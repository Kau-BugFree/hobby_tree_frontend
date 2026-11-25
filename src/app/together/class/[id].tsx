/**
 * T-02 클래스 상세 / T-06 요리 클래스 상세 · 준비 중 (Figma v6, 같은 레이아웃 · 데이터만 다름)
 * - 화면 모양은 components/together/ClassDetailView — 체험 모드·로그인 상태가 같은 화면
 *   예약 가능 → T-04, 준비 중 → T-07(아직 준비중이에요)
 * - 로그인 상태 + 숫자 id(서버 experienceId)면 API-36·37·40 (components/server/ServerClassDetail)
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ServerClassDetail } from '../../../components/server/ServerClassDetail';
import { ClassDetailView } from '../../../components/together/ClassDetailView';
import { classById } from '../../../data/together';
import { withComma } from '../../../lib/appState';
import { go } from '../../../lib/nav';
import { useSession } from '../../../lib/session';

export default function ClassRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { signedIn } = useSession();
  if (signedIn && Number(id) > 0) return <ServerClassDetail experienceId={Number(id)} />;
  return <ClassDetail />;
}

function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = classById(id);
  return (
    <ClassDetailView
      m={{
        art: `class-${c.id}`,
        kindLabel: '원데이 클래스',
        badge: c.bookable ? { label: '제휴', tone: 'ad' } : { label: '준비 중', tone: 'gray' },
        hostMeta: c.hostMeta,
        title: c.title,
        rows: [
          { k: '일시', v: c.when, icon: 'calendar' },
          { k: '장소', v: c.area, icon: 'pin' },
          { k: '정원', v: c.capacity, icon: 'users' },
          { k: '준비물', v: c.prep, icon: 'bag' },
        ],
        tree: { stage: c.stage, title: `내 ${c.hobby} 나무와 연결돼요`, sub: `참여하면 ${c.hobby} ${c.stage}단계 활동 1개로 기록돼요` },
        note: c.bookable ? '제휴 클래스예요. 취소·환불은 판매처 규정을 따라요.' : '예약 오픈 전이에요. 알림을 받으면 예약이 열릴 때 알려드려요.',
        ctaLabel: `${withComma(c.price)}원 · 예약하기`,
        onCta: () => (c.bookable ? go(`/together/book?id=${c.id}`) : go(`/together/coming-soon?id=${c.id}`)),
        onChat: () => go('/together/chat-soon'),
        onMore: () => go(`/overlay/more?title=${encodeURIComponent(c.title)}&path=${encodeURIComponent(`/class/${c.id}`)}`),
      }}
    />
  );
}
