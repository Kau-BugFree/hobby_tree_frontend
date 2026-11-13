/**
 * E-03-2 활동 진행 (체험 탭에서 시작한 활동)
 * - H-07과 같은 구성(StepList · TimerCard · AskCoachButton) 재사용
 * - ‘다 했어요 · 목록으로’ → E-02(해당 단계 목록)로 돌아감
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Screen, TagRow, TopBar } from '../../components';
import { AskCoachButton, DoneButton, StepList, TimerCard } from '../../components/activity/ActivityParts';
import { findCard } from '../../data/catalog';
import { go } from '../../lib/nav';
import { useToast } from '../../components/Toast';
import { COLORS } from '../../theme';

const MAX_STEPS = 3;

export default function ExperienceProgress() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const toast = useToast();
  const found = findCard(id) ?? findCard('cof-2-5');
  const [done, setDone] = useState<boolean[]>([true, false, false]);
  if (!found) return null;
  const { catalog, card } = found;
  const steps = card.steps.slice(0, MAX_STEPS).map((s) => ({ title: s }));

  const onFinish = () => {
    // TODO(API): POST /records { activityId: card.id }
    toast({ title: '기록했어요', sub: '같은 단계 활동 3개를 마치면 나무가 자라요', icon: 'check' });
    if (router.canDismiss()) router.dismissTo(`/experience/stage?hobby=${catalog.hobby}&stage=${card.level}`);
    else go(`/experience/stage?hobby=${catalog.hobby}&stage=${card.level}`);
  };

  return (
    <Screen
      header={<TopBar title="지금 하는 활동" onAction={() => go('/overlay/more')} />}
      footer={<DoneButton label="다 했어요 · 목록으로" onPress={onFinish} />}
    >
      <View style={styles.hero}>
        <TagRow
          tags={[
            { label: `${catalog.hobby} · ${catalog.levels[card.level]}`, tone: 'solid' },
            { label: `${card.minutes}분${card.tools[0] ? ` · ${card.tools[0].split(',')[0]}` : ''}`, tone: 'green' },
          ]}
        />
        <AppText variant="title22Bold" color="brandDeep">
          {card.title}
        </AppText>
        <AppText variant="callout14Regular" color="textBody">
          {card.goal}
        </AppText>
      </View>
      <StepList steps={steps} done={done} onToggle={(i) => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} />
      <TimerCard initial="00:00" label={`하는 중 · 할 일 ${steps.length}개 중 ${done.filter(Boolean).length}개 완료`} />
      <AskCoachButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 8, padding: 20, borderRadius: 30, backgroundColor: COLORS.bgKhaki },
});
