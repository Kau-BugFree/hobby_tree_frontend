import type { HobbyKey } from '../components/Graphics';
import type { AgeOption } from '../data/my';
import type { AppState } from '../lib/appState';
import type {
  AgeRange,
  Difficulty,
  EngineResult,
  EngineStatus,
  IndoorOutdoor,
  MatchedCriteria,
  QuestionnaireAnswers,
  QuestionnaireDef,
  Terms,
} from './types';

/**
 * 화면 답변 → API-11 questionnaire (AI 추천 엔진 요청 형식)
 * - 5필드(budgetLevel 등) 방식은 쓰지 않는다 — 섞어 보내지 말 것 (BE 요청)
 * - 선택지 문구는 API-10 questionnaire의 문구를 그대로 보낸다 (없는 문구는 422)
 * - 미응답은 키를 뺀다. 프로토타입 초기값을 답변처럼 보내지 않는다 (화면 초기값은 모두 비어 있음)
 * - 직접 입력 선택지를 골랐으면 값도 함께 보낸다 (custom_values) — 하나만 보내면 422
 * - Q14는 answers가 아니라 context_text (공백만이면 뺀다)
 * - resources: Q08 ‘주방 도구’를 골랐다고 냄비·그릇을 ‘있음’으로 확정하지 않는다 → 확인한 것만
 */
export const QUESTIONNAIRE_SCHEMA = 'onboarding-2026-10-13';
/** answers에 들어가는 질문 키 14그룹 (Q09는 두 키) */
export const QUESTION_KEYS = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09Place', 'q09Exclude', 'q10', 'q11', 'q12', 'q13'] as const;

/** 직접 입력 선택지 (명세 2.2) */
export const CUSTOM_OPTION = {
  q02: '다른 취미 직접 입력',
  q04: '직접 금액 입력',
  q05: '직접 금액 입력',
  q06: '직접 시간 입력',
  q09Exclude: '직접 입력',
} as const;

const asArray = (v: AppState['answers'][string]) => (Array.isArray(v) ? v : v ? [v] : []);
const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n)));

export function toQuestionnaire(state: AppState, def?: QuestionnaireDef | null): QuestionnaireAnswers {
  const groups = new Map((def?.groups ?? []).map((g) => [g.key, g]));
  const answers: QuestionnaireAnswers['answers'] = {};
  for (const key of QUESTION_KEYS) {
    const g = groups.get(key);
    // 서버 선택지에 있는 문구만 (서버 정의가 없으면 화면 문구 그대로)
    const allowed = (o: string) => !g?.options?.length || g.options.includes(o);
    const raw = state.answers[key];
    if (Array.isArray(raw)) {
      const picked = Array.from(new Set(raw.filter(allowed)));
      if (picked.length) answers[key] = g?.max ? picked.slice(0, g.max) : picked;
    } else if (typeof raw === 'string' && raw && allowed(raw)) {
      answers[key] = raw;
    }
  }

  const has = (key: string, option: string) => asArray(answers[key] ?? null).includes(option);
  const custom: QuestionnaireAnswers['custom_values'] = {};
  if (has('q04', CUSTOM_OPTION.q04)) custom.q04_amount_krw = clampInt(state.customAmount.q04, 0, 1_000_000_000);
  if (has('q05', CUSTOM_OPTION.q05)) custom.q05_amount_krw = clampInt(state.customAmount.q05, 0, 1_000_000_000);
  if (has('q06', CUSTOM_OPTION.q06)) custom.q06_minutes = clampInt(state.customMinutes, 1, 1440);
  // 직접 입력 글이 비어 있으면 선택지도 같이 뺀다 (선택지만 보내면 422)
  const other = state.customText.q02Other.trim().slice(0, 200);
  if (has('q02', CUSTOM_OPTION.q02)) {
    if (other) custom.q02_other = other;
    else dropOption(answers, 'q02', CUSTOM_OPTION.q02);
  }
  const excl = state.customText.q09Exclude.trim().slice(0, 500);
  if (has('q09Exclude', CUSTOM_OPTION.q09Exclude)) {
    if (excl) custom.q09_exclude_text = excl;
    else dropOption(answers, 'q09Exclude', CUSTOM_OPTION.q09Exclude);
  }

  const maxCtx = def?.contextTextMaxLength ?? 200;
  const ctx = state.freeText.trim().slice(0, maxCtx);
  return {
    schema_version: def?.version ?? QUESTIONNAIRE_SCHEMA,
    answers,
    custom_values: custom,
    context_text: ctx || null,
    resources: { ...state.resources },
  };
}

function dropOption(answers: QuestionnaireAnswers['answers'], key: string, option: string) {
  const v = answers[key];
  if (!Array.isArray(v)) return;
  const rest = v.filter((o) => o !== option);
  if (rest.length) answers[key] = rest;
  else delete answers[key];
}

