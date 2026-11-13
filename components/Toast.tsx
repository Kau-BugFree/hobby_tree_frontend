import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOWS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

/** Figma 토스트 오버레이 OV-04 / OV-05 / OV-06 / OV-11 */
export interface ToastMessage {
  title: string;
  sub?: string;
  /** 아이콘 노드 이름 (share, link, save, bell, check) */
  icon?: string;
}

const ToastContext = createContext<(m: ToastMessage) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

/** Figma: AFTER_TIMEOUT 1.8s → CLOSE. 스크린리더 사용자를 위해 알림도 함께 읽어 준다. */
const DURATION_MS = 1800;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMsg(null));
  }, [opacity]);

  const show = useCallback(
    (m: ToastMessage) => {
      if (timer.current) clearTimeout(timer.current);
      setMsg(m);
      AccessibilityInfo.announceForAccessibility([m.title, m.sub].filter(Boolean).join('. '));
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, DURATION_MS);
    },
    [hide, opacity],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg ? (
        <ToastLayer>
          <Animated.View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 110, opacity }]}>
            <Touchable onPress={hide} style={styles.toast} accessibilityRole="alert">
              <View style={styles.icon}>
                <IconSlot name={msg.icon ?? 'check'} size={15} color="textOnDark" />
              </View>
              <View style={styles.texts}>
                <AppText variant="callout14Bold" color="textOnDark">
                  {msg.title}
                </AppText>
                {msg.sub ? (
                  <AppText variant="caption12Medium" color="textOnDarkMuted">
                    {msg.sub}
                  </AppText>
                ) : null}
              </View>
            </Touchable>
          </Animated.View>
        </ToastLayer>
      ) : null}
    </ToastContext.Provider>
  );
}

/**
 * iOS에서는 오버레이 화면(더보기·공유 시트)이 앱 화면보다 위 '별도 창'에 떠서
 * 일반 View로 그린 토스트가 시트 뒤에 가려졌다. FullWindowOverlay는 항상 맨 위 창에 그린다.
 * (Android·웹은 같은 화면 계층이라 그대로 그린다)
 */
function ToastLayer({ children }: { children: React.ReactNode }) {
  return Platform.OS === 'ios' ? <FullWindowOverlay>{children}</FullWindowOverlay> : <>{children}</>;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  toast: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 18,
    borderRadius: 18,
    backgroundColor: COLORS.textPrimary,
    ...SHADOWS.toast,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: COLORS.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 1 },
});
