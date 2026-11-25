/**
 * E-01 체험 · 메인 나무 단계 카드 (6×1 세로 스크롤)
 * - 서브 컴포넌트: TreeSwitch(메인 나무 전환), StageCard ×6, AfterWorldTreeCard
 * - 단계 카드 → E-02 (해당 취미·단계의 세부 활동 목록)
 * 로그인 상태: 같은 화면에 서버 데이터 — 내 나무(API-18) 전환 · API-23 단계 목록 · API-22 로드맵(완료·현재·잠김)
 */
import React, { useEffect, useState } from 'react';
import { listStages } from '../../api/endpoints';
import type { HobbyStage } from '../../api/types';
import { useForest } from '../../lib/forest';
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
import { SUPPORTED_HOBBIES, TREES as ALL_TREES, TreeData } from '../../data/hobbies';

/** 체험 탭은 지원 취미 3개(요리·악기·독서)만 보여 준다 */
const TREES = ALL_TREES.filter((t) => SUPPORTED_HOBBIES.includes(t.hobby));
import { useCompact } from '../../lib/layout';
import { go } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';

const LEVELS: TreeStageNo[] = [0, 1, 2, 3, 4, 5];

function TreeSwitch({ trees, value, onChange }: { trees: TreeData[]; value: TreeData['hobby']; onChange: (h: TreeData['hobby']) => void }) {
  const compact = useCompact();
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {trees.map((t) => {
        const on = t.hobby === value;
        return (
          <Touchable
            key={String(t.server?.userHobbyId ?? t.hobby)}
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
  /** 서버: 단계 상태 태그 (완료 · 지금 단계 · 잠김) */
  badge?: { label: string; tone: 'green' | 'khaki' | 'gray' };
  /** 서버: 단계 번호·이름 줄 */
  levelLabel?: string;
  onPress: () => void;
}

function StageCard({ level, title, summary, count, range, done, badge, levelLabel, onPress }: StageCardProps) {
  return (
    <Touchable accessibilityLabel={`${level}단계 ${title}`} onPress={onPress} style={styles.stageCard}>
      <View style={styles.treeTile}>
        <TreeStage stage={level} scale={63 / 300} />
      </View>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <AppText variant="caption12Bold" color="textMuted">
            {levelLabel ?? `${level}단계 · ${STAGE_NAME[level]}${level === 5 ? ' (완성)' : ''}`}
          </AppText>
          {badge ? <Tag label={badge.label} tone={badge.tone} /> : done ? <Tag label={`완료 ${done}/${count}`} tone="green" /> : null}
        </View>
        <AppText variant="body16Bold" color="textPrimary">
          {title}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {summary}
        </AppText>
        <AppText variant="micro11Bold" color="brandPrimary">
          {range ? `활동 ${count}개 · ${range}` : `활동 ${count}개`}
        </AppText>
      </View>
      <IconSlot name="chev" size={18} color="textMuted" />
    </Touchable>
  );
}

/** 로그인 상태 + 내 나무가 있으면 서버판 (같은 화면 모양) */
export default function ExperienceRoute() {
  const { live, trees } = useForest();
  return live && trees.length ? <ServerExperience /> : <ExperienceScreen />;
}

const STATE_BADGE = {
  COMPLETED: { label: '완료', tone: 'green' },
  CURRENT: { label: '지금 단계', tone: 'khaki' },
  LOCKED: { label: '잠김', tone: 'gray' },
} as const;

function ServerExperience() {
  const insets = useSafeAreaInsets();
  const { trees } = useForest();
  const [hobby, setHobby] = useState<TreeData['hobby']>(trees[0].hobby);
  const tree = trees.find((t) => t.hobby === hobby) ?? trees[0];
  const sv = tree.server!;
  const [stages, setStages] = useState<HobbyStage[] | null>(null);

  useEffect(() => {
    let alive = true;
    setStages(null);
    listStages(sv.hobbyId)
      .then((r) => alive && setStages(r.stages ?? []))
      .catch(() => alive && setStages([]));
    return () => {
      alive = false;
    };
  }, [sv.hobbyId]);

  const states = Object.fromEntries((sv.roadmap?.stages ?? []).map((x) => [x.stageId, x.state]));
  const total = (stages ?? []).reduce((n, x) => n + (x.activityCount ?? 0), 0);

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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60 }]} showsVerticalScrollIndicator={false}>
        <TreeSwitch trees={trees} value={tree.hobby} onChange={setHobby} />
        <View style={styles.note}>
          <IconSlot name="sprout" size={20} color="brandPrimary" />
          <AppText variant="caption12Bold" color="textBody" style={styles.flex}>
            {`지금 ${tree.name} 나무: ${sv.stageNumber}단계${sv.stageName ? ` ${sv.stageName}` : ''} · 지금까지 완료 ${sv.completed}개`}
          </AppText>
        </View>
        <View style={styles.sectionHead}>
          <AppText variant="headline18Bold" color="textPrimary">
            {`${tree.name} 성장 지도${stages?.length ? ` · ${stages.length}단계` : ''}`}
          </AppText>
          <AppText variant="caption12Bold" color="textMuted">
            {total ? `활동 ${total}개` : ''}
          </AppText>
        </View>
        {stages === null ? (
          <AppText variant="callout14Regular" color="textMuted" align="center">
            단계를 불러오는 중…
          </AppText>
        ) : stages.length === 0 ? (
          <AppText variant="callout14Regular" color="textMuted" align="center">
            이 취미의 단계 정보가 아직 없어요
          </AppText>
        ) : (
          stages.map((st) => {
            const state = states[st.stageId];
            return (
              <StageCard
                key={st.stageId}
                level={Math.max(0, Math.min(5, st.stageNumber)) as TreeStageNo}
                levelLabel={`${st.stageNumber}단계 · ${st.name}`}
                title={st.name}
                summary={st.description ?? ''}
                count={st.activityCount ?? 0}
                range=""
                badge={state ? STATE_BADGE[state] : undefined}
                onPress={() =>
                  go(`/experience/stage?hobbyId=${sv.hobbyId}&userHobbyId=${sv.userHobbyId}&stageId=${st.stageId}&hobby=${encodeURIComponent(tree.name)}`)
                }
              />
            );
          })
        )}
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

function ExperienceScreen() {
  const insets = useSafeAreaInsets();
  const [hobby, setHobby] = useState<TreeData['hobby']>(TREES[0]?.hobby ?? '요리');
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
        <TreeSwitch trees={TREES} value={hobby} onChange={setHobby} />
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
