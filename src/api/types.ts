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
  /** API-08에서 받은 objectKey (임의 URL 불가, 초기화는 API-09) */
  profileImageKey?: string;
}
export interface UpdateProfileResponse {
  userId?: number;
  nickname?: string;
  profileImageUrl?: string | null;
  ageRange?: AgeRange;
  updatedAt?: string;
}

/** API-05 GET /users/me */
export interface MyProfile {
  userId?: number;
  nickname?: string | null;
  profileImageUrl?: string | null;
  provider?: Provider;
  ageRange?: AgeRange | null;
  memberStatus?: MemberStatus;
  onboardingCompleted?: boolean;
  treeCount?: number;
  maxTreeCount?: number;
  notificationSettings?: { notificationFrequency?: 'NONE' | 'WEEKLY' | 'ACTIVITY_DAYS' } | null;
  createdAt?: string;
  location?: { regionId: number; name: string; fullName?: string; level?: string; parentRegionId?: number | null; source?: 'MANUAL' | 'DEVICE'; updatedAt?: string } | null;
  locationConsent?: { consentType?: string; version?: string; agreed?: boolean; recordedAt?: string | null } | null;
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

/* ═══════════ 나머지 API (API_3.md 기준) ═══════════ */

/* ───────── 사용자 (API-07~09) ───────── */
/** API-07 DELETE /users/me */
export interface WithdrawResponse {
  userId?: number;
  memberStatus?: 'WITHDRAWN';
  withdrawnAt?: string;
  /** 이 시각까지 API-04로 복구 가능 (탈퇴 + 30일) */
  restorableUntil?: string;
}
/** API-08 POST /users/me/profile-image/upload-url */
export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';
export interface UploadUrlRequest {
  /** 1~100자 (표시용) */
  fileName: string;
  contentType: ImageContentType;
  /** 1~5,242,880 byte */
  fileSize: number;
}
export interface UploadUrlResponse {
  uploadUrl: string;
  /** API-06 profileImageKey로 보낸다 */
  objectKey: string;
  method?: 'PUT';
  expiresIn?: number;
  requiredHeaders?: Record<string, string>;
  maxFileSize?: number;
}
/** API-09 DELETE /users/me/profile-image */
export interface ResetProfileImageResponse {
  userId?: number;
  profileImageUrl?: string | null;
  updatedAt?: string;
}

/* ───────── 취미 나무 (API-18~22) ───────── */
export type TreeStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';
export interface UserHobbySummary {
  userHobbyId: number;
  hobbyId: number;
  hobbyName: string;
  thumbnailUrl?: string | null;
  treeStatus: TreeStatus;
  currentStageNumber: number;
  currentStageName?: string;
  distinctCompletedActivityCount?: number;
  requiredCountForNextStage?: number | null;
  remainingCountForNextStage?: number | null;
  plantedAt?: string;
}
/** API-18 GET /user-hobbies */
export interface UserHobbyList extends CursorPage<UserHobbySummary> {
  /** ACTIVE + PAUSED */
  occupiedTreeCount?: number;
  maxTreeCount?: number;
}
/** API-19 POST /user-hobbies */
export interface PlantRequest {
  hobbyId: number;
  /** 추천에서 심을 때만 */
  recommendationId?: number | null;
}
export interface PlantResponse {
  userHobbyId: number;
  hobbyId: number;
  hobbyName?: string;
  treeStatus?: TreeStatus;
  currentStageNumber?: number;
  distinctCompletedActivityCount?: number;
  plantedAt?: string;
}
/** API-20 GET /user-hobbies/{id} */
export interface UserHobbyDetail extends UserHobbySummary {
  totalStages?: number;
  isMaxStage?: boolean;
  currentStageCompletedCount?: number;
  currentStageRequiredCount?: number;
  /** 진행 중인 활동이 있으면 이어하기 */
  currentActivityRecord?: { recordId: number; activityId: number; title?: string; progressPercent?: number } | null;
  lastActivityAt?: string | null;
}
/** API-21 PATCH /user-hobbies/{id}/status */
export interface TreeStatusResponse {
  userHobbyId: number;
  treeStatus: TreeStatus;
  currentStageNumber?: number;
  pausedAt?: string | null;
  endedAt?: string | null;
  updatedAt?: string;
}
/** API-22 GET /user-hobbies/{id}/roadmap */
export type StageState = 'COMPLETED' | 'CURRENT' | 'LOCKED';
export interface RoadmapStage {
  stageId: number;
  stageNumber: number;
  name: string;
  state: StageState;
  unlockAtDistinctCompletedCount?: number;
  representativeActivityIds?: number[];
}
export interface Roadmap {
  userHobbyId: number;
  currentStageNumber?: number;
  distinctCompletedActivityCount?: number;
  growthRule?: { distinctActivitiesPerStage?: number };
  stages?: RoadmapStage[];
}

/* ───────── 활동 (API-23~33) ───────── */
/** API-23 GET /hobbies/{hobbyId}/stages */
export interface HobbyStage {
  stageId: number;
  stageNumber: number;
  name: string;
  description?: string;
  activityCount?: number;
  unlockAtDistinctCompletedCount?: number;
}
export interface HobbyStageList {
  hobbyId: number;
  hobbyName?: string;
  stages?: HobbyStage[];
}
export interface ActivitySummary {
  activityId: number;
  title: string;
  thumbnailUrl?: string | null;
  durationMinutes?: number | null;
  estimatedCost?: number | null;
  difficulty?: Difficulty | null;
  indoorOutdoor?: IndoorOutdoor | null;
  isSaved?: boolean;
}
/** API-24 GET /hobby-stages/{stageId}/activities */
export interface StageActivityList extends CursorPage<ActivitySummary> {
  stageId?: number;
  hobbyId?: number;
  stageNumber?: number;
}
export interface ActivityMaterial {
  materialId?: number;
  name: string;
  quantity?: string | null;
  isRequired?: boolean;
  acquisitionType?: string;
}
export interface ActivityStep {
  stepId: number;
  stepNumber: number;
  title: string;
  description?: string;
  isRequired?: boolean;
  imageUrl?: string | null;
}
/** API-25 GET /activities/{activityId} */
export interface ActivityDetail extends ActivitySummary {
  hobbyId?: number;
  stageId?: number;
  stageNumber?: number;
  description?: string;
  contentVersion?: number;
  materials?: ActivityMaterial[];
  steps?: ActivityStep[];
  cautions?: string[];
  contentUpdatedAt?: string;
}
/** API-26~30 활동 기록 */
export type RecordStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'NOT_DONE';
export interface ActivityRecordStart {
  recordId: number;
  userHobbyId: number;
  activityId: number;
  status: RecordStatus;
  contentVersion?: number;
  completedStepIds?: number[];
  progressPercent?: number;
  version: number;
  startedAt?: string;
  /** 같은 활동을 이미 진행 중이면 true (이어하기) */
  reused?: boolean;
}
export interface RecordFeedback {
  /** 1~5 */
  satisfactionScore: number;
  perceivedDifficulty: 'EASY' | 'APPROPRIATE' | 'HARD';
  /** 최대 1000자 */
  memo?: string;
}
export interface ActivityRecordDetail extends ActivityRecordStart {
  title?: string;
  treeStatus?: TreeStatus;
  steps?: ActivityStep[];
  elapsedSeconds?: number;
  canUpdate?: boolean;
  finishedAt?: string | null;
  feedback?: RecordFeedback | null;
}
/** API-28 PATCH /activity-records/{id}/progress */
export interface SaveProgressRequest {
  completedStepIds: number[];
  elapsedSeconds?: number;
  expectedVersion: number;
}
export interface SaveProgressResponse {
  recordId: number;
  status: RecordStatus;
  completedStepIds: number[];
  progressPercent?: number;
  elapsedSeconds?: number;
  version: number;
  updatedAt?: string;
}
/** API-29 PATCH /activity-records/{id}/complete */
export type CompleteRecordRequest =
  | { status: 'COMPLETED' | 'PARTIAL'; expectedVersion: number; feedback: RecordFeedback }
  | { status: 'NOT_DONE'; expectedVersion: number; notDoneReason: string };
export interface GrowthResult {
  growthApplied?: boolean;
  distinctCompletedActivityCount?: number;
  previousStageNumber?: number;
  currentStageNumber?: number;
  stageChanged?: boolean;
  isMaxStage?: boolean;
}
export interface CompleteRecordResponse {
  recordId: number;
  userHobbyId?: number;
  activityId?: number;
  status: RecordStatus;
  progressPercent?: number;
  version?: number;
  finishedAt?: string;
  feedback?: RecordFeedback | null;
  growth?: GrowthResult;
}
/** API-30 GET /user-hobbies/{id}/activity-records */
export interface ActivityRecordItem {
  recordId: number;
  activityId: number;
  title?: string;
  status: RecordStatus;
  progressPercent?: number;
  startedAt?: string;
  finishedAt?: string | null;
  satisfactionScore?: number | null;
  perceivedDifficulty?: RecordFeedback['perceivedDifficulty'] | null;
  growthApplied?: boolean;
}
export interface ActivityRecordList extends CursorPage<ActivityRecordItem> {
  userHobbyId?: number;
}
/** API-31·32 저장 / 저장 취소 */
export interface SaveActivityResponse {
  activityId: number;
  isSaved: boolean;
  savedAt?: string;
}
/** API-33 GET /users/me/saved-activities */
export interface SavedActivity extends ActivitySummary {
  hobbyId?: number;
  hobbyName?: string;
  stageId?: number;
  stageNumber?: number;
  savedAt?: string;
  /** 비공개로 바뀐 활동이면 false (저장 취소만 가능) */
  isAvailable?: boolean;
}
export type SavedActivityList = CursorPage<SavedActivity>;

/* ───────── 함께 · 클래스 (API-35~40) ───────── */
export type ExperienceType = 'CLASS' | 'MEETUP';
export type ExperienceStatus = 'COMING_SOON' | 'OPEN' | 'CLOSED';
export interface ExperienceSession {
  sessionId: number;
  startsAt: string;
  endsAt?: string;
  durationMinutes?: number;
  status?: ExperienceStatus | string;
  remainingSeats?: number | null;
}
export interface ExperienceSummary {
  experienceId: number;
  type: ExperienceType;
  title: string;
  hobbyId?: number;
  hobbyName?: string;
  thumbnailUrl?: string | null;
  region?: { regionId: number; name: string } | null;
  provider?: { providerId: number; name: string } | null;
  price?: number | null;
  currency?: string;
  status: ExperienceStatus;
  nextSession?: ExperienceSession | null;
  providerUpdatedAt?: string;
}
/** API-35 GET /experiences 쿼리 */
export interface ExperienceQuery {
  hobbyId?: number;
  regionId?: number;
  type?: ExperienceType;
  status?: ExperienceStatus;
  /** YYYY-MM-DD */
  fromDate?: string;
  toDate?: string;
  sort?: 'STARTS_AT' | 'PRICE_ASC';
  cursor?: string | null;
  size?: number;
}
export type ExperienceList = CursorPage<ExperienceSummary>;
/** API-36 GET /experiences/{id} */
export interface ExperienceDetail extends ExperienceSummary {
  description?: string;
  address?: string;
  venueName?: string;
  materials?: string[];
  sessions?: ExperienceSession[];
  bookingUrl?: string;
  cancellationPolicyUrl?: string;
  activityRecognition?: { supported?: boolean; activityId?: number | null; verificationRequired?: boolean } | null;
  isOpenNotificationSubscribed?: boolean;
}
/** API-37 POST /experiences/{id}/reservations (Idempotency-Key) */
export interface ReservationRequest {
  sessionId: number;
  userHobbyId?: number | null;
  /** 1~100자 — 입력만으로 예약 확정되지 않음 */
  externalReservationId?: string | null;
}
export type ReservationStatus = 'REDIRECTED' | 'PENDING_VERIFICATION' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export interface ReservationResponse {
  reservationId: number;
  experienceId: number;
  sessionId: number;
  userHobbyId?: number | null;
  status: ReservationStatus;
  verificationStatus?: string;
  externalReservationId?: string | null;
  /** 서버가 허용한 외부 예약 URL — 이 주소로만 이동 */
  bookingUrl?: string;
  createdAt?: string;
}
/** API-38 GET /users/me/experience-reservations */
export interface MyReservation {
  reservationId: number;
  experienceId: number;
  title?: string;
  sessionId?: number;
  startsAt?: string;
  userHobbyId?: number | null;
  status: ReservationStatus;
  verificationStatus?: string;
  attended?: boolean;
  bookingUrl?: string;
  cancellationPolicyUrl?: string;
  createdAt?: string;
}
export type MyReservationList = CursorPage<MyReservation>;
/** API-39 POST /experience-reservations/{id}/attendance (Idempotency-Key) */
export interface AttendanceRequest {
  userHobbyId: number;
  /** 제공자가 발급한 참여 증명 — 앱이 만들어 낼 수 없음 */
  attendanceToken: string;
}
export interface AttendanceResponse {
  reservationId: number;
  attendanceId?: number;
  attended: boolean;
  verifiedAt?: string;
  recordId?: number;
  activityId?: number;
  userHobbyId?: number;
  growth?: GrowthResult;
}
/** API-40 · 47 알림 신청 */
export interface SubscriptionResponse {
  experienceId?: number;
  subscriptionType?: 'CHAT_LAUNCH';
  isSubscribed: boolean;
  channel?: 'IN_APP';
  subscribedAt?: string;
}

/* ───────── 위치 (API-41~43) ───────── */
export type RegionLevel = 'SIGUNGU' | 'DONG';
export interface Region {
  regionId: number;
  name: string;
  fullName?: string;
  level?: RegionLevel;
  parentRegionId?: number | null;
}
/** API-41 GET /regions/search */
export interface RegionQuery {
  /** 공백 제거 후 1~50자 */
  keyword: string;
  level?: RegionLevel;
  parentRegionId?: number;
  cursor?: string | null;
  size?: number;
}
export type RegionList = CursorPage<Region>;
/** API-42 PUT /users/me/location */
export type SetLocationRequest =
  | { source: 'MANUAL'; regionId: number }
  | { source: 'DEVICE'; latitude: number; longitude: number; consentVersion: string };
export interface SetLocationResponse {
  userId?: number;
  location?: Region & { source?: 'MANUAL' | 'DEVICE'; updatedAt?: string };
}
/** API-43 POST /users/me/location-consents */
export interface LocationConsentRequest {
  consentType: 'NEARBY_EXPERIENCES';
  /** API-10 locationConsentNotice.version */
  version: string;
  agreed: boolean;
}
export interface LocationConsentResponse {
  consentId?: number;
  consentType?: string;
  version?: string;
  agreed: boolean;
  recordedAt?: string;
  /** 철회로 기기 위치 기반 지역이 지워졌으면 true */
  locationCleared?: boolean;
}

/* ───────── 알림 (API-44~47) ───────── */
export type NotificationType = 'ACTIVITY_REMINDER' | 'TREE_GROWTH' | 'EXPERIENCE_OPEN' | 'ANNOUNCEMENT' | 'CHAT_LAUNCH';
export interface AppNotification {
  notificationId: number;
  type: NotificationType | string;
  title: string;
  body?: string;
  target?: { type?: string; id?: number | null } | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string;
}
/** API-44 GET /notifications */
export interface NotificationList extends CursorPage<AppNotification> {
  unreadCount?: number;
}
/** API-45 PATCH /notifications/{id}/read */
export interface ReadNotificationResponse {
  notificationId: number;
  isRead: boolean;
  readAt?: string;
  unreadCount?: number;
}
/** API-46 PATCH /users/me/notification-settings */
export type NotificationFrequency = 'NONE' | 'WEEKLY' | 'ACTIVITY_DAYS';
export interface NotificationSettingsResponse {
  userId?: number;
  notificationSettings?: { notificationFrequency?: NotificationFrequency };
  updatedAt?: string;
}

/* ───────── 운영 · 콘텐츠 (API-48~49) ───────── */
/** API-48 POST /reports */
export type ReportReason = 'WRONG_INFORMATION' | 'BROKEN_LINK' | 'INAPPROPRIATE' | 'OTHER';
export interface ReportRequest {
  targetType: 'ACTIVITY' | 'SPONSORED_CONTENT';
  targetId: number;
  reason: ReportReason;
  /** 공백 제거 후 10~1000자 */
  description: string;
}
export interface ReportResponse {
  reportId: number;
  targetType?: string;
  targetId?: number;
  status?: 'RECEIVED';
  createdAt?: string;
}
/** API-49 GET /activities/{id}/sponsored-content */
export interface SponsoredContent {
  sponsoredContentId: number;
  title: string;
  description?: string;
  sponsorName?: string;
  thumbnailUrl?: string | null;
  contentType?: string;
  isSponsored?: boolean;
  /** 예: '광고·제휴' — 화면에 반드시 표시 */
  disclosureLabel?: string;
  externalUrl?: string;
  sortOrder?: number;
}
export interface SponsoredContentList {
  activityId?: number;
  items?: SponsoredContent[];
}
