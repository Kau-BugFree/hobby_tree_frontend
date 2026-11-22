/**
 * H-01 홈 · 나무 4그루 (가로 스크롤)
 * - 더미 제거: Status Bar, Home Indicator
 * - 서브 컴포넌트: HobbyPage(TreeCard + CurrentActivityCard + StageRecoCard) ×4 → 가로 FlatList(스냅)
 * - 작은 기기 대응으로 화면 전체는 세로 ScrollView, 탭바·FAB는 화면 위에 고정
 * 로그인 상태: API-18 내 나무 목록(+ 20 상세 · 22 로드맵 · 24 현재 단계 활동) — lib/forest.tsx
 *   화면에 들어올 때마다 다시 불러온다. 나무가 없으면 '첫 나무 심기' 안내
 */
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, ChatbotFab, IconSlot, TAB_BAR_HEIGHT, TreeStage } from '../../components';
import { HOBBY_PAGE_WIDTH, HobbyPage } from '../../components/home/HomeParts';
import { CircleIconButton, PlantTreeButton, TabHeader } from '../../components/TabHeader';
import { useAppState } from '../../lib/appState';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

const GAP = 12;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppState();
  const [page, setPage] = useState(0);
  const { trees: TREES, live, loading, error, maxTrees, reload } = useForest();
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / (HOBBY_PAGE_WIDTH + GAP)));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <TabHeader
          eyebrow={`안녕하세요, ${state.userName} 님`}
          title="나의 취미 숲"
          actions={
            <>
              <PlantTreeButton />
              <CircleIconButton icon="bell" label="알림" onPress={() => go('/home/notifications')} />
            </>
          }
        />
        {live && TREES.length === 0 ? (
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={COLORS.brandPrimary} />
            ) : (
              <>
                <TreeStage stage={0} scale={0.5} />
                <AppText variant="headline18Bold" color="brandDeep" align="center">
                  {error ? '나무를 불러오지 못했어요' : '아직 심은 나무가 없어요'}
                </AppText>
                <AppText variant="callout14Regular" color="textMuted" align="center">
                  {error ?? '추천받은 취미나 둘러본 취미로 첫 나무를 심어 보세요.'}
                </AppText>
                <Button label={error ? '다시 불러오기' : '첫 나무 심기'} onPress={() => (error ? reload() : go('/home/plant'))} style={styles.emptyBtn} />
              </>
            )}
          </View>
        ) : null}
        <FlatList
          horizontal
          data={TREES}
          keyExtractor={(t) => String(t.server?.userHobbyId ?? t.hobby)}
          renderItem={({ item }) => <HobbyPage tree={item} />}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          contentContainerStyle={styles.carousel}
          showsHorizontalScrollIndicator={false}
          snapToInterval={HOBBY_PAGE_WIDTH + GAP}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          accessibilityLabel="나무 목록, 옆으로 넘겨 보기"
        />
        <View style={styles.hint}>
          <IconSlot name="swipe" size={14} color="textMuted" />
          <AppText variant="micro11Bold" color="textMuted" style={styles.flex}>
            옆으로 넘겨 다른 나무 보기
          </AppText>
          <View style={styles.dots}>
            {TREES.map((t, i) => (
              <View key={String(t.server?.userHobbyId ?? t.hobby)} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>
          <AppText variant="micro11Bold" color="brandPrimary">
            {`${TREES.length}/${maxTrees}그루`}
          </AppText>
        </View>
      </ScrollView>
      <ChatbotFab />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 32 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 6 },
  carousel: { paddingHorizontal: 24, paddingBottom: 6 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, paddingHorizontal: 24 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.borderStrong },
  dotOn: { width: 16, backgroundColor: COLORS.brandPrimary },
});
