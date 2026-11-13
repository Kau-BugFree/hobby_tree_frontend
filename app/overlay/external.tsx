/**
 * OV-02 외부 페이지 이동 안내 (가운데 확인창)
 * - 이동하기 → 앱 안 브라우저(OV-09 대체: expo-web-browser, SFSafariViewController / Custom Tabs) 후 닫기
 * - 취소·Dim → CLOSE
 * ?title=판매처·기관 이름 &url=서버가 내려준 주소
 */
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import { AppText, Button, IconSlot, IconTile, OverlayDialog, useToast } from '../../components';
import { EXTERNAL_FALLBACK_URL } from '../../lib/config';
import { back } from '../../lib/nav';
import { COLORS } from '../../theme';

export default function ExternalDialog() {
  const { title, url } = useLocalSearchParams<{ title?: string; url?: string }>();
  const toast = useToast();

  const onGo = async () => {
    back();
    try {
      // TODO(API): 클릭 로그(광고·제휴 정산) POST /events { type: 'outbound', target }
      await WebBrowser.openBrowserAsync(url || EXTERNAL_FALLBACK_URL, {
        toolbarColor: COLORS.bgSurface,
        controlsColor: COLORS.brandPrimary,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch {
      toast({ title: '페이지를 열 수 없어요', sub: '잠시 후 다시 시도해 주세요' });
    }
  };

  return (
    <OverlayDialog>
      <IconTile size={56} radius={999}>
        <IconSlot name="external" size={26} color="brandDeep" />
      </IconTile>
      <AppText variant="headline18Bold" color="textPrimary" align="center">
        {title ? `${title} 페이지로 이동해요` : '외부 페이지로 이동해요'}
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {'판매처·기관 페이지가 앱 안 브라우저로 열려요.\n결제·신청은 그곳에서 진행되고, 하비트리는 결제 정보를 받지 않아요.'}
      </AppText>
      <Button label="이동하기" onPress={onGo} />
      <Button label="취소" variant="ghost" onPress={back} />
    </OverlayDialog>
  );
}
