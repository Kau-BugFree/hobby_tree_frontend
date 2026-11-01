/**
 * H-09 새 나무 심기
 * - 남은 자리(Slots) · 다른 취미 찾기(→ E-04) · 심을 취미 단일 선택 · 조건 불일치 취미 · B05 확인
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  ChipGroup,
  Choice,
  IconSlot,
  Screen,
  Tag,
  TopBar,
  Touchable,
  TreeStage,
} from '../../components';
import { MAX_TREE_SLOTS, PLANT_CANDIDATES, TREES } from '../../data/hobbies';
import { useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

const B05 = ['확인했어요', '아직이에요'] as const;

function SlotsCard() {
  const empty = MAX_TREE_SLOTS - TREES.length;
  return (
    <View style={styles.slots}>
      <AppText variant="body16Bold" color="brandDeep">
        {`지금 ${TREES.length}그루 · ${empty}자리 남았어요`}
      </AppText>
      <View style={styles.slotRow}>
        {TREES.map((t) => (
          <View key={t.hobby} style={styles.slot}>
            <TreeStage stage={t.stage} scale={51 / 300} />
          </View>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <View key={`empty-${i}`} style={[styles.slot, styles.slotEmpty]}>
            <IconSlot name="plus" size={20} color="brandPrimary" />
          </View>
        ))}
      </View>
      <AppText variant="caption12Medium" color="textBody">
        {`나무는 최대 ${MAX_TREE_SLOTS}그루까지 키울 수 있어요`}
      </AppText>
    </View>
  );
}

export default function PlantScreen() {
  const { state } = useAppState();
  const available = PLANT_CANDIDATES.filter((c) => c.available);
  const unavailable = PLANT_CANDIDATES.filter((c) => !c.available);
  const params = useLocalSearchParams<{ pick?: string }>();
  const [pick, setPick] = useState(available.some((c) => c.id === params.pick) ? params.pick! : available[0].id);
  const [b05, setB05] = useState<(typeof B05)[number]>('확인했어요');
  const picked = available.find((c) => c.id === pick)!;

  return (
    <Screen
      header={<TopBar title="새 나무 심기" />}
      footer={
        <Button
          label="고른 취미로 나무 심기"
          disabled={picked.id === 'running' && b05 !== '확인했어요'}
          onPress={() => go(`/home/planted?name=${encodeURIComponent(picked.name)}&first=${encodeURIComponent(picked.firstActivity)}`)}
        />
      }
    >
      <SlotsCard />
      <Touchable accessibilityLabel="다른 취미 찾아보기" onPress={() => go('/experience/explore')} style={styles.search}>
        <IconSlot name="search" size={18} color="textMuted" />
        <AppText variant="callout14Regular" color="textMuted" style={styles.flex}>
          다른 취미 찾아보기
        </AppText>
        <IconSlot name="chev" size={16} color="textMuted" />
      </Touchable>
      <AppText variant="headline18Bold" color="textPrimary">
        {`${state.userName} 님 조건에 맞는 취미`}
      </AppText>
      <View style={styles.choices}>
        {available.map((c) => (
          <Choice
            key={c.id}
            label={`${c.name} · 맞춤 ${c.match}% · 0단계 ‘${c.firstActivity}’`}
            selected={pick === c.id}
            onPress={() => setPick(c.id)}
          />
        ))}
      </View>
      {unavailable.map((c) => (
        <View key={c.id} style={styles.unavailable} accessibilityState={{ disabled: true }}>
          <View style={styles.rowGap6}>
            <AppText variant="callout14Bold" color="textMuted">
              {`${c.name} · 맞춤 ${c.match}%`}
            </AppText>
            <Tag label="지금은 어려워요" tone="gray" />
          </View>
          <AppText variant="caption12Medium" color="textMuted">
            {c.reason}
          </AppText>
        </View>
      ))}
      <AppText variant="caption12Medium" color="textMuted">
        0단계 맛보기 활동부터 시작해요. 몸을 쓰는 취미를 고르면 시작 전 안내를 한 번 확인해요.
      </AppText>
      {pick === 'running' ? (
        <View style={styles.b05}>
          <View style={styles.rowGap6}>
            <View style={styles.badge}>
              <AppText variant="micro11Bold" color="brandDeep">
                B05
              </AppText>
            </View>
            <AppText variant="callout14Bold" color="brandDeep">
              러닝 시작 안내를 확인했나요?
            </AppText>
          </View>
          <AppText variant="caption12Medium" color="textBody">
            몸을 쓰는 활동이라 시작 전 검토된 안내만 확인해요. 병력·진단명은 묻지 않아요.
          </AppText>
          <ChipGroup options={B05} value={b05} onChange={setB05} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slots: { gap: 10, padding: 16, borderRadius: 24, backgroundColor: COLORS.bgKhaki },
  slotRow: { flexDirection: 'row', gap: 8 },
  slot: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    overflow: 'hidden',
  },
  slotEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.borderStrong },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  choices: { gap: 8 },
  unavailable: { gap: 2, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.bgSunken },
  b05: { gap: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.bgGreenSoft },
  badge: { backgroundColor: COLORS.bgKhaki, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
});
