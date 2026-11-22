/**
 * T-02 서버판 · 클래스·모임 상세
 *   API-36 상세(소개·장소·준비물·일정·예약/취소 정책 링크·활동 인정)
 *   예약: 일정 고르기 → API-37 외부 예약 기록(Idempotency-Key, 활동 인정할 내 나무 연결) → 응답 bookingUrl로만 외부 이동
 *         예약은 제공자 페이지에서 하고, 앱은 결제하지 않는다
 *   오픈 예정(COMING_SOON): API-40 오픈 알림 신청
 *   참여 확인(API-39)은 제공자가 발급한 참여 토큰이 있어야 해서 앱에서 직접 만들 수 없다 → 내 예약 상태만 보여 준다
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { ApiError, errorMessage, newIdempotencyKey } from '../../api/client';
import { createReservation, getExperience, subscribeClassOpen } from '../../api/endpoints';
import type { ExperienceDetail } from '../../api/types';
import { withComma } from '../../lib/appState';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { Card, InfoNote, KeyValue } from '../Blocks';
import { Button } from '../Button';
import { IconSlot } from '../IconSlot';
import { Screen } from '../Screen';
import { Tag } from '../Tag';
import { useToast } from '../Toast';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';
import { formatWhen } from './ServerTogether';

const isHttp = (u?: string) => !!u && /^https?:\/\//.test(u);

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

  const onReserve = async () => {
    if (!sessionId) return;
    setBusy(true);
    const key = keyRef.current?.sessionId === sessionId ? keyRef.current.key : newIdempotencyKey();
    keyRef.current = { sessionId, key };
    try {
      const r = await createReservation(experienceId, { sessionId, userHobbyId: tree?.server?.userHobbyId ?? null }, key);
      const url = isHttp(r.bookingUrl) ? r.bookingUrl : isHttp(c.bookingUrl) ? c.bookingUrl : undefined;
      if (url) await Linking.openURL(url).catch(() => undefined);
      toast({
        title: '예약 페이지로 이동했어요',
        sub: '제공자 페이지에서 예약을 마치면 확인 후 ‘예약 확정’으로 바뀌어요',
        icon: 'calendar',
      });
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
  const comingSoon = c.status === 'COMING_SOON';
  const closed = c.status === 'CLOSED';

  const footer = comingSoon ? (
    <Button
      label={c.isOpenNotificationSubscribed ? '오픈 알림을 신청했어요' : '예약 열리면 알림 받기'}
      disabled={busy || !!c.isOpenNotificationSubscribed}
      onPress={onSubscribe}
    />
  ) : (
    <Button
      label={closed ? '모집이 마감됐어요' : busy ? '이동하는 중…' : `${c.price ? `${withComma(c.price)}원 · ` : ''}예약 페이지로 가기`}
      disabled={busy || closed || !sessionId}
      onPress={onReserve}
    />
  );

  return (
    <Screen
      header={
        <TopBar
          title={c.type === 'CLASS' ? '클래스 상세' : '모임 상세'}
          onAction={() => go(`/overlay/more?title=${encodeURIComponent(c.title)}&path=${encodeURIComponent(`/class/${c.experienceId}`)}`)}
        />
      }
      footer={footer}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <View style={styles.tags}>
          <Tag label={c.type === 'CLASS' ? '클래스' : '모임'} tone="solid" />
          <Tag label={comingSoon ? '오픈 예정' : closed ? '마감' : '모집 중'} tone={comingSoon || closed ? 'gray' : 'green'} />
          {c.hobbyName ? <Tag label={c.hobbyName} tone="khaki" /> : null}
        </View>
        <AppText variant="title22Bold" color="brandDeep">
          {c.title}
        </AppText>
        {c.description ? (
          <AppText variant="callout14Regular" color="textBody">
            {c.description}
          </AppText>
        ) : null}
      </View>

      <Card radius={22} gap={10}>
        {c.provider?.name ? <KeyValue k="진행" v={c.provider.name} icon="store" /> : null}
        <KeyValue k="장소" v={[c.venueName, c.address ?? c.region?.name].filter(Boolean).join(' · ') || '장소 미정'} icon="pin" />
        {(c.materials ?? []).length ? <KeyValue k="준비물" v={(c.materials ?? []).join(', ')} icon="bag" /> : null}
        <KeyValue k="가격" v={c.price ? `${withComma(c.price)}원` : '무료'} icon="card" />
      </Card>

      {sessions.length ? (
        <View style={styles.sessions}>
          <AppText variant="body16Bold" color="textPrimary">
            일정 고르기
          </AppText>
          {sessions.map((s) => {
            const on = s.sessionId === sessionId;
            const full = s.status !== 'OPEN' || s.remainingSeats === 0;
            return (
              <Touchable
                key={s.sessionId}
                accessibilityState={{ selected: on, disabled: full }}
                disabled={full}
                onPress={() => setSessionId(s.sessionId)}
                style={[styles.session, on && styles.sessionOn, full && styles.sessionOff]}
              >
                <IconSlot name="calendar" size={16} color={on ? 'brandPrimary' : 'textMuted'} />
                <AppText variant="callout14Bold" color={full ? 'textMuted' : 'textPrimary'} style={styles.flex}>
                  {formatWhen(s.startsAt)}
                </AppText>
                <AppText variant="caption12Medium" color="textMuted">
                  {full ? '마감' : s.remainingSeats != null ? `${s.remainingSeats}자리 남음` : ''}
                </AppText>
              </Touchable>
            );
          })}
        </View>
      ) : null}

      {c.activityRecognition?.supported ? (
        <InfoNote
          text={
            tree
              ? `참여가 확인되면 ${tree.name} 나무 활동으로 인정돼요.${c.activityRecognition.verificationRequired ? ' 제공자 확인이 필요해요.' : ''}`
              : `참여하면 ${c.hobbyName ?? '이 취미'} 나무 활동으로 인정받을 수 있어요. 먼저 나무를 심어 두세요.`
          }
        />
      ) : null}
      <InfoNote text="예약과 결제는 제공자 페이지에서 해요. 하비트리는 예약 기록만 남겨요." />
      {isHttp(c.cancellationPolicyUrl) ? (
        <Touchable accessibilityLabel="취소 정책 보기" onPress={() => Linking.openURL(c.cancellationPolicyUrl!).catch(() => undefined)} style={styles.link}>
          <AppText variant="caption12Bold" color="textMuted" style={styles.underline}>
            취소·환불 정책 보기
          </AppText>
        </Touchable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  content: { gap: 14 },
  hero: { gap: 8, padding: 20, borderRadius: 30, backgroundColor: COLORS.bgKhaki },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sessions: { gap: 8 },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  sessionOn: { borderWidth: 2, borderColor: COLORS.brandPrimary },
  sessionOff: { opacity: 0.5 },
  link: { alignSelf: 'center', paddingVertical: 6 },
  underline: { textDecorationLine: 'underline' },
});
