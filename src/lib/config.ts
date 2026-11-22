/**
 * 앱 환경 설정
 * - 백엔드 주소는 환경 변수 EXPO_PUBLIC_API_URL 로 바꾼다 (.env.local — Git에 올리지 않음)
 *   예) 로컬 백엔드: http://192.168.0.10:8080  (휴대폰에서는 localhost 대신 PC의 IP)
 * - 값이 없으면 배포 서버를 쓴다
 */
export const DEFAULT_API_URL = 'https://api.hobbytreeapp.com';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
export const API_PREFIX = '/api/v1';
/** 추천 생성(API-14)처럼 오래 걸릴 수 있는 요청까지 고려한 시간 제한 */
export const API_TIMEOUT_MS = 20000;

/** 공유 링크 도메인 (유니버설 링크/앱 링크 설정 필요) */
export const SHARE_BASE_URL = 'https://example.com/hobbytree';
/** 판매처·기관 페이지 기본 주소 — 실제로는 서버가 내려준 URL만 연다 */
export const EXTERNAL_FALLBACK_URL = 'https://example.com';

export const shareLink = (path = '') => `${SHARE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
