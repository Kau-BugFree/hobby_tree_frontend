/**
 * M-13 기본 이미지로 되돌리기 확인 (가운데 확인창 오버레이)
 * ‘되돌리기’ → 사진 삭제 후 M-03 / ‘취소’ → 닫기
 * TODO(API): DELETE /me/profile-photo
 */
import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, OverlayDialog, useToast } from '../../components';
import { Avatar } from '../../components/my/MyParts';
import { useAppState } from '../../lib/appState';
import { back } from '../../lib/nav';

export default function ResetPhotoDialog() {
  const { state, update } = useAppState();
  const toast = useToast();
  const initial = state.userName.slice(0, 1);

  const onReset = () => {
    update({ profilePhotoUri: null });
    back();
    toast({ title: '기본 이미지로 되돌렸어요', icon: 'check' });
  };

  return (
    <OverlayDialog>
      <Avatar size={64} name={state.userName} photoUri={null} />
      <AppText variant="headline18Bold" color="textPrimary" align="center" style={styles.title}>
        기본 이미지로 되돌릴까요?
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {`지금 프로필 사진은 지워지고\n이름 첫 글자 ‘${initial}’로 보여요.`}
      </AppText>
      <Button label="되돌리기" variant="danger" onPress={onReset} style={styles.first} />
      <Button label="취소" variant="ghost" onPress={back} />
    </OverlayDialog>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 4 },
  first: { marginTop: 6 },
});
