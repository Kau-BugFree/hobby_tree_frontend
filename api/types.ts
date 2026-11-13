/**
 * API 요청·응답 타입 — HobbyTree API 명세 기준
 * 이번 연동 범위: API-01~04(인증) · 10~13(온보딩) · 14~17(추천·취미) · 34(하비 코치)
 * 서버가 값을 빠뜨려도 앱이 멈추지 않도록 응답 필드는 대부분 선택(?)으로 둔다.
 */

/** 모든 응답 공통 모양 */
export interface ApiEnvelope<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

export interface CursorPage<T> {
  items?: T[];
  nextCursor?: string | null;
  hasNext?: boolean;
}

/* ───────── 인증 (API-01~04) ───────── */
export type Provider = 'KAKAO' | 'GOOGLE';
export type MemberStatus = 'PENDING_ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN' | 'ANONYMIZED';

export interface TokenBundle {
  userId?: number;
  accessToken: string;
  refreshToken: string;
  tokenType?: 'Bearer';
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
  memberStatus?: MemberStatus;
}

/** API-01 POST /auth/social-login */
export interface SocialLoginRequest {
  provider: Provider;
  /** KAKAO: Access Token · GOOGLE: ID Token */
  providerToken: string;
}
export interface SocialLoginResponse extends TokenBundle {
  isNewUser?: boolean;
}
/** API-01 실패(AUTH409_1)의 result — 탈퇴 계정 복구 안내 */
export interface RestoreRequiredResult {
  memberStatus?: 'WITHDRAWN';
  restorable?: boolean;
  restorableUntil?: string | null;
  restoreToken?: string | null;
  restoreTokenExpiresIn?: number;
}

/** API-02 POST /auth/reissue */
export type ReissueResponse = TokenBundle;

/** API-03 POST /auth/logout */
export interface LogoutResponse {
  loggedOut?: boolean;
}

/** API-04 POST /auth/restore */
export interface RestoreResponse extends SocialLoginResponse {
  restored?: boolean;
}

/* ───────── 프로필 (API-06) ───────── */
export type AgeRange = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS' | 'UNSPECIFIED';

/** API-06 PATCH /users/me — 보낸 필드만 바뀐다 (null 불가) */
export interface UpdateProfileRequest {
  nickname?: string;
  ageRange?: AgeRange;
}
export interface UpdateProfileResponse {
  userId?: number;
  nickname?: string;
  profileImageUrl?: string | null;
  ageRange?: AgeRange;
  updatedAt?: string;
}

/** API-05 GET /users/me (온보딩 완료 여부 확인에만 사용) */
export interface MyProfile {
  userId?: number;
  nickname?: string | null;
  ageRange?: AgeRange | null;
  memberStatus?: MemberStatus;
  onboardingCompleted?: boolean;
}

/* ───────── 온보딩 (API-10~13) ───────── */
export type BudgetLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type IndoorOutdoor = 'INDOOR' | 'OUTDOOR' | 'ANY';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ANY';

export interface OptionItem<V> {
  value: V;
  label?: string;
}
export interface BudgetOption extends OptionItem<BudgetLevel> {
  monthlyMin?: number;
  monthlyMax?: number | null;
}
export interface Category {
  categoryId: number;
  name: string;
}
export interface Terms {
  termsId: number;
  title: string;
  version: string;
  isRequired: boolean;
  /** 약관 전체 본문 (contentUrl 없음) */
  content?: string;
}

/** API-10 GET /onboarding/options */
export interface OnboardingOptions {
  optionsVersion: string;
  budgetOptions?: BudgetOption[];
  availableTimeOptions?: OptionItem<number>[];
  indoorOutdoorOptions?: OptionItem<IndoorOutdoor>[];
  difficultyOptions?: OptionItem<Difficulty>[];
  categories?: Category[];
  terms?: Terms[];
  locationConsentNotice?: { consentType?: string; version?: string; content?: string };
  /** 14문항 설문 정의 (AI 추천 엔진 기준) — 화면 선택지는 이 문구를 그대로 쓴다 */
  questionnaire?: QuestionnaireDef;
}

