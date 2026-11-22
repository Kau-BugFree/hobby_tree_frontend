/**
 * 앱 공통 확인 모달 (시스템 Alert 대신)
 * - 로그인 완료 모달(O-01-1)과 같은 모양: 어두운 배경 + 둥근 흰 카드 + 아이콘·나무 + 제목·설명 + 버튼
 * - 주 버튼(confirm) 아래 보조 버튼(cancel). 위험한 동작은 tone="danger"
 * - 뒤로 가기(안드로이드)·배경 탭은 취소로 처리
 */
import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { COLORS } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { IconTile, TreeStage, TreeStageNo } from './Graphics';
import { IconSlot } from './IconSlot';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  /** 설명 아래 강조 한 줄 (예: 복구 기한) */
  highlight?: string;
  /** 위에 보여 줄 그림: 아이콘 이름 또는 나무 단계 */
  icon?: string;
  tree?: TreeStageNo;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  highlight,
  icon,
  tree,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  busy,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancel = () => {
    if (!busy) onCancel?.();
  };
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={cancel} statusBarTranslucent>
      <View style={styles.dim}>
        <Pressable accessibilityRole="button" accessibilityLabel="닫기" style={StyleSheet.absoluteFill} onPress={cancel} />
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          {tree != null ? (
            <TreeStage stage={tree} scale={0.42} />
          ) : icon ? (
            <IconTile size={56} radius={999} bg={tone === 'danger' ? 'bgSunken' : 'bgGreenSoft'}>
              <IconSlot name={icon} size={26} color={tone === 'danger' ? 'accentDanger' : 'brandDeep'} />
            </IconTile>
          ) : null}
          <AppText variant="title22Bold" color="textPrimary" align="center">
            {title}
          </AppText>
          {message ? (
            <AppText variant="callout14Regular" color="textBody" align="center">
              {message}
            </AppText>
          ) : null}
          {highlight ? (
            <View style={styles.highlight}>
              <AppText variant="caption12Bold" color={tone === 'danger' ? 'accentDanger' : 'brandDeep'} align="center">
                {highlight}
              </AppText>
            </View>
          ) : null}
          <View style={styles.actions}>
            {busy ? (
              <ActivityIndicator color={COLORS.brandPrimary} style={styles.spinner} />
            ) : (
              <>
                <Button label={confirmLabel} variant={tone === 'danger' ? 'danger' : 'primary'} onPress={onConfirm} />
                {cancelLabel && onCancel ? <Button label={cancelLabel} variant="ghost" onPress={onCancel} /> : null}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: COLORS.dim },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: COLORS.bgSurface,
  },
  highlight: { alignSelf: 'stretch', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: COLORS.bgKhaki },
  actions: { alignSelf: 'stretch', gap: 4, marginTop: 6 },
  spinner: { paddingVertical: 18 },
});
