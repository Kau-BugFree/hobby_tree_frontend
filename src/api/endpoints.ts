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
  // ── 나머지 API (API_3.md) ──
  ActivityDetail,
  ActivityRecordDetail,
  ActivityRecordList,
  ActivityRecordStart,
  AttendanceRequest,
  AttendanceResponse,
  CompleteRecordRequest,
  CompleteRecordResponse,
  ExperienceDetail,
  ExperienceList,
  ExperienceQuery,
  HobbyStageList,
  LocationConsentRequest,
  LocationConsentResponse,
  MyReservationList,
  NotificationFrequency,
  NotificationList,
  NotificationSettingsResponse,
  NotificationType,
  PlantRequest,
  PlantResponse,
  ReadNotificationResponse,
  RecordStatus,
  RegionList,
  RegionQuery,
  ReportRequest,
  ReportResponse,
  ReservationRequest,
  ReservationResponse,
  ResetProfileImageResponse,
  Roadmap,
  SaveActivityResponse,
  SavedActivityList,
  SaveProgressRequest,
  SaveProgressResponse,
  SetLocationRequest,
  SetLocationResponse,
  SponsoredContentList,
  StageActivityList,
  SubscriptionResponse,
  TreeStatus,
  TreeStatusResponse,
  UploadUrlRequest,
  UploadUrlResponse,
  UserHobbyDetail,
  UserHobbyList,
  WithdrawResponse,
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

/* ═══════════ 나머지 API (API_3.md 기준) ═══════════ */
type Q = Record<string, string | number | boolean | null | undefined>;
const page = (cursor?: string | null, size = 20) => ({ cursor, size });

/* ── 사용자 ── */
/** API-07 회원 탈퇴 (30일 안에는 API-04로 복구) */
export const withdraw = () => api.delete<WithdrawResponse>('/users/me');
/** API-08 프로필 이미지 업로드 URL 발급 → 받은 uploadUrl에 PUT → API-06 profileImageKey */
export const issueProfileImageUploadUrl = (body: UploadUrlRequest) =>
  api.post<UploadUrlResponse>('/users/me/profile-image/upload-url', { body });
/** API-09 프로필 이미지 초기화 */
export const resetProfileImage = () => api.delete<ResetProfileImageResponse>('/users/me/profile-image');

/* ── 취미 나무 ── */
/** API-18 내 취미 나무 목록 */
export const listMyTrees = (status?: TreeStatus, cursor?: string | null, size = 20) =>
  api.get<UserHobbyList>('/user-hobbies', { query: { status, ...page(cursor, size) } });
/** API-19 취미 나무 심기 (추천에서 심으면 recommendationId 함께) */
export const plantTree = (body: PlantRequest) => api.post<PlantResponse>('/user-hobbies', { body });
/** API-20 취미 나무 상세 및 성장 현황 */
export const getTree = (userHobbyId: number) => api.get<UserHobbyDetail>(`/user-hobbies/${userHobbyId}`);
/** API-21 일시정지·재개·종료 */
export const changeTreeStatus = (userHobbyId: number, status: TreeStatus) =>
  api.patch<TreeStatusResponse>(`/user-hobbies/${userHobbyId}/status`, { body: { status } });
/** API-22 나무 성장 로드맵 */
export const getRoadmap = (userHobbyId: number) => api.get<Roadmap>(`/user-hobbies/${userHobbyId}/roadmap`);

/* ── 활동 ── */
/** API-23 취미별 단계 목록 */
export const listStages = (hobbyId: number) => api.get<HobbyStageList>(`/hobbies/${hobbyId}/stages`);
/** API-24 단계별 활동 목록 */
export const listStageActivities = (stageId: number, cursor?: string | null, size = 20) =>
  api.get<StageActivityList>(`/hobby-stages/${stageId}/activities`, { query: page(cursor, size) });
/** API-25 활동 상세 (준비물·단계) */
export const getActivity = (activityId: number) => api.get<ActivityDetail>(`/activities/${activityId}`);
/** API-26 활동 시작 (같은 활동 진행 중이면 기존 기록 · reused=true) — ⚠ 서버 미배포 */
export const startActivity = (userHobbyId: number, activityId: number) =>
  api.post<ActivityRecordStart>(`/user-hobbies/${userHobbyId}/activity-records`, { body: { activityId } });
/** API-27 활동 진행 상황 — ⚠ 서버 미배포 */
export const getActivityRecord = (recordId: number) => api.get<ActivityRecordDetail>(`/activity-records/${recordId}`);
/** API-28 단계 진행 저장 (완료 목록 전체 교체, expectedVersion) — ⚠ 서버 미배포 */
export const saveActivityProgress = (recordId: number, body: SaveProgressRequest) =>
  api.patch<SaveProgressResponse>(`/activity-records/${recordId}/progress`, { body });
/** API-29 활동 완료 및 피드백 — ⚠ 서버 미배포 */
export const completeActivityRecord = (recordId: number, body: CompleteRecordRequest) =>
  api.patch<CompleteRecordResponse>(`/activity-records/${recordId}/complete`, { body });
