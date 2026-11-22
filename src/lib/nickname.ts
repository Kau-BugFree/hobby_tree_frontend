/**
 * 닉네임 규칙 · 중복 확인 (11/16 회의: 모달 없이 입력칸 밑에 작은 글씨로 안내)
 * - 규칙은 백엔드 API-06(PATCH /api/v1/users/me)과 같다: 앞뒤 공백 제거 후 2~12자, 한글·영문·숫자·밑줄(_)
 * - 중복 확인: 백엔드에 확인 API가 생기기 전까지는 MOCK 목록으로 흉내 낸다.
 *   TODO(API): 닉네임 중복 확인 API가 생기면 checkNicknameAvailable만 바꾸면 된다.
 * - 쓰는 곳: O-05 약관 동의(회원가입 닉네임) · M-03 프로필 관리
 */
import { useEffect, useState } from 'react';

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

/** 사용할 수 있으면 true. 지금은 MOCK, 백엔드 확인 API가 생기면 교체 */
export async function checkNicknameAvailable(nick: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 300));
  return !TAKEN_MOCK.includes(nick.trim().toLowerCase());
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
export function useNicknameCheck(value: string, current?: string): NicknameCheck {
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
        setCheck(available ? result('available', '사용 가능한 닉네임이에요', true) : result('taken', '이미 사용 중인 닉네임이에요', false));
      } catch {
        if (alive) setCheck(result('error', '확인하지 못했어요. 잠시 뒤 다시 입력해 주세요', false));
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value, current]);

  return check;
}
