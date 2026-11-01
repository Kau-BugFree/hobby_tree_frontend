/**
 * M-02 취미 로드맵 (?hobby=커피)
 * - 요약 카드(그라데이션): 나무 일러스트 + 심은 날 + 단계 + 완료 수
 * - 0~5단계 타임라인(StageNode ×6): 지난 단계 = 완료 항목만, 현재 단계 = 완료 + 다음 2개 + ‘외 N개’, 다음 단계 = 활동 수
 * - 각 단계 → E-02 / ‘세계수 이후’(카탈로그 6레벨) → E-02 / 하단 → E-01
 * 데이터: 카탈로그(src/data/catalog) + 완료 기록(doneIdsOf) — TODO(API): GET /me/trees/:hobby/roadmap
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, Screen, STAGE_NAME, Tag, TopBar, Touchable, TreeStage, TreeStageNo } from '../../components';
import type { HobbyKey } from '../../components/Graphics';
import { CatalogCard, cardsOfLevel, catalogOf } from '../../data/catalog';
import { treeByHobby } from '../../data/hobbies';
import { DONE_DATES, doneIdsOf, PLANTED_INFO } from '../../data/my';
import { go, reset } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';

const STAGES: TreeStageNo[] = [0, 1, 2, 3, 4, 5];
const NEXT_PREVIEW = 2;

type NodeState = 'done' | 'current' | 'next';

interface StageItemRow {
  id: string;
  title: string;
  done: boolean;
  date?: string;
}

function ItemRow({ item }: { item: StageItemRow }) {
  return (
    <View style={styles.item}>
      <View style={[styles.itemDot, item.done ? styles.itemDotDone : styles.itemDotTodo]}>
        {item.done ? <IconSlot name="check" size={10} color="textOnDark" /> : null}
      </View>
      <AppText variant="caption12Medium" color={item.done ? 'textBody' : 'textMuted'} style={styles.flex}>
        {item.date ? `${item.title} · ${item.date}` : item.title}
      </AppText>
    </View>
  );
}

interface StageNodeProps {
  stage: TreeStageNo;
  levelName: string;
  cards: CatalogCard[];
  doneIds: string[];
  state: NodeState;
  last: boolean;
  onPress: () => void;
}

function StageNode({ stage, levelName, cards, doneIds, state, last, onPress }: StageNodeProps) {
  const done = cards.filter((c) => doneIds.includes(c.id));
  const todo = cards.filter((c) => !doneIds.includes(c.id));
  const rows: StageItemRow[] =
    state === 'next'
      ? []
      : [
          ...done.map((c) => ({ id: c.id, title: c.title, done: true, date: DONE_DATES[c.id] })),
          ...(state === 'current' ? todo.slice(0, NEXT_PREVIEW).map((c) => ({ id: c.id, title: c.title, done: false })) : []),
        ];
  const rest = state === 'current' ? todo.length - NEXT_PREVIEW : 0;
  const title = `${stage}단계 ${STAGE_NAME[stage]} · ${levelName}${stage === 5 ? ' → 세계수' : ''}`;

  return (
    <View style={styles.node}>
      <View style={styles.rail}>
        <View style={[styles.dot, state === 'done' ? styles.dotDone : state === 'current' ? styles.dotCurrent : styles.dotNext]}>
          {state === 'done' ? (
            <IconSlot name="check" size={14} color="textOnDark" />
          ) : (
            <AppText variant="micro11Bold" color={state === 'current' ? 'textOnDark' : 'textMuted'}>
              {String(stage)}
            </AppText>
          )}
        </View>
        {last ? null : <View style={[styles.line, { backgroundColor: state === 'done' ? COLORS.brandMid : COLORS.borderDefault }]} />}
      </View>
      <Touchable accessibilityLabel={`${title} 활동 보기`} onPress={onPress} style={[styles.stageCard, state === 'current' && styles.stageCardCurrent]}>
        <View style={styles.stageHead}>
          <AppText variant="callout14Bold" color={state === 'next' ? 'textBody' : 'textPrimary'} style={styles.flex}>
            {title}
          </AppText>
          {state === 'next' ? (
            <AppText variant="caption12Medium" color="textMuted">
              {`활동 ${cards.length}개`}
            </AppText>
          ) : (
            <Tag label={`완료 ${done.length}/${cards.length}`} tone={state === 'done' ? 'green' : 'solid'} />
          )}
        </View>
        {rows.map((r) => (
          <ItemRow key={r.id} item={r} />
        ))}
        {rest > 0 ? (
          <AppText variant="caption12Bold" color="textMuted">
            {`${todo[NEXT_PREVIEW]?.title ?? ''} 외 ${rest - 1}개`}
          </AppText>
        ) : null}
      </Touchable>
    </View>
  );
}

export default function RoadmapScreen() {
  const { hobby } = useLocalSearchParams<{ hobby?: string }>();
  const tree = treeByHobby(hobby);
  const catalog = catalogOf(tree.hobby);
  const doneIds = doneIdsOf(tree.hobby as HobbyKey);
  const planted = PLANTED_INFO[tree.hobby];
  const stageDone = cardsOfLevel(catalog, tree.stage).filter((c) => doneIds.includes(c.id)).length;
  const afterCards = cardsOfLevel(catalog, 6);
  const openStage = (stage: number) => go(`/experience/stage?hobby=${encodeURIComponent(tree.hobby)}&stage=${stage}`);

  return (
    <Screen
      header={<TopBar title={`${tree.name} 로드맵`} />}
      footer={<Button label={`체험에서 ${tree.name} 활동 전체 보기`} variant="secondary" onPress={() => reset('/experience')} />}
      contentStyle={styles.content}
    >
      <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={[styles.summary, SUMMARY_SHADOW]}>
        <TreeStage stage={tree.stage} scale={0.3} />
        <View style={styles.summaryText}>
          {planted ? <Tag label={`${planted.plantedAt} 심음 · ${planted.days}일째`} tone="onDark" /> : null}
          <AppText variant="headline18Bold" color="textOnDark">
            {`${tree.name} 나무 · ${tree.stage}단계 ${STAGE_NAME[tree.stage]}`}
          </AppText>
          <AppText variant="caption12Medium" color="textOnDarkMuted">
            {`${tree.stage}단계 완료 ${stageDone}개 · 전체 완료 ${doneIds.length}개`}
          </AppText>
        </View>
      </LinearGradient>

      <View style={styles.sectionRow}>
        <AppText variant="headline18Bold" color="textPrimary">
          0~5단계 전체 로드맵
        </AppText>
        <AppText variant="caption12Bold" color="brandPrimary">
          {`${tree.stage}/6 단계 완료`}
        </AppText>
      </View>

      <View>
        {STAGES.map((s, i) => (
          <StageNode
            key={s}
            stage={s}
            levelName={catalog.levels[s] ?? ''}
            cards={cardsOfLevel(catalog, s)}
            doneIds={doneIds}
            state={s < tree.stage ? 'done' : s === tree.stage ? 'current' : 'next'}
            last={i === STAGES.length - 1}
            onPress={() => openStage(s)}
          />
        ))}
      </View>

      {afterCards.length ? (
        <Touchable accessibilityLabel="세계수 이후 활동 보기" onPress={() => openStage(6)} style={styles.after}>
          <IconSlot name="sparkle" size={18} color="brandPrimary" />
          <AppText variant="callout14Bold" color="textBody" style={styles.flex}>
            {`세계수 이후 · ${catalog.levels[6] ?? ''}`}
          </AppText>
          <AppText variant="caption12Medium" color="textMuted">
            {`활동 ${afterCards.length}개`}
          </AppText>
        </Touchable>
      ) : null}
    </Screen>
  );
}

const SUMMARY_SHADOW = shadow(COLORS.shadowForest, 10, 24, 0.22, 6);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 16 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 28 },
  summaryText: { flex: 1, gap: 6 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  node: { flexDirection: 'row', gap: 12 },
  rail: { width: 28, alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: COLORS.brandPrimary },
  dotCurrent: { backgroundColor: COLORS.bgForest, borderWidth: 3, borderColor: COLORS.brandMid },
  dotNext: { backgroundColor: COLORS.bgSunken },
  line: { flex: 1, width: 2, marginVertical: 2 },
  stageCard: {
    flex: 1,
    gap: 8,
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  stageCardCurrent: { borderColor: COLORS.brandMid, borderWidth: 1.5 },
  stageHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemDot: { width: 16, height: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  itemDotDone: { backgroundColor: COLORS.brandMid },
  itemDotTodo: { borderWidth: 1.5, borderColor: COLORS.borderStrong },
  after: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
  },
});
