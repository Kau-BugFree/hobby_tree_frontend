/**
 * 체험 탭 MOCK_DATA: 단계별 완료 개수, 장비·장소 광고, 다른 취미 후보.
 * TODO(API): GET /me/progress, GET /ads?activityId=, GET /hobbies/explore
 */
import type { HobbyKey } from '../components/Graphics';

/** 취미별 단계(level) → 완료한 활동 수 */
export const COMPLETED: Record<HobbyKey, Record<number, number>> = {
  커피: { 0: 3, 1: 2 },
  요리: { 0: 1 },
  악기: { 0: 3, 1: 3, 2: 1 },
  독서: { 0: 3, 1: 3, 2: 3, 3: 2 },
  러닝: {},
};

export interface AdItem {
  id: string;
  kind: 'gear' | 'place';
  seller: string;
  title: string;
  fit: string;
  price: number;
  /** 장소 광고는 함께 탭 클래스로 연결 */
  classId?: string;
  shipping?: string;
  why?: string[];
}

/** 활동 세부 설명(E-03)에서만 노출하는 광고 — 취미별 */
export const ADS: Partial<Record<HobbyKey, AdItem[]>> = {
  커피: [
    {
      id: 'dripper-set',
      kind: 'gear',
      seller: '하비마켓',
      title: '입문 드리퍼 세트 (필터 40매)',
      fit: '준비물 · 드리퍼 + 필터',
      price: 18900,
      shipping: '무료배송',
      why: [
        '‘필터의 모양과 크기 맞추기’ · ‘물줄기 찬물 연습’에 쓰여요',
        '필터 40매면 다음 활동 ‘기본 핸드드립 레시피’까지 충분해요',
      ],
    },
    {
      id: 'filter-100',
      kind: 'gear',
      seller: '하비마켓',
      title: '원뿔형 드립 필터 100매',
      fit: '준비물 · 맞는 필터',
      price: 4900,
      shipping: '무료배송',
      why: ['드리퍼 모델에 맞는 크기인지 먼저 확인해요'],
    },
    {
      id: 'kettle',
      kind: 'gear',
      seller: '하비마켓',
      title: '가는 물줄기 드립 주전자',
      fit: '다음 활동 ‘물줄기 찬물 연습’에도 쓰여요',
      price: 24000,
      shipping: '무료배송',
      why: ['물줄기 굵기를 일정하게 유지하기 쉬워요'],
    },
    {
      id: 'brewing-class',
      kind: 'place',
      seller: '하비커피랩 · 성수 · 토 14:00',
      title: '브루잉 입문 원데이 클래스',
      fit: '장비가 없으면 · 드리퍼·필터 설치부터 함께 배워요',
      price: 35000,
      classId: 'brewing',
    },
  ],
};

export const findAd = (id: string | undefined) => {
  for (const list of Object.values(ADS)) {
    const ad = list?.find((a) => a.id === id);
    if (ad) return ad;
  }
  return null;
};

export const EXPLORE_FILTERS = ['전체', '집에서', '1만 원 이하', '혼자', '조용한'] as const;

export interface ExploreHobby {
  id: string;
  name: string;
  hobby?: HobbyKey;
  icon: string;
  match: number;
  why: string;
  first: string;
  tags: (typeof EXPLORE_FILTERS)[number][];
  blocked?: boolean;
}

export const EXPLORE_HOBBIES: ExploreHobby[] = [
  { id: 'running', name: '러닝', hobby: '러닝', icon: 'hobby-러닝', match: 74, why: '운동화만 있으면 · 혼자 내 속도로', first: '빠르게 걷기 20분', tags: ['1만 원 이하', '혼자'] },
  { id: 'film', name: '필름 사진', icon: 'camera', match: 68, why: '산책과 함께 · 혼자서도 OK', first: '일회용 카메라 1통', tags: ['혼자', '조용한'] },
  { id: 'garden', name: '가드닝', icon: 'leaf', match: 63, why: '창가 한 칸이면 충분 · 조용한', first: '바질 화분 키우기', tags: ['집에서', '1만 원 이하', '혼자', '조용한'] },
  { id: 'camping', name: '캠핑', icon: 'tent', match: 41, why: '장비가 많아 월 예산 초과 · 이동 필요', first: '집 앞 공원 피크닉', tags: [], blocked: true },
];
