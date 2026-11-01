import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { StageRecommendation, TreeData } from '../../data/hobbies';
import { ACTIVITIES } from '../../data/hobbies';
import { go } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';
import { AppText } from '../AppText';
import { HobbyIcon, IconTile, TreeStage } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { Tag } from '../Tag';
import { Touchable } from '../Touchable';

/** 한 페이지 너비 (Figma Hobby page w:326) */
export const HOBBY_PAGE_WIDTH = 326;

/** Figma "Tree card/…" : 그라데이션 카드 + 나무 + 6칸 단계 트랙 + 성장 상태 */
export function TreeCard({ tree }: { tree: TreeData }) {
  return (
    <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={[styles.treeCard, CARD_SHADOW]}>
      <View style={styles.treeTop}>
        <View style={styles.treeName}>
          <HobbyIcon hobby={tree.hobby} size={16} color="textOnDark" />
          <AppText variant="callout14Bold" color="textOnDark">
            {`${tree.name} 나무`}
          </AppText>
        </View>
        <Tag label={tree.stageLabel} tone="onDark" />
      </View>
      <View style={styles.treeArt}>
        <TreeStage stage={tree.stage} scale={0.75} />
      </View>
      <View style={styles.track} accessibilityLabel={`6단계 중 ${tree.stage}단계`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.trackSeg, { backgroundColor: i <= tree.stage ? COLORS.paletteKhaki : COLORS.onDarkTrack }]} />
        ))}
      </View>
      <View style={styles.growth}>
        <View style={styles.growthIcon}>
          <IconSlot name="sprout" size={22} color="textOnDark" />
        </View>
        <View style={styles.flex}>
          <AppText variant="callout14Bold" color="textOnDark">
            {tree.growthStatus}
          </AppText>
          <AppText variant="micro11Bold" color="textOnDarkMuted">
            {tree.stageTitle}
          </AppText>
        </View>
      </View>
    </LinearGradient>
  );
}

/** Figma "Current activity" 카드 */
export function CurrentActivityCard({ tree }: { tree: TreeData }) {
  const a = ACTIVITIES[tree.currentActivityId];
  return (
    <View style={[styles.bento, styles.current]}>
      <View style={styles.rowGap6}>
        <IconTile size={30} radius={12}>
          <HobbyIcon hobby={tree.hobby} size={17} />
        </IconTile>
        <AppText variant="caption12Bold" color="textMuted">
          지금 하는 활동
        </AppText>
      </View>
      <AppText variant="body16Bold" color="textPrimary" numberOfLines={2}>
        {a.title}
      </AppText>
      <AppText variant="caption12Medium" color="textMuted">
        {`${a.stage}단계 · ${a.minutes}분 · ${a.category}`}
      </AppText>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(tree.progress * 100)}%` }]} />
      </View>
      <View style={styles.rowGap4}>
        <IconSlot name="sprout" size={14} color="brandPrimary" />
        <AppText variant="micro11Bold" color="brandPrimary">
          {a.finishHint}
        </AppText>
      </View>
      <View style={styles.flex} />
      <Touchable
        accessibilityLabel={`${tree.name} 이어하기`}
        onPress={() => go(`/home/continue/${tree.hobby}`)}
        style={styles.continue}
      >
        <AppText variant="caption12Bold" color="textOnDark">
          이어하기
        </AppText>
      </Touchable>
    </View>
  );
}

function RecoItem({ reco, index, hobby }: { reco: StageRecommendation; index: number; hobby: string }) {
  return (
    <Touchable
      accessibilityLabel={reco.title}
      onPress={() => go(`/experience/stage?hobby=${hobby}&stage=${reco.stage}`)}
      style={[styles.reco, { backgroundColor: index === 0 ? COLORS.bgKhaki : COLORS.bgSunken }]}
    >
      <View style={styles.rowGap5}>
        <Tag label={`${reco.stage}단계`} tone={reco.tone} />
        <AppText variant="micro11Bold" color="textMuted">
          {`${reco.minutes}분`}
        </AppText>
      </View>
      <AppText variant="caption12Bold" color="textPrimary" numberOfLines={2}>
        {reco.title}
      </AppText>
    </Touchable>
  );
}

/** Figma "Stage recommendations" 카드 (단계별 추천 활동 2개) */
export function StageRecoCard({ tree }: { tree: TreeData }) {
  return (
    <View style={[styles.bento, styles.recoCard]}>
      <View style={styles.rowGap5}>
        <IconSlot name="spark" size={14} color="brandPrimary" />
        <AppText variant="caption12Bold" color="textMuted">
          단계별 추천 활동
        </AppText>
      </View>
      {tree.recommendations.map((r, i) => (
        <RecoItem key={r.title} reco={r} index={i} hobby={tree.hobby} />
      ))}
    </View>
  );
}

/** 한 취미 페이지 (나무 카드 + 2열 bento) */
export function HobbyPage({ tree }: { tree: TreeData }) {
  return (
    <View style={styles.page}>
      <TreeCard tree={tree} />
      <View style={styles.bentoRow}>
        <CurrentActivityCard tree={tree} />
        <StageRecoCard tree={tree} />
      </View>
    </View>
  );
}

const CARD_SHADOW = shadow(COLORS.shadowForest, 14, 30, 0.25, 10);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { width: HOBBY_PAGE_WIDTH, gap: 12 },
  treeCard: { height: 328, gap: 10, padding: 16, borderRadius: 34 },
  treeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  treeName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 999,
    backgroundColor: COLORS.onDarkGlass,
  },
  treeArt: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  track: { flexDirection: 'row', gap: 4 },
  trackSeg: { flex: 1, height: 6, borderRadius: 3 },
  growth: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  growthIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.onDarkTile,
  },
  bentoRow: { flexDirection: 'row', gap: 10 },
  bento: {
    flex: 1,
    minHeight: 212,
    padding: 14,
    borderRadius: 26,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  current: { gap: 7 },
  recoCard: { gap: 8 },
  rowGap4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowGap5: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: COLORS.bgSunken, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.brandPrimary },
  continue: { paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.bgForest, alignItems: 'center' },
  reco: { flex: 1, gap: 4, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 18 },
});
