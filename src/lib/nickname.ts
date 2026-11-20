/**
 * 닉네임 규칙 · 중복 확인 (11/16 회의: 모달 없이 입력칸 밑에 작은 글씨로 안내)
 * - 규칙은 백엔드 API-06(PATCH /api/v1/users/me)과 같다: 앞뒤 공백 제거 후 2~12자, 한글·영문·숫자·밑줄(_)
 * - 중복 확인: 백엔드에 확인 API가 생기기 전까지는 MOCK 목록으로 흉내 낸다.
 *   TODO(API): GET /api/v1/users/nickname/check?nickname= 같은 확인 API가 생기면 checkNicknameAvailable만 바꾸면 된다.
 */
import { useEffect, useState } from 'react';

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 12;
export const NICKNAME_RULE = /^[가-힣A-Za-z0-9_]{2,12}$/;
export const NICKNAME_GUIDE = '2~12자 · 한글·영문·숫자·밑줄(_)만 쓸 수 있어요';

/** 규칙에 어긋나면 이유를, 맞으면 null */
export function nicknameRuleError(raw: string): string | null {
  const nick = raw.trim();
  if (!nick) return '닉네임을 입력해 주세요';
  if (/\s/.test(nick)) return '띄어쓰기는 쓸 수 없어요';
  if (nick.length < NICKNAME_MIN) return `${NICKNAME_MIN}자 이상 입력해 주세요`;
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

export type NicknameStatus = 'same' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

export interface NicknameCheck {
  status: NicknameStatus;
  /** 입력칸 밑에 띄울 안내 (없으면 규칙 안내를 띄운다) */
  message: string | null;
  /** 저장해도 되는 상태인지 */
  ok: boolean;
}

/**
 * 입력이 멈춘 뒤(0.4초) 규칙 → 중복 순서로 확인한다.
 * 한글을 조합하는 도중(ㅎ, 하ㅂ…)에 오류가 깜빡이지 않도록 결과는 멈춘 뒤에만 바꾼다.
 */
export function useNicknameCheck(value: string, current: string): NicknameCheck {
  const [check, setCheck] = useState<NicknameCheck>({ status: 'same', message: null, ok: true });

  useEffect(() => {
    const nick = value.trim();
    if (nick === current.trim()) {
      setCheck({ status: 'same', message: null, ok: true });
      return;
    }
    let alive = true;
    setCheck((c) => ({ ...c, ok: false }));
    const t = setTimeout(async () => {
      const ruleError = nicknameRuleError(nick);
      if (ruleError) {
        if (alive) setCheck({ status: 'invalid', message: ruleError, ok: false });
        return;
      }
      setCheck({ status: 'checking', message: '사용할 수 있는지 확인하고 있어요…', ok: false });
      try {
        const available = await checkNicknameAvailable(nick);
        if (!alive) return;
        setCheck(
          available
            ? { status: 'available', message: '사용 가능한 닉네임이에요', ok: true }
            : { status: 'taken', message: '이미 사용 중인 닉네임이에요', ok: false },
        );
      } catch {
        if (alive) setCheck({ status: 'error', message: '확인하지 못했어요. 잠시 뒤 다시 입력해 주세요', ok: false });
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value, current]);

  return check;
}
