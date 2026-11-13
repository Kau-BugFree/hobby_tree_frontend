/** H-10 새 나무 심기 완료 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, Screen, TagRow, Touchable, TreeStage } from '../../components';
import { MAX_TREE_SLOTS, TREES } from '../../data/hobbies';
import { reset } from '../../lib/nav';
import { COLORS } from '../../theme';

export default function PlantedScreen() {
  const { name = '러닝', first = '빠르게 걷기 20분' } = useLocalSearchParams<{ name?: string; first?: string }>();
  const count = TREES.length + 1;
  return (
    <Screen
      bg="bgForest"
      footer={
        <>
          <Button variant="secondary" label="홈에서 보기" onPress={() => reset('/home')} />
          <Touchable small onPress={() => reset('/experience')} style={styles.link}>
            <AppText variant="callout14Bold" color="textOnDarkMuted">
              {`체험에서 ${name} 활동 둘러보기`}
            </AppText>
          </Touchable>
        </>
      }
      contentStyle={styles.content}
    >
      <View style={styles.halo}>
        <TreeStage stage={0} scale={0.75} />
      </View>
      <TagRow
        tags={[
          { label: `${name} · 0단계 씨앗`, tone: 'onDark' },
          { label: `${count}/${MAX_TREE_SLOTS}그루`, tone: 'onDark' },
        ]}
        style={styles.tags}
      />
      <AppText variant="title26Black" color="textOnDark" align="center">
        {`${name} 씨앗을 심었어요`}
      </AppText>
      <AppText variant="callout14Regular" color="textOnDarkMuted" align="center">
        {`같은 단계 활동 3개를 마치면 새싹이 돼요.\n첫 활동은 ‘${first}’이에요.`}
      </AppText>
      {count >= MAX_TREE_SLOTS ? (
        <View style={styles.full}>
          <IconSlot name="info" size={16} color="textOnDark" />
          <AppText variant="caption12Bold" color="textOnDark">
            자리가 다 찼어요 · 나무를 쉬게 하면 다시 심을 수 있어요
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: 14, paddingTop: 40, paddingHorizontal: 28 },
  halo: {
    width: 240,
    height: 240,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.onDarkGlassSoft,
  },
  tags: { justifyContent: 'center' },
  full: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.onDarkChip,
  },
  link: { paddingVertical: 8 },
});
