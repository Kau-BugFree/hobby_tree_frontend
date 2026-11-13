/**
 * O-01 로그인
 * - 더미 제거: Status Bar, Home Indicator
 * - 레이아웃: Hero(그라데이션 글로우 + 세계수) / 본문 / 하단 소셜 로그인 버튼 2개 (고정)
 * - 로그인은 카카오·구글 소셜 로그인만 지원 (백엔드 명세 API-01: provider = KAKAO | GOOGLE)
 * API-01 소셜 로그인 → 신규·온보딩 미완료는 온보딩, 기존 회원은 홈
 * API-04 탈퇴 후 30일 안이면 복구 안내 → 복구하기
 * 개발용 빌드: 카카오·구글 SDK 로그인 창 → 토큰 자동 / Expo Go·웹: .env.local 개발용 토큰 / 둘 다 없으면 '체험 모드'
 * 로그인에 성공하면 ‘로그인되었습니다!’ 모달 → ‘시작하기’로 온보딩(신규·미완료) 또는 홈(기존)으로 이동
 */
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageSourcePropType, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api/client';
import type { Provider } from '../../api/types';
import { AppText, Button, IllustrationSlot, Tag, Touchable, TreeStage, useToast } from '../../components';
import { go, reset } from '../../lib/nav';
import { SocialLoginCancelledError } from '../../lib/socialAuth';
import { SignInResult, useSession } from '../../lib/session';
import { COLORS } from '../../theme';

interface LoginOption {
  id: Provider;
  label: string;
  bg: string;
  fg: string;
  border?: string;
  /** 공식 리소스에서 가져온 브랜드 심볼 (assets/brand) */
  icon: ImageSourcePropType;
}

/** 소셜 브랜드 색상은 디자인 토큰이 아닌 각 사 가이드 색 */
const LOGIN_OPTIONS: LoginOption[] = [
  { id: 'KAKAO', label: '카카오로 시작하기', bg: COLORS.kakaoBg, fg: COLORS.kakaoFg, icon: require('../../../assets/brand/kakao.png') },
  {
    id: 'GOOGLE',
    label: 'Google로 시작하기',
    bg: COLORS.googleBg,
    fg: COLORS.googleFg,
    border: COLORS.googleBorder,
    icon: require('../../../assets/brand/google.png'),
  },
];

/** 로그인 성공 모달 */
function WelcomeModal({ isNew, onStart }: { isNew: boolean; onStart: () => void }) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onStart} statusBarTranslucent>
      <View style={styles.dim}>
        <View style={styles.modal} accessibilityViewIsModal accessibilityRole="alert">
          <TreeStage stage={1} scale={0.42} />
          <AppText variant="title22Bold" color="textPrimary" align="center">
            로그인되었습니다!
          </AppText>
          <AppText variant="callout14Regular" color="textBody" align="center">
            {isNew ? '몇 가지 질문에 답하면 나에게 맞는 첫 취미를 골라 드려요.' : '다시 오셨네요. 키우던 나무를 보러 가요.'}
          </AppText>
          <Button label={isNew ? '시작하기' : '홈으로 가기'} onPress={onStart} style={styles.modalBtn} />
        </View>
      </View>
    </Modal>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { signIn, restore } = useSession();
  const [busy, setBusy] = useState<Provider | null>(null);
  /** 로그인 성공 후 모달 → 확인하면 이동할 곳 */
  const [welcome, setWelcome] = useState<{ href: string; isNew: boolean } | null>(null);

  const afterLogin = (r: SignInResult) => {
    if (r.kind === 'ok') {
      const active = r.memberStatus === 'ACTIVE';
      setWelcome({ href: active ? '/home' : '/onboarding/step1', isNew: !active });
      return;
    }
    if (r.kind === 'restoreRequired') {
      const { restorable, restoreToken, restorableUntil } = r.info;
      if (!restorable || !restoreToken) {
        Alert.alert('복구할 수 없는 계정이에요', '탈퇴 후 30일이 지나 계정을 되살릴 수 없어요.');
        return;
      }
      const until = restorableUntil ? `\n(${restorableUntil.slice(0, 10)}까지 복구 가능)` : '';
      Alert.alert('탈퇴한 계정이에요', `복구하면 키우던 나무와 기록을 다시 볼 수 있어요.${until}`, [
        { text: '취소', style: 'cancel' },
        {
          text: '복구하기',
          onPress: async () => {
            try {
              afterLogin(await restore(restoreToken));
            } catch (e) {
              toast({ title: '복구하지 못했어요', sub: errorMessage(e), icon: 'info' });
            }
          },
        },
      ]);
      return;
    }
    // 소셜 SDK 미연결 (Expo Go 등) → 체험 모드
    toast({ title: '체험 모드로 둘러봐요', sub: '카카오·구글 로그인은 개발용 빌드에서 연결돼요', icon: 'info' });
    go('/onboarding/step1');
  };

  const onLogin = async (id: Provider) => {
    if (busy) return;
    setBusy(id);
    try {
      afterLogin(await signIn(id));
    } catch (e) {
      // 로그인 창을 닫은 경우는 조용히 넘어간다
      if (!(e instanceof SocialLoginCancelledError)) {
        toast({ title: '로그인하지 못했어요', sub: e instanceof Error && !('status' in e) ? e.message : errorMessage(e), icon: 'info' });
      }
    } finally {
      setBusy(null);
    }
  };

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
            accessibilityState={{ busy: busy === o.id, disabled: !!busy }}
            disabled={!!busy}
            onPress={() => onLogin(o.id)}
            style={[styles.loginBtn, { backgroundColor: o.bg }, o.border ? { borderWidth: 1, borderColor: o.border } : null]}
          >
            {busy === o.id ? (
              <ActivityIndicator color={o.fg} />
            ) : (
              <View style={styles.loginInner}>
                <Image source={o.icon} style={styles.loginIcon} resizeMode="contain" accessibilityIgnoresInvertColors />
                <AppText variant="body16Bold" style={{ color: o.fg }} align="center">
                  {o.label}
                </AppText>
              </View>
            )}
          </Touchable>
        ))}
      </View>
      {welcome ? (
        <WelcomeModal
          isNew={welcome.isNew}
          onStart={() => {
            const href = welcome.href;
            setWelcome(null);
            reset(href);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgForest },
  hero: { paddingTop: 20, alignItems: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', top: 0, borderWidth: 0, backgroundColor: COLORS.paletteGreen, opacity: 0.35, borderRadius: 0 },
  content: { flex: 1, gap: 12, paddingTop: 8, paddingHorizontal: 28 },
  buttons: { gap: 10, paddingTop: 12, paddingHorizontal: 24 },
  dim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: COLORS.dim },
  modal: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: COLORS.bgSurface,
  },
  modalBtn: { alignSelf: 'stretch', marginTop: 6 },
  loginInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  loginIcon: { width: 20, height: 20 },
  loginBtn: { borderRadius: 999, minHeight: 56, paddingVertical: 17, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
});
