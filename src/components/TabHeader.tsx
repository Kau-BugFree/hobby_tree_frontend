import React from 'react';
import { StyleSheet, View } from 'react-native';

import { go } from '../lib/nav';
import { COLORS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

/** 메인 탭 상단 헤더: 작은 안내문 + 큰 제목 + 오른쪽 액션들 */
export function TabHeader({ eyebrow, title, actions }: { eyebrow: string; title: string; actions?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        <AppText variant="callout14Regular" color="textMuted">
          {eyebrow}
        </AppText>
        <AppText variant="title26Black" color="brandDeep">
          {title}
        </AppText>
      </View>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

/** "Plant new tree" 알약 버튼 — 모든 메인 탭 헤더 공통 → H-09 */
export function PlantTreeButton() {
  return (
    <Touchable accessibilityLabel="새 나무 심기" onPress={() => go('/home/plant')} style={styles.plant}>
      <IconSlot name="plant" size={18} color="brandDeep" />
      <AppText variant="callout14Bold" color="brandDeep">
        새 나무
      </AppText>
    </Touchable>
  );
}

/** 44×44 원형 아이콘 버튼 (Bell, Search 등) */
export function CircleIconButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Touchable accessibilityLabel={label} onPress={onPress} style={styles.circle}>
      <IconSlot name={icon} size={20} color="textBody" />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  titles: { flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: COLORS.bgGreenSoft,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
});
