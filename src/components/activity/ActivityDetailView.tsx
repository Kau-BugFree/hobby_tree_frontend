/**
 * E-03 활동 세부 설명 · 장비·장소 광고 — 화면 모양 (Figma v6)
 * 체험 모드(카탈로그)와 로그인 상태(API-25·49)가 같은 화면을 쓰도록 데이터만 받아 그린다.
 * - BulletCard(준비물) · NumberedSteps(이렇게 해요) · 완료 기준/가볍게 하려면 · AdRow(장비·장소 광고)
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { Card, InfoNote } from '../Blocks';
import { Button } from '../Button';
import { IconTile } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { Screen } from '../Screen';
import { Tag, TagRow } from '../Tag';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';

export interface AdView {
  id: string;
  kind: 'product' | 'place';
  title: string;
  seller: string;
  fit?: string;
  price?: string;
  /** 광고 표시 (기본 AD) */
  label?: string;
  onPress: () => void;
}

export interface ActivityDetailModel {
  title: string;
  group: string;
  minutes?: number | null;
  goal?: string;
  /** 예: ‘요리 · 1단계 새싹’ */
  hobbyLine: string;
  fit?: { ok: boolean; text: string } | null;
  materials: string[];
  steps: string[];
  check?: string | null;
  light?: string | null;
  cautions?: string[];
  ads: AdView[];
  startLabel: string;
  onStart: () => void;
  onMore: () => void;
  /** 저장(API-31·32) — 로그인 상태만 */
  saved?: boolean;
  onToggleSave?: () => void;
  saving?: boolean;
}

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
        <View key={`${i}-${s}`} style={styles.bullet}>
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

function AdRow({ ad }: { ad: AdView }) {
  return (
    <Touchable accessibilityLabel={`광고, ${ad.title}${ad.price ? `, ${ad.price}` : ''}`} onPress={ad.onPress} style={styles.ad}>
      <IconTile size={68} radius={16} bg={ad.kind === 'place' ? 'bgGreenSoft' : 'bgKhaki'}>
        <IconSlot name={ad.kind === 'place' ? 'store' : 'product'} size={ad.kind === 'place' ? 28 : 48} color="brandDeep" />
      </IconTile>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <Tag label={ad.label ?? 'AD'} tone="ad" />
          <AppText variant="micro11Bold" color="textMuted" numberOfLines={1} style={styles.flex}>
            {ad.seller}
          </AppText>
        </View>
        <AppText variant="callout14Bold" color="textPrimary">
          {ad.title}
        </AppText>
        {ad.fit ? (
          <AppText variant="micro11Bold" color="brandPrimary">
            {ad.fit}
          </AppText>
        ) : null}
        {ad.price ? (
          <AppText variant="body16Bold" color="brandDeep">
            {ad.price}
          </AppText>
        ) : null}
      </View>
      <IconSlot name="chev" size={16} color="textMuted" />
    </Touchable>
  );
}

export function ActivityDetailView({ m }: { m: ActivityDetailModel }) {
  return (
    <Screen header={<TopBar title="활동 세부 설명" onAction={m.onMore} />} contentStyle={styles.content}>
      <View style={styles.hero}>
        <TagRow
          tags={[
            { label: m.group, tone: 'solid' },
            ...(m.minutes ? [{ label: `${m.minutes}분 안팎`, tone: 'gray' as const }] : []),
          ]}
        />
        <AppText variant="title22Bold" color="textPrimary">
          {m.title}
        </AppText>
        {m.goal ? (
          <AppText variant="callout14Regular" color="textBody">
            {m.goal}
          </AppText>
        ) : null}
        <AppText variant="micro11Bold" color="textMuted">
          {m.hobbyLine}
        </AppText>
      </View>
      {m.fit ? (
        <View style={styles.fit}>
          <IconSlot name="check-circle" size={16} color={m.fit.ok ? 'brandPrimary' : 'accentFruit'} />
          <AppText variant="caption12Bold" color="textBody" style={styles.flex}>
            {m.fit.text}
          </AppText>
        </View>
      ) : null}
      {m.materials.length ? <BulletCard title="준비물" items={m.materials} /> : null}
      {m.steps.length ? <NumberedSteps steps={m.steps} /> : null}
      {m.check || m.light ? (
        <View style={styles.check}>
          {m.check ? (
            <View style={styles.bullet}>
              <IconSlot name="flag" size={16} color="brandPrimary" style={styles.bulletIcon} />
              <AppText variant="callout14Bold" color="brandDeep" style={styles.flex}>
                {`완료 기준 · ${m.check}`}
              </AppText>
            </View>
          ) : null}
          {m.light ? (
            <View style={styles.bullet}>
              <IconSlot name="feather" size={16} color="brandPrimary" style={styles.bulletIcon} />
              <AppText variant="caption12Medium" color="textBody" style={styles.flex}>
                {`가볍게 하려면 · ${m.light}`}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
      {(m.cautions ?? []).map((c) => (
        <InfoNote key={c} text={c} />
      ))}
      {m.ads.length ? (
        <>
          <View style={styles.sectionHead}>
            <AppText variant="headline18Bold" color="textPrimary">
              이 활동에 쓰는 장비·장소
            </AppText>
            <Tag label="광고" tone="ad" />
          </View>
          {m.ads.map((ad) => (
            <AdRow key={ad.id} ad={ad} />
          ))}
          <InfoNote text="광고는 활동을 고른 뒤 세부 설명에서만 보여요. 구매·예약하면 하비트리가 수수료를 받을 수 있지만 가격과 추천 순서는 같아요." bold />
        </>
      ) : null}
      <Button label={m.startLabel} onPress={m.onStart} />
      {m.onToggleSave ? (
        <Button label={m.saved ? '저장 취소' : '나중에 할래요 · 저장'} variant="ghost" disabled={m.saving} onPress={m.onToggleSave} />
      ) : null}
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
