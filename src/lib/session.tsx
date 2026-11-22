import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiError, onAuthExpired } from '../api/client';
import * as API from '../api/endpoints';
import { clearTokens, getMemberStatus, getRefreshToken, hasSession, saveMemberStatus, saveTokens } from '../api/tokens';
import type { MemberStatus, Provider, RestoreRequiredResult, SocialLoginResponse } from '../api/types';
import { ageFromServer } from '../api/mappers';
import { useAppState } from './appState';
import { getProviderToken, socialSignOut, SocialSdkUnavailableError } from './socialAuth';

/**
 * 로그인 세션
 * - signedIn: 서비스 토큰이 있음 → 연동한 화면(온보딩·추천·취미·하비 코치)이 실제 API를 호출
 * - signedOut: 토큰 없음 → 지금처럼 가짜 데이터(src/data)로 동작 (체험 모드)
 * 그래서 소셜 SDK·서버가 준비되기 전에도 앱 전체를 그대로 둘러볼 수 있다.
 * 로그인 직후·앱 시작 시 API-05(내 프로필)로 서버 닉네임·연령대를 받아 화면 이름(‘○○ 님’)에 반영한다.
 */
export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

export type SignInResult =
  | { kind: 'ok'; memberStatus?: MemberStatus; isNewUser?: boolean }
  | { kind: 'restoreRequired'; info: RestoreRequiredResult }
  | { kind: 'sdkUnavailable' };

interface SessionCtx {
  status: SessionStatus;
  signedIn: boolean;
  memberStatus: MemberStatus | null;
  signIn: (provider: Provider) => Promise<SignInResult>;
  restore: (restoreToken: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** API-07 회원 탈퇴 → 이 기기 로그인 정보도 지운다. 30일 안에는 같은 소셜 계정으로 로그인해 복구(API-04) */
  withdraw: () => Promise<{ restorableUntil?: string }>;
  /** 온보딩 완료(API-13) 뒤 회원 상태 반영 */
  setMemberStatus: (s: MemberStatus) => void;
  /** API-05로 서버 닉네임·연령대를 다시 받아 화면에 반영 */
  syncProfile: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [memberStatus, setMemberStatusState] = useState<MemberStatus | null>(null);
  const { state: appState, update } = useAppState();
  const profileRef = React.useRef(appState.profile);
  /** 이번 로그인에 쓴 소셜 제공자 — 로그아웃 때 그 SDK만 정리 (API-01 요청 · API-05 provider) */
  const providerRef = React.useRef<Provider | null>(null);
  profileRef.current = appState.profile;

  /** API-05 → 닉네임(‘○○ 님’)·연령대를 화면 상태에 맞춘다. 실패해도 로그인은 그대로 둔다 */
  const syncProfile = useCallback(async () => {
    try {
      const me = await API.getMe();
      if (me.provider) providerRef.current = me.provider;
      // 체크리스트 1: 로그인 토큰으로 /users/me 200 확인 (Metro 터미널에 표시)
      if (__DEV__) console.log(`[API] GET /users/me → 200 · userId ${me.userId ?? '?'} · ${me.memberStatus ?? '-'} · ${me.nickname ?? '(닉네임 없음)'}`);
      const age = ageFromServer(me.ageRange);
      update({
        ...(me.nickname ? { userName: me.nickname } : {}),
        ...(age ? { profile: { ...profileRef.current, age } } : {}),
        // 프로필 사진(API-08·06) · 활동 지역(API-42) · 위치 동의(API-43)
        ...(me.profileImageUrl !== undefined ? { profilePhotoUri: me.profileImageUrl } : {}),
        ...(me.location ? { region: me.location.fullName ?? me.location.name } : {}),
        ...(me.locationConsent ? { locationConsent: !!me.locationConsent.agreed } : {}),
      });
      if (me.memberStatus) {
        setMemberStatusState(me.memberStatus);
        saveMemberStatus(me.memberStatus).catch(() => undefined);
      }
    } catch {
      // 프로필을 못 받아도 앱은 계속 쓸 수 있다
    }
  }, [update]);

  // 앱 시작: 저장된 토큰이 있으면 로그인 상태로 시작
  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await hasSession();
      const ms = ok ? await getMemberStatus() : null;
      if (!alive) return;
      setMemberStatusState(ms);
      setStatus(ok ? 'signedIn' : 'signedOut');
      if (ok) syncProfile();
    })();
    return () => {
      alive = false;
    };
    // 앱 시작 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 토큰 재발급(API-02)까지 실패 → 로그인 화면으로
  useEffect(
    () =>
      onAuthExpired(() => {
        setStatus('signedOut');
        setMemberStatusState(null);
        router.replace('/onboarding/login');
      }),
    [],
  );

  const setMemberStatus = useCallback((s: MemberStatus) => {
    setMemberStatusState(s);
    saveMemberStatus(s).catch(() => undefined);
  }, []);

  const finishLogin = useCallback(
    async (t: SocialLoginResponse): Promise<SignInResult> => {
      await saveTokens(t);
      if (t.memberStatus) await saveMemberStatus(t.memberStatus);
      setMemberStatusState(t.memberStatus ?? null);
      setStatus('signedIn');
      syncProfile();
      return { kind: 'ok', memberStatus: t.memberStatus, isNewUser: t.isNewUser };
    },
    [syncProfile],
  );

  /** API-01: 소셜 SDK 토큰 → 서비스 토큰 */
  const signIn = useCallback(
    async (provider: Provider): Promise<SignInResult> => {
      let providerToken: string;
      try {
        providerToken = await getProviderToken(provider);
        providerRef.current = provider;
      } catch (e) {
        if (e instanceof SocialSdkUnavailableError) return { kind: 'sdkUnavailable' };
        throw e;
      }
      try {
        return await finishLogin(await API.socialLogin({ provider, providerToken }));
      } catch (e) {
        // 탈퇴 후 30일 안의 계정 → 복구 안내 (AUTH409_1)
        if (e instanceof ApiError && e.code === 'AUTH409_1') return { kind: 'restoreRequired', info: (e.result ?? {}) as RestoreRequiredResult };
        throw e;
      }
    },
    [finishLogin],
  );

  /** API-04: 탈퇴 계정 복구 */
  const restore = useCallback(async (restoreToken: string) => finishLogin(await API.restoreAccount(restoreToken)), [finishLogin]);

  /** API-03: 로그아웃 — 서버가 실패해도 이 기기의 토큰은 지운다 */
  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) await API.logout(refreshToken);
    } catch {
      // 이미 폐기된 세션 등 — 로컬 토큰 삭제는 계속
    }
    await clearTokens();
    socialSignOut(providerRef.current).catch(() => undefined);
    providerRef.current = null;
    setStatus('signedOut');
    setMemberStatusState(null);
  }, []);

  const withdraw = useCallback(async () => {
    const res = await API.withdraw(); // 서버가 모든 세션을 폐기한다
    await clearTokens();
    socialSignOut(providerRef.current).catch(() => undefined);
    providerRef.current = null;
    setStatus('signedOut');
    setMemberStatusState(null);
    return { restorableUntil: res.restorableUntil };
  }, []);

  const value = useMemo(
    () => ({ status, signedIn: status === 'signedIn', memberStatus, signIn, restore, signOut, withdraw, setMemberStatus, syncProfile }),
    [status, memberStatus, signIn, restore, signOut, withdraw, setMemberStatus, syncProfile],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
