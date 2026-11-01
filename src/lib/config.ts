/**
 * 앱 환경 설정
 * TODO: 실제 값은 app.config.ts의 extra(EAS 환경 변수)에서 읽기 — 지금은 데모용 자리 표시 값
 */
/** 공유 링크 도메인 (유니버설 링크/앱 링크 설정 필요) */
export const SHARE_BASE_URL = 'https://example.com/hobbytree';
/** 판매처·기관 페이지 기본 주소 — 실제로는 서버가 내려준 URL만 연다 */
export const EXTERNAL_FALLBACK_URL = 'https://example.com';

export const shareLink = (path = '') => `${SHARE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
