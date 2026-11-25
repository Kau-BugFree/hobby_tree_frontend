/**
 * M-02 취미 로드맵 (?hobby=요리) — 화면 모양은 components/my/RoadmapView (Figma v6)
 * - 체험 모드: 카탈로그(src/data/catalog) + 완료 기록(doneIdsOf)
 * - 로그인 상태 + userHobbyId: 서버판(API-20·21·22·23, components/server/ServerRoadmap) — 같은 화면
 * - 각 단계 → E-02 / ‘세계수 이후’(카탈로그 6레벨) → E-02 / 하단 → E-01
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { STAGE_NAME, TreeStageNo } from '../../components';
import type { HobbyKey } from '../../components/Graphics';
import type { RoadmapNode, StageItemRow } from '../../components/my/RoadmapView';
import { RoadmapView } from '../../components/my/RoadmapView';
import { ServerRoadmap } from '../../components/server/ServerRoadmap';
import { cardsOfLevel, catalogOf } from '../../data/catalog';
import { treeByHobby } from '../../data/hobbies';
import { DONE_DATES, doneIdsOf, PLANTED_INFO } from '../../data/my';
import { go, reset } from '../../lib/nav';
import { useSession } from '../../lib/session';

const STAGES: TreeStageNo[] = [0, 1, 2, 3, 4, 5];
const NEXT_PREVIEW = 2;

/** 서버 나무(userHobbyId)면 서버판 로드맵 + 나무 관리 (API-20·21·22) */
export default function RoadmapRoute() {
  const { userHobbyId } = useLocalSearchParams<{ userHobbyId?: string }>();
  const { signedIn } = useSession();
  if (signedIn && Number(userHobbyId) > 0) return <ServerRoadmap userHobbyId={Number(userHobbyId)} />;
  return <RoadmapScreen />;
}

function RoadmapScreen() {
  const { hobby } = useLocalSearchParams<{ hobby?: string }>();
  const tree = treeByHobby(hobby);
  const catalog = catalogOf(tree.hobby);
  const doneIds = doneIdsOf(tree.hobby as HobbyKey);
  const planted = PLANTED_INFO[tree.hobby];
  const stageDone = cardsOfLevel(catalog, tree.stage).filter((c) => doneIds.includes(c.id)).length;
  const afterCards = cardsOfLevel(catalog, 6);
  const openStage = (stage: number) => go(`/experience/stage?hobby=${encodeURIComponent(tree.hobby)}&stage=${stage}`);

  const nodes: RoadmapNode[] = STAGES.map((s) => {
    const cards = cardsOfLevel(catalog, s);
    const state = s < tree.stage ? 'done' : s === tree.stage ? 'current' : 'next';
    const done = cards.filter((c) => doneIds.includes(c.id));
    const todo = cards.filter((c) => !doneIds.includes(c.id));
    const rows: StageItemRow[] =
      state === 'next'
        ? []
        : [
            ...done.map((c) => ({ id: c.id, title: c.title, done: true, date: DONE_DATES[c.id] })),
            ...(state === 'current' ? todo.slice(0, NEXT_PREVIEW).map((c) => ({ id: c.id, title: c.title, done: false })) : []),
          ];
    const rest = state === 'current' ? todo.length - NEXT_PREVIEW : 0;
    return {
      key: String(s),
      stage: s,
      title: `${s}단계 ${STAGE_NAME[s]} · ${catalog.levels[s] ?? ''}${s === 5 ? ' → 세계수' : ''}`,
      state,
      tag: `완료 ${done.length}/${cards.length}`,
      right: `활동 ${cards.length}개`,
      rows,
      rest: rest > 0 ? `${todo[NEXT_PREVIEW]?.title ?? ''} 외 ${rest - 1}개` : undefined,
      onPress: () => openStage(s),
    };
  });

  return (
    <RoadmapView
      m={{
        title: `${tree.name} 로드맵`,
        treeStage: tree.stage,
        plantedTag: planted ? `${planted.plantedAt} 심음 · ${planted.days}일째` : undefined,
        headline: `${tree.name} 나무 · ${tree.stage}단계 ${STAGE_NAME[tree.stage]}`,
        sub: `${tree.stage}단계 완료 ${stageDone}개 · 전체 완료 ${doneIds.length}개`,
        sectionRight: `${tree.stage}/6 단계 완료`,
        nodes,
        after: afterCards.length
          ? { label: `세계수 이후 · ${catalog.levels[6] ?? ''}`, right: `활동 ${afterCards.length}개`, onPress: () => openStage(6) }
          : undefined,
        footerLabel: `체험에서 ${tree.name} 활동 전체 보기`,
        onFooter: () => reset('/experience'),
      }}
    />
  );
}
