import { ApiError, newIdempotencyKey } from '../api/client';
import * as API from '../api/endpoints';
import { QUESTIONNAIRE_SCHEMA, sameQuestionnaire, toQuestionnaire } from '../api/mappers';
import type { AgeRange, MemberStatus, OnboardingOptions, Preferences, Recommendation, TermsAgreement } from '../api/types';
import type { AppState } from './appState';

/**
 * 온보딩 → 추천 흐름 (로그인 상태에서만)
 *   API-10 선택지·설문 조회 → API-12 지금 저장된 취향 버전 확인 → API-11 14문항 설문 저장(questionnaire)
 *   → API-12 다시 조회해 저장된 설문·버전 확인
 *   → API-06 닉네임·연령대 저장 → API-13 온보딩 완료(약관 동의, 아직 ACTIVE가 아닐 때) → API-14 추천 생성
 * API-13은 '필수 약관 동의 + 필수 프로필'을 확인한다(ONBOARDING400_1) → 그 전에 프로필(연령대)을 채운다
 * 백엔드는 온보딩을 마친 회원에게만 추천을 준다(미완료면 AUTH403_2) → 반드시 13 다음에 14
 * 버전이 어긋나면(다른 기기에서 수정 등) 최신 값을 다시 읽고 한 번만 다시 시도한다.
 */

/** 저장된 취향 버전 (없으면 0 = 최초 저장) */
async function currentVersion(): Promise<number> {
  try {
    return (await API.getPreferences()).preferencesVersion ?? 0;
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'PREFERENCE404_1' || e.status === 404)) return 0;
    throw e;
  }
}

/**
 * API-11 저장 — questionnaire 방식만 보낸다 (5필드 budgetLevel 등은 보내지 않음: 섞으면 안 됨)
 * optionsVersion · questionnaire.schema_version 둘 다 API-10 result.questionnaire.version (BE 확정 · 운영값 onboarding-2026-10-13)
 *   ⚠ 최상위 result.optionsVersion(2026-11-07)을 보내면 409(PREFERENCE409_1)
 * 409가 나면 API-10·저장 버전을 새로 읽어 한 번 더. 성공 응답의 preferencesVersion으로 온보딩 완료·추천을 부른다.
 */
const questionnaireVersionOf = (opts: OnboardingOptions) => opts.questionnaire?.version ?? QUESTIONNAIRE_SCHEMA;

async function save(state: AppState, options: OnboardingOptions): Promise<{ saved: Preferences; options: OnboardingOptions }> {
  let opts = options;
  let expectedVersion = await currentVersion();
  for (let attempt = 0; ; attempt++) {
    const version = questionnaireVersionOf(opts);
    const questionnaire = { ...toQuestionnaire(state, opts.questionnaire), schema_version: version };
    try {
      const saved = await API.savePreferences({ optionsVersion: version, expectedVersion, questionnaire });
      if (__DEV__) console.log(`[온보딩] 설문 저장 성공 · optionsVersion=${version} · preferencesVersion=${saved.preferencesVersion}`);
      await verifySaved(questionnaire, saved.preferencesVersion);
      return { saved, options: opts };
    } catch (e) {
      if (attempt > 0 || !(e instanceof ApiError) || e.status !== 409) throw e;
      if (__DEV__) console.log(`[온보딩] 설문 저장 409 (${e.code}) · optionsVersion=${version} → API-10·저장 버전 다시 읽고 재시도`);
      [opts, expectedVersion] = await Promise.all([API.getOnboardingOptions(), currentVersion()]);
    }
  }
}

/**
 * API-12로 다시 읽어 방금 저장한 설문이 그대로 들어갔는지 확인 (체크리스트 3)
 * 버전이 다르면 그 사이 다른 곳에서 바뀐 것 → 온보딩 완료·추천에 엉뚱한 버전을 쓰지 않도록 멈춘다
 * 설문 내용이 다르게 보이면(서버가 값을 정리해 돌려주는 경우 등) 개발 로그만 남기고 계속한다
 */
