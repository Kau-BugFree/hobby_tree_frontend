/**
 * E-03 활동 세부 설명 · 장비·장소 광고 (Figma v6)
 * - 화면 모양은 components/activity/ActivityDetailView — 체험 모드·로그인 상태가 같은 화면
 * - 광고는 활동을 고른 뒤 이 화면에서만 노출 (10/10 결정)
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ActivityDetailView } from '../../components/activity/ActivityDetailView';
import { ServerActivity } from '../../components/server/ServerActivity';
import { findCard } from '../../data/catalog';
import { ADS } from '../../data/experience';
import { formatManWon, useAppState, withComma } from '../../lib/appState';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';

/** 로그인 상태 + 서버 활동(activityId)이면 서버 데이터(API-25·31·32·49)로 같은 화면 */
export default function DetailRoute() {
  const p = useLocalSearchParams<{ activityId?: string; userHobbyId?: string }>();
  const { signedIn } = useSession();
  if (signedIn && Number(p.activityId) > 0) return <ServerActivity activityId={Number(p.activityId)} userHobbyId={Number(p.userHobbyId) || undefined} />;
  return <ActivityDetail />;
}

function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useAppState();
  const found = findCard(id) ?? findCard('cof-2-5');
  if (!found) return null;
  const { catalog, card } = found;
  const ads = ADS[catalog.hobby as keyof typeof ADS] ?? [];
  const sessionMin = state.answers.q06 === '직접 시간 입력' ? state.customMinutes : parseInt(String(state.answers.q06), 10) * (String(state.answers.q06).includes('시간') ? 60 : 1) || 30;
  const budget = state.answers.q04 === '직접 금액 입력' ? state.customAmount.q04 : 10000;
  const fits = card.minutes <= sessionMin;

  return (
    <ActivityDetailView
      m={{
        title: card.title,
        group: card.group,
        minutes: card.minutes,
        goal: `오늘 남길 것: ${card.goal}`,
        hobbyLine: `${catalog.hobby} · ${catalog.levels[card.level]}`,
        fit: {
          ok: fits,
          text: fits
            ? `내 1회 조건(${sessionMin}분 · ${formatManWon(budget)}) 안에 맞는 활동이에요`
            : `내 1회 시간(${sessionMin}분)보다 길어요 · 나눠서 해도 돼요`,
        },
        materials: [...card.tools, ...card.materials],
        steps: card.steps,
        check: card.checks[0],
        light: card.light,
        ads: ads.map((ad) => ({
          id: ad.id,
          kind: ad.kind === 'place' ? 'place' : 'product',
          title: ad.title,
          seller: ad.seller,
          fit: ad.fit,
          price: `${withComma(ad.price)}원`,
          onPress: () => (ad.kind === 'place' && ad.classId ? go(`/together/class/${ad.classId}`) : go(`/experience/ad?id=${ad.id}`)),
        })),
        startLabel: '이 활동 시작하기',
        onStart: () => go(`/experience/progress?id=${card.id}`),
        onMore: () => go(`/overlay/more?title=${encodeURIComponent(card.title)}&path=${encodeURIComponent(`/activity/${card.id}`)}`),
      }}
    />
  );
}
