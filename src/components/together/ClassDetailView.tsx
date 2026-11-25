/**
 * T-02 클래스 상세 / T-06 요리 클래스 상세 · 준비 중 — 화면 모양 (Figma v6)
 * 체험 모드(MOCK)와 로그인 상태(API-36)가 같은 화면을 쓰도록 데이터만 받아 그린다.
 * - 일러스트 + 태그 · 진행자·제목 · InfoRows(일시·장소·정원·준비물) · TreeLinkCard · 안내
 * - 하단 고정: 채팅(준비 중) + ‘가격 · 예약하기’
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS, shadow } from '../../theme';
import { AppText } from '../AppText';
import { InfoNote, KeyValue } from '../Blocks';
import { Button } from '../Button';
import type { TreeStageNo } from '../Graphics';
import { IllustrationSlot, TreeStage } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { Screen } from '../Screen';
import { Tag } from '../Tag';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';

export interface ClassDetailModel {
  topTitle?: string;
  art: string;
  kindLabel: string;
  /** 제휴·준비 중 등 두 번째 태그 */
  badge?: { label: string; tone: 'ad' | 'gray' | 'green' };
  hostMeta: string;
  title: string;
  rows: { k: string; v: string; icon: string }[];
  tree: { stage: TreeStageNo; title: string; sub: string };
  note: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;
  onChat: () => void;
  onMore: () => void;
  /** 하단 안내 아래 링크 (예: 취소·환불 정책) */
  link?: { label: string; onPress: () => void };
  /** 정보 카드 아래 추가 영역 (로그인 상태: 일정 고르기) */
  children?: React.ReactNode;
}

export function ClassDetailView({ m }: { m: ClassDetailModel }) {
  return (
    <Screen
      header={<TopBar title={m.topTitle ?? '클래스 상세'} onAction={m.onMore} />}
      footer={
        <View style={styles.footerRow}>
          <Touchable accessibilityLabel="채팅, 준비 중" onPress={m.onChat} style={styles.chat}>
            <IconSlot name="chat" size={22} color="brandDeep" />
          </Touchable>
          <Button label={m.ctaLabel} disabled={m.ctaDisabled} onPress={m.onCta} style={styles.flex} />
        </View>
      }
    >
      <View style={styles.image}>
        <IllustrationSlot name={m.art} width={200} height={120} />
        <View style={styles.imageTags}>
          <Tag label={m.kindLabel} tone="solid" />
          {m.badge ? <Tag label={m.badge.label} tone={m.badge.tone} /> : null}
        </View>
      </View>
      <View style={styles.titles}>
        <AppText variant="caption12Bold" color="textMuted">
          {m.hostMeta}
        </AppText>
        <AppText variant="title22Bold" color="textPrimary">
          {m.title}
        </AppText>
      </View>
      <View style={styles.info}>
        {m.rows.map((r) => (
          <KeyValue key={r.k} k={r.k} v={r.v} icon={r.icon} keyWidth={48} />
        ))}
      </View>
      {m.children}
      <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={[styles.treeLink, TREE_SHADOW]}>
        <TreeStage stage={m.tree.stage} scale={66 / 300} />
        <View style={styles.flex}>
          <AppText variant="body16Bold" color="textOnDark">
            {m.tree.title}
          </AppText>
          <AppText variant="caption12Medium" color="textOnDarkMuted">
            {m.tree.sub}
          </AppText>
        </View>
      </LinearGradient>
      <InfoNote bold text={m.note} />
      {m.link ? (
        <Touchable accessibilityLabel={m.link.label} onPress={m.link.onPress} style={styles.link}>
          <AppText variant="caption12Bold" color="textMuted" style={styles.underline}>
            {m.link.label}
          </AppText>
        </Touchable>
      ) : null}
    </Screen>
  );
}

const TREE_SHADOW = shadow(COLORS.shadowForest, 8, 18, 0.2, 6);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footerRow: { alignSelf: 'stretch', flexDirection: 'row', gap: 10 },
  chat: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  image: { height: 150, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgKhaki },
  imageTags: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', gap: 6 },
  titles: { gap: 2 },
  info: {
    gap: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  link: { alignSelf: 'center', paddingVertical: 6 },
  underline: { textDecorationLine: 'underline' },
  treeLink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 24 },
});