async function verifySaved(sent: ReturnType<typeof toQuestionnaire>, version: number) {
  const back = await API.getPreferences().catch(() => null);
  if (!back) return; // 재조회 실패는 저장 실패가 아니다
  if (__DEV__ && back.preferencesVersion !== version) {
    console.log(`[온보딩] ⚠ 저장 응답 버전 v${version} · 재조회 버전 v${back.preferencesVersion}`);
  }
  if (__DEV__) {
    const ok = sameQuestionnaire(sent, back.questionnaire);
    console.log(`[온보딩] 설문 저장 확인 v${version} · ${ok ? '저장한 답변과 같음' : '⚠ 재조회 내용이 보낸 값과 다름'}`);
    if (!ok) console.log('[온보딩] 보낸 값', JSON.stringify(sent), '\n[온보딩] 받은 값', JSON.stringify(back.questionnaire));
  }
}

export interface PreparedRecommendation {
  options: OnboardingOptions;
  preferencesVersion: number;
  /** API-13을 보냈으면 그 결과 회원 상태 */
  memberStatus?: MemberStatus;
  /** 조건에 맞는 취미가 없으면(RECOMMENDATION422_1) null */
  recommendation: Recommendation | null;
}

/** 추천 개수 — 나무는 최대 5그루까지 심을 수 있어 5개까지 받는다 (명세: 1~5) */
export const RECOMMEND_COUNT = 5;

/** 약관을 다시 받아야 할 때 (ONBOARDING409_1 등) */
export class AgreementsNeededError extends Error {
  constructor(message = '약관이 바뀌었어요. 약관을 다시 확인해 주세요.') {
    super(message);
    this.name = 'AgreementsNeededError';
  }
}

/**
 * @param agreements O-05-1 약관 화면에서 받은 동의
 * @param needComplete 아직 온보딩 미완료(PENDING_ONBOARDING)면 true → API-13을 보낸다
 */
/** 지금 진행 중인 단계 — 실패하면 화면에 어느 단계에서 멈췄는지 보여 준다 */
export let lastStep = '';
/** 화면에는 단계 이름만(Figma O-05-2-E ‘취향 저장 단계에서 멈췄어요’), Metro 로그에는 API 번호까지 */
const step = (label: string, api: string) => {
  lastStep = label;
  if (__DEV__) console.log(`[온보딩] ▶ ${label} (${api})`);
};

export async function prepareRecommendation(
  state: AppState,
  agreements: TermsAgreement[] | null,
  needComplete: boolean,
  ageRange: AgeRange | null = null,
  nickname: string | null = null,
): Promise<PreparedRecommendation> {
  step('선택지 조회', 'API-10');
  const fresh = await API.getOnboardingOptions();
  step('취향 저장', 'API-11');
  const { saved, options } = await save(state, fresh);
  const preferencesVersion = saved.preferencesVersion;

  let memberStatus: MemberStatus | undefined;
  if (needComplete) {
    if (!agreements?.length) throw new AgreementsNeededError('약관 동의가 필요해요.');
    // 서버 약관 버전과 다른 동의는 보내지 않는다 → 약관 화면으로 돌려보냄
    const current = options.terms ?? [];
    const stale = current.some((t) => t.isRequired && !agreements.find((a) => a.termsId === t.termsId && a.version === t.version && a.agreed));
    if (current.length && stale) throw new AgreementsNeededError();
    // 필수 프로필: 닉네임 · 연령대 (API-06으로 먼저 저장)
    if (ageRange || nickname) {
      step('프로필 저장', 'API-06');
      await API.updateProfile({ ...(nickname ? { nickname } : {}), ...(ageRange ? { ageRange } : {}) });
    }
    // 서버가 지금 가진 약관만 보낸다 (없는 ID는 빼고, 화면에 없던 서버 약관은 동의 안 함으로 채움)
    const toSend = current.length
      ? current.map((t) => ({
          termsId: t.termsId,
          version: t.version,
          agreed: !!agreements.find((a) => a.termsId === t.termsId && a.agreed),
        }))
      : agreements;
    step('온보딩 완료', 'API-13');
    try {
      const done = await API.completeOnboarding({ preferencesVersion, agreements: toSend });
      memberStatus = done.memberStatus ?? 'ACTIVE';
    } catch (e) {
      // 이미 온보딩을 마친 계정이면(다시 진행한 경우) 서버가 완료 요청을 거절할 수 있다 → 실제 상태를 확인하고 계속 진행
      const me = await API.getMe().catch(() => null);
      if (me && (me.memberStatus === 'ACTIVE' || me.onboardingCompleted)) {
        memberStatus = 'ACTIVE';
      } else if (e instanceof ApiError && (e.code === 'ONBOARDING409_1' || e.code === 'ONBOARDING400_1')) {
        throw new AgreementsNeededError(`${e.message} (${e.code})`);
      } else {
        throw e;
      }
    }
  }

  step('추천 생성', 'API-14');
  const recommendation = await createRecommendationSafe(preferencesVersion);
  lastStep = '';
  return { options, preferencesVersion, memberStatus, recommendation };
}

