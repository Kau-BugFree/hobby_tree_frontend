/**
 * M-05 프로필 사진 변경 (바텀 시트 오버레이)
 * - 앨범에서 선택 → 시스템 사진 선택기(M-10 대체, iOS 14+ PHPicker는 권한 알림 없음)
 * - 사진 찍기 → 카메라 권한(M-11 시스템 알림) → 시스템 카메라(M-12 대체)
 * - 기본 이미지로 되돌리기 → M-13 확인창 (SWAP)
 * TODO(API): 고른 사진은 POST /me/profile-photo (presigned URL 업로드) 후 받은 URL만 저장
 */
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText, Button, Divider, IconSlot, OverlaySheet, Touchable, useToast } from '../../components';
import { useAppState } from '../../lib/appState';
import { back, swap } from '../../lib/nav';
import { ColorToken } from '../../theme';

interface PhotoOption {
  key: 'album' | 'camera' | 'reset';
  label: string;
  icon: string;
  color: ColorToken;
}

const OPTIONS: PhotoOption[] = [
  { key: 'album', label: '앨범에서 선택', icon: 'image', color: 'textPrimary' },
  { key: 'camera', label: '사진 찍기', icon: 'camera', color: 'textPrimary' },
  { key: 'reset', label: '기본 이미지로 되돌리기', icon: 'reset', color: 'accentDanger' },
];

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

function OptionRow({ item, disabled, onPress }: { item: PhotoOption; disabled?: boolean; onPress: () => void }) {
  return (
    <>
      <Touchable accessibilityLabel={item.label} disabled={disabled} onPress={onPress} style={[styles.row, disabled && styles.disabled]}>
        <IconSlot name={item.icon} size={20} color={item.color} />
        <AppText variant="body16Bold" color={item.color}>
          {item.label}
        </AppText>
      </Touchable>
      <Divider />
    </>
  );
}

export default function PhotoSheet() {
  const { state, update } = useAppState();
  const toast = useToast();

  const apply = (res: ImagePicker.ImagePickerResult) => {
    if (res.canceled || !res.assets[0]) return;
    update({ profilePhotoUri: res.assets[0].uri });
    back();
    toast({ title: '프로필 사진을 바꿨어요', icon: 'check' });
  };

  const onAlbum = async () => apply(await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS));

  const onCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast({ title: '카메라 권한이 필요해요', sub: perm.canAskAgain ? undefined : '설정에서 카메라 접근을 허용해 주세요', icon: 'camera' });
      if (!perm.canAskAgain) Linking.openSettings();
      return;
    }
    apply(await ImagePicker.launchCameraAsync(PICK_OPTIONS));
  };

  const handlers: Record<PhotoOption['key'], () => void> = {
    album: onAlbum,
    camera: onCamera,
    reset: () => swap('/my/reset-photo'),
  };

  return (
    <OverlaySheet>
      <View style={styles.head}>
        <AppText variant="headline18Bold" color="textPrimary">
          프로필 사진 변경
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          사진은 프로필에만 보이고, 추천에는 쓰지 않아요
        </AppText>
      </View>
      <View>
        {OPTIONS.map((o) => (
          <OptionRow key={o.key} item={o} disabled={o.key === 'reset' && !state.profilePhotoUri} onPress={handlers[o.key]} />
        ))}
      </View>
      <Button label="취소" variant="ghost" onPress={back} />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 4 },
  disabled: { opacity: 0.4 },
});
