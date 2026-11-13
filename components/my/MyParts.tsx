/**
 * MY 탭 공통 서브 컴포넌트
 * - Avatar: M-01 프로필 카드 · M-03 사진 · M-13 확인창 (사진 없으면 이름 첫 글자)
 * - StageTrack: 6칸 성장 막대 (M-01 로드맵 행, H-01 나무 카드와 동일 규칙)
 * - RoadmapRow / EmptySlotRow: M-01 취미 로드맵 목록
 * - FormSection · FieldLabel · BudgetSlider · CheckRow: M-03 · M-04 입력 요소
 */
import Slider from '@react-native-community/slider';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { TreeData } from '../../data/hobbies';
import { formatManWon } from '../../lib/appState';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { HobbyIcon, STAGE_NAME, TreeStage, TreeStageNo } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { Touchable } from '../Touchable';

/* ───────── Avatar ───────── */

export interface AvatarProps {
  size: number;
  name: string;
  photoUri: string | null;
}

export function Avatar({ size, name, photoUri }: AvatarProps) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (photoUri) {
    return <Image source={{ uri: photoUri }} resizeMode="cover" style={box} accessibilityLabel={`${name} 프로필 사진`} />;
  }
  return (
    <View style={[styles.avatar, box]} accessibilityLabel={`${name} 기본 프로필`}>
      <AppText variant={size >= 80 ? 'title26Black' : 'headline18Bold'} color="textOnDark" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>
        {name.slice(0, 1)}
      </AppText>
    </View>
  );
}

/* ───────── StageTrack ───────── */

export function StageTrack({ stage, total = 6 }: { stage: TreeStageNo; total?: number }) {
  return (
    <View style={styles.track} accessibilityLabel={`${total}단계 중 ${stage}단계`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.seg, { backgroundColor: i <= stage ? COLORS.brandMid : COLORS.bgSunken }]} />
      ))}
    </View>
  );
}

/* ───────── M-01 로드맵 행 ───────── */

export function RoadmapRow({ tree, onPress }: { tree: TreeData; onPress: () => void }) {
  return (
    <Touchable accessibilityLabel={`${tree.name} 로드맵, ${tree.stageLabel}`} onPress={onPress} style={styles.roadRow}>
      <View style={styles.treeTile}>
        <TreeStage stage={tree.stage} scale={0.15} />
      </View>
      <View style={styles.flexGap6}>
        <View style={styles.rowGap6}>
          <HobbyIcon hobby={tree.hobby} size={16} />
          <AppText variant="callout14Bold" color="textPrimary">
            {`${tree.name} · ${tree.stage}단계 ${STAGE_NAME[tree.stage]}`}
          </AppText>
        </View>
        <StageTrack stage={tree.stage} />
        <AppText variant="caption12Medium" color="textMuted">
          {`${tree.stage}단계 ${tree.growthStatus}`}
        </AppText>
      </View>
      <IconSlot name="chev" size={18} color="textMuted" />
    </Touchable>
  );
}

export function EmptySlotRow({ left, onPress }: { left: number; onPress: () => void }) {
  return (
    <Touchable accessibilityLabel={`새 나무 심기, ${left}자리 남음`} onPress={onPress} style={styles.empty}>
      <View style={styles.plus}>
        <IconSlot name="plus" size={20} color="brandPrimary" />
      </View>
      <AppText variant="callout14Bold" color="brandPrimary">
        {`새 나무 심기 · ${left}자리 남음`}
      </AppText>
    </Touchable>
  );
}

/* ───────── M-03 폼 요소 ───────── */

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="headline18Bold" color="textPrimary">
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function FieldLabel({ label, hint, right }: { label: string; hint?: string; right?: string }) {
  return (
    <View style={styles.labelRow}>
      <AppText variant="callout14Bold" color="textBody">
        {label}
        {hint ? (
          <AppText variant="caption12Medium" color="textMuted">
            {` · ${hint}`}
          </AppText>
        ) : null}
      </AppText>
      {right ? (
        <AppText variant="callout14Bold" color="brandDeep">
          {right}
        </AppText>
      ) : null}
    </View>
  );
}

export interface BudgetSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

const won = (v: number) => (v === 0 ? '0원' : formatManWon(v));

/** Figma Slider: 트랙 8 · 채움 brand/primary · 썸 22 (네이티브 Slider로 구현, 썸 모양은 OS 기본) */
export function BudgetSlider({ label, value, min, max, step, onChange }: BudgetSliderProps) {
  return (
    <View style={styles.sliderBox}>
      <FieldLabel label={label} right={won(value)} />
      <Slider
        accessibilityLabel={label}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={COLORS.brandPrimary}
        maximumTrackTintColor={COLORS.bgSunken}
        thumbTintColor={COLORS.brandPrimary}
        style={styles.slider}
      />
      <View style={styles.labelRow}>
        <AppText variant="micro11Bold" color="textMuted">
          {won(min)}
        </AppText>
        <AppText variant="micro11Bold" color="textMuted">
          {won(max)}
        </AppText>
      </View>
    </View>
  );
}

export function CheckRow({
  label,
  checked,
  onToggle,
  onView,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onView?: () => void;
}) {
  return (
    <View style={styles.checkRow}>
      <Touchable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        onPress={onToggle}
        style={styles.checkHit}
      >
        <View style={[styles.box, checked ? styles.boxOn : styles.boxOff]}>
          {checked ? <IconSlot name="check" size={14} color="textOnDark" /> : null}
        </View>
        <AppText variant="callout14Regular" color="textBody" style={styles.flex}>
          {label}
        </AppText>
      </Touchable>
      {onView ? (
        <Touchable small accessibilityLabel={`${label} 전문 보기`} onPress={onView}>
          <AppText variant="caption12Bold" color="textMuted" style={styles.underline}>
            보기
          </AppText>
        </Touchable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGap6: { flex: 1, gap: 6 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandPrimary },
  track: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  roadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  treeTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgGreenSoft,
    overflow: 'hidden',
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
  },
  plus: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgGreenSoft },
  section: { gap: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderBox: { gap: 4 },
  slider: { height: 36, marginHorizontal: -4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkHit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  box: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: COLORS.brandPrimary },
  boxOff: { backgroundColor: COLORS.bgSurface, borderWidth: 1.5, borderColor: COLORS.borderStrong },
  underline: { textDecorationLine: 'underline' },
});
