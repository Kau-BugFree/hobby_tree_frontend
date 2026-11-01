import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

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
  freeText: string;
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
}

const initialAnswers = (): Record<string, Answer> => {
  const out: Record<string, Answer> = {};
  for (const step of [STEP1, STEP2, STEP3, OPTIONAL])
    for (const q of step.questions) for (const g of q.groups) out[g.key] = Array.isArray(g.initial) ? [...g.initial] : g.initial;
  out.parseConfirm = '맞아요';
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
  customAmount: { q04: 15000, q05: 20000 },
  customMinutes: 80,
  freeText: '기타가 있고 밤에만 할 수 있어요. 장비는 더 사고 싶지 않아요.',
  picked: [...INITIAL_PICKED],
  hobbyChecks: initialChecks(),
  region: '서울 마포구',
  profilePhotoUri: null,
  alarms: [],
  profile: PROFILE,
  locationConsent: false,
};

interface Ctx {
  state: AppState;
  setAnswer: (key: string, value: Answer) => void;
  update: (patch: Partial<AppState>) => void;
  toggleAlarm: (id: string, on?: boolean) => void;
}

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL);
  const setAnswer = useCallback((key: string, value: Answer) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));
  }, []);
  const update = useCallback((patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch })), []);
  const toggleAlarm = useCallback((id: string, on = true) => {
    setState((s) => ({
      ...s,
      alarms: on ? Array.from(new Set([...s.alarms, id])) : s.alarms.filter((a) => a !== id),
    }));
  }, []);
  const value = useMemo(() => ({ state, setAnswer, update, toggleAlarm }), [state, setAnswer, update, toggleAlarm]);
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
