/**
 * T-07 아직 준비중이에요 (바텀 시트 오버레이)
 * - ‘예약 열리면 알림 받기’ → 알림 신청 + 토스트(OV-11) / ‘다른 클래스 둘러보기’ → T-01
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, IconSlot, IconTile, OverlaySheet, TagRow, useToast } from '../../components';
import { classById } from '../../data/together';
import { useAppState } from '../../lib/appState';
import { back, reset } from '../../lib/nav';

export default function ComingSoonSheet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const c = classById(id ?? 'cooking-bowl');
  const { toggleAlarm } = useAppState();
  const toast = useToast();

  const onAlarm = () => {
    // TODO(API): POST /classes/:id/open-alarm + 푸시 권한 요청
    toggleAlarm(`class:${c.id}`);
    back();
    toast({ title: '알림을 켰어요', sub: '열리면 푸시 알림으로 가장 먼저 알려드릴게요', icon: 'bell' });
  };

  return (
    <OverlaySheet style={styles.sheet}>
      <IconTile size={88} radius={999} bg="bgKhaki" style={styles.center}>
        <IconSlot name="hourglass" size={40} color="brandDeep" />
      </IconTile>
      <AppText variant="title22Bold" color="textPrimary" align="center">
        아직 준비중이에요
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {`‘${c.title}’는 강사님과 일정을 맞추고 있어요.\n예약이 열리면 가장 먼저 알려드릴게요.`}
      </AppText>
      <TagRow
        style={styles.tags}
        tags={[
          { label: c.openNote ?? '오픈 예정', tone: 'khaki' },
          { label: `${c.hobby} ${c.stage}단계`, tone: 'green' },
        ]}
      />
      <Button label="예약 열리면 알림 받기" onPress={onAlarm} />
      <Button label="다른 클래스 둘러보기" variant="ghost" onPress={() => reset('/together')} />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  sheet: { alignItems: 'center' },
  center: { alignSelf: 'center' },
  tags: { justifyContent: 'center', marginBottom: 4 },
});
