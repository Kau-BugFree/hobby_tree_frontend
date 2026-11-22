/**
 * OV-07 문제 신고하기 (바텀 시트, 키보드 대응)
 * - 신고 사유(ChoiceGroup 단일) + 자세한 내용(선택, 0/300)
 * - 신고하기 → OV-08 (SWAP) / 취소 → CLOSE
 * 로그인 상태 + 신고 대상(targetType·targetId: 활동·제휴 콘텐츠)이면 API-48 문제 신고
 *   사유 → WRONG_INFORMATION · INAPPROPRIATE · OTHER, 설명은 10~1000자 필수 (24시간 안 같은 신고는 REPORT409_1)
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { reportContent } from '../../api/endpoints';
import type { ReportReason } from '../../api/types';
import { AppText, Button, ChoiceGroup, KeyboardSafe, OverlaySheet, useToast } from '../../components';
import { useSession } from '../../lib/session';
import { back, swap } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';

const REASONS = ['정보가 틀려요 (가격·장소·일정)', '링크가 열리지 않아요', '광고·홍보가 지나쳐요', '안전하지 않은 내용이에요', '부적절한 표현이 있어요', '기타'] as const;
type Reason = (typeof REASONS)[number];
const REASON_TO_SERVER: Record<Reason, ReportReason> = {
  '정보가 틀려요 (가격·장소·일정)': 'WRONG_INFORMATION',
  '링크가 열리지 않아요': 'BROKEN_LINK',
  '광고·홍보가 지나쳐요': 'INAPPROPRIATE',
  '안전하지 않은 내용이에요': 'INAPPROPRIATE',
  '부적절한 표현이 있어요': 'INAPPROPRIATE',
  기타: 'OTHER',
};
const MAX_LEN = 1000;
const MIN_LEN = 10;

export default function ReportSheet() {
  const { path, targetType, targetId } = useLocalSearchParams<{ path?: string; targetType?: string; targetId?: string }>();
  const { signedIn } = useSession();
  const toast = useToast();
  const server = signedIn && (targetType === 'ACTIVITY' || targetType === 'SPONSORED_CONTENT') && Number(targetId) > 0;
  const [reason, setReason] = useState<Reason>(REASONS[0]);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  // 서버 신고는 설명 10자 이상 필수
  const needDetail = server ? detail.trim().length < MIN_LEN : reason === '기타' && !detail.trim();

  const onSubmit = async () => {
    void path;
    if (server) {
      setBusy(true);
      try {
        await reportContent({
          targetType: targetType as 'ACTIVITY' | 'SPONSORED_CONTENT',
          targetId: Number(targetId),
          reason: REASON_TO_SERVER[reason],
          description: `[${reason}] ${detail.trim()}`.slice(0, MAX_LEN),
        });
      } catch (e) {
        const msg = e instanceof ApiError && e.code === 'REPORT409_1' ? '같은 내용은 24시간 안에 한 번만 신고할 수 있어요.' : errorMessage(e);
        toast({ title: '신고하지 못했어요', sub: msg, icon: 'info' });
        return;
      } finally {
        setBusy(false);
      }
    }
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
            placeholder={server ? `무엇이 문제인지 ${MIN_LEN}자 이상 적어 주세요` : reason === '기타' ? '자세한 내용을 적어 주세요' : '자세한 내용을 적어 주세요 (선택)'}
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel="자세한 내용"
            style={[TYPO.callout14Regular, styles.input]}
          />
          <AppText variant="caption12Medium" color="textMuted" align="right">
            {`${detail.length}/${MAX_LEN}`}
          </AppText>
        </View>
        <Button label={busy ? '신고하는 중…' : '신고하기'} disabled={needDetail || busy} onPress={onSubmit} />
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
