/**
 * 08 홈 · 나의 나무 (Figma ‘HobbyTree 하비트리 · 모바일 앱 디자인’ 10:139)
 * - 헤더: 안녕하세요, ○○ 님 / 나의 나무 + 알림
 * - 나무 카드: 일러스트 + 이름 · 단계 · N주째 + 상태 태그 + 물(활동) · 열매(쌓인 성장) + ‘쉬어도 나무는 시들지 않아요’
 * - 이번 주에 해 볼 만한 것: 활동 1개 + 시작
 * - 다른 나무: 다른 나무 카드(누르면 위 카드로) + 새 취미 심기
 * 로그인 상태: API-18 내 나무 목록(+ 20 상세 · 22 로드맵 · 24 현재 단계 활동) — lib/forest.tsx
 *   물 = 완료한 활동 수, 열매 = 지난 단계 수, N주째 = 심은 날부터
 */
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, ChatbotFab, HobbyIcon, IconSlot, STAGE_NAME, TAB_BAR_HEIGHT, Touchable, TreeStage } from '../../components';
import { CircleIconButton } from '../../components/TabHeader';
import type { TreeData } from '../../data/hobbies';
import { ACTIVITIES } from '../../data/hobbies';
import { doneIdsOf, PLANTED_INFO } from '../../data/my';
import { useAppState } from '../../lib/appState';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

const weeksSince = (iso?: string) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? null : Math.max(1, Math.floor((Date.now() - t) / (7 * 86400000)) + 1);
};

/** 화면에 쓰는 값만 뽑는다 (체험 모드 · 서버 같은 모양) */
function viewOf(t: TreeData) {
  const sv = t.server;
  const stageName = sv?.stageName ?? STAGE_NAME[t.stage];
  const weeks = sv ? weeksSince(sv.plantedAt) : PLANTED_INFO[t.hobby] ? Math.max(1, Math.ceil(PLANTED_INFO[t.hobby]!.days / 7)) : null;
  const water = sv ? sv.completed : doneIdsOf(t.hobby).length;
  const fruit = sv ? Math.max(0, sv.stageNumber - 1) : t.stage;
  const paused = sv ? sv.treeStatus !== 'ACTIVE' : false;
  const mock = ACTIVITIES[t.currentActivityId];
  const next = sv?.current?.title
    ? { title: sv.current.title, sub: `진행 ${sv.current.progressPercent ?? 0}% · 이어서 하기` }
    : t.recommendations[0]
      ? { title: t.recommendations[0].title, sub: `${t.recommendations[0].minutes}분 · ${t.stage}단계 활동` }
      : mock
        ? { title: mock.title, sub: `${mock.minutes}분 · ${mock.category}` }
        : null;
  return { stageName, weeks, water, fruit, paused, next };
}

