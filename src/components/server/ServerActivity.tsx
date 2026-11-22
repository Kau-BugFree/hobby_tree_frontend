/**
 * E-03 서버판 · 활동 상세
 *   API-25 활동 상세(준비물·단계·주의) · API-31/32 저장·저장 취소 · API-49 제휴 콘텐츠(광고·제휴 표시) · API-48 신고(더보기 → 신고)
 *   ‘이 활동 시작하기’ → 나무가 있으면 활동 진행 화면(API-26 시작은 진행 화면에서)
 *   나무가 없으면 이 취미로 나무 심기 안내
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

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

function SponsoredRow({ item }: { item: SponsoredContent }) {
  return (
    <Touchable accessibilityLabel={`${item.disclosureLabel ?? '광고'} ${item.title}`} onPress={() => openExternal(item.externalUrl)} style={styles.ad}>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <Tag label={item.disclosureLabel ?? '광고·제휴'} tone="khaki" />
          {item.sponsorName ? (
            <AppText variant="micro11Bold" color="textMuted">
              {item.sponsorName}
            </AppText>
          ) : null}
        </View>
        <AppText variant="callout14Bold" color="textPrimary">
          {item.title}
        </AppText>
        {item.description ? (
          <AppText variant="caption12Medium" color="textBody">
            {item.description}
          </AppText>
        ) : null}
      </View>
      <IconSlot name="external" size={16} color="textMuted" />
    </Touchable>
  );
}

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

  const materials = a.materials ?? [];
  const steps = [...(a.steps ?? [])].sort((x, y) => x.stepNumber - y.stepNumber);

  return (
    <Screen
      header={<TopBar title="활동 세부 설명" onAction={() => go(moreHref)} />}
      footer={
        <>
          <Button label={tree?.server ? '이 활동 시작하기' : '이 취미로 나무 심고 시작하기'} onPress={onStart} />
          <Button label={a.isSaved ? '저장 취소' : '나중에 할래요 · 저장'} variant="ghost" disabled={saving} onPress={toggleSave} />
        </>
      }
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <View style={styles.tags}>
          {a.stageNumber ? <Tag label={`${a.stageNumber}단계`} tone="solid" /> : null}
          {a.durationMinutes ? <Tag label={`${a.durationMinutes}분`} tone="green" /> : null}
          {a.estimatedCost != null ? <Tag label={a.estimatedCost ? formatWon(a.estimatedCost) : '0원'} tone="water" /> : null}
          {a.difficulty ? <Tag label={DIFFICULTY_LABEL[a.difficulty]} tone="gray" /> : null}
          {a.indoorOutdoor ? <Tag label={PLACE_LABEL[a.indoorOutdoor]} tone="gray" /> : null}
        </View>
        <AppText variant="title22Bold" color="brandDeep">
          {a.title}
        </AppText>
        {a.description ? (
          <AppText variant="callout14Regular" color="textBody">
            {a.description}
          </AppText>
        ) : null}
      </View>

      {materials.length ? (
        <Card radius={22} gap={9}>
          <AppText variant="body16Bold" color="textPrimary">
            준비물
          </AppText>
          {materials.map((m) => (
            <View key={m.materialId ?? m.name} style={styles.bullet}>
              <IconSlot name="check" size={16} color="brandPrimary" />
              <AppText variant="callout14Regular" color="textBody" style={styles.flex}>
                {`${m.name}${m.quantity ? ` · ${m.quantity}` : ''}${m.isRequired === false ? ' (선택)' : ''}`}
              </AppText>
            </View>
          ))}
        </Card>
      ) : null}

      {steps.length ? (
        <Card radius={22} gap={10}>
          <AppText variant="body16Bold" color="textPrimary">
            이렇게 해요
          </AppText>
          {steps.map((s) => (
            <View key={s.stepId} style={styles.step}>
              <View style={styles.num}>
                <AppText variant="caption12Bold" color="textOnDark">
                  {s.stepNumber}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="callout14Bold" color="textPrimary">
                  {`${s.title}${s.isRequired === false ? ' (선택)' : ''}`}
                </AppText>
                {s.description ? (
                  <AppText variant="caption12Medium" color="textBody">
                    {s.description}
                  </AppText>
                ) : null}
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {(a.cautions ?? []).map((c) => (
        <InfoNote key={c} text={c} />
      ))}

      {ads.length ? (
        <View style={styles.ads}>
          <AppText variant="caption12Bold" color="textMuted">
            함께 보면 좋은 제휴 콘텐츠 · 광고
          </AppText>
          {ads.map((ad) => (
            <SponsoredRow key={ad.sponsoredContentId} item={ad} />
          ))}
        </View>
      ) : null}
    </Screen>
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
