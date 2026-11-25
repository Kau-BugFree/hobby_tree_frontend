/**
 * M-02 취미 로드맵 — 화면 모양 (Figma v6)
 * 체험 모드(카탈로그)와 로그인 상태(API-20·22·23)가 같은 화면을 쓰도록 데이터만 받아 그린다.
 * - 요약 카드(그라데이션): 나무 일러스트 + 심은 날 + 단계 + 완료 수
 * - 0~5단계 타임라인(StageNode): 지난 단계 = 완료 · 현재 단계 = 완료 + 다음 활동 · 다음 단계 = 활동 수
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS, shadow } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import type { TreeStageNo } from '../Graphics';
import { TreeStage } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { Screen } from '../Screen';
import { Tag } from '../Tag';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';

export type NodeState = 'done' | 'current' | 'next';

export interface StageItemRow {
  id: string;
  title: string;
  done: boolean;
  date?: string;
}

export interface RoadmapNode {
  key: string;
  stage: number;
  title: string;
  state: NodeState;
  /** 완료·현재 단계 오른쪽 태그 (예: 완료 2/5) */
  tag?: string;
  /** 다음 단계 오른쪽 글자 (예: 활동 5개) */
  right?: string;
  rows: StageItemRow[];
  rest?: string;
  onPress: () => void;
}

export interface RoadmapModel {
  title: string;
  treeStage: TreeStageNo;
  plantedTag?: string;
  /** 요약 카드 오른쪽 위 상태 태그 (로그인 상태: 쉬는 중 등) */
  statusTag?: string;
  headline: string;
  sub: string;
  sectionRight: string;
  nodes: RoadmapNode[];
  /** 진행 중인 활동 이어하기 (로그인 상태) */
  resume?: { title: string; onPress: () => void };
  after?: { label: string; right: string; onPress: () => void };
  footerLabel: string;
  onFooter: () => void;
  /** 타임라인 아래 추가 영역 (나무 관리 버튼) */
  children?: React.ReactNode;
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

function StageNode({ n, last }: { n: RoadmapNode; last: boolean }) {
  const { state } = n;
  return (
    <View style={styles.node}>
      <View style={styles.rail}>
        <View style={[styles.dot, state === 'done' ? styles.dotDone : state === 'current' ? styles.dotCurrent : styles.dotNext]}>
          {state === 'done' ? (
            <IconSlot name="check" size={14} color="textOnDark" />
          ) : (
            <AppText variant="micro11Bold" color={state === 'current' ? 'textOnDark' : 'textMuted'}>
              {String(n.stage)}
            </AppText>
          )}
        </View>
        {last ? null : <View style={[styles.line, { backgroundColor: state === 'done' ? COLORS.brandMid : COLORS.borderDefault }]} />}
      </View>
      <Touchable accessibilityLabel={`${n.title} 활동 보기`} onPress={n.onPress} style={[styles.stageCard, state === 'current' && styles.stageCardCurrent]}>
        <View style={styles.stageHead}>
          <AppText variant="callout14Bold" color={state === 'next' ? 'textBody' : 'textPrimary'} style={styles.flex}>
            {n.title}
          </AppText>
          {state === 'next' || !n.tag ? (
            n.right ? (
              <AppText variant="caption12Medium" color="textMuted">
                {n.right}
              </AppText>
            ) : null
          ) : (
            <Tag label={n.tag} tone={state === 'done' ? 'green' : 'solid'} />
          )}
        </View>
        {n.rows.map((r) => (
          <ItemRow key={r.id} item={r} />
        ))}
        {n.rest ? (
          <AppText variant="caption12Bold" color="textMuted">
            {n.rest}
          </AppText>
        ) : null}
      </Touchable>
    </View>
  );
}

export function RoadmapView({ m }: { m: RoadmapModel }) {
  return (
    <Screen
      header={<TopBar title={m.title} />}
      footer={<Button label={m.footerLabel} onPress={m.onFooter} />}
      contentStyle={styles.content}
    >
      <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={[styles.summary, SUMMARY_SHADOW]}>
        <TreeStage stage={m.treeStage} scale={0.3} />
        <View style={styles.summaryText}>
          {m.plantedTag || m.statusTag ? (
            <View style={styles.tagRow}>
              {m.plantedTag ? <Tag label={m.plantedTag} tone="onDark" /> : null}
              {m.statusTag ? <Tag label={m.statusTag} tone="onDark" /> : null}
            </View>
          ) : null}
          <AppText variant="headline18Bold" color="textOnDark">
            {m.headline}
          </AppText>
          <AppText variant="caption12Medium" color="textOnDarkMuted">
            {m.sub}
          </AppText>
        </View>
      </LinearGradient>

      {m.resume ? (
        <Touchable accessibilityLabel="진행 중인 활동 이어하기" onPress={m.resume.onPress} style={styles.resume}>
          <IconSlot name="play" size={18} color="brandDeep" />
          <View style={styles.flex}>
            <AppText variant="caption12Bold" color="textMuted">
              진행 중인 활동
            </AppText>
            <AppText variant="callout14Bold" color="textPrimary">
              {m.resume.title}
            </AppText>
          </View>
          <IconSlot name="chev" size={16} color="textMuted" />
        </Touchable>
      ) : null}

      <View style={styles.sectionRow}>
        <AppText variant="headline18Bold" color="textPrimary">
          0~5단계 전체 로드맵
        </AppText>
        <AppText variant="caption12Bold" color="brandPrimary">
          {m.sectionRight}
        </AppText>
      </View>

      <View>
        {m.nodes.map((n, i) => (
          <StageNode key={n.key} n={n} last={i === m.nodes.length - 1} />
        ))}
        {m.nodes.length === 0 ? (
          <AppText variant="callout14Regular" color="textMuted">
            단계 정보가 아직 없어요
          </AppText>
        ) : null}
      </View>

      {m.after ? (
        <Touchable accessibilityLabel={`${m.after.label} 활동 보기`} onPress={m.after.onPress} style={styles.after}>
          <IconSlot name="sparkle" size={18} color="brandPrimary" />
          <AppText variant="callout14Bold" color="textBody" style={styles.flex}>
            {m.after.label}
          </AppText>
          <AppText variant="caption12Medium" color="textMuted">
            {m.after.right}
          </AppText>
        </Touchable>
      ) : null}
      {m.children}
    </Screen>
  );
}

const SUMMARY_SHADOW = shadow(COLORS.shadowForest, 10, 24, 0.22, 6);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 16 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 28 },
  summaryText: { flex: 1, gap: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: COLORS.bgKhaki },
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
