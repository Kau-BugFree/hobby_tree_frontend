import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { AgeRange, OnboardingOptions, Recommendation, TermsAgreement } from '../api/types';
import type { HobbyKey } from '../components/Graphics';
import { PROFILE, ProfileData } from '../data/my';
import { HOBBY_CHECKS, INITIAL_PICKED, OPTIONAL, STEP1, STEP2, STEP3 } from '../data/onboarding';

/**
 * 앱 전역 상태 (메모리).
 * 실제 서비스에서는 서버 API + 캐시(TanStack Query 등)로 대체하고,
 * 여기에는 화면 간 이동에 필요한 UI 상태만 남긴다.
 */
export type Answer = string | string[] | null;

export interface AppState {
  userName: string;
  answers: Record<string, Answer>;
  /** Q04·Q05 직접 입력 금액(원), Q06 직접 입력 시간(분) */
  customAmount: { q04: number; q05: number };
  customMinutes: number;
  /** Q02 ‘다른 취미 직접 입력’ · Q09 제외 ‘직접 입력’ 글 */
  customText: { q02Other: string; q09Exclude: string };
  /** Q14 추가 고려사항 (questionnaire.context_text) */
  freeText: string;
  /** 자원 확인 (questionnaire.resources) — 사용자가 직접 확인한 것만 true/false */
  resources: Record<string, boolean>;
  /** O-06에서 고른 취미 */
  picked: HobbyKey[];
  /** O-06-1 추가 확인 답변: `${hobby}:${code}` → 값 */
  hobbyChecks: Record<string, string>;
  region: string;
  profilePhotoUri: string | null;
  /** 출시·오픈 알림을 신청한 대상 id */
  alarms: string[];
  /** M-03 프로필 관리 값 (연령대·예산·시간) */
  profile: ProfileData;
  /** M-04 위치 동의 여부 (동의 시각·버전은 서버에 기록) */
  locationConsent: boolean;
  /** ── 서버 연동 값 (로그인 상태에서만 채워짐) ── */
  server: ServerOnboarding;
}

export interface ServerOnboarding {
  /** API-10 선택지·약관 */
  options: OnboardingOptions | null;
  /** API-11·12 현재 취향 버전 (API-13·14에 그대로 보냄) */
  preferencesVersion: number | null;
  /** API-14·15 추천 결과 */
  recommendation: Recommendation | null;
  /** O-06에서 고른 서버 취미 ID */
  pickedHobbyIds: number[];
  /** API-34 이어서 쓰는 하비 코치 대화 ID */
  coachConversationId: number | null;
  /** O-05-1 약관 화면에서 받은 동의 (API-13에 그대로 보냄) */
  agreements: TermsAgreement[] | null;
  /** O-05-1에서 고른 연령대 (API-06으로 저장 → API-13 '필수 프로필') */
  ageRange: AgeRange | null;
  /** O-05-1에서 입력한 닉네임 (API-06으로 저장 → API-13 '필수 프로필') */
  nickname: string | null;
}

/** 온보딩 답변은 모두 빈 상태로 시작한다 — 프로토타입 초기값을 답변처럼 서버에 보내지 않기 위해 (AI 명세 3.1) */
const initialAnswers = (): Record<string, Answer> => {
  const out: Record<string, Answer> = {};
  for (const step of [STEP1, STEP2, STEP3, OPTIONAL])
    for (const q of step.questions) for (const g of q.groups) out[g.key] = g.kind === 'multi' ? [] : null;
  return out;
};

const initialChecks = (): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [hobby, def] of Object.entries(HOBBY_CHECKS)) for (const c of def.checks) out[`${hobby}:${c.code}`] = c.initial;
  return out;
};

const INITIAL: AppState = {
  userName: '다은',
  answers: initialAnswers(),
  customAmount: { q04: 10000, q05: 30000 },
  customMinutes: 30,
  customText: { q02Other: '', q09Exclude: '' },
  freeText: '',
  resources: {},
  picked: [...INITIAL_PICKED],
  hobbyChecks: initialChecks(),
  region: '서울 마포구',
  profilePhotoUri: null,
  alarms: [],
  profile: PROFILE,
  locationConsent: false,
  server: { options: null, preferencesVersion: null, recommendation: null, pickedHobbyIds: [], coachConversationId: null, agreements: null, ageRange: null, nickname: null },
};

interface Ctx {
  state: AppState;
  setAnswer: (key: string, value: Answer) => void;
  update: (patch: Partial<AppState>) => void;
  updateServer: (patch: Partial<ServerOnboarding>) => void;
  toggleAlarm: (id: string, on?: boolean) => void;
}

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL);
  const setAnswer = useCallback((key: string, value: Answer) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));
  }, []);
  const update = useCallback((patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch })), []);
  const updateServer = useCallback(
    (patch: Partial<ServerOnboarding>) => setState((s) => ({ ...s, server: { ...s.server, ...patch } })),
    [],
  );
  const toggleAlarm = useCallback((id: string, on = true) => {
    setState((s) => ({
      ...s,
      alarms: on ? Array.from(new Set([...s.alarms, id])) : s.alarms.filter((a) => a !== id),
    }));
  }, []);
  const value = useMemo(
    () => ({ state, setAnswer, update, updateServer, toggleAlarm }),
    [state, setAnswer, update, updateServer, toggleAlarm],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}

/** 단일/복수 선택 규칙(배타 선택지, 최대 개수)을 적용한 다음 값 */
export function nextSelection(
  current: Answer,
  option: string,
  kind: 'single' | 'multi',
  exclusive: readonly string[] = [],
  max?: number,
): Answer {
  if (kind === 'single') return option;
  const arr = Array.isArray(current) ? current : current ? [current] : [];
  if (arr.includes(option)) return arr.filter((o) => o !== option);
  if (exclusive.includes(option)) return [option];
  const base = arr.filter((o) => !exclusive.includes(o));
  if (max && base.length >= max) return [...base.slice(1), option];
  return [...base, option];
}

export const withComma = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const formatWon = (n: number) => `${withComma(n)}원`;
export const formatManWon = (n: number) => (n % 10000 === 0 ? `${n / 10000}만 원` : formatWon(n));
export const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h && mm) return `${h}시간 ${mm}분`;
  if (h) return `${h}시간`;
  return `${mm}분`;
};

/** '서울 마포구' → '서울 마포' (M-01 프로필 카드 표기) */
export const shortRegion = (r: string) => r.replace(/(구|군)$/, '');