/** API-30 나무별 활동 기록 — ⚠ 서버 미배포 */
export const listActivityRecords = (userHobbyId: number, status?: RecordStatus, cursor?: string | null, size = 20) =>
  api.get<ActivityRecordList>(`/user-hobbies/${userHobbyId}/activity-records`, { query: { status, ...page(cursor, size) } });
/** API-31 활동 저장 (이미 저장했어도 성공) */
export const saveActivity = (activityId: number) => api.put<SaveActivityResponse>(`/activities/${activityId}/save`);
/** API-32 활동 저장 취소 */
export const unsaveActivity = (activityId: number) => api.delete<SaveActivityResponse>(`/activities/${activityId}/save`);
/** API-33 저장한 활동 목록 — ⚠ 서버 미배포 */
export const listSavedActivities = (hobbyId?: number, cursor?: string | null, size = 20) =>
  api.get<SavedActivityList>('/users/me/saved-activities', { query: { hobbyId, ...page(cursor, size) } });

/* ── 함께 · 클래스 ── */
/** API-35 클래스·모임 목록 */
export const listExperiences = (query: ExperienceQuery = {}) =>
  api.get<ExperienceList>('/experiences', { query: { size: 20, ...query } as Q });
/** API-36 클래스·모임 상세 */
export const getExperience = (experienceId: number) => api.get<ExperienceDetail>(`/experiences/${experienceId}`);
/** API-37 외부 예약 정보 기록 (Idempotency-Key) → 응답 bookingUrl로만 이동 */
export const createReservation = (experienceId: number, body: ReservationRequest, idempotencyKey = newIdempotencyKey()) =>
  api.post<ReservationResponse>(`/experiences/${experienceId}/reservations`, { body, headers: { 'Idempotency-Key': idempotencyKey } });
/** API-38 내 예약 목록 */
export const listMyReservations = (status?: string, cursor?: string | null, size = 20) =>
  api.get<MyReservationList>('/users/me/experience-reservations', { query: { status, ...page(cursor, size) } });
/** API-39 참여 확인 및 활동 인정 (Idempotency-Key · 제공자 참여 토큰 필요) */
export const confirmAttendance = (reservationId: number, body: AttendanceRequest, idempotencyKey = newIdempotencyKey()) =>
  api.post<AttendanceResponse>(`/experience-reservations/${reservationId}/attendance`, { body, headers: { 'Idempotency-Key': idempotencyKey } });
/** API-40 클래스 오픈 알림 신청 (COMING_SOON일 때) */
export const subscribeClassOpen = (experienceId: number) =>
  api.post<SubscriptionResponse>(`/experiences/${experienceId}/open-notification`);

/* ── 위치 ── */
/** API-41 지역 검색 */
export const searchRegions = (query: RegionQuery) =>
  api.get<RegionList>('/regions/search', { query: { size: 20, ...query } as Q });
/** API-42 활동 지역 설정 (MANUAL: regionId · DEVICE: 위도·경도 + 동의 버전) */
export const setLocation = (body: SetLocationRequest) => api.put<SetLocationResponse>('/users/me/location', { body });
/** API-43 위치 동의·철회 기록 */
export const recordLocationConsent = (body: LocationConsentRequest) =>
  api.post<LocationConsentResponse>('/users/me/location-consents', { body });

/* ── 알림 ── */
/** API-44 알림 목록 */
export const listNotifications = (opts: { isRead?: boolean; type?: NotificationType; cursor?: string | null; size?: number } = {}) =>
  api.get<NotificationList>('/notifications', { query: { size: 20, ...opts } as Q });
/** API-45 알림 읽음 처리 */
export const markNotificationRead = (notificationId: number) =>
  api.patch<ReadNotificationResponse>(`/notifications/${notificationId}/read`);
/** API-46 알림 설정 변경 */
export const updateNotificationSettings = (notificationFrequency: NotificationFrequency) =>
  api.patch<NotificationSettingsResponse>('/users/me/notification-settings', { body: { notificationFrequency } });
/** API-47 채팅 출시 알림 신청 */
export const subscribeChatLaunch = () => api.post<SubscriptionResponse>('/notification-subscriptions/chat-launch');

/* ── 운영 · 콘텐츠 ── */
/** API-48 활동·콘텐츠 문제 신고 */
export const reportContent = (body: ReportRequest) => api.post<ReportResponse>('/reports', { body });
/** API-49 활동 관련 제휴 콘텐츠 (광고·제휴 표시 필수) */
export const getSponsoredContent = (activityId: number) =>
  api.get<SponsoredContentList>(`/activities/${activityId}/sponsored-content`);

/* ── 네이버 지역 업체 (49개 목록 밖 신규 API) ── */
/** 지역명 + 취미로 근처 업체 검색 (최대 5개) */
export const searchLocalBusinesses = (region: string, hobby: import('./types').LocalHobbyCode) =>
  api.get<import('./types').LocalBusinessList>('/local-businesses', { query: { region, hobby } });
/** 고른 업체 → experienceId·sessionId 발급 (예약 기록은 API-37로) */
export const selectLocalBusiness = (body: import('./types').LocalBusinessSelectRequest) =>
  api.post<import('./types').LocalBusinessSelectResponse>('/local-businesses/select', { body });
