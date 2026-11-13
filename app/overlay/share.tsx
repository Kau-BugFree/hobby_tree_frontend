/**
 * OV-03 공유하기 (바텀 시트)
 * - 링크 미리보기 + 공유 대상(ShareTarget ×4)
 *   메시지(sms:) · 메일(mailto:) · 더보기(시스템 공유 시트) → 닫고 OV-04 토스트
 *   링크 복사(expo-clipboard) → 닫고 OV-05 토스트
 */
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, Platform, Share, StyleSheet, View } from 'react-native';

import { AppText, Button, HobbyIcon, IconSlot, IconTile, OverlaySheet, Touchable, useToast } from '../../components';
import { shareLink } from '../../lib/config';
import { back } from '../../lib/nav';
import { COLORS } from '../../theme';

interface ShareTarget {
  key: 'sms' | 'mail' | 'copy' | 'more';
  label: string;
  icon: string;
}

const TARGETS: ShareTarget[] = [
  { key: 'sms', label: '메시지', icon: 'message' },
  { key: 'mail', label: '메일', icon: 'mail' },
  { key: 'copy', label: '링크 복사', icon: 'link' },
  { key: 'more', label: '더보기', icon: 'more' },
];

function TargetButton({ item, onPress }: { item: ShareTarget; onPress: () => void }) {
  return (
    <Touchable accessibilityLabel={item.label} onPress={onPress} style={styles.target}>
      <IconTile size={56} radius={999}>
        <IconSlot name={item.icon} size={24} color="brandDeep" />
      </IconTile>
      <AppText variant="caption12Bold" color="textBody" align="center">
        {item.label}
      </AppText>
    </Touchable>
  );
}

export default function ShareSheet() {
  const { title, path } = useLocalSearchParams<{ title?: string; path?: string }>();
  const toast = useToast();
  const label = title || '지금 보고 있는 활동·클래스';
  const url = shareLink(path || '');
  const message = `${label}\n${url}`;

  const shared = () => {
    back();
    toast({ title: '공유했어요', sub: '받은 사람은 링크로 활동을 볼 수 있어요', icon: 'share' });
  };

  const handlers: Record<ShareTarget['key'], () => Promise<void>> = {
    sms: async () => {
      // iOS는 &body=, Android는 ?body=
      await Linking.openURL(`sms:${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`);
      shared();
    },
    mail: async () => {
      await Linking.openURL(`mailto:?subject=${encodeURIComponent(label)}&body=${encodeURIComponent(message)}`);
      shared();
    },
    copy: async () => {
      await Clipboard.setStringAsync(url);
      back();
      toast({ title: '링크를 복사했어요', sub: '원하는 곳에 붙여 넣어 보세요', icon: 'link' });
    },
    more: async () => {
      const res = await Share.share({ message, url, title: label });
      if (res.action === Share.sharedAction) shared();
    },
  };

  const run = (key: ShareTarget['key']) =>
    handlers[key]().catch(() => toast({ title: '공유할 수 없어요', sub: '이 기기에서 지원하지 않는 방법이에요' }));

  return (
    <OverlaySheet>
      <AppText variant="headline18Bold" color="textPrimary">
        공유하기
      </AppText>
      <View style={styles.preview}>
        <IconTile size={48} radius={14} bg="bgKhaki">
          <HobbyIcon hobby="독서" size={24} />
        </IconTile>
        <View style={styles.flex}>
          <AppText variant="callout14Bold" color="textPrimary" numberOfLines={1}>
            {label}
          </AppText>
          <AppText variant="caption12Medium" color="textMuted">
            하비트리 링크 · 앱이 없으면 웹으로 열려요
          </AppText>
        </View>
      </View>
      <View style={styles.targets}>
        {TARGETS.map((t) => (
          <TargetButton key={t.key} item={t} onPress={() => run(t.key)} />
        ))}
      </View>
      <Button label="닫기" variant="ghost" onPress={back} />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.bgApp,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  targets: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 4 },
  target: { alignItems: 'center', gap: 6, minWidth: 64 },
});
