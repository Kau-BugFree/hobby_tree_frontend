/**
 * T-03 채팅 준비 중 (바텀 시트 오버레이)
 * - Figma 프레임은 T-01 복사본 위에 시트를 얹은 형태 → transparentModal로 이전 화면 위에 띄움
 */
import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, IllustrationSlot, OverlaySheet, TagRow } from '../../components';
import { CHAT_FEATURES } from '../../data/together';
import { useAppState } from '../../lib/appState';
import { back, swap } from '../../lib/nav';

export default function ChatSoonSheet() {
  const { toggleAlarm } = useAppState();
  const onAlarm = () => {
    // TODO(API): POST /features/chat/launch-alarm + 푸시 권한 요청
    toggleAlarm('feature:chat');
    swap('/together/chat-alarm-set');
  };
  return (
    <OverlaySheet style={styles.sheet}>
      <IllustrationSlot name="chat-bubbles" width={120} height={84} />
      <AppText variant="title22Bold" color="textPrimary" align="center">
        채팅은 준비 중이에요
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {'같은 클래스에 가는 사람, 같은 나무를 키우는 사람과\n이야기할 수 있도록 준비하고 있어요.'}
      </AppText>
      <TagRow style={styles.tags} tags={CHAT_FEATURES.map((f) => ({ label: f, tone: 'khaki' as const }))} />
      <Button label="출시되면 알림 받기" onPress={onAlarm} />
      <Button label="닫기" variant="ghost" onPress={back} />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  sheet: { alignItems: 'center' },
  tags: { justifyContent: 'center', marginBottom: 4 },
});
