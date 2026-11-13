/**
 * E-03 활동 세부 설명 · 장비·장소 광고
 * - 서브 컴포넌트: BulletCard(준비물), NumberedSteps(이렇게 해요), AdRow(장비·장소 광고)
 * - 광고는 활동을 고른 뒤 이 화면에서만 노출 (10/10 결정)
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, IconSlot, IconTile, InfoNote, Screen, Tag, TagRow, TopBar, Touchable } from '../../components';
import { findCard } from '../../data/catalog';
import { ADS, AdItem } from '../../data/experience';
import { formatManWon, useAppState, withComma } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

function BulletCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card radius={22} gap={9}>
      <AppText variant="body16Bold" color="textPrimary">
        {title}
      </AppText>
      {items.map((t) => (
        <View key={t} style={styles.bullet}>
          <IconSlot name="check" size={16} color="brandPrimary" style={styles.bulletIcon} />
          <AppText variant="callout14Regular" color="textBody" style={styles.flex}>
            {t}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <Card radius={22} gap={9}>
      <AppText variant="body16Bold" color="textPrimary">
        이렇게 해요
      </AppText>
      {steps.map((s, i) => (
        <View key={s} style={styles.bullet}>
          <View style={styles.num}>
            <AppText variant="caption12Bold" color="textOnDark">
              {String(i + 1)}
            </AppText>
          </View>
          <AppText variant="callout14Regular" color="textBody" style={styles.flex}>
            {s}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

function AdRow({ ad }: { ad: AdItem }) {
  const onPress = () => (ad.kind === 'place' && ad.classId ? go(`/together/class/${ad.classId}`) : go(`/experience/ad?id=${ad.id}`));
  return (
    <Touchable accessibilityLabel={`광고, ${ad.title}, ${withComma(ad.price)}원`} onPress={onPress} style={styles.ad}>
      <IconTile size={68} radius={16} bg={ad.kind === 'place' ? 'bgGreenSoft' : 'bgKhaki'}>
        <IconSlot name={ad.kind === 'place' ? 'store' : 'product'} size={ad.kind === 'place' ? 28 : 48} color="brandDeep" />
      </IconTile>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <Tag label="AD" tone="ad" />
          <AppText variant="micro11Bold" color="textMuted" numberOfLines={1} style={styles.flex}>
            {ad.seller}
          </AppText>
        </View>
        <AppText variant="callout14Bold" color="textPrimary">
          {ad.title}
        </AppText>
        <AppText variant="micro11Bold" color="brandPrimary">
          {ad.fit}
        </AppText>
        <AppText variant="body16Bold" color="brandDeep">
          {`${withComma(ad.price)}원`}
        </AppText>
      </View>
      <IconSlot name="chev" size={16} color="textMuted" />
    </Touchable>
  );
}

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useAppState();
  const found = findCard(id) ?? findCard('cof-2-5');
  if (!found) return null;
  const { catalog, card } = found;
  const ads = ADS[catalog.hobby as keyof typeof ADS] ?? [];
  const sessionMin = state.answers.q06 === '직접 시간 입력' ? state.customMinutes : parseInt(String(state.answers.q06), 10) * (String(state.answers.q06).includes('시간') ? 60 : 1) || 30;
  const budget = state.answers.q04 === '직접 금액 입력' ? state.customAmount.q04 : 10000;
  const fits = card.minutes <= sessionMin;

  return (
    <Screen header={<TopBar title="활동 세부 설명" onAction={() => go(`/overlay/more?title=${encodeURIComponent(card.title)}&path=${encodeURIComponent(`/activity/${card.id}`)}`)} />} contentStyle={styles.content}>
      <View style={styles.hero}>
        <TagRow
          tags={[
            { label: card.group, tone: 'solid' },
            { label: `${card.minutes}분 안팎`, tone: 'gray' },
          ]}
        />
        <AppText variant="title22Bold" color="textPrimary">
          {card.title}
        </AppText>
        <AppText variant="callout14Regular" color="textBody">
          {`오늘 남길 것: ${card.goal}`}
        </AppText>
        <AppText variant="micro11Bold" color="textMuted">
          {`${catalog.hobby} · ${catalog.levels[card.level]}`}
        </AppText>
      </View>
      <View style={styles.fit}>
        <IconSlot name="check-circle" size={16} color={fits ? 'brandPrimary' : 'accentFruit'} />
        <AppText variant="caption12Bold" color="textBody" style={styles.flex}>
          {fits
            ? `내 1회 조건(${sessionMin}분 · ${formatManWon(budget)}) 안에 맞는 활동이에요`
            : `내 1회 시간(${sessionMin}분)보다 길어요 · 나눠서 해도 돼요`}
        </AppText>
      </View>
      {card.tools.length + card.materials.length > 0 ? <BulletCard title="준비물" items={[...card.tools, ...card.materials]} /> : null}
      <NumberedSteps steps={card.steps} />
      <View style={styles.check}>
        {card.checks[0] ? (
          <View style={styles.bullet}>
            <IconSlot name="flag" size={16} color="brandPrimary" style={styles.bulletIcon} />
            <AppText variant="callout14Bold" color="brandDeep" style={styles.flex}>
              {`완료 기준 · ${card.checks[0]}`}
            </AppText>
          </View>
        ) : null}
        {card.light ? (
          <View style={styles.bullet}>
            <IconSlot name="feather" size={16} color="brandPrimary" style={styles.bulletIcon} />
            <AppText variant="caption12Medium" color="textBody" style={styles.flex}>
              {`가볍게 하려면 · ${card.light}`}
            </AppText>
          </View>
        ) : null}
      </View>
      {ads.length ? (
        <>
          <View style={styles.sectionHead}>
            <AppText variant="headline18Bold" color="textPrimary">
              이 활동에 쓰는 장비·장소
            </AppText>
            <Tag label="광고" tone="ad" />
          </View>
          {ads.map((ad) => (
            <AdRow key={ad.id} ad={ad} />
          ))}
          <InfoNote text="광고는 활동을 고른 뒤 세부 설명에서만 보여요. 구매·예약하면 하비트리가 수수료를 받을 수 있지만 가격과 추천 순서는 같아요." bold />
        </>
      ) : null}
      <Button label="이 활동 시작하기" onPress={() => go(`/experience/progress?id=${card.id}`)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12, paddingTop: 6 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hero: { gap: 7, padding: 18, borderRadius: 28, backgroundColor: COLORS.bgKhaki },
  fit: {
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
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletIcon: { marginTop: 2 },
  num: { width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgForest },
  check: { gap: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 22, backgroundColor: COLORS.bgGreenSoft },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  ad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
});
