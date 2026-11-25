/**
 * M-01 MY · 알림 설정 (Figma v5) — ‘알림 받기’ 스위치 하나
 * - 기본 꺼짐. 켜면 주 1회 요약(WEEKLY), 끄면 받지 않기(NONE)
 * - 로그인 상태: API-05로 현재 값 확인 · API-46으로 저장 (실패하면 되돌림)
 */
import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { getMe, updateNotificationSettings } from '../../api/endpoints';
import { useAppState } from '../../lib/appState';
import { useSession } from '../../lib/session';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { useToast } from '../Toast';

const OFF = '받지 않기';
const ON = '주 1회 요약';

export function NoticeToggleCard() {
  const { state, setAnswer } = useAppState();
  const { signedIn } = useSession();
  const toast = useToast();
  const value = (state.answers.noticeFrequency as string | undefined) ?? OFF;
  const on = value !== OFF;

  useFocusEffect(
    useCallback(() => {
      if (!signedIn) return;
      getMe()
        .then((me) => {
          const f = me.notificationSettings?.notificationFrequency;
          if (f) setAnswer('noticeFrequency', f === 'NONE' ? OFF : f === 'WEEKLY' ? ON : '활동한 날만');
        })
        .catch(() => undefined);
    }, [signedIn, setAnswer]),
  );

  const onChange = async (next: boolean) => {
    const prev = value;
    setAnswer('noticeFrequency', next ? ON : OFF);
    if (!signedIn) return;
    try {
      await updateNotificationSettings(next ? 'WEEKLY' : 'NONE');
    } catch (e) {
      setAnswer('noticeFrequency', prev);
      toast({ title: '알림 설정을 바꾸지 못했어요', sub: errorMessage(e), icon: 'info' });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.flex}>
        <AppText variant="body16Bold" color="textPrimary">
          알림 받기
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          활동·클래스 소식을 꼭 필요할 때만 알려 드려요. 연속 기록이 끊겨도 알리지 않아요.
        </AppText>
      </View>
      <Switch
        accessibilityLabel="알림 받기"
        value={on}
        onValueChange={onChange}
        trackColor={{ false: COLORS.bgKhaki, true: COLORS.brandPrimary }}
        thumbColor={COLORS.bgSurface}
        ios_backgroundColor={COLORS.bgKhaki}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
});
