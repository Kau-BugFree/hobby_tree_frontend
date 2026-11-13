/**
 * H-07-1~4 진행 활동 (요리 · 커피 · 악기 연주 · 독서)
 * - 서브 컴포넌트: StepList(할 일 토글 ×3), TimerCard(일시정지/재생), AskCoachButton, DoneButton
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Screen, TagRow, TopBar } from '../../../components';
import { AskCoachButton, DoneButton, StepList, TimerCard } from '../../../components/activity/ActivityParts';
import { ACTIVITIES, treeByHobby } from '../../../data/hobbies';
import { go } from '../../../lib/nav';
import { COLORS } from '../../../theme';

export default function ActivityScreen() {
  const { hobby } = useLocalSearchParams<{ hobby: string }>();
  const tree = treeByHobby(hobby);
  const a = ACTIVITIES[tree.currentActivityId];
  const [done, setDone] = useState<boolean[]>([true, false, false]);

  // Figma: 독서(H-07-4)는 기록 시트(H-04), 나머지(H-07-1~3)는 기록 완료(OV-10)로 이어진다.
  const onFinish = () => (tree.hobby === '독서' ? go(`/home/record?hobby=${tree.hobby}`) : go('/home/record-done'));

  return (
    <Screen
      header={<TopBar title="지금 하는 활동" onAction={() => go(`/overlay/more?title=${encodeURIComponent(a.title)}&path=${encodeURIComponent(`/activity/${a.id}`)}`)} />}
      footer={<DoneButton label="다 했어요 · 기록하기" onPress={onFinish} />}
    >
      <View style={styles.hero}>
        <TagRow tags={a.tags} />
        <AppText variant="title22Bold" color="brandDeep">
          {a.title}
        </AppText>
        <AppText variant="callout14Regular" color="textBody">
          {a.description}
        </AppText>
      </View>
      <StepList steps={a.steps} done={done} onToggle={(i) => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} />
      <TimerCard initial={a.timer} label={`하는 중 · 할 일 ${a.steps.length}개 중 ${done.filter(Boolean).length}개 완료`} />
      <AskCoachButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 8, padding: 20, borderRadius: 30, backgroundColor: COLORS.bgKhaki },
});
