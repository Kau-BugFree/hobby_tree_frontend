/**
 * T-01 서버판 · 함께 탭 (Figma v6 T-01 · T-01-1 · T-01-2 레이아웃)
 *   취미 칩(요리·악기·독서) → 그 취미의 대표 클래스 카드(일러스트) + 근처 다른 활동 목록
 *   클래스·모임 목록(API-35: 가까운 일정순, 커서 ‘더 보기’)
 *   내 예약(API-38: 외부 예약 기록·검증 상태)
 *   항목 → 클래스 상세(API-36)
 */
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api/client';
import { listExperiences, listMyReservations } from '../../api/endpoints';
import { hobbyKeyOf } from '../../api/mappers';
import type { ExperienceStatus, ExperienceSummary, MyReservation, ReservationStatus } from '../../api/types';
import { CLASS_ART_BY_HOBBY } from '../../assets/classArt';
import { SUPPORTED_HOBBIES } from '../../data/hobbies';
import { withComma } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS, SHADOWS } from '../../theme';
import { AppText } from '../AppText';
import { SectionTitle } from '../Blocks';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { ChatbotFab } from '../ChatbotFab';
import type { HobbyKey } from '../Graphics';
import { IconTile, IllustrationSlot } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { TAB_BAR_HEIGHT } from '../TabBar';
import { PlantTreeButton, TabHeader } from '../TabHeader';
import { Tag } from '../Tag';
import { Touchable } from '../Touchable';

const STATUS_LABEL: Record<ExperienceStatus, string> = { OPEN: '모집 중', COMING_SOON: '오픈 예정', CLOSED: '마감' };
const RES_LABEL: Record<ReservationStatus, string> = {
  REDIRECTED: '예약 페이지로 이동함',
  PENDING_VERIFICATION: '예약 확인 중',
  CONFIRMED: '예약 확정',
  CANCELLED: '취소됨',
  COMPLETED: '참여 완료',
};

