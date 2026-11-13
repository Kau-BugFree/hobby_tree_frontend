import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, UIManager, View } from 'react-native';

import { COLORS } from '../theme';
import { AppText } from './AppText';
import type { HobbyKey } from './Graphics';
import { HobbyIcon } from './Graphics';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

// Android에서 열고 닫을 때 부드럽게 펼쳐지도록 (구 아키텍처 전용 설정, 새 아키텍처에선 무시됨)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * 다른 취미 고르기 토글 메뉴.
 * 버튼을 누르면 아래로 취미 목록이 펼쳐지고(▼ → ▲), 하나를 고르거나 다시 누르면 접힌다.
 */
export function HobbyToggleMenu({
  value,
  options,
  onChange,
}: {
  value: HobbyKey;
  options: readonly HobbyKey[];
  onChange: (next: HobbyKey) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (next: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(next);
  };

  return (
    <View style={styles.wrap}>
      <Touchable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`지금 ${value}. 다른 취미 고르기`}
        onPress={() => toggle(!open)}
        style={[styles.button, open && styles.buttonOpen]}
      >
        <HobbyIcon hobby={value} size={18} color="brandDeep" />
        <AppText variant="callout14Bold" color="brandDeep" style={styles.flex} numberOfLines={1}>
          {`${value} · 다른 취미 보기`}
        </AppText>
        {/* chev(오른쪽 화살표)를 돌려 ▼/▲ 로 사용 */}
        <IconSlot name="chev" size={16} color="brandDeep" style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }} />
      </Touchable>

      {open ? (
        <View style={styles.menu} accessibilityRole="menu">
          {options.map((h) => {
            const on = h === value;
            return (
              <Touchable
                key={h}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: on }}
                accessibilityLabel={h}
                onPress={() => {
                  toggle(false);
                  if (!on) onChange(h);
                }}
                style={[styles.item, on && styles.itemOn]}
              >
                <HobbyIcon hobby={h} size={18} color={on ? 'textOnDark' : 'brandDeep'} />
                <AppText variant="callout14Bold" color={on ? 'textOnDark' : 'textBody'} style={styles.flex}>
                  {h}
                </AppText>
                {on ? <IconSlot name="check" size={16} color="textOnDark" /> : null}
              </Touchable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: 6 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.bgGreenSoft,
  },
  buttonOpen: { borderWidth: 1.5, borderColor: COLORS.brandPrimary },
  menu: {
    padding: 6,
    gap: 2,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 10, borderRadius: 12 },
  itemOn: { backgroundColor: COLORS.bgForest },
});
