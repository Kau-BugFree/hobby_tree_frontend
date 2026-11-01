/** OV-08 신고 접수 완료 (가운데 확인창) — 확인·Dim → CLOSE */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, IconTile, OverlayDialog } from '../../components';
import { back } from '../../lib/nav';

export default function ReportDoneDialog() {
  return (
    <OverlayDialog>
      <IconTile size={56} radius={999} bg="brandPrimary">
        <IconSlot name="check" size={28} color="textOnDark" />
      </IconTile>
      <AppText variant="headline18Bold" color="textPrimary" align="center">
        신고가 접수됐어요
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {'운영팀이 확인한 뒤 결과를 알림으로 알려드릴게요.\n보통 1~2일 걸려요.'}
      </AppText>
      <View style={styles.spacer} />
      <Button label="확인" onPress={back} />
    </OverlayDialog>
  );
}

const styles = StyleSheet.create({
  spacer: { height: 4 },
});
