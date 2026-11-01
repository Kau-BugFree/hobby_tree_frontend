/**
 * 함께 탭 MOCK_DATA (T-01 · T-02 · T-04 · T-06)
 * TODO(API): GET /classes?hobby=&near=, GET /classes/:id, GET /classes/:id/slots
 */
import type { HobbyKey, TreeStageNo } from '../components/Graphics';

export type ClassKind = '원데이' | '공공';

export interface ClassItem {
  id: string;
  hobby: HobbyKey;
  kind: ClassKind;
  title: string;
  host: string;
  hostMeta: string;
  area: string;
  when: string;
  whenShort: string;
  duration: string;
  capacity: string;
  prep: string;
  price: number;
  stage: TreeStageNo;
  /** 예약 가능 여부 — false면 ‘아직 준비중이에요’ (T-07) */
  bookable: boolean;
  /** 공공 프로그램처럼 외부 페이지에서 신청 */
  external?: boolean;
  partner: boolean;
  openNote?: string;
}

export const CLASSES: ClassItem[] = [
  {
    id: 'brewing',
    hobby: '커피',
    kind: '원데이',
    title: '브루잉 입문 원데이 클래스',
    host: '하비커피랩',
    hostMeta: '하비커피랩 · 바리스타 1명 : 6명',
    area: '성수동 · 성수역 3번 출구 5분',
    when: '10/18(토) 14:00 – 16:00',
    whenShort: '10/18(토) 14:00 · 2시간 · 4자리 남음',
    duration: '2시간',
    capacity: '6명 · 4자리 남음',
    prep: '없음 · 드리퍼·원두 제공',
    price: 35000,
    stage: 1,
    bookable: true,
    partner: true,
  },
  {
    id: 'library-reading',
    hobby: '독서',
    kind: '공공',
    title: '구립도서관 저녁 독서 모임',
    host: '구립도서관',
    hostMeta: '구립도서관 · 공공 프로그램',
    area: '가까운 구립도서관',
    when: '목 19:30',
    whenShort: '목 19:30 · 무료 · 독서 3단계',
    duration: '1시간 30분',
    capacity: '기관 페이지에서 확인',
    prep: '읽고 있는 책',
    price: 0,
    stage: 3,
    bookable: false,
    external: true,
    partner: false,
  },
  {
    id: 'cooking-bowl',
    hobby: '요리',
    kind: '원데이',
    title: '자취생 한 그릇 쿠킹 클래스',
    host: '하비키친',
    hostMeta: '하비키친 · 요리 강사 1명 : 8명',
    area: '망원동 · 망원역 2번 출구 3분',
    when: '토 11:00 – 13:00 · 일정 조율 중',
    whenShort: '토 11:00 · 2만 원 · 요리 0단계',
    duration: '2시간',
    capacity: '8명 · 예약 오픈 전',
    prep: '앞치마 · 재료 모두 제공',
    price: 20000,
    stage: 0,
    bookable: false,
    partner: true,
    openNote: '오픈 예정 · 11월',
  },
];

export const classById = (id: string | undefined) => CLASSES.find((c) => c.id === id) ?? CLASSES[0];

export const TOGETHER_FILTERS: HobbyKey[] = ['요리', '커피', '악기', '독서'];

/** T-04 예약 선택지 */
export interface DateSlot {
  id: string;
  weekday: string;
  date: string;
  seats: number;
}

export const DATE_SLOTS: DateSlot[] = [
  { id: '1018', weekday: '토', date: '10/18', seats: 4 },
  { id: '1019', weekday: '일', date: '10/19', seats: 2 },
  { id: '1025', weekday: '토', date: '10/25', seats: 6 },
  { id: '1026', weekday: '일', date: '10/26', seats: 5 },
  { id: '1101', weekday: '토', date: '11/1', seats: 6 },
  { id: '1102', weekday: '일', date: '11/2', seats: 6 },
  { id: '1108', weekday: '토', date: '11/8', seats: 6 },
];

export const TIME_SLOTS = ['11:00 – 13:00 · 2자리 남음', '14:00 – 16:00 · 4자리 남음'] as const;
export const PAYMENTS = ['신용·체크카드', '카카오페이', '네이버페이', '계좌이체'] as const;
export const REFUND_RULES = ['클래스 2일 전까지 · 전액 환불', '클래스 1일 전 · 50% 환불', '당일 취소·불참 · 환불 불가'];
export const MAX_PEOPLE = 4;

export const CHAT_FEATURES = ['클래스 단톡', '같은 취미 1:1', '후기 나누기'];
