/**
 * E-02 선택한 난이도 · 세부 활동 목록 (Figma v6)
 * - 화면 모양은 components/activity/StageListView — 체험 모드·로그인 상태가 같은 화면
 * - 로그인 상태 + 서버 취미(hobbyId)면 API-23 단계 · API-24 단계별 활동 (components/server/ServerStage)
 * - Figma 문구 원칙: ‘단계’ 표현 대신 단계 이름(예: 추출 방식 탐색)으로 부른다
 */
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { STAGE_NAME, TreeStageNo } from '../../components';
import { StageListView } from '../../components/activity/StageListView';
import type { HobbyKey } from '../../components/Graphics';
import { ServerStage } from '../../components/server/ServerStage';
import { CATALOG, CatalogCard, cardsOfLevel, catalogOf, minuteRange } from '../../data/catalog';
import { SUPPORTED_HOBBIES } from '../../data/hobbies';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';

/** 다른 취미 토글은 지원 취미 3개(요리·악기·독서)만 */
const HOBBIES = (Object.keys(CATALOG) as HobbyKey[]).filter((h) => SUPPORTED_HOBBIES.includes(h));

export default function StageRoute() {
  const p = useLocalSearchParams<{ hobbyId?: string; userHobbyId?: string; stageId?: string; hobby?: string }>();
  const { signedIn } = useSession();
  if (signedIn && Number(p.hobbyId) > 0) {
    return <ServerStage hobbyId={Number(p.hobbyId)} userHobbyId={Number(p.userHobbyId) || undefined} stageId={Number(p.stageId) || undefined} hobbyName={p.hobby} />;
  }
  return <StageActivities />;
}

function StageActivities() {
  const { hobby = '요리', stage = '2' } = useLocalSearchParams<{ hobby?: string; stage?: string }>();
  const level = Number(stage);
  const catalog = catalogOf(hobby);
  const cards = cardsOfLevel(catalog, level);
  const treeStage = Math.min(level, 5) as TreeStageNo;
  return (
    <StageListView
      m={{
        title: catalog.levels[level],
        hobby: catalog.hobby as HobbyKey,
        treeStage,
        eyebrow: `${catalog.hobby} · ${level <= 5 ? STAGE_NAME[treeStage] : '세계수 이후'}`,
        summary: `${catalog.summaries[level]} · 활동 ${cards.length}개 · 한 번에 ${minuteRange(cards)}`,
        cards: cards.map((c: CatalogCard) => {
          const prep = [...c.tools, ...c.materials].join(', ');
          return {
            id: c.id,
            title: c.title,
            tag: c.group,
            minutes: c.minutes,
            goal: c.goal,
            prep: prep ? `준비물 · ${prep}` : undefined,
            searchText: [c.title, c.goal, c.group, ...c.tools, ...c.materials].join(' '),
            onPress: () => go(`/experience/detail?id=${c.id}`),
          };
        }),
        hobbyOptions: HOBBIES,
        onChangeHobby: (h) => router.setParams({ hobby: h }),
        footnote: `활동 목록 출처: HobbyTree ${catalog.hobby} 성장 지도 (첨부 HTML, 2026.10.09 초안)`,
      }}
    />
  );
}
