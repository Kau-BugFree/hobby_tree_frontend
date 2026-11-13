import { router } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOWS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { TAB_BAR_HEIGHT } from './TabBar';
import { Touchable } from './Touchable';

/** Figma "Chatbot FAB" (Collapsed | Labeled). 탭 화면 오른쪽 아래에 떠 있다. → C-01 */
export function ChatbotFab({ labeled = false, onPress }: { labeled?: boolean; onPress?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Touchable
      accessibilityLabel="하비 코치 열기"
      onPress={onPress ?? (() => router.push('/chat/panel'))}
      style={[
        styles.fab,
        labeled && styles.labeled,
        { bottom: Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 12 },
      ]}
    >
      <IconSlot name="chat-spark" size={24} color="paletteKhaki" />
      {labeled ? (
        <AppText variant="callout14Bold" color="textOnDark">
          하비 코치
        </AppText>
      ) : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 999,
    backgroundColor: COLORS.bgForest,
    ...SHADOWS.fab,
  },
  labeled: { paddingHorizontal: 18 },
});
