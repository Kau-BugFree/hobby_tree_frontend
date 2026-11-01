/**
 * OV-07 문제 신고하기 (바텀 시트, 키보드 대응)
 * - 신고 사유(ChoiceGroup 단일) + 자세한 내용(선택, 0/300)
 * - 신고하기 → OV-08 (SWAP) / 취소 → CLOSE
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, ChoiceGroup, KeyboardSafe, OverlaySheet } from '../../components';
import { back, swap } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';

const REASONS = ['정보가 틀려요 (가격·장소·일정)', '광고·홍보가 지나쳐요', '안전하지 않은 내용이에요', '부적절한 표현이 있어요', '기타'] as const;
type Reason = (typeof REASONS)[number];
const MAX_LEN = 300;

export default function ReportSheet() {
  const { path } = useLocalSearchParams<{ path?: string }>();
  const [reason, setReason] = useState<Reason>(REASONS[0]);
  const [detail, setDetail] = useState('');
  const needDetail = reason === '기타' && !detail.trim();

  const onSubmit = () => {
    // TODO(API): POST /reports { target: path, reason, detail } — 운영 도구로 전달, 결과는 푸시 알림
    void path;
    swap('/overlay/report-done');
  };

  return (
    <KeyboardSafe style={styles.flex}>
      <OverlaySheet>
        <AppText variant="headline18Bold" color="textPrimary">
          문제 신고하기
        </AppText>
        <AppText variant="callout14Regular" color="textBody">
          어떤 문제인지 알려주세요. 신고 내용은 운영팀만 봐요.
        </AppText>
        <ChoiceGroup options={REASONS} value={reason} onChange={setReason} />
        <View style={styles.textarea}>
          <TextInput
            value={detail}
            onChangeText={(t) => setDetail(t.slice(0, MAX_LEN))}
            maxLength={MAX_LEN}
            multiline
            placeholder={reason === '기타' ? '자세한 내용을 적어 주세요' : '자세한 내용을 적어 주세요 (선택)'}
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel="자세한 내용"
            style={[TYPO.callout14Regular, styles.input]}
          />
          <AppText variant="caption12Medium" color="textMuted" align="right">
            {`${detail.length}/${MAX_LEN}`}
          </AppText>
        </View>
        <Button label="신고하기" disabled={needDetail} onPress={onSubmit} />
        <Button label="취소" variant="ghost" onPress={back} />
      </OverlaySheet>
    </KeyboardSafe>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  textarea: {
    minHeight: 92,
    gap: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.bgApp,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  input: { flex: 1, minHeight: 44, padding: 0, color: COLORS.textPrimary, textAlignVertical: 'top', includeFontPadding: false },
});