/* ───────── 14문항 설문 (AI Hobby Recommender 명세 · onboarding-2026-10-13) ───────── */
export interface QuestionGroupDef {
  /** 요청 질문 키 (q01 … q13, q09Place, q09Exclude) */
  key: string;
  code?: string;
  title?: string;
  kind?: 'single' | 'multi';
  options?: string[];
  exclusive?: string[];
  max?: number | null;
  custom_option?: string | null;
}
export interface QuestionnaireDef {
  version?: string;
  groups?: QuestionGroupDef[];
  /** 자원 코드 → 설명 */
  resources?: Record<string, string>;
  contextTextMaxLength?: number;
}

/**
 * API-11 Body의 questionnaire — AI 추천 엔진 요청 형식을 그대로 담는다 (snake_case)
 * 미응답 질문은 키를 뺀다. 직접 입력은 선택지와 값을 함께 보낸다.
 */
export interface QuestionnaireAnswers {
  schema_version: string;
  answers: Record<string, string | string[]>;
  custom_values: {
    q04_amount_krw?: number;
    q05_amount_krw?: number;
    q06_minutes?: number;
    q02_other?: string;
    q09_exclude_text?: string;
  };
  /** Q14 추가 고려사항 (1~200자, 없으면 null) */
  context_text: string | null;
  /** 자원 코드별 실제 사용 가능 여부 — 확인한 것만 넣는다 */
  resources: Record<string, boolean>;
}

/**
 * (이전 방식) 5필드 취향 — 지금은 보내지 않는다. questionnaire 방식과 섞어 보내지 말 것 (BE 요청)
 * 응답에는 서버가 계산한 값이 들어올 수 있어 타입만 남겨 둔다.
 */
export interface PreferencesInput {
  optionsVersion: string;
  budgetLevel: BudgetLevel;
  availableTimeMinutes: number;
  indoorOutdoor: IndoorOutdoor;
  difficultyPreference: Difficulty;
  preferredCategoryIds: number[];
}
/** API-11 PUT /users/me/preferences — questionnaire 방식 (5필드는 보내지 않음) */
export interface SavePreferencesRequest {
  optionsVersion: string;
  /** 최초 저장 0, 수정 시 현재 preferencesVersion */
  expectedVersion: number;
  questionnaire: QuestionnaireAnswers;
}
/** API-11·12 응답 */
export interface Preferences extends Partial<PreferencesInput> {
  userId?: number;
  preferencesVersion: number;
  updatedAt?: string;
  /** 저장된 설문 (재조회 확인용) */
  questionnaire?: Partial<QuestionnaireAnswers> | null;
}

/** API-13 POST /onboarding/complete */
export interface TermsAgreement {
  termsId: number;
  version: string;
  agreed: boolean;
}
export interface CompleteOnboardingRequest {
  preferencesVersion: number;
  agreements: TermsAgreement[];
}
export interface CompleteOnboardingResponse {
  userId?: number;
  memberStatus?: MemberStatus;
  onboardingCompleted?: boolean;
  completedAt?: string;
}

/* ───────── 추천 · 취미 (API-14~17) ───────── */
export type MatchedCriteria =
  | 'INDOOR'
  | 'OUTDOOR'
  | 'WITHIN_TIME'
  | 'WITHIN_BUDGET'
  | 'PREFERRED_CATEGORY'
  | 'BEGINNER_FRIENDLY'
  | (string & {});

export interface RecommendationItem {
  hobbyId: number;
  name: string;
  thumbnailUrl?: string | null;
  reason?: string;
  matchedCriteria?: MatchedCriteria[];
  /** AI 취미 코드 (cooking · instrument · reading) — engineResult.recommendations[].hobby_id와 같음 */
  hobbyCode?: string | null;
  /** 규칙 기반 적합도 점수 0~100 — 확률·정확도로 보여 주지 않는다 */
  score?: number | null;
}

