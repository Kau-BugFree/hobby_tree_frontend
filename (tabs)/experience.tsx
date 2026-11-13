/**
 * E-01 체험 · 메인 나무 단계 카드 (6×1 세로 스크롤)
 * - 서브 컴포넌트: TreeSwitch(메인 나무 전환), StageCard ×6, AfterWorldTreeCard
 * - 단계 카드 → E-02 (해당 취미·단계의 세부 활동 목록)
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  ChatbotFab,
  CircleIconButton,
  HobbyIcon,
  IconSlot,
  PlantTreeButton,
  STAGE_NAME,
  TAB_BAR_HEIGHT,
  TabHeader,
  Tag,
  Touchable,
  TreeStage,
  TreeStageNo,
} from '../../components';
import { cardsOfLevel, catalogOf, minuteRange } from '../../data/catalog';
import { COMPLETED } from '../../data/experience';
import { TREES, TreeData } from '../../data/hobbies';
import { useCompact } from '../../lib/layout';
import { go } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';

const LEVELS: TreeStageNo[] = [0, 1, 2, 3, 4, 5];

function TreeSwitch({ value, onChange }: { value: TreeData['hobby']; onChange: (h: TreeData['hobby']) => void }) {
  const compact = useCompact();
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {TREES.map((t) => {
        const on = t.hobby === value;
        return (
          <Touchable
            key={t.hobby}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${t.name} 나무`}
            onPress={() => onChange(t.hobby)}
            style={[styles.switchItem, on && styles.switchOn]}
          >
            <View style={styles.rowGap4}>
              <HobbyIcon hobby={t.hobby} size={15} color={on ? 'textOnDark' : 'textBody'} />
              <AppText variant="callout14Bold" color={on ? 'textOnDark' : 'textBody'}>
                {t.hobby}
              </AppText>
            </View>
            {/* 좁은 화면에선 '3단계 어린 나무'가 두 줄로 넘쳐 잘리므로 단계 숫자만 보여 준다 */}
            <AppText variant="micro11Bold" color={on ? 'textOnDarkMuted' : 'textMuted'} numberOfLines={1}>
              {compact ? `${t.stage}단계` : `${t.stage}단계 ${STAGE_NAME[t.stage]}`}
            </AppText>
          </Touchable>
        );
      })}
    </View>
  );
}

interface StageCardProps {
  level: TreeStageNo;
  title: string;
  summary: string;
  count: number;
  range: string;
  done?: number;
  onPress: () => void;
}

function StageCard({ level, title, summary, count, range, done, onPress }: StageCardProps) {
  return (
    <Touchable accessibilityLabel={`${level}단계 ${title}`} onPress={onPress} style={styles.stageCard}>
      <View style={styles.treeTile}>
        <TreeStage stage={level} scale={63 / 300} />
      </View>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <AppText variant="caption12Bold" color="textMuted">
            {`${level}단계 · ${STAGE_NAME[level]}${level === 5 ? ' (완성)' : ''}`}
          </AppText>
          {done ? <Tag label={`완료 ${done}/${count}`} tone="green" /> : null}
        </View>
        <AppText variant="body16Bold" color="textPrimary">
          {title}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {summary}
        </AppText>
        <AppText variant="micro11Bold" color="brandPrimary">
          {`활동 ${count}개 · ${range}`}
        </AppText>
      </View>
      <IconSlot name="chev" size={18} color="textMuted" />
    </Touchable>
  );
}

export default function ExperienceScreen() {
  const insets = useSafeAreaInsets();
  const [hobby, setHobby] = useState<TreeData['hobby']>('커피');
  const tree = TREES.find((t) => t.hobby === hobby)!;
  const catalog = catalogOf(hobby);
  const completed = COMPLETED[hobby];
  const totalDone = Object.values(completed).reduce((a, b) => a + b, 0);
  const after = cardsOfLevel(catalog, 6);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TabHeader
        eyebrow="메인 나무에 맞춘 단계별 체험"
        title="체험"
        actions={
          <>
            <PlantTreeButton />
            <CircleIconButton icon="search" label="다른 취미 찾아보기" onPress={() => go('/experience/explore')} />
          </>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <TreeSwitch value={hobby} onChange={setHobby} />
        <View style={styles.note}>
          <IconSlot name="sprout" size={20} color="brandPrimary" />
          <AppText variant="caption12Bold" color="textBody" style={styles.flex}>
            {`지금 ${tree.name} 나무: ${tree.stage}단계 ${STAGE_NAME[tree.stage]} · 지금까지 완료 ${totalDone}개`}
          </AppText>
        </View>
        <View style={styles.sectionHead}>
          <AppText variant="headline18Bold" color="textPrimary">
            {`${tree.name} 성장 지도 · 0~5단계`}
          </AppText>
          <AppText variant="caption12Bold" color="textMuted">
            {`활동 ${catalog.cards.length}개`}
          </AppText>
        </View>
        {LEVELS.map((lv) => {
          const cards = cardsOfLevel(catalog, lv);
          return (
            <StageCard
              key={lv}
              level={lv}
              title={catalog.levels[lv]}
              summary={catalog.summaries[lv]}
              count={cards.length}
              range={minuteRange(cards)}
              done={completed[lv]}
              onPress={() => go(`/experience/stage?hobby=${hobby}&stage=${lv}`)}
            />
          );
        })}
        {after.length ? (
          <Touchable
            accessibilityLabel={`세계수 이후 ${catalog.levels[6]}`}
            onPress={() => go(`/experience/stage?hobby=${hobby}&stage=6`)}
            style={styles.after}
          >
            <View style={styles.flex}>
              <AppText variant="callout14Bold" color="brandDeep">
                {`세계수 이후 · ${catalog.levels[6]}`}
              </AppText>
              <AppText variant="caption12Medium" color="textMuted">
                {`${catalog.summaries[6]} · 활동 ${after.length}개 · 완성 뒤에도 계속 가꿔요`}
              </AppText>
            </View>
            <IconSlot name="chev" size={18} color="textMuted" />
          </Touchable>
        ) : null}
        <Touchable accessibilityLabel="다른 취미 활동 확인하기" onPress={() => go('/experience/explore')} style={styles.other}>
          <IconSlot name="compass" size={20} color="brandPrimary" />
          <AppText variant="callout14Bold" color="brandPrimary">
            다른 취미 활동 확인하기
          </AppText>
        </Touchable>
      </ScrollView>
      <ChatbotFab />
    </View>
  );
}

const SWITCH_SHADOW = shadow(COLORS.shadowForest, 4, 10, 0.25, 4);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  content: { gap: 12, paddingTop: 2, paddingHorizontal: 24 },
  rowGap4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switch: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 22, backgroundColor: COLORS.bgSunken },
  switchItem: { flex: 1, alignItems: 'center', gap: 1, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 18 },
  switchOn: { backgroundColor: COLORS.bgForest, ...SWITCH_SHADOW },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  treeTile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgGreenSoft,
    overflow: 'hidden',
  },
  after: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
  },
  other: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
  },
});
