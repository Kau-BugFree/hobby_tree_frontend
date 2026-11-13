import { api, newIdempotencyKey } from './client';
import type {
  CoachChatRequest,
  CoachChatResponse,
  CoachConversationList,
  CoachMessageList,
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  CreateRecommendationRequest,
  HobbyDetail,
  HobbyList,
  HobbyQuery,
  LogoutResponse,
  MyProfile,
  OnboardingOptions,
  Preferences,
  Recommendation,
  RestoreResponse,
  SavePreferencesRequest,
  SocialLoginRequest,
  SocialLoginResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './types';

/**
 * API 목록 — 화면은 fetch를 직접 쓰지 않고 여기 함수만 부른다.
 * 주소는 모두 /api/v1 뒤에 붙는다 (client.ts).
 */

/* ── 인증 ── */
/** API-01 소셜 로그인 및 회원가입 */
export const socialLogin = (body: SocialLoginRequest) => api.post<SocialLoginResponse>('/auth/social-login', { body, auth: false });
/** API-02 토큰 재발급 → client.ts의 reissueTokens()가 401일 때 자동으로 부른다 */
/** API-03 로그아웃 (Access Token 없이 Refresh Token으로 세션 식별) */
export const logout = (refreshToken: string) => api.post<LogoutResponse>('/auth/logout', { body: { refreshToken }, auth: false });
/** API-04 탈퇴 계정 복구 */
export const restoreAccount = (restoreToken: string) =>
  api.post<RestoreResponse>('/auth/restore', { body: { restoreToken, agreeToRestore: true }, auth: false });

/* ── 프로필 ── */
/** API-05 내 프로필 조회 — 이미 온보딩을 마친 계정인지 확인할 때 사용 */
export const getMe = () => api.get<MyProfile>('/users/me');
/** API-06 내 프로필 수정 — 온보딩 완료(API-13)의 '필수 프로필'(연령대)을 채운다 */
export const updateProfile = (body: UpdateProfileRequest) => api.patch<UpdateProfileResponse>('/users/me', { body });

/* ── 온보딩 ── */
/** API-10 온보딩 선택지·약관 조회 (로그인 전에도 가능) */
/** 항상 새로 받는다 (캐시 X) — 설문 저장의 optionsVersion = result.questionnaire.version */
export const getOnboardingOptions = () =>
  api.get<OnboardingOptions>('/onboarding/options', { auth: false, headers: { 'Cache-Control': 'no-cache' } });
/** API-11 취향 저장·수정 (모든 필드 완전 교체, expectedVersion으로 덮어쓰기 방지) */
export const savePreferences = (body: SavePreferencesRequest) => api.put<Preferences>('/users/me/preferences', { body });
/** API-12 내 취향 조회 (없으면 404 PREFERENCE404_1 → 최초 온보딩) */
export const getPreferences = () => api.get<Preferences>('/users/me/preferences');
/** API-13 온보딩 완료 (필수 약관 동의 포함) */
export const completeOnboarding = (body: CompleteOnboardingRequest) =>
  api.post<CompleteOnboardingResponse>('/onboarding/complete', { body });

/* ── 추천 · 취미 ── */
/**
 * API-14 맞춤 취미 추천 생성
 * idempotencyKey: 같은 동작을 다시 보낼 때(재시도)는 같은 키를 넘긴다 → 중복 생성 방지
 */
export const createRecommendation = (body: CreateRecommendationRequest, idempotencyKey = newIdempotencyKey()) =>
  api.post<Recommendation>('/recommendations', { body, headers: { 'Idempotency-Key': idempotencyKey } });
/** API-15 최근 추천 결과 (없으면 404 RECOMMENDATION404_1) */
export const getLatestRecommendation = () => api.get<Recommendation>('/recommendations/latest');
/** API-16 전체 취미 탐색·검색 (커서 페이지) */
export const listHobbies = (query: HobbyQuery = {}) =>
  api.get<HobbyList>('/hobbies', { query: { size: 20, ...query } as Record<string, string | number | null | undefined> });
/** API-17 취미 상세 */
export const getHobby = (hobbyId: number) => api.get<HobbyDetail>(`/hobbies/${hobbyId}`);

/* ── 하비 코치 ── */
/** API-34 질문 보내고 답변 받기 (conversationId 없으면 새 대화) */
export const sendCoachMessage = (body: CoachChatRequest, idempotencyKey = newIdempotencyKey()) =>
  api.post<CoachChatResponse>('/coach/chat', { body, headers: { 'Idempotency-Key': idempotencyKey } });
/** API-34 부속: 내 대화 목록 (최근 대화가 먼저) */
export const listCoachConversations = (cursor?: string | null, size = 20) =>
  api.get<CoachConversationList>('/coach/conversations', { query: { cursor, size } });
/** API-34 부속: 대화 메시지 목록 (오래된 메시지부터) */
export const getCoachMessages = (conversationId: number, cursor?: string | null, size = 50) =>
  api.get<CoachMessageList>(`/coach/conversations/${conversationId}/messages`, { query: { cursor, size } });
