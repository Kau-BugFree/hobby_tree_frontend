import { Answer, AppState, formatManWon, formatMinutes } from './appState';

const list = (a: Answer) => (Array.isArray(a) ? a : a ? [a] : []);
/** ‘요리 (한식·중식…)’ → ‘요리’ */
const shortName = (s: string) => s.replace(/\s*\(.*\)$/, '').replace('읽을 책·전자책', '읽을 책');

/** O-05 확인 화면 · O-05-2 종합 화면에 쓰는 사람이 읽는 요약 */
export function summarize(state: AppState) {
  const a = state.answers;
  const q04 = a.q04 === '직접 금액 입력' ? formatManWon(state.customAmount.q04) : (a.q04 as string) ?? '미확인';
  const q05 = a.q05 === '직접 금액 입력' ? formatManWon(state.customAmount.q05) : (a.q05 as string) ?? '미확인';
  const q06 = a.q06 === '직접 시간 입력' ? formatMinutes(state.customMinutes) : (a.q06 as string) ?? '미확인';
  return {
    status: (a.q01 as string) ?? '미확인',
    interests: list(a.q02).map(shortName).join(' · ') || '미확인',
    goals: list(a.q03).join(' · ') || '미확인',
    firstSpend: q04.endsWith('까지') ? `추가 지출 ${q04}` : q04,
    firstSpendShort: q04.replace('까지', ''),
    monthly: q05,
    session: `${q06} (준비·정리·이동 포함)`,
    sessionShort: q06,
    weekly: `${(a.q07 as string) ?? '미확인'} · 참고용`,
    weeklyShort: (a.q07 as string) ?? '미확인',
    items: list(a.q08).map(shortName).join(' · ') || '미확인',
    place: list(a.q09Place).join(' · ') || '미확인',
    exclude: list(a.q09Exclude).join(' · ') || '없음',
    company: (a.q10 as string) ?? '미확인',
  };
}