/** API-14 — 재시도할 때 같은 멱등 키를 써서 중복 생성을 막는다 */
export async function createRecommendationSafe(preferencesVersion: number, idempotencyKey = newIdempotencyKey()) {
  try {
    return await API.createRecommendation({ preferencesVersion, count: RECOMMEND_COUNT, excludeHobbyIds: [] }, idempotencyKey);
  } catch (e) {
    if (e instanceof ApiError && e.code === 'RECOMMENDATION422_1') return null;
    if (e instanceof ApiError && e.status === 409) {
      const body = { preferencesVersion, count: RECOMMEND_COUNT, excludeHobbyIds: [] };
      if (__DEV__) console.log(`[추천] 409 (${e.code}) ${e.message}`);
      // 같은 요청이 아직 처리 중 → 잠깐 뒤 같은 키로 / 그 밖의 409(키 충돌 등) → 새 키로 한 번 더
      if (e.code === 'COMMON409_2') {
        await new Promise((r) => setTimeout(r, 1500));
        return API.createRecommendation(body, idempotencyKey);
      }
      return API.createRecommendation(body, newIdempotencyKey());
    }
    throw e;
  }
}

/** API-15 최근 추천 (없으면 null) */
export async function latestRecommendation(): Promise<Recommendation | null> {
  try {
    return await API.getLatestRecommendation();
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'RECOMMENDATION404_1' || e.status === 404)) return null;
    throw e;
  }
}

/** 오래된 추천(isStale) → 현재 취향 버전으로 새로 추천 */
export async function refreshRecommendation(): Promise<{ preferencesVersion: number; recommendation: Recommendation | null }> {
  const preferencesVersion = await currentVersion();
  if (!preferencesVersion) throw new ApiError(409, 'PREFERENCE_MISSING', '먼저 온보딩 답변을 저장해 주세요.');
  return { preferencesVersion, recommendation: await createRecommendationSafe(preferencesVersion) };
}

export { currentVersion as currentPreferencesVersion };

/**
 * 답변을 고친 뒤 다시 저장하고 새로 추천 (이미 온보딩을 마친 뒤 — 결과가 needs_review·no_match일 때)
 * 예: Q14 자유 입력을 빼고 다시 추천받기
 */
export async function resaveAndRecommend(state: AppState): Promise<{ options: OnboardingOptions; preferencesVersion: number; recommendation: Recommendation | null }> {
  const { saved, options } = await save(state, await API.getOnboardingOptions());
  return { options, preferencesVersion: saved.preferencesVersion, recommendation: await createRecommendationSafe(saved.preferencesVersion) };
}
