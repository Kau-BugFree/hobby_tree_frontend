import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS, ColorToken } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

/** 여러 화면에서 반복되는 작은 레이아웃 블록 모음 */

export function Card({
  children,
  bg = 'bgSurface',
  border = 'borderDefault',
  radius = 20,
  padding = 16,
  gap = 10,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  bg?: ColorToken;
  border?: ColorToken | null;
  radius?: number;
  padding?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const s: StyleProp<ViewStyle> = [
    { backgroundColor: COLORS[bg], borderRadius: radius, padding, gap, alignSelf: 'stretch' },
    border ? { borderWidth: 1, borderColor: COLORS[border] } : null,
    style,
  ];
  return onPress ? (
    <Touchable onPress={onPress} accessibilityLabel={accessibilityLabel} style={s}>
      {children}
    </Touchable>
  ) : (
    <View style={s}>{children}</View>
  );
}

export function Row({ children, gap = 8, align = 'center', justify, style }: {
  children: React.ReactNode;
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: align, justifyContent: justify, gap }, style]}>{children}</View>;
}

export function Col({ children, gap = 4, flex, style }: { children: React.ReactNode; gap?: number; flex?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ gap }, flex && { flex: 1 }, style]}>{children}</View>;
}

/** 섹션 제목 + 오른쪽 보조 텍스트 */
export function SectionTitle({ title, right, onPressRight }: { title: string; right?: string; onPressRight?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <AppText variant="headline18Bold" color="textPrimary" style={styles.flex}>
        {title}
      </AppText>
      {right ? (
        onPressRight ? (
          <Touchable small onPress={onPressRight}>
            <AppText variant="caption12Bold" color="brandPrimary">
              {right}
            </AppText>
          </Touchable>
        ) : (
          <AppText variant="caption12Bold" color="brandPrimary">
            {right}
          </AppText>
        )
      ) : null}
    </View>
  );
}

/** ⓘ 아이콘 + 보조 설명 (Figma 14px info 아이콘 + Caption) */
export function InfoNote({ text, color = 'textMuted', bold }: { text: string; color?: ColorToken; bold?: boolean }) {
  return (
    <View style={styles.note}>
      <IconSlot name="info" size={14} color={color} style={styles.noteIcon} />
      <AppText variant={bold ? 'caption12Bold' : 'caption12Medium'} color={color} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

/** 질문 번호 배지 (Q01, B05 …) + 선택 규칙 */
export function QuestionHead({ code, rule, title }: { code: string; rule?: string; title: string }) {
  return (
    <View style={styles.qHead}>
      <View style={styles.qRow}>
        <View style={styles.qBadge}>
          <AppText variant="micro11Bold" color="brandDeep">
            {code}
          </AppText>
        </View>
        {rule ? (
          <AppText variant="caption12Bold" color="textMuted">
            {rule}
          </AppText>
        ) : null}
      </View>
      <AppText variant="headline18Bold" color="textPrimary">
        {title}
      </AppText>
    </View>
  );
}

/** 라벨-값 한 줄 (예: 일시 / 10/18(토) 14:00) */
export function KeyValue({ k, v, icon, keyWidth = 56 }: { k: string; v: string; icon?: string; keyWidth?: number }) {
  return (
    <View style={styles.kv}>
      {icon ? <IconSlot name={icon} size={18} color="brandPrimary" /> : null}
      <AppText variant="callout14Regular" color="textMuted" style={{ width: keyWidth }}>
        {k}
      </AppText>
      <AppText variant="callout14Bold" color="textPrimary" style={styles.flex}>
        {v}
      </AppText>
    </View>
  );
}

/** 오른쪽 화살표가 있는 목록 행 */
export function ListRow({
  title,
  sub,
  left,
  right,
  onPress,
  style,
}: {
  title: string;
  sub?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Touchable onPress={onPress} accessibilityLabel={title} style={[styles.listRow, style]}>
      {left}
      <View style={styles.flex}>
        <AppText variant="callout14Bold" color="textPrimary">
          {title}
        </AppText>
        {sub ? (
          <AppText variant="caption12Medium" color="textMuted">
            {sub}
          </AppText>
        ) : null}
      </View>
      {right ?? <IconSlot name="chev" size={18} color="textMuted" />}
    </Touchable>
  );
}

export function Divider({ color = 'borderDefault' }: { color?: ColorToken }) {
  return <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: COLORS[color] }} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  noteIcon: { marginTop: 2 },
  qHead: { gap: 6 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qBadge: { backgroundColor: COLORS.bgKhaki, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  kv: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
  },
});
