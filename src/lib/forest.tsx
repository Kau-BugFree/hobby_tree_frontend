/**
 * 내 취미 나무 (서버 연동)
 *   API-18 목록 → 나무마다 API-20 상세 · API-22 로드맵 → 현재 단계의 API-24 활동 2개(단계별 추천)
 *   API-19 심기 · API-21 일시정지·재개·종료
 * 서버 나무를 지금 화면이 쓰는 TreeData 모양으로 바꿔서 홈·로드맵·심기 화면이 그대로 쓰게 한다.
 * 로그인 안 함(체험 모드)이면 가짜 데이터(TREES)를 그대로 쓴다.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '../api/client';
import * as API from '../api/endpoints';
import { hobbyKeyOf } from '../api/mappers';
import type { Roadmap, TreeStatus, UserHobbyDetail, UserHobbySummary } from '../api/types';
import type { TreeStageNo } from '../components/Graphics';
import { MAX_TREE_SLOTS, TreeData, TREES } from '../data/hobbies';
import { useSession } from './session';

/** 서버 나무 정보 (TreeData.server) */
export interface ServerTreeInfo {
  userHobbyId: number;
  hobbyId: number;
  treeStatus: TreeStatus;
  stageNumber: number;
  stageName?: string;
  totalStages?: number;
  isMaxStage?: boolean;
  completed: number;
  remaining?: number | null;
  plantedAt?: string;
  /** 진행 중인 활동 (API-20 currentActivityRecord) */
  current?: { recordId: number; activityId: number; title?: string; progressPercent?: number } | null;
  /** 현재 단계 stageId (API-22) — 단계별 활동(API-24) 조회용 */
  currentStageId?: number | null;
  roadmap?: Roadmap | null;
}

const toStageNo = (n: number): TreeStageNo => Math.max(0, Math.min(5, Math.round(n))) as TreeStageNo;

function toTree(s: UserHobbySummary, d?: UserHobbyDetail | null, roadmap?: Roadmap | null, reco: { title: string; stage: number; minutes: number }[] = []): TreeData {
  const detail = d ?? s;
  const stageNumber = detail.currentStageNumber ?? 1;
  const stage = toStageNo(stageNumber);
  const completed = detail.distinctCompletedActivityCount ?? 0;
  const remaining = detail.remainingCountForNextStage;
  const isMax = d?.isMaxStage;
  const stageName = detail.currentStageName ?? roadmap?.stages?.find((x) => x.stageNumber === stageNumber)?.name;
  const statusLabel = detail.treeStatus === 'PAUSED' ? ' · 쉬는 중' : detail.treeStatus === 'ENDED' ? ' · 종료' : '';
  const currentStage = roadmap?.stages?.find((x) => x.state === 'CURRENT') ?? roadmap?.stages?.find((x) => x.stageNumber === stageNumber);
  const cur = d?.currentActivityRecord ?? null;
  return {
    hobby: hobbyKeyOf(detail.hobbyName),
    name: detail.hobbyName,
    stage,
    stageLabel: `${stageNumber}단계${stageName ? ` · ${stageName}` : ''}${statusLabel}`,
    growthStatus: isMax
      ? `완료 ${completed}개 · 최고 단계예요`
      : `완료 ${completed}개${remaining != null ? ` · ${remaining}개 더 하면 다음 단계` : ''}`,
    stageTitle: `${stageNumber}단계${stageName ? ` · ${stageName}` : ''}`,
    currentActivityId: '',
    progress: (cur?.progressPercent ?? 0) / 100,
    recommendations: reco.map((r, i) => ({ title: r.title, stage: toStageNo(r.stage), minutes: r.minutes, tone: i === 0 ? 'green' : 'water' })),
    server: {
      userHobbyId: s.userHobbyId,
      hobbyId: s.hobbyId,
      treeStatus: detail.treeStatus,
      stageNumber,
      stageName,
      totalStages: d?.totalStages,
      isMaxStage: isMax,
      completed,
      remaining,
      plantedAt: s.plantedAt,
      current: cur,
      currentStageId: currentStage?.stageId ?? null,
      roadmap: roadmap ?? null,
    },
  };
}

/** 나무 하나의 상세·로드맵·현재 단계 활동을 함께 받는다 (일부 실패해도 목록 정보로 보여 준다) */
async function loadTree(s: UserHobbySummary): Promise<TreeData> {
  const [d, roadmap] = await Promise.all([API.getTree(s.userHobbyId).catch(() => null), API.getRoadmap(s.userHobbyId).catch(() => null)]);
  const stageNumber = d?.currentStageNumber ?? s.currentStageNumber;
  const stageId = (roadmap?.stages?.find((x) => x.state === 'CURRENT') ?? roadmap?.stages?.find((x) => x.stageNumber === stageNumber))?.stageId;
  let reco: { title: string; stage: number; minutes: number }[] = [];
  if (stageId) {
    const acts = await API.listStageActivities(stageId, null, 2).catch(() => null);
    reco = (acts?.items ?? []).slice(0, 2).map((a) => ({ title: a.title, stage: stageNumber, minutes: a.durationMinutes ?? 0 }));
  }
  return toTree(s, d, roadmap, reco);
}

