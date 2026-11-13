/**
 * O-06 추천 취미 목록 · 선택
 * - 반복 "Toggle · O-06 · …" 카드 → HobbyPickCard 서브 컴포넌트 + FlatList
 * - 최대 5그루
 * 로그인 상태: API-14(방금 만든 추천) 또는 API-15(최근 추천) 결과를 보여 준다
 *   - 추천 이유(reason) + 맞춘 조건(matchedCriteria) 태그
 *   - ‘첫 체험 자세히’ → 취미 상세(API-17)
 *   - 추천 뒤 취향이 바뀌었으면(isStale) ‘새로 추천받기’(API-14)
 * AI 추천 엔진 결과(engineResult.status) 4종을 모두 처리한다 — 넷 다 HTTP 200의 정상 결과
 *   - recommended  : 추천 카드 + 첫 활동 · 활동별 ‘확인 필요(needs_confirmation)’ 표시
 *   - browse       : Q01 ‘지금은 생각 없어요’ / Q11 ‘안내 없이 직접 찾기’ → 둘러보기 · 나중에 시작하기
 *   - needs_review : Q14 자유 입력·Q09 직접 입력 제외 조건 → 조건 고치기 · 자유 입력 빼고 다시 추천
 *   - no_match     : 조건을 통과한 활동 없음 → 제외 이유 + 예산·시간 고치기 · 둘러보기
 *   점수(score)는 확률·정확도가 아니므로 %로 보여 주지 않는다
 * 체험 모드: 지금처럼 가짜 추천(RECOMMENDED)
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { criteriaLabel, engineStatusOf, hobbyKeyOf, readEngineResult } from '../../api/mappers';
import type { EngineResult, EngineStatus, RecommendationItem } from '../../api/types';
import { AppText, Button, HobbyIcon, IconSlot, Screen, Tag, Touchable, useToast } from '../../components';
import type { HobbyKey } from '../../components/Graphics';
import { MAX_TREES, RECOMMENDED, RecommendedHobby } from '../../data/onboarding';
import { useAppState } from '../../lib/appState';
import { go, reset } from '../../lib/nav';
import { latestRecommendation, refreshRecommendation, resaveAndRecommend } from '../../lib/onboardingFlow';
import { useSession } from '../../lib/session';
import { COLORS } from '../../theme';

/** 화면 카드 한 장 — 가짜 추천과 서버 추천을 같은 모양으로 맞춘다 */
interface PickCard {
  id: string;
  hobby: HobbyKey;
  name: string;
  /** 가짜 추천: '잘 맞아요 96%' · 서버 추천: 맞춘 조건 태그 */
  tags: string[];
  why: string;
  firstActivity?: string;
  /** 첫 활동에 확인할 것 (needs_confirmation) */
  confirm?: string[];
  hobbyId?: number;
}

const fromMock = (r: RecommendedHobby): PickCard => ({
  id: r.hobby,
  hobby: r.hobby,
  name: r.name,
  tags: [`잘 맞아요 ${r.match}%`],
  why: r.why,
  firstActivity: r.firstActivity,
});

const fromServer = (r: RecommendationItem, engine: EngineResult | null): PickCard => {
  const e = engine?.recommendations?.find((x) => x.hobby_id && x.hobby_id === r.hobbyCode);
  const first = e?.activities?.[0];
  const needsConfirm = first?.status === 'needs_confirmation';
  return {
    id: String(r.hobbyId),
    hobby: hobbyKeyOf(r.hobbyCode ?? r.name),
    name: r.name,
    tags: [...(r.matchedCriteria ?? []).slice(0, 3).map(criteriaLabel), ...(needsConfirm ? ['확인 필요'] : [])],
    why: r.reason || (e?.reasons ?? []).slice(0, 2).join(' · '),
    firstActivity: first?.title,
    confirm: needsConfirm ? first?.confirmation_required : undefined,
    hobbyId: r.hobbyId,
  };
};

