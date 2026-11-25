/**
 * 앱 업데이트(EAS Update) — 앱을 켤 때와 앱으로 돌아올 때 새 버전을 확인한다
 * - 새 버전이 있으면 내려받아 두고 ‘지금 업데이트’ 모달 → 누르면 바로 다시 시작
 * - ‘나중에’를 누르면 다음에 앱을 새로 켤 때 자동으로 적용된다
 * - 개발 모드(npx expo start)와 업데이트가 꺼진 빌드에서는 아무것도 하지 않는다
 * 배포: eas update --channel production --message "수정 내용"
 */
import * as Updates from 'expo-updates';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { ConfirmModal } from './ConfirmModal';

/** 앱으로 돌아왔을 때 다시 확인하는 최소 간격 */
const RECHECK_MS = 10 * 60 * 1000;

export function UpdateChecker() {
  const [ready, setReady] = useState(false);
  const [applying, setApplying] = useState(false);
  const lastCheck = useRef(0);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled || busy.current) return;
    if (Date.now() - lastCheck.current < RECHECK_MS) return;
    busy.current = true;
    lastCheck.current = Date.now();
    try {
      const res = await Updates.checkForUpdateAsync();
      if (res.isAvailable) {
        await Updates.fetchUpdateAsync();
        setReady(true);
      }
    } catch {
      // 네트워크가 없거나 서버 오류면 조용히 넘어간다 (지금 버전으로 계속 사용)
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  const apply = async () => {
    setApplying(true);
    try {
      await Updates.reloadAsync();
    } catch {
      setApplying(false);
      setReady(false);
    }
  };

  return (
    <ConfirmModal
      visible={ready}
      icon="sparkle"
      title="새 버전이 준비됐어요"
      message="지금 업데이트하면 앱이 잠깐 다시 시작돼요. 나중에 하면 다음에 앱을 켤 때 적용돼요."
      confirmLabel="지금 업데이트"
      cancelLabel="나중에"
      busy={applying}
      onConfirm={apply}
      onCancel={() => setReady(false)}
    />
  );
}
