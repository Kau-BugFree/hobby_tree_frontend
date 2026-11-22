import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useCompact } from '../lib/layout';
import { COLORS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

/**
 * 결제 수단 아이콘.
 * - 신용·체크카드 / 계좌이체: 앱 공통 선 아이콘(card, bank)
 * - 카카오페이 / 네이버페이: 각 사 대표색 배지 (글자 배지 임시안)
 *   TODO(디자인): 정식 출시 전 각 사 브랜드 가이드의 공식 로고 파일로 교체
 */
export function PaymentIcon({ method, size = 40 }: { method: string; size?: number }) {
  const box = { width: size, height: size, borderRadius: size * 0.3 };
  if (method === '카카오페이') {
    return (
      <View style={[styles.badge, box, { backgroundColor: COLORS.kakaoBg }]}>
        <AppText variant="caption12Bold" style={{ color: COLORS.kakaoFg }} maxFontSizeMultiplier={1}>
          pay
        </AppText>
      </View>
    );
  }
  if (method === '네이버페이') {
    return (
      <View style={[styles.badge, box, { backgroundColor: COLORS.naverBg }]}>
        <AppText variant="headline18Bold" color="white" maxFontSizeMultiplier={1}>
          N
        </AppText>
      </View>
    );
  }
  return (
    <View style={[styles.badge, box, { backgroundColor: COLORS.bgGreenSoft }]}>
      <IconSlot name={method === '계좌이체' ? 'bank' : 'card'} size={size * 0.55} color="brandDeep" />
    </View>
  );
}

/** 결제 수단 선택 (단일 선택). 넓은 화면은 2열, 좁은 화면(360dp 등)은 이름이 잘리지 않게 1열 */
export function PaymentMethodGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  const compact = useCompact();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o === value;
        return (
          <Touchable
            key={o}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o}
            onPress={() => onChange(o)}
            style={[styles.tile, compact && styles.tileFull, on ? styles.tileOn : styles.tileOff]}
          >
            <PaymentIcon method={o} size={36} />
            <AppText
              variant={on ? 'callout14Bold' : 'callout14Regular'}
              color={on ? 'brandDeep' : 'textBody'}
              numberOfLines={1}
              style={styles.label}
            >
              {o}
            </AppText>
            {on ? (
              <View style={styles.check}>
                <IconSlot name="check" size={12} color="textOnDark" />
              </View>
            ) : null}
          </Touchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    // 2열: (전체 - 간격 8) / 2
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tileFull: { flexBasis: '100%' },
  tileOff: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  tileOn: { backgroundColor: COLORS.bgGreenSoft, borderWidth: 1.5, borderColor: COLORS.brandPrimary },
  label: { flex: 1 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgForest,
  },
});
