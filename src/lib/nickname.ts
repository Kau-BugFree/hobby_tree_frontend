/**
 * 닉네임 규칙 · 중복 확인 (11/16 회의: 모달 없이 입력칸 밑에 작은 글씨로 안내)
 * - 규칙은 백엔드 API-06(PATCH /api/v1/users/me)과 같다: 앞뒤 공백 제거 후 2~12자, 한글·영문·숫자·밑줄(_)
 * - 중복 확인: 백엔드는 닉네임 중복을 막는다(이슈 #200, DB UNIQUE). 하지만 미리 확인하는 API는 없고,
 *   저장(PATCH /api/v1/users/me) 때 겹치면 409 USER409_2 "이미 사용 중인 닉네임"을 돌려준다.
 *   → 입력하는 동안은 MOCK 목록 + 서버가 거절한 닉네임으로 확인하고,
 *     저장에서 USER409_2가 오면 markTaken()으로 입력칸 밑에 빨간 글씨를 띄운다.
 *   TODO(API): 확인 API가 생기면 checkNicknameAvailable만 바꾸면 된다.
 * - 쓰는 곳: O-05 약관 동의(회원가입 닉네임) · M-03 프로필 관리
 */
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../api/client';
import { NICKNAME_MAX, NICKNAME_RULE } from '../api/mappers';

export const NICKNAME_GUIDE = '2~12자 · 한글·영문·숫자·밑줄(_)만 쓸 수 있어요';

/** 규칙에 어긋나면 이유를, 맞으면 null */
export function nicknameRuleError(raw: string): string | null {
  const nick = raw.trim();
  if (!nick) return '닉네임을 입력해 주세요';
  if (/\s/.test(nick)) return '띄어쓰기는 쓸 수 없어요';
  if (nick.length < 2) return '2자 이상 입력해 주세요';
  if (nick.length > NICKNAME_MAX) return `${NICKNAME_MAX}자까지 쓸 수 있어요`;
  if (/[ㄱ-ㅎㅏ-ㅣ]/.test(nick)) return '자음·모음만 따로 쓸 수 없어요';
  if (!NICKNAME_RULE.test(nick)) return '특수문자는 쓸 수 없어요 (밑줄 _ 만 가능)';
  return null;
}

/** MOCK: 이미 다른 사람이 쓰는 닉네임 (대소문자 구분 없음) */
const TAKEN_MOCK = ['하비트리', 'hobbytree', '관리자', 'admin', '즐거운수달'];

/** 서버가 저장을 거절한(USER409_2) 닉네임 — 앱이 켜져 있는 동안 기억한다 (서버 비교는 대소문자 구분) */
const takenByServer = new Set<string>();

/** API-06 저장이 '이미 사용 중인 닉네임'(409 USER409_2)으로 실패했는지 */
export function isNicknameTakenError(e: unknown): boolean {
  return e instanceof ApiError && e.code === 'USER409_2';
}

/** 서버가 거절한 닉네임으로 기억해 둔다 → 같은 닉네임을 다시 입력하면 바로 빨간 글씨 */
export function markNicknameTaken(nick: string) {
  takenByServer.add(nick.trim());
}

export const NICKNAME_TAKEN_MESSAGE = '이미 사용 중인 닉네임이에요';

/** 사용할 수 있으면 true. 지금은 MOCK + 서버가 거절한 닉네임, 백엔드 확인 API가 생기면 교체 */
export async function checkNicknameAvailable(nick: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 300));
  const trimmed = nick.trim();
  if (takenByServer.has(trimmed)) return false;
  return !TAKEN_MOCK.includes(trimmed.toLowerCase());
}

export type NicknameStatus = 'empty' | 'same' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

export interface NicknameCheck {
  status: NicknameStatus;
  /** 입력칸 밑에 띄울 안내 (없으면 규칙 안내를 띄운다) */
  message: string | null;
  /** 저장해도 되는 상태인지 */
  ok: boolean;
  /** 빨간 글씨로 보여 줄 상태인지 */
  bad: boolean;
}

export interface NicknameCheckHandle extends NicknameCheck {
  /** 저장에서 USER409_2를 받았을 때 — 지금 입력한 닉네임을 '이미 사용 중'으로 표시 */
  markTaken: () => void;
}

const result = (status: NicknameStatus, message: string | null, ok: boolean): NicknameCheck => ({
  status,
  message,
  ok,
  bad: status === 'invalid' || status === 'taken' || status === 'error',
});

/**
 * 입력이 멈춘 뒤(0.4초) 규칙 → 중복 순서로 확인한다.
 * current: 지금 쓰고 있는 닉네임(프로필 관리). 같으면 다시 확인하지 않는다. 회원가입처럼 없으면 생략.
 */
export function useNicknameCheck(value: string, current?: string): NicknameCheckHandle {
  const [check, setCheck] = useState<NicknameCheck>(() => result(current ? 'same' : 'empty', null, !!current));

  useEffect(() => {
    const nick = value.trim();
    if (current && nick === current.trim()) {
      setCheck(result('same', null, true));
      return;
    }
    if (!nick) {
      setCheck(result('empty', null, false));
      return;
    }
    let alive = true;
    setCheck((c) => ({ ...c, ok: false }));
    const t = setTimeout(async () => {
      const ruleError = nicknameRuleError(nick);
      if (ruleError) {
        if (alive) setCheck(result('invalid', ruleError, false));
        return;
      }
      setCheck(result('checking', '사용할 수 있는지 확인하고 있어요…', false));
      try {
        const available = await checkNicknameAvailable(nick);
        if (!alive) return;
        setCheck(available ? result('available', '사용 가능한 닉네임이에요', true) : result('taken', NICKNAME_TAKEN_MESSAGE, false));
      } catch {
        if (alive) setCheck(result('error', '확인하지 못했어요. 잠시 뒤 다시 입력해 주세요', false));
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value, current]);

  const markTaken = useCallback(() => {
    markNicknameTaken(value);
    setCheck(result('taken', NICKNAME_TAKEN_MESSAGE, false));
  }, [value]);

  return { ...check, markTaken };
}
