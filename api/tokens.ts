import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { MemberStatus, TokenBundle } from './types';

/**
 * 서비스 토큰 저장소
 * - 휴대폰: 보안 저장소(iOS 키체인 · Android Keystore)에 저장
 * - 웹(브라우저 미리보기): 보안 저장소가 없어서 메모리에만 둔다 (새로고침하면 로그아웃)
 * - 토큰 원문은 로그로 남기지 않는다
 * - 회원 상태(memberStatus)도 함께 저장 → 앱을 다시 켰을 때 온보딩/홈 중 어디로 갈지 정한다
 *   (내 프로필 조회 API-05는 이번 연동 범위가 아니라서 로그인·재발급 응답 값을 보관)
 */
const KEY_ACCESS = 'hobbytree.accessToken';
const KEY_REFRESH = 'hobbytree.refreshToken';
const KEY_STATUS = 'hobbytree.memberStatus';

interface Stored {
  access: string | null;
  refresh: string | null;
  status: MemberStatus | null;
}

let memory: Stored = { access: null, refresh: null, status: null };
let loaded = false;
const native = Platform.OS !== 'web';

async function load() {
  if (loaded) return;
  loaded = true;
  if (!native) return;
  try {
    const [access, refresh, status] = await Promise.all([
      SecureStore.getItemAsync(KEY_ACCESS),
      SecureStore.getItemAsync(KEY_REFRESH),
      SecureStore.getItemAsync(KEY_STATUS),
    ]);
    memory = { access, refresh, status: status as MemberStatus | null };
  } catch {
    memory = { access: null, refresh: null, status: null };
  }
}

export async function getAccessToken() {
  await load();
  return memory.access;
}

export async function getRefreshToken() {
  await load();
  return memory.refresh;
}

export async function getMemberStatus() {
  await load();
  return memory.status;
}

export async function hasSession() {
  await load();
  return !!memory.refresh;
}

export async function saveTokens(t: Pick<TokenBundle, 'accessToken' | 'refreshToken'>) {
  await load();
  memory = { ...memory, access: t.accessToken, refresh: t.refreshToken };
  if (!native) return;
  await Promise.all([SecureStore.setItemAsync(KEY_ACCESS, t.accessToken), SecureStore.setItemAsync(KEY_REFRESH, t.refreshToken)]);
}

export async function saveMemberStatus(status: MemberStatus) {
  await load();
  memory = { ...memory, status };
  if (!native) return;
  await SecureStore.setItemAsync(KEY_STATUS, status);
}

export async function clearTokens() {
  memory = { access: null, refresh: null, status: null };
  loaded = true;
  if (!native) return;
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS),
    SecureStore.deleteItemAsync(KEY_REFRESH),
    SecureStore.deleteItemAsync(KEY_STATUS),
  ]);
}
