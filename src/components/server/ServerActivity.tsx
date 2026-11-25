/**
 * E-03 서버판 · 활동 상세
 *   API-25 활동 상세(준비물·단계·주의) · API-31/32 저장·저장 취소 · API-49 제휴 콘텐츠(광고·제휴 표시) · API-48 신고(더보기 → 신고)
 *   ‘이 활동 시작하기’ → 나무가 있으면 활동 진행 화면(API-26 시작은 진행 화면에서)
 *   나무가 없으면 이 취미로 나무 심기 안내
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { ActivityDetailView } from '../activity/ActivityDetailView';

import { errorMessage } from '../../api/client';
import { getActivity, getSponsoredContent, saveActivity, unsaveActivity } from '../../api/endpoints';
import { DIFFICULTY_LABEL, PLACE_LABEL } from '../../api/mappers';
import type { ActivityDetail, SponsoredContent } from '../../api/types';
import { formatWon } from '../../lib/appState';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { Card, InfoNote } from '../Blocks';
import { Button } from '../Button';
import { IconSlot } from '../IconSlot';
import { Screen } from '../Screen';
import { Tag } from '../Tag';
import { useToast } from '../Toast';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';

/** 서버가 준 외부 링크만 연다 (http/https) */
const openExternal = (url?: string) => {
  if (url && /^https?:\/\//.test(url)) Linking.openURL(url).catch(() => undefined);
};

export function ServerActivity({ activityId, userHobbyId }: { activityId: number; userHobbyId?: number }) {
  const toast = useToast();
  const { trees } = useForest();
  const [a, setA] = useState<ActivityDetail | null>(null);
  const [ads, setAds] = useState<SponsoredContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [detail, sponsored] = await Promise.all([getActivity(activityId), getSponsoredContent(activityId).catch(() => null)]);
      setA(detail);
      setAds([...(sponsored?.items ?? [])].sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [activityId]);

  useEffect(() => {
    load();
  }, [load]);

  // 이 활동의 취미 나무 (파라미터 우선, 없으면 내 나무 중 같은 취미)
  const tree = trees.find((t) => (userHobbyId ? t.server?.userHobbyId === userHobbyId : a?.hobbyId && t.server?.hobbyId === a.hobbyId));

  const toggleSave = async () => {
    if (!a) return;
    setSaving(true);
    try {
      const res = a.isSaved ? await unsaveActivity(a.activityId) : await saveActivity(a.activityId);
      setA({ ...a, isSaved: res.isSaved });
      toast({ title: res.isSaved ? '활동을 저장했어요' : '저장을 취소했어요', icon: 'bookmark' });
    } catch (e) {
      toast({ title: '저장하지 못했어요', sub: errorMessage(e), icon: 'info' });
    } finally {
      setSaving(false);
    }
  };

  const onStart = () => {
    if (!a) return;
    if (!tree?.server) {
      if (a.hobbyId) go(`/home/plant?pick=${a.hobbyId}`);
      return;
    }
    if (tree.server.treeStatus !== 'ACTIVE') {
      toast({ title: '쉬는 나무예요', sub: '나무를 다시 키우기로 바꾸면 활동을 시작할 수 있어요', icon: 'info' });
      return;
    }
    go(`/home/activity/${encodeURIComponent(tree.hobby)}?userHobbyId=${tree.server.userHobbyId}&activityId=${a.activityId}`);
  };

  const moreHref = a
    ? `/overlay/more?title=${encodeURIComponent(a.title)}&path=${encodeURIComponent(`/activity/${a.activityId}`)}&targetType=ACTIVITY&targetId=${a.activityId}`
    : '/overlay/more';

  if (error || !a) {
    return (
      <Screen header={<TopBar title="활동 세부 설명" />}>
        <View style={styles.center}>
          {error ? (
            <>
              <AppText variant="callout14Regular" color="textBody" align="center">
                {error}
              </AppText>
              <Button label="다시 시도" variant="outline" hug onPress={load} />
            </>
          ) : (
            <ActivityIndicator color={COLORS.brandPrimary} />
          )}
        </View>
      </Screen>
    );
  }

  const steps = [...(a.steps ?? [])].sort((x, y) => x.stepNumber - y.stepNumber);
  const stageName = tree?.server?.roadmap?.stages?.find((st) => st.stageId === a.stageId)?.name;

  return (
    <ActivityDetailView
      m={{
        title: a.title,
        group: a.difficulty ? DIFFICULTY_LABEL[a.difficulty] : a.stageNumber ? `${a.stageNumber}단계` : '활동',
        minutes: a.durationMinutes,
        goal: a.description,
        hobbyLine: [tree?.name, a.stageNumber ? `${a.stageNumber}단계${stageName ? ` ${stageName}` : ''}` : null, a.indoorOutdoor ? PLACE_LABEL[a.indoorOutdoor] : null, a.estimatedCost != null ? (a.estimatedCost ? formatWon(a.estimatedCost) : '0원') : null]
          .filter(Boolean)
          .join(' · '),
        materials: (a.materials ?? []).map((m) => `${m.name}${m.quantity ? ` · ${m.quantity}` : ''}${m.isRequired === false ? ' (선택)' : ''}`),
        steps: steps.map((st) => (st.description ? `${st.title} — ${st.description}` : st.title)),
        cautions: a.cautions,
        ads: ads.map((ad) => ({
          id: String(ad.sponsoredContentId),
          kind: ad.contentType === 'PLACE' || ad.contentType === 'CLASS' ? 'place' : 'product',
          title: ad.title,
          seller: ad.sponsorName ?? '',
          fit: ad.description,
          label: ad.disclosureLabel ?? '광고·제휴',
          onPress: () => openExternal(ad.externalUrl),
        })),
        startLabel: tree?.server ? '이 활동 시작하기' : '이 취미로 나무 심고 시작하기',
        onStart,
        onMore: () => go(moreHref),
        saved: !!a.isSaved,
        saving,
        onToggleSave: toggleSave,
      }}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  content: { gap: 14 },
  hero: { gap: 8, padding: 20, borderRadius: 30, backgroundColor: COLORS.bgKhaki },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  step: { flexDirection: 'row', gap: 10 },
  num: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgForest },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ads: { gap: 8 },
  ad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
});
