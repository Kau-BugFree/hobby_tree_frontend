/**
 * OV-01 더보기 메뉴 (바텀 시트)
 * - 공유하기 → OV-03 (SWAP) / 저장하기 → 닫고 OV-06 토스트 / 문제 신고하기 → OV-07 (SWAP) / 닫기·Dim → CLOSE
 * - ?title= & path= 로 지금 보고 있는 화면 정보를 공유 시트에 넘긴다
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, IconSlot, OverlaySheet, Touchable, useToast } from '../../components';
import { back, swap } from '../../lib/nav';
import { ColorToken } from '../../theme';

interface MenuItem {
  key: 'share' | 'save' | 'report';
  label: string;
  icon: string;
  color: ColorToken;
}

const MENU: MenuItem[] = [
  { key: 'share', label: '공유하기', icon: 'share', color: 'textPrimary' },
  { key: 'save', label: '저장하기', icon: 'bookmark', color: 'textPrimary' },
  { key: 'report', label: '문제 신고하기', icon: 'flag', color: 'accentDanger' },
];

function MenuRow({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  return (
    <Touchable accessibilityLabel={item.label} onPress={onPress} style={styles.row}>
      <IconSlot name={item.icon} size={20} color={item.color} />
      <AppText variant="body16Bold" color={item.color}>
        {item.label}
      </AppText>
    </Touchable>
  );
}

export default function MoreSheet() {
  const { title, path } = useLocalSearchParams<{ title?: string; path?: string }>();
  const toast = useToast();
  const qs = `title=${encodeURIComponent(title ?? '')}&path=${encodeURIComponent(path ?? '')}`;

  const handlers: Record<MenuItem['key'], () => void> = {
    share: () => swap(`/overlay/share?${qs}`),
    save: () => {
      // TODO(API): POST /me/saved { targetType, targetId }
      back();
      toast({ title: '활동을 저장했어요', sub: 'MY에서 다시 볼 수 있어요', icon: 'bookmark' });
    },
    report: () => swap(`/overlay/report?${qs}`),
  };

  return (
    <OverlaySheet gap={4}>
      <AppText variant="headline18Bold" color="textPrimary">
        더보기
      </AppText>
      {MENU.map((m) => (
        <MenuRow key={m.key} item={m} onPress={handlers[m.key]} />
      ))}
      <Button label="닫기" variant="ghost" onPress={back} />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, minHeight: 48 },
});
