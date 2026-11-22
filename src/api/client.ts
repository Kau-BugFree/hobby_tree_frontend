import { API_BASE_URL, API_PREFIX, API_TIMEOUT_MS } from '../lib/config';
import { clearTokens, getAccessToken, getRefreshToken, saveMemberStatus, saveTokens } from './tokens';
import type { ApiEnvelope, ReissueResponse } from './types';

/**
 * 공통 API Client — 모든 요청은 여기를 거친다.
 * 1) 주소: API_BASE_URL(환경 변수) + /api/v1 + path
 * 2) 인증: 'Authorization: Bearer {accessToken}' 자동 첨부
 * 3) 응답: { isSuccess, code, message, result } 중 result만 돌려주고, 실패면 ApiError를 던진다
 *    (성공·실패 판단은 HTTP Status · isSuccess · code 기준 — 명세 작성 규칙)
 * 4) Access Token 만료(401) → API-02로 재발급 후 원래 요청을 한 번 다시 보낸다
 *    재발급은 동시에 여러 번 부르지 않도록 하나로 묶는다 (명세 비고)
 * 5) 재발급도 실패하면 토큰을 지우고 onAuthExpired 구독자(로그인 화면 이동)에게 알린다
 */

export class ApiError extends Error {
  constructor(
    /** HTTP 상태 (0 = 네트워크 오류·시간 초과) */
    readonly status: number,
    /** 서버 오류 코드 (예: AUTH401_2) 또는 앱 내부 코드 (NETWORK, TIMEOUT, PARSE) */
    readonly code: string,
    message: string,
    /** 실패 응답의 부가 정보 (예: 탈퇴 계정 복구 안내) */
    readonly result: unknown = null,
    /** 429일 때 다시 시도까지 남은 초 */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  body?: unknown;
  query?: Query;
  /** false면 토큰 없이 보낸다 (로그인·재발급·온보딩 선택지 등) */
  auth?: boolean;
  /** 추가 헤더 (예: Idempotency-Key) */
  headers?: Record<string, string>;
}

/* ───── 인증 만료 알림 (세션 → 로그인 화면) ───── */
type Listener = () => void;
const expiredListeners = new Set<Listener>();
export function onAuthExpired(fn: Listener) {
  expiredListeners.add(fn);
  return () => {
    expiredListeners.delete(fn);
  };
}

function buildUrl(path: string, query?: Query) {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return `${API_BASE_URL}${API_PREFIX}${path}${qs ? `?${qs}` : ''}`;
}

async function send<T>(method: string, path: string, opts: RequestOptions, token: string | null): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = (e as { name?: string })?.name === 'AbortError';
    throw new ApiError(0, aborted ? 'TIMEOUT' : 'NETWORK', aborted ? '서버 응답이 늦어요. 잠시 후 다시 시도해 주세요.' : '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json: Partial<ApiEnvelope<T>> | null = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new ApiError(res.status, 'PARSE', '서버 응답을 읽을 수 없어요.');
    }
  }

  if (res.ok && json?.isSuccess !== false) return (json?.result ?? null) as T;

  if (__DEV__) console.warn(`[API] ${method} ${path} → ${res.status} ${json?.code ?? ''} ${json?.message ?? ''}`);
  const retryAfter = Number(res.headers.get('Retry-After')) || undefined;
  throw new ApiError(
    res.status,
    json?.code ?? `HTTP_${res.status}`,
    json?.message ?? '요청을 처리하지 못했어요.',
    json?.result ?? null,
    retryAfter,
  );
}

/* ───── 토큰 재발급 (API-02) — 동시에 하나만 ───── */
let reissuing: Promise<boolean> | null = null;

export function reissueTokens(): Promise<boolean> {
  if (!reissuing) {
    reissuing = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      try {
        const t = await send<ReissueResponse>('POST', '/auth/reissue', { body: { refreshToken } }, null);
        if (!t?.accessToken || !t.refreshToken) return false;
        await saveTokens(t);
        if (t.memberStatus) await saveMemberStatus(t.memberStatus);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      reissuing = null;
    });
  }
  return reissuing;
}

async function expireSession() {
  await clearTokens();
  expiredListeners.forEach((fn) => fn());
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const auth = opts.auth !== false;
  const token = auth ? await getAccessToken() : null;
  try {
    return await send<T>(method, path, opts, token);
  } catch (e) {
    // Access Token 만료·폐기 → 한 번만 재발급 후 재시도
    if (auth && e instanceof ApiError && e.status === 401) {
      const ok = await reissueTokens();
      if (__DEV__) console.log(`[API] ${method} ${path} 401 → 토큰 재발급 ${ok ? '성공, 다시 요청' : '실패 → 로그아웃(로그인 화면으로)'}`);
      if (ok) return send<T>(method, path, opts, await getAccessToken());
      await expireSession();
    }
    throw e;
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>('PUT', path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>('PATCH', path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};

/** 화면에 보여 줄 오류 문구 (서버 message가 있으면 그대로, 없으면 상황별 기본 문구) */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return `요청이 많아요. ${e.retryAfter ? `${e.retryAfter}초 뒤에` : '잠시 후'} 다시 시도해 주세요.`;
    if (e.status >= 500) return '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
    return e.message;
  }
  return '알 수 없는 오류가 생겼어요.';
}

/** 멱등 키(Idempotency-Key)용 UUID v4 — 같은 동작을 다시 보낼 때는 같은 키를 쓴다 (API-14·34) */
export function newIdempotencyKey(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