const STATUS_COPY: Record<Exclude<EngineStatus, 'recommended'>, { title: string; body: string }> = {
  browse: {
    title: '직접 둘러보며 골라요',
    body: '지금은 추천 대신 전체 취미를 둘러볼 수 있어요. 마음이 생기면 언제든 홈에서 나무를 심을 수 있어요.',
  },
  needs_review: {
    title: '적어 주신 조건을 확인해야 해요',
    body: '자유롭게 적은 내용은 자동으로 해석하지 않아요. 조건을 고치거나, 적은 내용을 빼고 다시 추천받을 수 있어요.',
  },
  no_match: {
    title: '지금 조건에 맞는 활동이 없어요',
    body: '예산·시간·제외 조건을 모두 통과한 첫 활동을 찾지 못했어요. 조건을 조금 넓혀 다시 추천받아 보세요.',
  },
};

/** browse · needs_review · no_match 안내 */
function StatusView({ status, engine, freeText }: { status: Exclude<EngineStatus, 'recommended'>; engine: EngineResult | null; freeText: string }) {
  const copy = STATUS_COPY[status];
  const excluded = (engine?.excluded ?? []).filter((x) => x.reasons?.length);
  return (
    <View style={styles.status}>
      <View style={styles.statusIcon}>
        <IconSlot name={status === 'browse' ? 'leaf' : 'info'} size={22} color="brandDeep" />
      </View>
      <AppText variant="title22Bold" color="brandDeep">
        {copy.title}
      </AppText>
      <AppText variant="callout14Regular" color="textBody">
        {copy.body}
      </AppText>
      {status === 'needs_review' && freeText.trim() ? (
        <View style={styles.quote}>
          <AppText variant="caption12Bold" color="textMuted">
            적어 주신 내용
          </AppText>
          <AppText variant="callout14Regular" color="textPrimary">
            {`“${freeText.trim()}”`}
          </AppText>
        </View>
      ) : null}
      {status === 'no_match' && excluded.length ? (
        <View style={styles.quote}>
          <AppText variant="caption12Bold" color="textMuted">
            빠진 이유
          </AppText>
          {excluded.map((x) => (
            <AppText key={x.hobby_id ?? x.name} variant="caption12Medium" color="textBody">
              {`${x.name ?? x.hobby_id} · ${(x.reasons ?? []).join(' · ')}`}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** 엔진 안내 (지원 안 하는 관심 취미 · 안내 문구 · 추가 확인 질문) */
function EngineNotes({ engine }: { engine: EngineResult | null }) {
  if (!engine) return null;
  const lines = [
    ...(engine.unsupported_interests?.length ? [`${engine.unsupported_interests.join(' · ')}은(는) 아직 준비 중이에요`] : []),
    ...(engine.notices ?? []),
    ...(engine.follow_up_questions ?? []).map((q) => `확인해 주세요 · ${q}`),
  ];
  if (!lines.length) return null;
  return (
    <View style={styles.notes}>
      {lines.map((l) => (
        <View key={l} style={styles.noteRow}>
          <IconSlot name="info" size={14} color="brandPrimary" />
          <AppText variant="caption12Medium" color="textBody" style={styles.flex}>
            {l}
          </AppText>
        </View>
      ))}
    </View>
  );
}

interface HobbyPickCardProps {
  item: PickCard;
  picked: boolean;
  onToggle: () => void;
}

function HobbyPickCard({ item, picked, onToggle }: HobbyPickCardProps) {
  return (
    <Touchable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: picked }}
      accessibilityLabel={`${item.name}, ${item.tags.join(', ')}`}
      onPress={onToggle}
      style={[styles.card, picked ? styles.cardOn : styles.cardOff]}
    >
      <View style={[styles.icon, { backgroundColor: picked ? COLORS.bgForest : COLORS.bgSunken }]}>
        <HobbyIcon hobby={item.hobby} size={22} color={picked ? 'paletteKhaki' : 'textMuted'} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="body16Bold" color="textPrimary">
            {item.name}
          </AppText>
          {item.tags.map((t) => (
            <Tag key={t} label={t} tone={picked ? 'green' : 'gray'} />
          ))}
        </View>
        {item.why ? (
          <AppText variant="caption12Medium" color="textBody">
            {item.why}
          </AppText>
        ) : null}
        {item.firstActivity ? (
          <AppText variant="caption12Bold" color="brandPrimary">
            {`첫 체험: ${item.firstActivity}`}
          </AppText>
        ) : null}
        {item.confirm?.length ? (
          <AppText variant="caption12Medium" color="textMuted">
            {`시작 전 확인 · ${item.confirm.slice(0, 2).join(' · ')}`}
          </AppText>
        ) : null}
        {item.hobbyId ? (
          <Touchable small accessibilityLabel={`${item.name} 첫 체험 자세히`} onPress={() => go(`/hobby/${item.hobbyId}`)} style={styles.more}>
            <AppText variant="caption12Bold" color="brandPrimary">
              첫 체험 자세히
            </AppText>
            <IconSlot name="chev" size={12} color="brandPrimary" />
          </Touchable>
        ) : null}
      </View>
      <View style={[styles.check, picked ? styles.checkOn : styles.checkOff]}>
        {picked ? <IconSlot name="check" size={15} color="textOnDark" /> : null}
      </View>
    </Touchable>
  );
}

export default function OnboardingRecommend() {
  const { state, update, updateServer } = useAppState();
  const { signedIn } = useSession();
  const toast = useToast();
  const rec = state.server.recommendation;
  const [loading, setLoading] = useState(signedIn && !rec);
  const [refreshing, setRefreshing] = useState(false);

  // 로그인 상태인데 추천이 메모리에 없으면(앱 재실행 등) API-15 최근 추천을 불러온다
  useEffect(() => {
    if (!signedIn || rec) return;
    let alive = true;
    latestRecommendation()
      .then((r) => {
        if (!alive || !r) return;
        updateServer({ recommendation: r, pickedHobbyIds: (r.items ?? []).slice(0, 3).map((i) => i.hobbyId) });
      })
      .catch((e) => alive && toast({ title: '추천을 불러오지 못했어요', sub: errorMessage(e), icon: 'info' }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const [resubmitting, setResubmitting] = useState(false);
  const engine = signedIn && rec ? readEngineResult(rec.engineResult) : null;
  const status: EngineStatus = signedIn && rec ? engineStatusOf(rec) : 'recommended';
  const server = signedIn && rec ? (status === 'recommended' ? (rec.items ?? []) : []) : null;
  const cards: PickCard[] = server ? server.map((i) => fromServer(i, engine)) : RECOMMENDED.map(fromMock);
  const pickedIds = server ? state.server.pickedHobbyIds.map(String) : state.picked;
  const count = pickedIds.length;

  const toggle = (card: PickCard) => {
    const on = pickedIds.includes(card.id);
    if (!on && count >= MAX_TREES) return;
    if (server && card.hobbyId) {
      const ids = on ? state.server.pickedHobbyIds.filter((i) => i !== card.hobbyId) : [...state.server.pickedHobbyIds, card.hobbyId];
      updateServer({ pickedHobbyIds: ids });
      // 아래 확인·심기 화면(아직 가짜 데이터)은 아이콘 종류(HobbyKey)로 동작하므로 함께 맞춘다
      const keys = server.filter((i) => ids.includes(i.hobbyId)).map((i) => hobbyKeyOf(i.hobbyCode ?? i.name));
      update({ picked: Array.from(new Set<HobbyKey>(keys)) });
      return;
    }
    const h = card.hobby;
    update({ picked: on ? state.picked.filter((p) => p !== h) : [...state.picked, h] });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await refreshRecommendation();
      updateServer({
        preferencesVersion: r.preferencesVersion,
        recommendation: r.recommendation,
        pickedHobbyIds: (r.recommendation?.items ?? []).slice(0, 3).map((i) => i.hobbyId),
      });
    } catch (e) {
      toast({ title: '새로 추천받지 못했어요', sub: `${errorMessage(e)}${e instanceof ApiError ? ` (${e.code})` : ''}`, icon: 'info' });
    } finally {
      setRefreshing(false);
    }
  };

  /** needs_review: 자유 입력(Q14)·직접 입력 제외 조건을 빼고 다시 저장 → 새로 추천 */
  const resubmitWithoutText = async () => {
    setResubmitting(true);
    try {
      const next = { ...state, freeText: '', customText: { ...state.customText, q09Exclude: '' } };
      update({ freeText: '', customText: next.customText });
      const r = await resaveAndRecommend(next);
      const items = engineStatusOf(r.recommendation) === 'recommended' ? (r.recommendation?.items ?? []) : [];
      const ids = items.slice(0, 3).map((i) => i.hobbyId);
      updateServer({ options: r.options, preferencesVersion: r.preferencesVersion, recommendation: r.recommendation, pickedHobbyIds: ids });
      update({ picked: Array.from(new Set<HobbyKey>(items.filter((i) => ids.includes(i.hobbyId)).map((i) => hobbyKeyOf(i.hobbyCode ?? i.name)))) });
    } catch (e) {
      toast({ title: '다시 추천받지 못했어요', sub: `${errorMessage(e)}${e instanceof ApiError ? ` (${e.code})` : ''}`, icon: 'info' });
    } finally {
      setResubmitting(false);
    }
  };

  const header = (
    <View style={styles.head}>
      <AppText variant="title26Black" color="brandDeep">
        {`${state.userName} 님께 맞는 취미예요`}
      </AppText>
      <AppText variant="callout14Regular" color="textMuted">
        {`키우고 싶은 나무를 골라 주세요 · 최대 ${MAX_TREES}그루`}
      </AppText>
      {rec?.isStale && signedIn ? (
        <Touchable accessibilityLabel="새로 추천받기" disabled={refreshing} onPress={onRefresh} style={styles.stale}>
          <IconSlot name="reset" size={16} color="brandDeep" />
          <AppText variant="caption12Bold" color="brandDeep" style={styles.flex}>
            {refreshing ? '새로 추천받는 중…' : '추천 뒤에 취향이 바뀌었어요 · 새로 추천받기'}
          </AppText>
        </Touchable>
      ) : null}
      {signedIn && rec && server && server.length === 0 ? (
        <AppText variant="callout14Regular" color="textBody">
          지금 조건에 맞는 취미를 찾지 못했어요. 예산이나 시간을 조금 넓혀 다시 추천받아 보세요.
        </AppText>
      ) : null}
      <EngineNotes engine={engine} />
      {signedIn && !rec && !loading ? (
        <AppText variant="caption12Medium" color="textMuted">
          서버 추천이 없어 기본 추천을 보여 드려요
        </AppText>
      ) : null}
    </View>
  );

  if (status !== 'recommended') {
    const busy = resubmitting;
    return (
      <Screen
        footer={
          status === 'browse' ? (
            <>
              <Button label="취미 둘러보기" onPress={() => go('/experience/explore')} />
              <Button variant="ghost" label="나중에 시작하기" onPress={() => reset('/home')} />
            </>
          ) : status === 'needs_review' ? (
            <>
              <Button label={busy ? '다시 추천받는 중…' : '적은 내용 빼고 추천받기'} disabled={busy} onPress={resubmitWithoutText} />
              <Button variant="ghost" label="조건 고치기" disabled={busy} onPress={() => go('/onboarding/optional')} />
            </>
          ) : (
            <>
              <Button label="예산·시간 고치기" onPress={() => go('/onboarding/step2')} />
              <Button variant="ghost" label="취미 둘러보기" onPress={() => go('/experience/explore')} />
            </>
          )
        }
        contentStyle={styles.statusContent}
      >
        <StatusView status={status} engine={engine} freeText={state.freeText} />
        <EngineNotes engine={engine} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <View style={styles.hint}>
            <IconSlot name="info" size={16} color="brandPrimary" />
            <AppText variant="caption12Medium" color="textMuted">
              나중에 홈에서 더 심을 수 있어요
            </AppText>
          </View>
          <Button variant="dark" label={`고른 ${count}그루 확인하기`} disabled={count === 0} onPress={() => go('/onboarding/confirm')} />
        </>
      }
      contentStyle={styles.content}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          renderItem={({ item }) => <HobbyPickCard item={item} picked={pickedIds.includes(item.id)} onToggle={() => toggle(item)} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 0, paddingTop: 0 },
  list: { gap: 12, paddingTop: 10, paddingHorizontal: 24, paddingBottom: 24 },
  head: { gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
  },
  cardOn: { borderWidth: 2, borderColor: COLORS.brandPrimary },
  cardOff: { borderWidth: 1, borderColor: COLORS.borderDefault },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingVertical: 2 },
  check: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: COLORS.brandPrimary },
  checkOff: { backgroundColor: COLORS.bgSurface, borderWidth: 2, borderColor: COLORS.borderStrong },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusContent: { gap: 16, paddingTop: 24 },
  status: { gap: 12 },
  statusIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgGreenSoft },
  quote: { gap: 4, padding: 14, borderRadius: 18, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  notes: { gap: 6, padding: 12, borderRadius: 16, backgroundColor: COLORS.bgKhaki },
  noteRow: { flexDirection: 'row', gap: 6 },
  stale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.bgKhaki,
  },
});