/** 저장한 설문과 재조회한 설문이 같은지 (API-12로 확인) */
export function sameQuestionnaire(a: QuestionnaireAnswers, b?: Partial<QuestionnaireAnswers> | null): boolean {
  if (!b) return false;
  const norm = (x: unknown) => JSON.stringify(x, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v));
  return norm(a.answers) === norm(b.answers ?? {}) && (a.context_text ?? null) === (b.context_text ?? null);
}

/**
 * API-14 engineResult 읽기 — 서버가 snake_case 그대로 주든 camelCase로 바꿔 주든 같은 모양으로 맞춘다
 */
type Loose = Record<string, unknown>;
const pick = (o: Loose, ...keys: string[]) => keys.map((k) => o?.[k]).find((v) => v !== undefined);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function readEngineResult(raw: unknown): EngineResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Loose;
  const recs = (pick(o, 'recommendations') as Loose[] | undefined) ?? [];
  const excluded = (pick(o, 'excluded') as Loose[] | undefined) ?? [];
  return {
    status: pick(o, 'status') as EngineResult['status'],
    schema_version: pick(o, 'schema_version', 'schemaVersion') as string | undefined,
    recommendations: recs.map((r) => ({
      hobby_id: pick(r, 'hobby_id', 'hobbyId') as string | undefined,
      name: pick(r, 'name') as string | undefined,
      rank: pick(r, 'rank') as number | undefined,
      score: pick(r, 'score') as number | undefined,
      reasons: strs(pick(r, 'reasons')),
      activities: ((pick(r, 'activities') as Loose[] | undefined) ?? []).map((a) => ({
        activity_id: pick(a, 'activity_id', 'activityId') as string | undefined,
        title: pick(a, 'title') as string | undefined,
        total_minutes: pick(a, 'total_minutes', 'totalMinutes') as number | undefined,
        active_minutes: pick(a, 'active_minutes', 'activeMinutes') as number | undefined,
        estimated_first_cost_krw: pick(a, 'estimated_first_cost_krw', 'estimatedFirstCostKrw') as number | undefined,
        estimated_repeat_cost_krw: pick(a, 'estimated_repeat_cost_krw', 'estimatedRepeatCostKrw') as number | undefined,
        status: pick(a, 'status') as string | undefined,
        confirmation_required: strs(pick(a, 'confirmation_required', 'confirmationRequired')),
      })),
    })),
    excluded: excluded.map((x) => ({
      hobby_id: pick(x, 'hobby_id', 'hobbyId') as string | undefined,
      name: pick(x, 'name') as string | undefined,
      reasons: strs(pick(x, 'reasons')),
    })),
    unsupported_interests: strs(pick(o, 'unsupported_interests', 'unsupportedInterests')),
    notices: strs(pick(o, 'notices')),
    follow_up_questions: strs(pick(o, 'follow_up_questions', 'followUpQuestions')),
  };
}

/** 추천 결과 상태 — engineResult가 없으면 항목 유무로 판단 */
export function engineStatusOf(rec: { items?: unknown[]; engineResult?: unknown } | null | undefined): EngineStatus {
  const s = String(readEngineResult(rec?.engineResult)?.status ?? '').toLowerCase();
  if (s === 'recommended' || s === 'browse' || s === 'needs_review' || s === 'no_match') return s as EngineStatus;
  return rec?.items?.length ? 'recommended' : 'no_match';
}

/** 닉네임 규칙 (API-06): 2~12자, 한글·영문·숫자·밑줄 (띄어쓰기 불가) */
export const NICKNAME_MAX = 12;
export const NICKNAME_RULE = /^[가-힣A-Za-z0-9_]{2,12}$/;
export function nicknameError(nick: string): string | null {
  const t = nick.trim();
  if (!t) return null; // 아직 입력 전
  if (t.length < 2) return '2자 이상 입력해 주세요';
  if (!NICKNAME_RULE.test(t)) return '한글·영문·숫자·밑줄(_)만 쓸 수 있어요 (띄어쓰기·자음만은 안 돼요)';
  return null;
}

/** 연령대 칩 → 서버 값 (API-06 ageRange) */
const AGE_TO_SERVER: Record<AgeOption, AgeRange> = {
  '20대': 'TWENTIES',
  '30대': 'THIRTIES',
  '40대 이상': 'FORTIES',
  '밝히지 않음': 'UNSPECIFIED',
};
export const ageToServer = (a: AgeOption) => AGE_TO_SERVER[a];
/** 서버 연령대 → 칩 (10대·50대 이상은 가까운 칩으로) */
export function ageFromServer(v?: AgeRange | null): AgeOption | null {
  switch (v) {
    case 'TWENTIES':
      return '20대';
    case 'THIRTIES':
      return '30대';
    case 'FORTIES':
    case 'FIFTIES_PLUS':
      return '40대 이상';
    case 'TEENS':
    case 'UNSPECIFIED':
      return '밝히지 않음';
    default:
      return null;
  }
}

