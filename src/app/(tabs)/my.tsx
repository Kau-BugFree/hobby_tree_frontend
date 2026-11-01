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
  CircleIconButton,
  IconSlot,
  PlantTreeButton,
  SectionTitle,
  TAB_BAR_HEIGHT,
  TabHeader,
  TagRow,
  Touchable,
} from '../../components';
import { Avatar, EmptySlotRow, RoadmapRow } from '../../components/my/MyParts';
import { MAX_TREE_SLOTS, TREES } from '../../data/hobbies';
import { PROFILE_STATS, profileTags } from '../../data/my';
import { shortRegion, useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
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

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppState();
  const stats: StatItem[] = [
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
          <RoadmapRow key={t.hobby} tree={t} onPress={() => go(`/my/roadmap?hobby=${encodeURIComponent(t.hobby)}`)} />
        ))}
        {left > 0 ? <EmptySlotRow left={left} onPress={() => go('/home/plant')} /> : null}
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
});
