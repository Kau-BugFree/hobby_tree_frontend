/**
 * M-01 MY · 취미 기록
 * - 더미 제거: Status Bar, Home Indicator
 * - 서브 컴포넌트: ProfileCard, StatTile ×3(벤토), RoadmapRow ×4, EmptySlotRow
 * - 프로필 카드·관리 버튼 → M-03 / 로드맵 행 → M-02 / 빈 자리 → H-09
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  ChatbotFab,
  ConfirmModal,
  CircleIconButton,
  IconSlot,
  PlantTreeButton,
  SectionTitle,
  TAB_BAR_HEIGHT,
  TabHeader,
  TagRow,
  Touchable,
  useToast,
} from '../../components';
import { Avatar, EmptySlotRow, RoadmapRow } from '../../components/my/MyParts';
import { useForest } from '../../lib/forest';
import { PROFILE_STATS, profileTags } from '../../data/my';
import { shortRegion, useAppState } from '../../lib/appState';
import { go, reset } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { errorMessage } from '../../api/client';
import { COLORS, SHADOWS } from '../../theme';

interface StatItem {
  value: string;
  label: string;
  tone: 'forest' | 'khaki';
}

function StatTile({ item }: { item: StatItem }) {
  const body = (
    <>
      <AppText variant="title22Bold" color={item.tone === 'forest' ? 'textOnDark' : 'brandDeep'}>
        {item.value}
      </AppText>
      <AppText variant="caption12Medium" color={item.tone === 'forest' ? 'textOnDarkMuted' : 'textBody'}>
        {item.label}
      </AppText>
    </>
  );
  return item.tone === 'forest' ? (
    <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={styles.stat}>
      {body}
    </LinearGradient>
  ) : (
    <View style={[styles.stat, styles.statKhaki]}>{body}</View>
  );
}

function ProfileCard() {
  const { state } = useAppState();
  const places = Array.isArray(state.answers.q09Place) ? state.answers.q09Place : [];
  return (
    <Touchable accessibilityLabel="프로필 관리" onPress={() => go('/my/profile')} style={[styles.profile, SHADOWS.card]}>
      <Avatar size={56} name={state.userName} photoUri={state.profilePhotoUri} />
      <View style={styles.flexGap4}>
        <AppText variant="headline18Bold" color="textPrimary">
          {state.userName}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {`${state.profile.age} · ${shortRegion(state.region)}`}
        </AppText>
        <TagRow tags={profileTags(state.profile, places).map((label) => ({ label, tone: 'khaki' as const }))} />
      </View>
      <View style={styles.edit}>
        <IconSlot name="edit" size={16} color="brandDeep" />
      </View>
    </Touchable>
  );
}

/** API-03 로그아웃 · API-07 회원 탈퇴 — 로그인 상태일 때만 보인다 */
function LogoutRow() {
  const { signedIn, signOut, withdraw } = useSession();
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  if (!signedIn) return null;
  /** 먼저 로그인 화면으로 옮긴 뒤 세션을 정리한다 (MY 화면이 로그아웃 상태로 다시 그려지다 멈추지 않게) */
  const onPress = async () => {
    setBusy(true);
    reset('/onboarding/login');
    try {
      await signOut();
    } catch {
      // 서버 로그아웃이 실패해도 이 기기 로그인 정보는 지워진다
    }
    toast({ title: '로그아웃했어요', icon: 'info' });
  };
  /** API-07 회원 탈퇴 — 앱 모달로 한 번 더 확인 */
  const [confirmWithdraw, setConfirmWithdraw] = React.useState(false);
  const onWithdraw = async () => {
    setBusy(true);
    try {
      const r = await withdraw();
      setConfirmWithdraw(false);
      reset('/onboarding/login');
      toast({ title: '탈퇴했어요', sub: r.restorableUntil ? `${r.restorableUntil.slice(0, 10)}까지 같은 계정으로 로그인하면 복구할 수 있어요` : undefined, icon: 'info' });
    } catch (e) {
      setConfirmWithdraw(false);
      toast({ title: '탈퇴하지 못했어요', sub: errorMessage(e), icon: 'info' });
    } finally {
      setBusy(false);
    }
  };
  const restoreUntil = (() => {
    const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  return (
    <View style={styles.accountRow}>
      <Touchable accessibilityLabel="로그아웃" disabled={busy} onPress={onPress} style={styles.logout}>
        <AppText variant="callout14Bold" color="textMuted">
          {busy ? '처리하는 중…' : '로그아웃'}
        </AppText>
      </Touchable>
      <Touchable accessibilityLabel="회원 탈퇴" disabled={busy} onPress={() => setConfirmWithdraw(true)} style={styles.logout}>
        <AppText variant="caption12Bold" color="textMuted">
          회원 탈퇴
        </AppText>
      </Touchable>
      <ConfirmModal
        visible={confirmWithdraw}
        tone="danger"
        icon="leaf"
        title="정말 탈퇴할까요?"
        message="키우던 나무와 활동 기록은 30일 동안 보관돼요. 그 안에 같은 계정으로 로그인하면 다시 되살릴 수 있어요."
        highlight={`${restoreUntil}이 지나면 복구할 수 없어요`}
        confirmLabel="탈퇴하기"
        cancelLabel="계속 이용하기"
        busy={busy}
        onConfirm={onWithdraw}
        onCancel={() => setConfirmWithdraw(false)}
      />
    </View>
  );
}

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppState();
  // 로그인: API-18 나무 목록 기준 / 체험 모드: 가짜 값
  const { trees: ALL_TREES, live, maxTrees: MAX_TREE_SLOTS } = useForest();
  // 백엔드 요청(11/14): MY 탭에서는 커피 나무를 보여 주지 않는다 (체험 탭과 같은 기준)
  const TREES = ALL_TREES.filter((t) => t.hobby !== '커피');
  const stats: StatItem[] = live
    ? [
        { value: `${TREES.length}그루`, label: '키우는 나무', tone: 'forest' },
        { value: `${Math.max(0, ...TREES.map((t) => t.server?.stageNumber ?? 0))}단계`, label: '가장 큰 나무', tone: 'khaki' },
        { value: `${TREES.reduce((n, t) => n + (t.server?.completed ?? 0), 0)}개`, label: '해 본 활동', tone: 'khaki' },
      ]
    : [
        { value: `${PROFILE_STATS.trees}그루`, label: '키우는 나무', tone: 'forest' },
        { value: `${PROFILE_STATS.maxStage}단계`, label: '가장 큰 나무', tone: 'khaki' },
        { value: `${PROFILE_STATS.doneActivities}개`, label: '해 본 활동', tone: 'khaki' },
      ];
  const left = MAX_TREE_SLOTS - TREES.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TabHeader
        eyebrow={`${state.userName} 님의 취미 기록`}
        title="MY"
        actions={
          <>
            <PlantTreeButton />
            <CircleIconButton icon="settings" label="프로필 관리" onPress={() => go('/my/profile')} />
          </>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileCard />
        <View style={styles.bento}>
          {stats.map((s) => (
            <StatTile key={s.label} item={s} />
          ))}
        </View>
        <SectionTitle title="취미 로드맵" right={`${TREES.length}/${MAX_TREE_SLOTS}그루`} />
        {TREES.map((t) => (
          <RoadmapRow
            key={String(t.server?.userHobbyId ?? t.hobby)}
            tree={t}
            onPress={() => go(`/my/roadmap?hobby=${encodeURIComponent(t.hobby)}${t.server ? `&userHobbyId=${t.server.userHobbyId}` : ''}`)}
          />
        ))}
        {left > 0 ? <EmptySlotRow left={left} onPress={() => go('/home/plant')} /> : null}
        <LogoutRow />
      </ScrollView>
      <ChatbotFab />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  content: { gap: 12, paddingHorizontal: 24, paddingTop: 4 },
  flexGap4: { flex: 1, gap: 4 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  edit: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgGreenSoft },
  bento: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, gap: 2, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 20 },
  statKhaki: { backgroundColor: COLORS.bgKhaki },
  accountRow: { alignItems: 'center', gap: 2 },
  logout: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, marginTop: 8 },
});