/** '2026-11-07T14:00:00+09:00' → '11/7(토) 14:00' */
export function formatWhen(iso?: string | null): string {
  if (!iso) return '일정 미정';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
  const day = '일월화수목금토'[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${day}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function ClassRow({ item }: { item: ExperienceSummary }) {
  return (
    <Touchable accessibilityLabel={item.title} onPress={() => go(`/together/class/${item.experienceId}`)} style={styles.row}>
      <IconTile size={46} radius={14}>
        <IconSlot name={`hobby-${hobbyKeyOf(item.hobbyName)}`} size={22} color="brandDeep" />
      </IconTile>
      <View style={styles.flex}>
        <View style={styles.tags}>
          <Tag label={item.type === 'CLASS' ? '클래스' : '모임'} tone="khaki" />
          <Tag label={STATUS_LABEL[item.status] ?? item.status} tone={item.status === 'OPEN' ? 'green' : 'gray'} />
        </View>
        <AppText variant="callout14Bold" color="textPrimary">
          {item.title}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {[formatWhen(item.nextSession?.startsAt), item.region?.name, item.provider?.name].filter(Boolean).join(' · ')}
        </AppText>
        <AppText variant="caption12Bold" color="brandDeep">
          {item.price ? `${withComma(item.price)}원` : '무료'}
        </AppText>
      </View>
      <IconSlot name="chev" size={18} color="textMuted" />
    </Touchable>
  );
}

/** Figma ‘Featured class’ 카드 — 일러스트 + 종류·제휴 태그 + 제목·장소·일정 + 가격·활동 인정 */
function FeaturedCard({ item }: { item: ExperienceSummary }) {
  const key = hobbyKeyOf(item.hobbyName);
  return (
    <Touchable accessibilityLabel={item.title} onPress={() => go(`/together/class/${item.experienceId}`)} style={[styles.featured, SHADOWS.card]}>
      <View style={styles.featuredImage}>
        <IllustrationSlot name={CLASS_ART_BY_HOBBY[key] ?? ''} width={180} height={108} />
        <View style={styles.imageTags}>
          <Tag label={item.type === 'CLASS' ? '원데이 클래스' : '모임'} tone="solid" />
          {item.provider ? <Tag label="제휴" tone="ad" /> : null}
          {item.status !== 'OPEN' ? <Tag label={STATUS_LABEL[item.status] ?? item.status} tone="gray" /> : null}
        </View>
      </View>
      <View style={styles.featuredBody}>
        <AppText variant="headline18Bold" color="textPrimary">
          {item.title}
        </AppText>
        <View style={styles.rowGap6}>
          <IconSlot name="pin" size={14} color="textMuted" />
          <AppText variant="caption12Medium" color="textMuted">
            {[item.region?.name, item.provider?.name].filter(Boolean).join(' · ') || '장소 미정'}
          </AppText>
        </View>
        <View style={styles.rowGap6}>
          <IconSlot name="calendar" size={14} color="textMuted" />
          <AppText variant="caption12Medium" color="textMuted">
            {[formatWhen(item.nextSession?.startsAt), item.nextSession?.durationMinutes ? `${item.nextSession.durationMinutes}분` : null].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <View style={styles.priceRow}>
          <AppText variant="headline18Bold" color="brandDeep">
            {item.price ? `${withComma(item.price)}원` : '무료'}
          </AppText>
          <Tag label={`${item.hobbyName ?? key} 활동으로 인정`} tone="water" />
        </View>
      </View>
    </Touchable>
  );
}

function ReservationRow({ item }: { item: MyReservation }) {
  return (
    <Touchable accessibilityLabel={item.title ?? '예약'} onPress={() => go(`/together/class/${item.experienceId}`)} style={styles.row}>
      <IconTile size={40} radius={14}>
        <IconSlot name="calendar" size={20} color="brandDeep" />
      </IconTile>
      <View style={styles.flex}>
        <AppText variant="callout14Bold" color="textPrimary">
          {item.title ?? '클래스'}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {`${formatWhen(item.startsAt)} · ${RES_LABEL[item.status] ?? item.status}${item.attended ? ' · 참여 확인됨' : ''}`}
        </AppText>
      </View>
      {item.bookingUrl && /^https?:\/\//.test(item.bookingUrl) ? (
        <Touchable small accessibilityLabel="예약 페이지 열기" onPress={() => Linking.openURL(item.bookingUrl!).catch(() => undefined)}>
          <IconSlot name="external" size={18} color="textMuted" />
        </Touchable>
      ) : null}
    </Touchable>
  );
}

export function ServerTogether() {
  const insets = useSafeAreaInsets();
  const [hobby, setHobby] = useState<HobbyKey>(SUPPORTED_HOBBIES[0]);
  const [items, setItems] = useState<ExperienceSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (after: string | null = null) => {
      try {
        const res = await listExperiences({ sort: 'STARTS_AT', cursor: after, size: 20 });
        setItems((prev) => (after && prev ? [...prev, ...(res.items ?? [])] : (res.items ?? [])));
        setCursor(res.nextCursor ?? null);
        setHasNext(!!res.hasNext);
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
        if (!after) setItems([]);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load();
      listMyReservations(undefined, null, 10)
        .then((r) => setReservations(r.items ?? []))
        .catch(() => undefined);
    }, [load]),
  );

  // 고른 취미의 대표 클래스(모집 중 우선) → 나머지는 ‘근처 다른 활동’
  const ofHobby = (items ?? []).filter((c) => hobbyKeyOf(c.hobbyName) === hobby && c.type === 'CLASS');
  const featured = ofHobby.find((c) => c.status === 'OPEN') ?? ofHobby[0];
  const nearby = (items ?? []).filter((c) => c !== featured);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TabHeader
        eyebrow="밖에서 함께하는 취미"
        title="함께"
        actions={
          <>
            <PlantTreeButton />
            <Touchable accessibilityLabel="채팅, 준비 중" onPress={() => go('/together/chat-soon')} style={styles.chatBtn}>
              <IconSlot name="chat" size={16} color="textBody" />
              <AppText variant="caption12Bold" color="textBody">
                채팅
              </AppText>
            </Touchable>
          </>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.filters} accessibilityRole="radiogroup">
          {SUPPORTED_HOBBIES.map((h) => (
            <Chip key={h} label={h} selected={hobby === h} onPress={() => setHobby(h)} />
          ))}
        </View>

        {items === null ? <ActivityIndicator color={COLORS.brandPrimary} /> : null}
        {featured ? (
          <FeaturedCard item={featured} />
        ) : items ? (
          <View style={styles.empty}>
            <AppText variant="callout14Bold" color="textBody">
              {`아직 ${hobby} 원데이 클래스가 없어요`}
            </AppText>
            <AppText variant="caption12Medium" color="textMuted">
              근처 다른 활동을 먼저 둘러보세요.
            </AppText>
          </View>
        ) : null}

        <SectionTitle title="근처 다른 활동" right={`${nearby.length}곳`} />
        {error ? (
          <AppText variant="callout14Regular" color="textBody">
            {error}
          </AppText>
        ) : null}
        {nearby.map((c) => (
          <ClassRow key={c.experienceId} item={c} />
        ))}
        {hasNext ? <Button label="더 보기" variant="outline" onPress={() => load(cursor)} /> : null}

        {reservations.length ? (
          <>
            <SectionTitle title="내 예약" right={`${reservations.length}건`} />
            {reservations.map((r) => (
              <ReservationRow key={r.reservationId} item={r} />
            ))}
          </>
        ) : null}
      </ScrollView>
      <ChatbotFab />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  content: { gap: 12, paddingHorizontal: 24 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tags: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  empty: { gap: 4, padding: 20, borderRadius: 24, backgroundColor: COLORS.bgSunken, alignItems: 'center' },
  featured: { borderRadius: 24, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault, overflow: 'hidden' },
  featuredImage: { height: 132, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgKhaki },
  imageTags: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', gap: 6 },
  featuredBody: { gap: 4, padding: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
});
