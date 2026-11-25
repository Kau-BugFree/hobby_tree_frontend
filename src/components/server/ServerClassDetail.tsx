/**
 * T-02 로그인 상태 · 클래스·모임 상세 — 화면은 Figma v6 T-02와 같은 ClassDetailView
 *   API-36 상세(진행자·장소·정원·준비물·일정·취소 정책·활동 인정)
 *   예약: 일정 고르기(T-04 날짜 카드 모양) → API-37 외부 예약 기록(Idempotency-Key, 활동 인정할 내 나무 연결)
 *         → 응답 bookingUrl로만 외부 이동 (결제는 제공자 페이지에서)
 *   오픈 예정(COMING_SOON): API-40 오픈 알림 신청
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError, errorMessage, newIdempotencyKey } from '../../api/client';
import { createReservation, getExperience, subscribeClassOpen } from '../../api/endpoints';
import { hobbyKeyOf, hobbyLabel } from '../../api/mappers';
import type { ExperienceDetail } from '../../api/types';
import { CLASS_ART_BY_HOBBY } from '../../assets/classArt';
import { withComma } from '../../lib/appState';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { SectionTitle } from '../Blocks';
import { Button } from '../Button';
import type { TreeStageNo } from '../Graphics';
import { Screen } from '../Screen';
import { useToast } from '../Toast';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';
import { ClassDetailView } from '../together/ClassDetailView';
import { formatWhen } from './ServerTogether';

const isHttp = (u?: string) => !!u && /^https?:\/\//.test(u);
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function ServerClassDetail({ experienceId }: { experienceId: number }) {
  const toast = useToast();
  const { trees } = useForest();
  const [c, setC] = useState<ExperienceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  /** 같은 예약 요청을 다시 보낼 때 같은 키 (중복 기록 방지) */
  const keyRef = useRef<{ sessionId: number; key: string } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await getExperience(experienceId);
      setC(d);
      const firstOpen = (d.sessions ?? []).find((s) => s.status === 'OPEN' && (s.remainingSeats ?? 1) > 0) ?? d.sessions?.[0];
      setSessionId((prev) => prev ?? firstOpen?.sessionId ?? d.nextSession?.sessionId ?? null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [experienceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error || !c) {
    return (
      <Screen header={<TopBar title="클래스 상세" />}>
        <View style={styles.center}>
          {error ? (
            <>
              <AppText variant="callout14Regular" color="textBody" align="center">
                {error}
              </AppText>
              <Button label="다시 시도" variant="outline" hug onPress={load} />
            </>
          ) : (
            <ActivityIndicator color={COLORS.brandPrimary} />
          )}
        </View>
      </Screen>
    );
  }

  // 활동으로 인정받을 내 나무 (같은 취미·키우는 중)
  const tree = trees.find((t) => t.server?.hobbyId === c.hobbyId && t.server?.treeStatus === 'ACTIVE');
  const hobby = hobbyLabel(c.hobbyName) || tree?.name || '취미';
  const stageNo = Math.max(1, Math.min(5, tree?.server?.stageNumber ?? 1)) as TreeStageNo;

  const onReserve = async () => {
    if (!sessionId) return;
    setBusy(true);
    const key = keyRef.current?.sessionId === sessionId ? keyRef.current.key : newIdempotencyKey();
    keyRef.current = { sessionId, key };
    try {
      const r = await createReservation(experienceId, { sessionId, userHobbyId: tree?.server?.userHobbyId ?? null }, key);
      const url = isHttp(r.bookingUrl) ? r.bookingUrl : isHttp(c.bookingUrl) ? c.bookingUrl : undefined;
      if (url) await Linking.openURL(url).catch(() => undefined);
      toast({ title: '예약 페이지로 이동했어요', sub: '판매처에서 예약을 마치면 ‘예약 확정’으로 바뀌어요', icon: 'calendar' });
      keyRef.current = null;
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'RESERVATION409_1'
          ? '이미 이 일정을 예약했어요. 함께 탭의 내 예약에서 확인해 주세요.'
          : e instanceof ApiError && e.code === 'RESERVATION400_1'
            ? '지금은 예약할 수 없는 일정이에요. 다른 일정을 골라 주세요.'
            : errorMessage(e);
      toast({ title: '예약 정보를 기록하지 못했어요', sub: msg, icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  const onSubscribe = async () => {
    setBusy(true);
    try {
      await subscribeClassOpen(experienceId);
      setC({ ...c, isOpenNotificationSubscribed: true });
      toast({ title: '알림을 신청했어요', sub: '예약이 열리면 알림함으로 알려드릴게요', icon: 'bell' });
    } catch (e) {
      toast({ title: '알림을 신청하지 못했어요', sub: errorMessage(e), icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  const sessions = c.sessions ?? [];
  const picked = sessions.find((s) => s.sessionId === sessionId) ?? c.nextSession;
  const comingSoon = c.status === 'COMING_SOON';
  const closed = c.status === 'CLOSED';
  const seats = picked?.remainingSeats;

  const ctaLabel = comingSoon
    ? c.isOpenNotificationSubscribed
      ? '오픈 알림을 신청했어요'
      : '예약 열리면 알림 받기'
    : closed
      ? '모집이 마감됐어요'
      : busy
        ? '이동하는 중…'
        : `${c.price ? `${withComma(c.price)}원` : '무료'} · 예약하기`;

  return (
    <ClassDetailView
      m={{
        topTitle: c.type === 'CLASS' ? '클래스 상세' : '모임 상세',
        art: CLASS_ART_BY_HOBBY[hobbyKeyOf(c.hobbyName)] ?? '',
        kindLabel: c.type === 'CLASS' ? '원데이 클래스' : '모임',
        badge: comingSoon ? { label: '준비 중', tone: 'gray' } : closed ? { label: '마감', tone: 'gray' } : c.provider ? { label: '제휴', tone: 'ad' } : undefined,
        hostMeta: [c.provider?.name, c.region?.name].filter(Boolean).join(' · ') || hobby,
        title: c.title,
        rows: [
          { k: '일시', v: picked?.startsAt ? formatWhen(picked.startsAt) : '일정 미정', icon: 'calendar' },
          { k: '장소', v: [c.venueName, c.address ?? c.region?.name].filter(Boolean).join(' · ') || '장소 미정', icon: 'pin' },
          { k: '정원', v: seats != null ? `${seats}자리 남음` : '판매처에서 확인', icon: 'users' },
          { k: '준비물', v: (c.materials ?? []).join(', ') || '없음', icon: 'bag' },
        ],
        tree: {
          stage: stageNo,
          title: `내 ${hobby} 나무와 연결돼요`,
          sub: tree
            ? `참여가 확인되면 ${hobby} ${stageNo}단계 활동 1개로 기록돼요`
            : `${hobby} 나무를 심어 두면 참여가 활동으로 기록돼요`,
        },
        note: comingSoon
          ? '예약 오픈 전이에요. 알림을 받으면 예약이 열릴 때 알려드려요.'
          : '제휴 클래스예요. 예약·결제와 취소·환불은 판매처 규정을 따라요.',
        ctaLabel,
        ctaDisabled: busy || closed || (comingSoon ? !!c.isOpenNotificationSubscribed : !sessionId),
        onCta: comingSoon ? onSubscribe : onReserve,
        onChat: () => go('/together/chat-soon'),
        onMore: () => go(`/overlay/more?title=${encodeURIComponent(c.title)}&path=${encodeURIComponent(`/class/${c.experienceId}`)}`),
        link: isHttp(c.cancellationPolicyUrl)
          ? { label: '취소·환불 정책 보기', onPress: () => Linking.openURL(c.cancellationPolicyUrl!).catch(() => undefined) }
          : undefined,
        children:
          !comingSoon && sessions.length > 1 ? (
            <>
              <SectionTitle title="날짜" right="옆으로 넘겨 보세요" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dates}>
                {sessions.map((s) => {
                  const on = s.sessionId === sessionId;
                  const full = s.status !== 'OPEN' || s.remainingSeats === 0;
                  const d = new Date(s.startsAt);
                  const ok = !Number.isNaN(d.getTime());
                  return (
                    <Touchable
                      key={s.sessionId}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, disabled: full }}
                      accessibilityLabel={formatWhen(s.startsAt)}
                      disabled={full}
                      onPress={() => setSessionId(s.sessionId)}
                      style={[styles.date, on ? styles.dateOn : styles.dateOff, full && styles.dateFull]}
                    >
                      <AppText variant="caption12Medium" color={on ? 'textOnDarkMuted' : 'textMuted'}>
                        {ok ? WEEK[d.getDay()] : ''}
                      </AppText>
                      <AppText variant="body16Bold" color={on ? 'textOnDark' : 'textPrimary'}>
                        {ok ? `${d.getMonth() + 1}.${d.getDate()}` : '-'}
                      </AppText>
                      <AppText variant="micro11Bold" color={on ? 'textOnDark' : 'brandPrimary'}>
                        {full ? '마감' : s.remainingSeats != null ? `${s.remainingSeats}자리` : ok ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''}
                      </AppText>
                    </Touchable>
                  );
                })}
              </ScrollView>
            </>
          ) : undefined,
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  dateScroll: { marginHorizontal: -24, flexGrow: 0 },
  dates: { gap: 8, paddingHorizontal: 24 },
  date: { width: 62, height: 80, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dateOn: { backgroundColor: COLORS.brandPrimary },
  dateOff: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  dateFull: { opacity: 0.45 },
});