interface ForestCtx {
  /** 화면에 보여 줄 나무 (로그인: 서버 ACTIVE·PAUSED / 체험 모드: 가짜 데이터) */
  trees: TreeData[];
  /** 서버 나무를 쓰는 중인지 */
  live: boolean;
  loading: boolean;
  error: string | null;
  maxTrees: number;
  /** 이미 심은 서버 취미 ID (종료 포함) */
  plantedHobbyIds: number[];
  reload: () => Promise<void>;
  /** API-19 — 이미 심은 취미(TREE409_2)는 성공으로 본다 */
  plant: (hobbyId: number, recommendationId?: number | null) => Promise<void>;
  /** API-21 */
  changeStatus: (userHobbyId: number, status: TreeStatus) => Promise<void>;
}

const Ctx = createContext<ForestCtx | null>(null);

export function ForestProvider({ children }: { children: React.ReactNode }) {
  const { signedIn } = useSession();
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [planted, setPlanted] = useState<number[]>([]);
  const [maxTrees, setMax] = useState(MAX_TREE_SLOTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!signedIn) return;
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      // 커서를 따라 끝까지 (최대 5그루 + 종료된 나무)
      const all: UserHobbySummary[] = [];
      let cursor: string | null = null;
      let max = MAX_TREE_SLOTS;
      for (let i = 0; i < 5; i++) {
        const pageRes = await API.listMyTrees(undefined, cursor, 50);
        all.push(...(pageRes.items ?? []));
        if (pageRes.maxTreeCount) max = pageRes.maxTreeCount;
        if (!pageRes.hasNext || !pageRes.nextCursor) break;
        cursor = pageRes.nextCursor;
      }
      const visible = all.filter((t) => t.treeStatus !== 'ENDED');
      const loaded = await Promise.all(visible.map(loadTree));
      if (my !== seq.current) return;
      setTrees(loaded);
      setPlanted(all.map((t) => t.hobbyId));
      setMax(max);
    } catch (e) {
      if (my !== seq.current) return;
      setError(e instanceof ApiError ? `${e.message} (${e.code})` : '나무를 불러오지 못했어요');
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    if (signedIn) reload();
    else {
      setTrees([]);
      setPlanted([]);
    }
  }, [signedIn, reload]);

  const plant = useCallback(
    async (hobbyId: number, recommendationId?: number | null) => {
      try {
        await API.plantTree({ hobbyId, ...(recommendationId ? { recommendationId } : {}) });
      } catch (e) {
        // 같은 취미 나무가 이미 있음 → 이미 심어진 것으로 보고 계속
        if (!(e instanceof ApiError && e.code === 'TREE409_2')) throw e;
      }
    },
    [],
  );

  const changeStatus = useCallback(
    async (userHobbyId: number, status: TreeStatus) => {
      await API.changeTreeStatus(userHobbyId, status);
      await reload();
    },
    [reload],
  );

  const value = useMemo<ForestCtx>(
    () => ({
      trees: signedIn ? trees : TREES,
      live: signedIn,
      loading,
      error,
      maxTrees,
      plantedHobbyIds: planted,
      reload,
      plant,
      changeStatus,
    }),
    [signedIn, trees, loading, error, maxTrees, planted, reload, plant, changeStatus],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useForest() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useForest must be used inside ForestProvider');
  return ctx;
}

/** URL 파라미터(hobby 이름 또는 userHobbyId) → 나무 */
export function useTreeByParam(hobby?: string, userHobbyId?: string | number) {
  const { trees } = useForest();
  const id = Number(userHobbyId);
  return (
    (id ? trees.find((t) => t.server?.userHobbyId === id) : undefined) ??
    trees.find((t) => t.hobby === hobby || t.name === hobby) ??
    trees[0] ??
    TREES[0]
  );
}

/** 나무 심기 오류 → 안내 문구 */
export function plantErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'TREE409_1') return `나무는 최대 ${MAX_TREE_SLOTS}그루까지 키울 수 있어요. 쉬는 나무를 종료하면 자리가 생겨요.`;
    if (e.code === 'HOBBY404_1') return '지금은 심을 수 없는 취미예요.';
    if (e.code === 'RECOMMENDATION404_1') return '추천 정보가 바뀌었어요. 다시 추천받아 주세요.';
    return `${e.message} (${e.code})`;
  }
  return '나무를 심지 못했어요.';
}