/* ───────── AI 추천 엔진 결과 (API-14 engineResult) ───────── */
export type EngineStatus = 'recommended' | 'browse' | 'needs_review' | 'no_match';
export interface EngineActivity {
  activity_id?: string;
  title?: string;
  total_minutes?: number;
  active_minutes?: number;
  estimated_first_cost_krw?: number;
  estimated_repeat_cost_krw?: number;
  status?: 'eligible' | 'needs_confirmation' | (string & {});
  confirmation_required?: string[];
}
export interface EngineRecommendation {
  hobby_id?: string;
  name?: string;
  ui_key?: string;
  rank?: number;
  score?: number;
  reasons?: string[];
  activities?: EngineActivity[];
}
export interface EngineExcluded {
  hobby_id?: string;
  name?: string;
  reasons?: string[];
}
export interface EngineResult {
  status?: EngineStatus | (string & {});
  schema_version?: string;
  rules_version?: string;
  catalog_version?: string;
  recommendations?: EngineRecommendation[];
  excluded?: EngineExcluded[];
  unsupported_interests?: string[];
  notices?: string[];
  follow_up_questions?: string[];
}

/** API-14 POST /recommendations */
export interface CreateRecommendationRequest {
  preferencesVersion: number;
  count?: number;
  excludeHobbyIds?: number[];
}
/** API-14·15 응답 */
export interface Recommendation {
  recommendationId: number;
  preferencesVersion?: number;
  createdAt?: string;
  items?: RecommendationItem[];
  requestedCount?: number;
  returnedCount?: number;
  /** API-15: 추천 뒤에 취향 설정이 바뀌었는지 */
  isStale?: boolean;
  /** AI 추천 엔진 원본 결과 — status 4종(recommended·browse·needs_review·no_match) */
  engineResult?: EngineResult | null;
}

export interface HobbySummary {
  hobbyId: number;
  name: string;
  description?: string;
  category?: Category | null;
  thumbnailUrl?: string | null;
  minDurationMinutes?: number | null;
  minCost?: number | null;
  difficulty?: Difficulty | null;
  indoorOutdoor?: IndoorOutdoor | null;
  isPlanted?: boolean;
  userHobbyId?: number | null;
}

/** API-16 GET /hobbies 쿼리 */
export interface HobbyQuery {
  keyword?: string;
  categoryId?: number;
  maxDurationMinutes?: number;
  maxCost?: number;
  indoorOutdoor?: IndoorOutdoor;
  sort?: 'NAME' | 'POPULAR';
  cursor?: string | null;
  size?: number;
}
export type HobbyList = CursorPage<HobbySummary>;

/** API-17 GET /hobbies/{hobbyId} */
export interface HobbyDetail extends HobbySummary {
  introduction?: string;
  totalStages?: number;
  growthRule?: { distinctActivitiesPerStage?: number };
  starterMaterials?: { name: string; isRequired?: boolean }[];
  treeStatus?: 'ACTIVE' | 'PAUSED' | 'ENDED' | null;
  contentUpdatedAt?: string;
}

/* ───────── 하비 코치 (API-34) ───────── */
export interface CoachReference {
  sourceType?: string;
  sourceId?: number;
  title?: string;
  sourceCode?: string;
}
export interface CoachSuggestedActivity {
  activityId?: number;
  title?: string;
  reason?: string;
}

/** POST /coach/chat */
export interface CoachChatRequest {
  /** 없거나 null이면 새 대화 */
  conversationId?: number | null;
  message: string;
  /** 새 대화를 시작할 때만 반영 */
  userHobbyId?: number | null;
}
export interface CoachChatResponse {
  conversationId: number;
  messageId?: number;
  answer: string;
  references?: CoachReference[];
  suggestedActivities?: CoachSuggestedActivity[];
  usedContext?: { userHobbyId?: number; hobbyId?: number } | null;
  createdAt?: string;
}

/** GET /coach/conversations */
export interface CoachConversation {
  conversationId: number;
  userHobbyId?: number | null;
  hobbyId?: number | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string;
  createdAt?: string;
}
export type CoachConversationList = CursorPage<CoachConversation>;

/** GET /coach/conversations/{id}/messages */
export interface CoachMessage {
  messageId: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  references?: CoachReference[];
  suggestedActivities?: CoachSuggestedActivity[];
  createdAt?: string;
}
export interface CoachMessageList extends CursorPage<CoachMessage> {
  conversationId?: number;
  userHobbyId?: number | null;
  hobbyId?: number | null;
}