function TreeCard({ tree }: { tree: TreeData }) {
  const v = viewOf(tree);
  const roadmap = () => go(`/my/roadmap?hobby=${encodeURIComponent(tree.hobby)}${tree.server ? `&userHobbyId=${tree.server.userHobbyId}` : ''}`);
  return (
    <Touchable accessibilityLabel={`${tree.name} 나무 로드맵 보기`} onPress={roadmap} style={styles.treeCard}>
      <View style={styles.illust}>
        <TreeStage stage={tree.stage} scale={0.7} />
      </View>
      <View style={styles.treeBody}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <AppText variant="headline18Bold" color="textPrimary">
              {`${tree.name} 나무`}
            </AppText>
            <AppText variant="caption12Medium" color="textMuted">
              {`${v.stageName} 단계${v.weeks ? ` · ${v.weeks}주째` : ''}`}
            </AppText>
          </View>
          <View style={[styles.tag, v.paused && styles.tagRest]}>
            <AppText variant="caption12Bold" color={v.paused ? 'textMuted' : 'brandDeep'}>
              {v.paused ? '쉬는 중' : '자라는 중'}
            </AppText>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <IconSlot name="drop" size={20} color="brandPrimary" />
            <View>
              <AppText variant="caption12Medium" color="textMuted">
                물 (활동)
              </AppText>
              <AppText variant="headline18Bold" color="textPrimary">{`${v.water}번`}</AppText>
            </View>
          </View>
          <View style={styles.statBox}>
            <IconSlot name="fruit" size={20} color="brandPrimary" />
            <View>
              <AppText variant="caption12Medium" color="textMuted">
                열매 (쌓인 성장)
              </AppText>
              <AppText variant="headline18Bold" color="textPrimary">{`${v.fruit}개`}</AppText>
            </View>
          </View>
        </View>
        <View style={styles.note}>
          <IconSlot name="moon" size={14} color="textMuted" />
          <AppText variant="caption12Medium" color="textMuted" style={styles.flex}>
            쉬어도 나무는 시들지 않아요. 연속 기록은 세지 않아요.
          </AppText>
        </View>
      </View>
    </Touchable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppState();
  const { trees, live, loading, error, maxTrees, reload } = useForest();
  const [mainKey, setMainKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const keyOf = (t: TreeData) => String(t.server?.userHobbyId ?? t.hobby);
  const main = trees.find((t) => keyOf(t) === mainKey) ?? trees[0];
  const others = trees.filter((t) => t !== main);
  const v = main ? viewOf(main) : null;

  const start = () => {
    if (!main) return;
    const sv = main.server;
    if (sv?.current) {
      go(`/home/activity/${encodeURIComponent(main.hobby)}?userHobbyId=${sv.userHobbyId}&recordId=${sv.current.recordId}&activityId=${sv.current.activityId}`);
    } else if (sv) {
      go(`/experience/stage?hobbyId=${sv.hobbyId}&userHobbyId=${sv.userHobbyId}&hobby=${encodeURIComponent(main.name)}${sv.currentStageId ? `&stageId=${sv.currentStageId}` : ''}`);
    } else {
      go(`/home/activity/${encodeURIComponent(main.hobby)}`);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <AppText variant="callout14Regular" color="textMuted">{`안녕하세요, ${state.userName} 님`}</AppText>
            <AppText variant="title22Bold" color="textPrimary">
              나의 나무
            </AppText>
          </View>
          <CircleIconButton icon="bell" label="알림" onPress={() => go('/home/notifications')} />
        </View>

        {!main ? (
          <View style={styles.empty}>
            {live && loading ? (
              <ActivityIndicator color={COLORS.brandPrimary} />
            ) : (
              <>
                <TreeStage stage={0} scale={0.5} />
                <AppText variant="headline18Bold" color="textPrimary" align="center">
                  {error ? '나무를 불러오지 못했어요' : '아직 심은 나무가 없어요'}
                </AppText>
                <AppText variant="callout14Regular" color="textMuted" align="center">
                  {error ?? '추천받은 취미나 둘러본 취미로 첫 나무를 심어 보세요.'}
                </AppText>
                <Button label={error ? '다시 불러오기' : '첫 나무 심기'} onPress={() => (error ? reload() : go('/home/plant'))} style={styles.emptyBtn} />
              </>
            )}
          </View>
        ) : (
          <>
            <TreeCard tree={main} />

            {v?.next ? (
              <>
                <View style={styles.sectionHead}>
                  <AppText variant="headline18Bold" color="textPrimary">
                    이번 주에 해 볼 만한 것
                  </AppText>
                  {!live ? (
                    <AppText variant="caption12Bold" color="textMuted">
                      주 2회 · 30분
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.weekly}>
                  <View style={styles.weeklyIcon}>
                    <HobbyIcon hobby={main.hobby} size={20} color="brandPrimary" />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="callout14Bold" color="textPrimary" numberOfLines={1}>
                      {v.next.title}
                    </AppText>
                    <AppText variant="caption12Medium" color="textMuted" numberOfLines={1}>
                      {v.next.sub}
                    </AppText>
                  </View>
                  <Touchable accessibilityLabel={`${v.next.title} 시작`} onPress={start} style={styles.startBtn}>
                    <AppText variant="caption12Bold" color="textOnDark">
                      {main.server?.current ? '이어서' : '시작'}
                    </AppText>
                  </Touchable>
                </View>
              </>
            ) : null}

            <AppText variant="headline18Bold" color="textPrimary" style={styles.sectionTitle}>
              다른 나무
            </AppText>
            <View style={styles.grid}>
              {others.map((t) => {
                const ov = viewOf(t);
                return (
                  <Touchable key={keyOf(t)} accessibilityLabel={`${t.name} 나무 보기`} onPress={() => setMainKey(keyOf(t))} style={styles.other}>
                    <View style={styles.otherIcon}>
                      <HobbyIcon hobby={t.hobby} size={18} color="brandDeep" />
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="callout14Bold" color="textPrimary" numberOfLines={1}>
                        {t.name}
                      </AppText>
                      <AppText variant="caption12Medium" color="textMuted" numberOfLines={1}>
                        {ov.paused ? '쉬는 중 · 기록 유지' : `${ov.stageName} · 물 ${ov.water}번`}
                      </AppText>
                    </View>
                  </Touchable>
                );
              })}
              {trees.length < maxTrees ? (
                <Touchable accessibilityLabel="새 취미 심기" onPress={() => go('/home/plant')} style={[styles.other, styles.plant]}>
                  <View style={styles.plantIcon}>
                    <IconSlot name="plus" size={18} color="brandPrimary" />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="callout14Bold" color="brandDeep">
                      새 취미 심기
                    </AppText>
                    <AppText variant="caption12Medium" color="textMuted">
                      첫 체험부터
                    </AppText>
                  </View>
                </Touchable>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
      <ChatbotFab />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  content: { paddingHorizontal: 24, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 8 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 6 },
  treeCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  illust: { height: 190, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: COLORS.bgKhaki },
  treeBody: { gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: COLORS.bgGreenSoft },
  tagRest: { backgroundColor: COLORS.bgSunken },
  statRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.bgKhaki },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  sectionTitle: { paddingTop: 8 },
  weekly: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  weeklyIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgGreenSoft },
  startBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.brandPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  other: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  otherIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgKhaki },
  plant: { borderStyle: 'dashed', borderColor: COLORS.brandMid, backgroundColor: COLORS.bgKhaki },
  plantIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgGreenSoft },
});
