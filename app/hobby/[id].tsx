/**
 * 취미 상세 · 첫 체험 안내 (API-17 GET /hobbies/{hobbyId})
 * - O-06 추천 카드 ‘첫 체험 자세히’, E-04 다른 취미 둘러보기에서 들어온다
 * - 소개 · 첫 체험 기준(최소 시간·비용·난이도·장소) · 입문 준비물 · 성장 규칙 · 내 나무 여부
 * - 추천 목록에 있는 취미면 하단에서 바로 고르기/빼기
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { getHobby } from '../../api/endpoints';
import { DIFFICULTY_LABEL, hobbyKeyOf, PLACE_LABEL } from '../../api/mappers';
import type { HobbyDetail } from '../../api/types';
import { AppText, Button, Card, HobbyIcon, IconSlot, IconTile, InfoNote, Screen, Tag, TopBar } from '../../components';
import type { HobbyKey } from '../../components/Graphics';
import { MAX_TREES } from '../../data/onboarding';
import { formatMinutes, formatWon, useAppState } from '../../lib/appState';
import { back } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { COLORS } from '../../theme';

function FactTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <IconSlot name={icon} size={18} color="brandPrimary" />
      <AppText variant="caption12Medium" color="textMuted">
        {label}
      </AppText>
      <AppText variant="body16Bold" color="textPrimary">
        {value}
      </AppText>
    </View>
  );
}

export default function HobbyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hobbyId = Number(id);
  const { signedIn } = useSession();
  const { state, update, updateServer } = useAppState();
  const [data, setData] = useState<HobbyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getHobby(hobbyId));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [hobbyId]);

  useEffect(() => {
    if (signedIn && hobbyId > 0) load();
  }, [signedIn, hobbyId, load]);

  // 추천 목록(O-06)에 있는 취미면 여기서 바로 고를 수 있다
  const recItems = state.server.recommendation?.items ?? [];
  const inRecommendation = recItems.some((i) => i.hobbyId === hobbyId);
  const picked = state.server.pickedHobbyIds.includes(hobbyId);
  const togglePick = () => {
    const ids = picked ? state.server.pickedHobbyIds.filter((i) => i !== hobbyId) : [...state.server.pickedHobbyIds, hobbyId];
    if (ids.length > MAX_TREES) return;
    updateServer({ pickedHobbyIds: ids });
    const keys = recItems.filter((i) => ids.includes(i.hobbyId)).map((i) => hobbyKeyOf(i.name));
    update({ picked: Array.from(new Set<HobbyKey>(keys)) });
    back();
  };

  const footer = inRecommendation ? (
    <Button label={picked ? '고른 취미에서 빼기' : '이 취미 고르기'} variant={picked ? 'outline' : 'primary'} onPress={togglePick} />
  ) : (
    <Button label="닫기" variant="outline" onPress={back} />
  );

  let body: React.ReactNode;
  if (!signedIn) {
    body = <InfoNote text="로그인하면 취미 상세를 볼 수 있어요." />;
  } else if (error) {
    body = (
      <View style={styles.center}>
        <AppText variant="callout14Regular" color="textBody" align="center">
          {error}
        </AppText>
        <Button label="다시 시도" variant="outline" hug onPress={load} />
      </View>
    );
  } else if (!data) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.brandPrimary} />
      </View>
    );
  } else {
    const key = hobbyKeyOf(data.name, data.category?.name);
    const materials = data.starterMaterials ?? [];
    body = (
      <>
        <View style={styles.hero}>
          <IconTile size={64} radius={22}>
            <HobbyIcon hobby={key} size={32} />
          </IconTile>
          <View style={styles.flex}>
            <View style={styles.tags}>
              {data.category?.name ? <Tag label={data.category.name} tone="khaki" /> : null}
              {data.isPlanted ? <Tag label="키우는 중" tone="green" /> : null}
            </View>
            <AppText variant="title22Bold" color="textPrimary">
              {data.name}
            </AppText>
            {data.description ? (
              <AppText variant="caption12Medium" color="textMuted">
                {data.description}
              </AppText>
            ) : null}
          </View>
        </View>

        <AppText variant="headline18Bold" color="textPrimary">
          첫 체험은 이렇게 시작해요
        </AppText>
        <View style={styles.facts}>
          <FactTile icon="clock" label="최소 시간" value={data.minDurationMinutes != null ? formatMinutes(data.minDurationMinutes) : '미정'} />
          <FactTile icon="bag" label="최소 비용" value={data.minCost != null ? (data.minCost === 0 ? '0원' : formatWon(data.minCost)) : '미정'} />
        </View>
        <View style={styles.facts}>
          <FactTile icon="sprout" label="난이도" value={data.difficulty ? DIFFICULTY_LABEL[data.difficulty] : '미정'} />
          <FactTile icon="pin" label="장소" value={data.indoorOutdoor ? PLACE_LABEL[data.indoorOutdoor] : '미정'} />
        </View>
        <InfoNote text="시간·비용은 입문 활동 기준 요약값이에요. 취미 전체의 확정 비용은 아니에요." />

        {data.introduction ? (
          <Card radius={22} gap={8}>
            <AppText variant="body16Bold" color="textPrimary">
              소개
            </AppText>
            <AppText variant="callout14Regular" color="textBody">
              {data.introduction}
            </AppText>
          </Card>
        ) : null}

        {materials.length ? (
          <Card radius={22} gap={9}>
            <AppText variant="body16Bold" color="textPrimary">
              입문 준비물
            </AppText>
            {materials.map((m) => (
              <View key={m.name} style={styles.material}>
                <IconSlot name="check" size={16} color="brandPrimary" />
                <AppText variant="callout14Regular" color="textBody" style={styles.flex}>
                  {m.name}
                </AppText>
                <Tag label={m.isRequired ? '필수' : '선택'} tone={m.isRequired ? 'green' : 'gray'} />
              </View>
            ))}
          </Card>
        ) : null}

        {data.totalStages ? (
          <Card radius={22} gap={6} style={styles.growth}>
            <AppText variant="body16Bold" color="brandDeep">
              나무가 자라는 방법
            </AppText>
            <AppText variant="callout14Regular" color="textBody">
              {`총 ${data.totalStages}단계 · 단계마다 서로 다른 활동 ${data.growthRule?.distinctActivitiesPerStage ?? 3}개를 마치면 한 단계 자라요.`}
            </AppText>
          </Card>
        ) : null}
      </>
    );
  }

  return (
    <Screen header={<TopBar title={data?.name ?? '취미 상세'} onBack={back} />} footer={footer} contentStyle={styles.content}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 14 },
  center: { paddingVertical: 60, alignItems: 'center', gap: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tags: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: {
    flex: 1,
    gap: 4,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  material: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  growth: { backgroundColor: COLORS.bgGreenSoft },
});
