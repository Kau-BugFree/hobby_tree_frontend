/** T-03-1 출시 알림 설정 완료 (바텀 시트 오버레이) */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, IconTile, OverlaySheet, Tag } from '../../components';
import { back, swap } from '../../lib/nav';
import { COLORS } from '../../theme';

export default function ChatAlarmSet() {
  return (
    <OverlaySheet style={styles.sheet}>
      <View style={styles.art}>
        <IconTile size={84} radius={999}>
          <IconSlot name="bell" size={40} color="brandDeep" />
        </IconTile>
        <View style={styles.badge}>
          <IconSlot name="check" size={16} color="textOnDark" />
        </View>
      </View>
      <AppText variant="title22Bold" color="textPrimary" align="center">
        출시 알림을 설정했어요
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {'채팅이 열리면 푸시 알림으로 가장 먼저 알려드릴게요.\n알림은 알림 화면에서 언제든 끌 수 있어요.'}
      </AppText>
      <Tag label="채팅 출시 알림 켜짐" tone="green" style={styles.tag} />
      <Button label="확인" onPress={back} />
      <Button label="알림 설정 보기" variant="ghost" onPress={() => swap('/home/notifications')} />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  sheet: { alignItems: 'center' },
  art: { width: 96, height: 88, alignItems: 'center' },
  badge: {
    position: 'absolute',
    left: 62,
    top: 56,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandPrimary,
    borderWidth: 3,
    borderColor: COLORS.bgSurface,
  },
  tag: { alignSelf: 'center', marginBottom: 4 },
});
