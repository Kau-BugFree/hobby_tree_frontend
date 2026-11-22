/**
 * H-01-C1~C4 활동 이어하기 확인 (오버레이 다이얼로그)
 * "○○ 취미를 이어서 하시겠습니까?" → 이어서 하기: 활동 페이지(H-07-x) / 취소: 닫기
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { AppText, Button, HobbyIcon, IconTile, OverlayDialog } from '../../../components';
import { ACTIVITIES, treeByHobby } from '../../../data/hobbies';
import { useTreeByParam } from '../../../lib/forest';
import { back, swap } from '../../../lib/nav';

export default function ContinueConfirm() {
  const { hobby, userHobbyId } = useLocalSearchParams<{ hobby: string; userHobbyId?: string }>();
  const live = useTreeByParam(hobby, userHobbyId);
  // 서버 나무: 진행 중 기록(API-20 currentActivityRecord)으로 이어하기
  const cur = live.server?.current;
  if (live.server && cur) {
    return (
      <OverlayDialog>
        <IconTile size={48} radius={16}>
          <HobbyIcon hobby={live.hobby} size={22} />
        </IconTile>
        <AppText variant="headline18Bold" color="textPrimary" align="center">
          {`${live.name} 취미를 이어서 하시겠습니까?`}
        </AppText>
        <AppText variant="callout14Regular" color="textBody" align="center">
          {`‘${cur.title ?? '진행 중인 활동'}’\n${live.server.stageNumber}단계 · 진행 ${cur.progressPercent ?? 0}%`}
        </AppText>
        <Button
          label="이어서 하기"
          onPress={() => swap(`/home/activity/${encodeURIComponent(live.hobby)}?userHobbyId=${live.server!.userHobbyId}&recordId=${cur.recordId}&activityId=${cur.activityId}`)}
          style={{ marginTop: 4 }}
        />
        <Button label="취소" variant="ghost" onPress={back} />
      </OverlayDialog>
    );
  }
  const tree = treeByHobby(hobby);
  const a = ACTIVITIES[tree.currentActivityId];
  return (
    <OverlayDialog>
      <IconTile size={48} radius={16}>
        <HobbyIcon hobby={tree.hobby} size={22} />
      </IconTile>
      <AppText variant="headline18Bold" color="textPrimary" align="center">
        {`${tree.name} 취미를 이어서 하시겠습니까?`}
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {`‘${a.title}’\n${a.stage}단계 · ${a.minutes}분 · ${a.category}`}
      </AppText>
      <Button label="이어서 하기" onPress={() => swap(`/home/activity/${tree.hobby}`)} style={{ marginTop: 4 }} />
      <Button label="취소" variant="ghost" onPress={back} />
    </OverlayDialog>
  );
}
