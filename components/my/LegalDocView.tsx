/**
 * M-06 · M-07 약관 전문 공통 레이아웃
 * - Meta 박스(시행일·버전 + 예시 문안 안내) → 소개문 → 요약표(선택) → 조항(Article) 목록 → 하단 ‘확인’(BACK)
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { LegalArticle, LegalDoc, LegalRow } from '../../data/terms';
import { back } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Screen } from '../Screen';
import { TopBar } from '../TopBar';

function Article({ item }: { item: LegalArticle }) {
  return (
    <View style={styles.article} accessibilityRole="text">
      <AppText variant="body16Bold" color="textPrimary" accessibilityRole="header">
        {item.title}
      </AppText>
      <AppText variant="callout14Regular" color="textBody">
        {item.body}
      </AppText>
    </View>
  );
}

function SummaryTable({ rows }: { rows: LegalRow[] }) {
  return (
    <View style={styles.table}>
      {rows.map((r, i) => (
        <View key={r.k} style={[styles.tableRow, i > 0 && styles.tableDivider]}>
          <AppText variant="callout14Bold" color="textPrimary" style={styles.tableKey}>
            {r.k}
          </AppText>
          <AppText variant="callout14Regular" color="textBody" style={styles.flex}>
            {r.v}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function LegalDocView({ doc }: { doc: LegalDoc }) {
  return (
    <Screen header={<TopBar title={doc.title} />} footer={<Button label="확인" onPress={back} />} contentStyle={styles.content}>
      <View style={styles.meta}>
        <AppText variant="caption12Bold" color="brandDeep">
          {doc.effective}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {doc.note}
        </AppText>
      </View>
      {doc.intro ? (
        <AppText variant="callout14Regular" color="textBody">
          {doc.intro}
        </AppText>
      ) : null}
      {doc.summary ? <SummaryTable rows={doc.summary} /> : null}
      {doc.articles.map((a) => (
        <Article key={a.title} item={a} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 20 },
  meta: { gap: 4, padding: 14, borderRadius: 16, backgroundColor: COLORS.bgSunken },
  article: { gap: 6 },
  table: { borderRadius: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  tableRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  tableDivider: { borderTopWidth: 1, borderTopColor: COLORS.borderDefault },
  tableKey: { width: 72 },
});
