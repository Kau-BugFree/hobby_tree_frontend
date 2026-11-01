/**
 * MY 탭 MOCK_DATA (M-01 · M-02 · M-03 · M-08)
 * TODO(API): GET /me/profile, PATCH /me/profile, GET /me/stats, GET /me/trees/:hobby/roadmap, GET /regions?q=
 */
import type { HobbyKey } from '../components/Graphics';
import { CATALOG, cardsOfLevel } from './catalog';
import { COMPLETED } from './experience';

export const AGE_OPTIONS = ['20대', '30대', '40대 이상', '밝히지 않음'] as const;
export type AgeOption = (typeof AGE_OPTIONS)[number];

/** 관심 취미 칩 라벨 → 취미 키 */
export const INTEREST_OPTIONS = ['요리', '커피', '악기', '독서', '러닝·걷기'] as const;
export type InterestOption = (typeof INTEREST_OPTIONS)[number];
export const interestToHobby = (o: InterestOption): HobbyKey => (o === '러닝·걷기' ? '러닝' : o);
export const hobbyToInterest = (h: HobbyKey): InterestOption => (h === '러닝' ? '러닝·걷기' : h);

export const WEEK_TIME_OPTIONS = ['1~2시간', '3~4시간', '5시간 이상'] as const;
export const ONCE_TIME_OPTIONS = ['15분', '30분', '1시간', '2시간'] as const;

/** 예산 슬라이더 범위(원) */
export const BUDGET_SLIDERS = {
  month: { label: '월 예산', min: 0, max: 100000, step: 5000 },
  once: { label: '1회 예산', min: 0, max: 50000, step: 5000 },
} as const;

export interface ProfileData {
  age: AgeOption;
  monthBudget: number;
  onceBudget: number;
  weekTime: (typeof WEEK_TIME_OPTIONS)[number];
  onceTime: (typeof ONCE_TIME_OPTIONS)[number];
}

export const PROFILE: ProfileData = {
  age: '20대',
  monthBudget: 20000,
  onceBudget: 10000,
  weekTime: '3~4시간',
  onceTime: '30분',
};

const PLACE_TAG: Record<string, string> = { 집: '#집에서', '가까운 실내 공간': '#실내에서', 야외: '#야외에서', 상관없어요: '#어디서든' };
const manWon = (n: number) => (n % 10000 === 0 ? `${n / 10000}만 원` : `${n}원`);

/** M-01 프로필 카드 태그: #집에서 #월 2만 원 #1회 30분 (Q09 선호 장소 + 예산 + 1회 시간) */
export const profileTags = (p: ProfileData, places: string[]) => [
  PLACE_TAG[places[0] ?? '상관없어요'] ?? '#어디서든',
  `#월 ${manWon(p.monthBudget)}`,
  `#1회 ${p.onceTime}`,
];

/** M-01 통계 벤토 — 서버 집계값 (온보딩·체험·클래스 기록 포함) */
export const PROFILE_STATS = { trees: 4, maxStage: 3, doneActivities: 38 };

/** M-02 요약 카드: 나무를 심은 날 · 키운 날 수 */
export const PLANTED_INFO: Partial<Record<HobbyKey, { plantedAt: string; days: number }>> = {
  커피: { plantedAt: '9/14', days: 26 },
  요리: { plantedAt: '10/2', days: 8 },
  악기: { plantedAt: '9/3', days: 37 },
  독서: { plantedAt: '8/21', days: 50 },
};

/** M-02 완료 활동 날짜 (카탈로그 카드 id → 완료일) */
export const DONE_DATES: Record<string, string> = {
  'C0-1': '9/14',
  'cof-0-4': '9/15',
  'cof-0-12': '9/17',
  'C1-1': '9/20',
  'cof-1-4': '9/22',
};

/** 완료한 활동 id — Figma에 나온 커피만 명시, 나머지는 단계별 완료 수(COMPLETED)만큼 앞에서부터 채움 */
const DONE_IDS: Partial<Record<HobbyKey, string[]>> = {
  커피: ['C0-1', 'cof-0-4', 'cof-0-12', 'C1-1', 'cof-1-4'],
};

export const doneIdsOf = (hobby: HobbyKey): string[] => {
  const explicit = DONE_IDS[hobby];
  if (explicit) return explicit;
  const cat = CATALOG[hobby];
  return Object.entries(COMPLETED[hobby] ?? {}).flatMap(([lv, n]) =>
    cardsOfLevel(cat, Number(lv))
      .slice(0, n)
      .map((c) => c.id),
  );
};

/** M-08 지역 검색 결과 (구 단위로만 저장) */
export interface RegionResult {
  label: string;
  /** 저장되는 시·구 */
  saveAs: string;
  isDistrict: boolean;
}

export const REGIONS: RegionResult[] = [
  { label: '서울 마포구', saveAs: '서울 마포구', isDistrict: true },
  { label: '서울 마포구 망원동', saveAs: '서울 마포구', isDistrict: false },
  { label: '서울 마포구 합정동', saveAs: '서울 마포구', isDistrict: false },
  { label: '서울 마포구 연남동', saveAs: '서울 마포구', isDistrict: false },
  { label: '서울 마포구 상암동', saveAs: '서울 마포구', isDistrict: false },
  { label: '서울 성동구', saveAs: '서울 성동구', isDistrict: true },
  { label: '서울 성동구 성수동', saveAs: '서울 성동구', isDistrict: false },
  { label: '서울 서대문구', saveAs: '서울 서대문구', isDistrict: true },
  { label: '서울 서대문구 연희동', saveAs: '서울 서대문구', isDistrict: false },
];

export const searchRegions = (q: string) => {
  const key = q.replace(/\s/g, '');
  if (!key) return [];
  return REGIONS.filter((r) => r.label.replace(/\s/g, '').includes(key));
};
