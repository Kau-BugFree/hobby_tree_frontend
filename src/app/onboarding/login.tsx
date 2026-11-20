/**
 * O-01 로그인
 * - 더미 제거: Status Bar, Home Indicator
 * - 레이아웃: Hero(그라데이션 글로우 + 세계수) / 본문 / 하단 로그인 버튼 (고정)
 * - 소셜 로그인: 카카오 · Google (백엔드 API-01 provider = KAKAO | GOOGLE)
 *   각 사 디자인 가이드에 맞춤 (11/18 윤여빈 요청)
 *   · 카카오: 배경 #FEE500, 말풍선 심볼 #000000, 레이블 #000000 85%, 모서리 12, 문구 ‘카카오 로그인’(가이드 표준 문구)
 *     https://developers.kakao.com/docs/ko/kakaologin/design-guide
 *   · Google(라이트 테마): 배경 #FFFFFF, 테두리 #747775 1px, 글자 #1F1F1F, 표준 색 G 로고, 로고-글자 간격 10
 *     문구 ‘Google 계정으로 로그인’(Sign in with Google 한국어) — https://developers.google.com/identity/branding-guidelines
 *   · 두 버튼은 크기·모양·순서를 같게 해서 어느 한쪽을 강조하지 않는다 (두 가이드 공통 요구)
 *   · 심볼/로고 + 글자를 한 묶음으로 가운데 정렬 (카카오 ‘레이블과 함께 가운데 정렬’ 허용, Google 로고 오른쪽 10 간격)
 */
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IllustrationSlot, Tag, Touchable, TreeStage } from '../../components';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

interface LoginOption {
  id: 'kakao' | 'google';
  label: string;
  bg: string;
  fg: string;
  icon: ImageSourcePropType;
  border?: string;
}

/** 소셜 브랜드 색상은 디자인 토큰이 아닌 각 사 가이드 색 */
const LOGIN_OPTIONS: LoginOption[] = [
  { id: 'kakao', label: '카카오 로그인', bg: COLORS.kakaoBg, fg: COLORS.kakaoFg, icon: require('../../../assets/brand/kakao.png') },
  {
    id: 'google',
    label: 'Google 계정으로 로그인',
    bg: COLORS.googleBg,
    fg: COLORS.googleFg,
    border: COLORS.googleBorder,
    icon: require('../../../assets/brand/google.png'),
  },
  // ‘이메일로 시작하기 · 이미 계정이 있어요’ 글자 버튼은 통째로 뺐다 (11/18) — 백엔드 로그인은 KAKAO · GOOGLE 두 가지만 지원
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
            style={[styles.socialBtn, { backgroundColor: o.bg }, o.border ? { borderWidth: 1, borderColor: o.border } : null]}
          >
            <View style={styles.socialInner}>
              <Image source={o.icon} style={styles.loginIcon} resizeMode="contain" accessibilityIgnoresInvertColors />
              <AppText variant="body16Bold" style={{ color: o.fg }} align="center">
                {o.label}
              </AppText>
            </View>
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
  /** 카카오 가이드: 모서리 12 — Google도 같은 모양(직사각형 계열)으로 맞춘다 */
  socialBtn: { borderRadius: 12, minHeight: 54, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  socialInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginIcon: { width: 20, height: 20 },
});
