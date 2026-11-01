/** OV-10 기록 완료 (오버레이 다이얼로그) */
import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, IconSlot, IconTile, OverlayDialog } from '../../components';
import { back, reset } from '../../lib/nav';

export default function RecordDone() {
  return (
    <OverlayDialog>
      <IconTile size={52} radius={26} bg="brandPrimary">
        <IconSlot name="check" size={24} color="textOnDark" />
      </IconTile>
      <AppText variant="headline18Bold" color="textPrimary" align="center">
        기록했어요
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {'이번 단계 완료 개수에 1개를 더했어요.\n같은 단계 활동 3개를 마치면 나무가 자라요.'}
      </AppText>
      <Button label="홈으로" onPress={() => reset('/home')} style={styles.first} />
      <Button label="닫기" variant="ghost" onPress={back} />
    </OverlayDialog>
  );
}

const styles = StyleSheet.create({ first: { marginTop: 4 } });
