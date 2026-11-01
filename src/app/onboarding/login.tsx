/**
 * O-01 로그인
 * - 더미 제거: Status Bar, Home Indicator
 * - 레이아웃: Hero(그라데이션 글로우 + 세계수) / 본문 / 하단 로그인 버튼 3개 (고정)
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IllustrationSlot, Tag, Touchable, TreeStage } from '../../components';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

interface LoginOption {
  id: 'kakao' | 'apple' | 'email';
  label: string;
  bg: string | null;
  fg: string;
}

/** 소셜 브랜드 색상은 디자인 토큰이 아닌 각 사 가이드 색 */
const LOGIN_OPTIONS: LoginOption[] = [
  { id: 'kakao', label: '카카오로 시작하기', bg: COLORS.kakaoBg, fg: COLORS.kakaoFg },
  { id: 'apple', label: 'Apple로 시작하기', bg: COLORS.appleBg, fg: COLORS.appleFg },
  { id: 'email', label: '이메일로 시작하기 · 이미 계정이 있어요', bg: null, fg: COLORS.textOnDarkMuted },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  // TODO(API): 소셜 로그인 SDK 연동 후 신규 가입자는 온보딩, 기존 사용자는 홈 탭으로 분기
  const onLogin = (_id: LoginOption['id']) => go('/onboarding/step1');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <IllustrationSlot name="Glow" width="100%" height={330} style={styles.glow} />
        <TreeStage stage={5} scale={0.96} />
      </View>
      <View style={styles.content}>
        <Tag label="HobbyTree 하비트리" tone="onDark" />
        <AppText variant="display34Black" color="textOnDark">
          {'씨앗 하나에서\n나만의 세계수까지'}
        </AppText>
        <AppText variant="callout14Regular" color="textOnDarkMuted">
          취향과 생활에 맞는 취미를 고르고, 활동할 때마다 물을 줘서 나무를 키워요.
        </AppText>
      </View>
      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
        {LOGIN_OPTIONS.map((o) => (
          <Touchable
            key={o.id}
            accessibilityLabel={o.label}
            onPress={() => onLogin(o.id)}
            style={[styles.loginBtn, o.bg ? { backgroundColor: o.bg } : styles.textBtn]}
          >
            <AppText
              variant={o.bg ? 'body16Bold' : 'callout14Bold'}
              style={{ color: o.fg }}
              align="center"
            >
              {o.label}
            </AppText>
          </Touchable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgForest },
  hero: { paddingTop: 20, alignItems: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', top: 0, borderWidth: 0, backgroundColor: COLORS.paletteGreen, opacity: 0.35, borderRadius: 0 },
  content: { flex: 1, gap: 12, paddingTop: 8, paddingHorizontal: 28 },
  buttons: { gap: 10, paddingTop: 12, paddingHorizontal: 24 },
  loginBtn: { borderRadius: 999, paddingVertical: 17, paddingHorizontal: 20, alignItems: 'center' },
  textBtn: { paddingVertical: 10 },
});