/**
 * 서버 취미 → 앱 아이콘용 HobbyKey
 * 서버 취미는 이름이 다양해서(홈베이킹·우쿨렐레 …) 카테고리·이름으로 가장 가까운 아이콘을 고른다.
 */
const NAME_RULES: [RegExp, HobbyKey][] = [
  // AI 취미 코드 (hobbyCode)
  [/^cooking$/, '요리'],
  [/^instrument$/, '악기'],
  [/^reading$/, '독서'],
  [/커피|드립|원두|라떼/, '커피'],
  [/러닝|달리기|걷기|조깅|마라톤/, '러닝'],
  [/독서|책|읽기|필사/, '독서'],
  [/악기|피아노|기타|우쿨렐레|건반|드럼|바이올린|노래|음악/, '악기'],
  [/요리|베이킹|제과|제빵|쿠킹|디저트|반찬/, '요리'],
];
export function hobbyKeyOf(name?: string | null, categoryName?: string | null): HobbyKey {
  const text = `${categoryName ?? ''} ${name ?? ''}`.trim();
  for (const [re, key] of NAME_RULES) if (re.test(text)) return key;
  return '요리';
}

/** 추천 근거 코드 → 짧은 한글 태그 */
const CRITERIA_LABEL: Record<string, string> = {
  INDOOR: '실내',
  OUTDOOR: '야외',
  WITHIN_TIME: '시간 맞춤',
  WITHIN_BUDGET: '예산 맞춤',
  PREFERRED_CATEGORY: '관심 분야',
  BEGINNER_FRIENDLY: '입문 쉬움',
};
export const criteriaLabel = (c: MatchedCriteria) => CRITERIA_LABEL[c] ?? c;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { BEGINNER: '입문', INTERMEDIATE: '경험 있음', ANY: '상관없음' };
export const PLACE_LABEL: Record<IndoorOutdoor, string> = { INDOOR: '실내', OUTDOOR: '실외', ANY: '어디서나' };

/**
 * 약관 목록 — 최신 API 명세(API-10·13) 기준: 필수 4 · 선택 4
 *   필수: 1 서비스 이용약관 2.0 · 5 개인정보 처리방침 1.0 · 2 개인정보 수집 및 이용 동의서 2.0 · 3 만 19세 이상 확인 1.0
 *   선택: 6 위치기반 서비스 이용약관 · 7 사진 파일 접근 및 이용 안내 · 8 AI 서비스 이용 및 개인정보 처리 안내 · 4 학습용 데이터셋 활용 동의 (모두 1.0)
 * 순서는 서버 응답 순서(1·5·2·3 → 6·7·8·4)를 따른다.
 * ⚠ 온보딩 완료(API-13)는 '서버가 지금 가진 약관'만 받는다 → 서버(API-10)가 약관을 보내 주면 그 목록만 쓴다.
 *   (서버에 없는 약관 ID를 보내면 ONBOARDING400_1로 거절됨 — 명세와 배포 서버가 다를 때 대비)
 *   서버 약관을 못 받았을 때(체험 모드 등)만 아래 명세 목록을 보여 준다.
 */
export const SPEC_TERMS: Terms[] = [
  { termsId: 1, title: '서비스 이용약관', version: '2.0', isRequired: true },
  { termsId: 5, title: '개인정보 처리방침', version: '1.0', isRequired: true },
  { termsId: 2, title: '개인정보 수집 및 이용 동의서', version: '2.0', isRequired: true },
  { termsId: 3, title: '만 19세 이상 확인', version: '1.0', isRequired: true },
  { termsId: 6, title: '위치기반 서비스 이용약관', version: '1.0', isRequired: false },
  { termsId: 7, title: '사진 파일 접근 및 이용 안내', version: '1.0', isRequired: false },
  { termsId: 8, title: 'AI 서비스 이용 및 개인정보 처리 안내', version: '1.0', isRequired: false },
  { termsId: 4, title: '학습용 데이터셋 활용 동의', version: '1.0', isRequired: false },
];
/** 체험 모드 등 서버 약관이 없을 때 */
export const FALLBACK_TERMS = SPEC_TERMS;

export function mergeTerms(server?: Terms[] | null): Terms[] {
  const list = server?.length ? [...server] : [...SPEC_TERMS];
  // 필수 약관이 위로 오게만 정리 (같은 묶음 안에서는 서버·명세 순서 유지)
  return list.map((t, i) => ({ t, i })).sort((a, b) => Number(b.t.isRequired) - Number(a.t.isRequired) || a.i - b.i).map((x) => x.t);
}
