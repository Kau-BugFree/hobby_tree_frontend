/**
 * 홈(H-01·H-07)의 나무·활동 MOCK_DATA.
 * TODO(API): GET /me/trees, GET /activities/:id 응답으로 교체
 */
import type { HobbyKey, TreeStageNo } from '../components/Graphics';
import type { TagTone } from '../components/Tag';

export interface ActivityStep {
  title: string;
  sub: string;
}

export interface ActivityDetail {
  id: string;
  hobby: HobbyKey;
  title: string;
  stage: TreeStageNo;
  minutes: number;
  category: string;
  description: string;
  tags: { label: string; tone: TagTone }[];
  steps: ActivityStep[];
  /** 남은 타이머 (mm:ss) */
  timer: string;
  progressText: string;
  /** 이 활동을 끝냈을 때 성장 안내 */
  finishHint: string;
}

export interface StageRecommendation {
  title: string;
  stage: TreeStageNo;
  minutes: number;
  tone: TagTone;
}

export interface TreeData {
  hobby: HobbyKey;
  name: string;
  stage: TreeStageNo;
  stageLabel: string;
  growthStatus: string;
  stageTitle: string;
  currentActivityId: string;
  /** 지금 하는 활동 진행률 0~1 */
  progress: number;
  recommendations: StageRecommendation[];
}

export const ACTIVITIES: Record<string, ActivityDetail> = {
  'cook-dressing': {
    id: 'cook-dressing',
    hobby: '요리',
    title: '계량해서 간장 드레싱 만들기',
    stage: 0,
    minutes: 15,
    category: '한식',
    description: '큰술·작은술을 맞춰 재고, 맛을 한 줄로 남겨요.',
    tags: [
      { label: '요리 · 0단계', tone: 'solid' },
      { label: '15분 · 계량스푼', tone: 'green' },
    ],
    steps: [
      { title: '큰술·작은술 차이 확인하기', sub: '물로 15mL와 5mL를 비교해요' },
      { title: '재료를 계량해 섞기', sub: '간장 2·식초 2·설탕 1·기름 2큰술' },
      { title: '맛보고 한 줄 메모하기', sub: '신맛과 단맛 중 어느 쪽이 강한지' },
    ],
    timer: '06:30',
    progressText: '하는 중 · 할 일 3개 중 1개 완료',
    finishHint: '끝내면 완료 2개',
  },
  'coffee-iced-latte': {
    id: 'coffee-iced-latte',
    hobby: '커피',
    title: '머신 없이 아이스 밀크커피 만들기',
    stage: 1,
    minutes: 15,
    category: '음료',
    description: '인스턴트커피와 우유로 내 입에 맞는 한 잔을 만들어요.',
    tags: [
      { label: '커피 · 1단계', tone: 'solid' },
      { label: '15분 · 컵·얼음', tone: 'green' },
    ],
    steps: [
      { title: '커피를 물에 녹이고 식히기', sub: '인스턴트 1작은술 + 물 60mL' },
      { title: '얼음·우유에 커피 더하기', sub: '우유 120mL, 스푼으로 섞어요' },
      { title: '진하면 우유 조금 더하기', sub: '쓴 양만 기억하고 정리해요' },
    ],
    timer: '08:10',
    progressText: '하는 중 · 할 일 3개 중 1개 완료',
    finishHint: '끝내면 묘목으로 자라요',
  },
  'piano-twinkle': {
    id: 'piano-twinkle',
    hobby: '악기',
    title: '양손으로 작은별 만들기',
    stage: 2,
    minutes: 20,
    category: '피아노',
    description: '오른손 멜로디에 왼손 첫 박 기본음을 붙여 봐요.',
    tags: [
      { label: '악기 연주 · 2단계', tone: 'solid' },
      { label: '20분 · 건반', tone: 'green' },
    ],
    steps: [
      { title: '오른손 멜로디만 천천히', sub: '편한 속도로 시작해요' },
      { title: '왼손 첫 박 기본음 붙이기', sub: '각 손을 따로 익힌 뒤에' },
      { title: '8~16마디 이어서 연주', sub: '어려운 곳 한 곳만 표시해요' },
    ],
    timer: '11:05',
    progressText: '하는 중 · 할 일 3개 중 1개 완료',
    finishHint: '끝내면 완료 2개',
  },
  'read-three-questions': {
    id: 'read-three-questions',
    hobby: '독서',
    title: '질문 세 개로 읽기',
    stage: 3,
    minutes: 25,
    category: '논픽션',
    description: '읽기 전에 질문을 세우고, 답이 있는 곳을 표시해요.',
    tags: [
      { label: '독서 · 3단계', tone: 'solid' },
      { label: '25분 · 책 한 장', tone: 'green' },
    ],
    steps: [
      { title: '알고 싶은 질문 세 개 적기', sub: '관심 분야 책의 한 장을 골라요' },
      { title: '읽으며 답이 있는 곳 표시하기', sub: '한 구간만 읽어도 괜찮아요' },
      { title: '답한 질문과 남은 질문 나누기', sub: '남은 질문은 다음 읽기로 넘겨요' },
    ],
    timer: '12:40',
    progressText: '읽는 중 · 질문 3개 중 1개 답함',
    finishHint: '끝내면 큰 나무로 자라요',
  },
};

export const TREES: TreeData[] = [
  {
    hobby: '요리',
    name: '요리',
    stage: 0,
    stageLabel: '0단계 · 씨앗',
    growthStatus: '완료 1개 · 2개 더 하면 새싹',
    stageTitle: '0단계 · 주방 첫걸음',
    currentActivityId: 'cook-dressing',
    progress: 0.45,
    recommendations: [
      { title: '전자레인지 달걀찜', stage: 0, minutes: 15, tone: 'green' },
      { title: '참치마요 주먹밥', stage: 0, minutes: 20, tone: 'water' },
    ],
  },
  {
    hobby: '커피',
    name: '커피',
    stage: 1,
    stageLabel: '1단계 · 새싹',
    growthStatus: '완료 2개 · 1개 더 하면 묘목',
    stageTitle: '1단계 · 일상의 한 잔 만들기',
    currentActivityId: 'coffee-iced-latte',
    progress: 0.45,
    recommendations: [
      { title: '커피와 물의 양 따로 재기', stage: 1, minutes: 15, tone: 'green' },
      { title: '커피 취향 한 줄 카드', stage: 0, minutes: 10, tone: 'water' },
    ],
  },
  {
    hobby: '악기',
    name: '악기 연주',
    stage: 2,
    stageLabel: '2단계 · 묘목',
    growthStatus: '완료 1개 · 2개 더 하면 어린 나무',
    stageTitle: '2단계 · 기본 연주 응용',
    currentActivityId: 'piano-twinkle',
    progress: 0.45,
    recommendations: [
      { title: '4코드 이어 치기', stage: 2, minutes: 20, tone: 'green' },
      { title: '4박자 리듬 맞추기', stage: 1, minutes: 15, tone: 'water' },
    ],
  },
  {
    hobby: '독서',
    name: '독서',
    stage: 3,
    stageLabel: '3단계 · 어린 나무',
    growthStatus: '완료 2개 · 1개 더 하면 큰 나무',
    stageTitle: '3단계 · 한 권의 흐름 만들기',
    currentActivityId: 'read-three-questions',
    progress: 0.45,
    recommendations: [
      { title: '반복되는 소재 발견하기', stage: 3, minutes: 25, tone: 'green' },
      { title: '주장과 예시 구분하기', stage: 2, minutes: 20, tone: 'water' },
    ],
  },
];

export const MAX_TREE_SLOTS = 5;

/** URL 파라미터(hobby) → 나무 */
export const treeByHobby = (hobby: string | undefined) => TREES.find((t) => t.hobby === hobby) ?? TREES[0];

/** H-09 새 나무 심기 후보 (E-04 목록과 동일) */
export interface PlantCandidate {
  id: string;
  name: string;
  match: number;
  firstActivity: string;
  available: boolean;
  reason?: string;
}

export const PLANT_CANDIDATES: PlantCandidate[] = [
  { id: 'running', name: '러닝', match: 74, firstActivity: '빠르게 걷기 20분', available: true },
  { id: 'film', name: '필름 사진', match: 68, firstActivity: '일회용 카메라 1통', available: true },
  { id: 'garden', name: '가드닝', match: 63, firstActivity: '바질 화분 키우기', available: true },
  { id: 'camping', name: '캠핑', match: 41, firstActivity: '집 앞 공원 피크닉', available: false, reason: '장비가 많아 월 예산을 넘고, 이동이 필요해요' },
];

/** H-08 알림 MOCK_DATA */
export interface NoticeItem {
  id: string;
  title: string;
  sub: string;
  icon: string;
  href?: string;
}

export const NOTICES: NoticeItem[] = [
  { id: 'coffee', title: '커피 나무 · 활동 1개만 더 하면 묘목이 돼요', sub: '지금 하는 활동 이어서 하기', icon: 'sprout', href: '/home/activity/커피' },
  { id: 'class', title: '브루잉 입문 원데이 클래스 · 토 14:00', sub: '제휴 클래스 일정 안내 · 4자리 남음', icon: 'calendar', href: '/together/class/brewing' },
  { id: 'reading', title: '독서 나무 · 4단계 활동을 둘러볼 수 있어요', sub: '체험에서 단계별 활동 보기', icon: 'book', href: '/experience' },
];

export const NOTICE_FREQUENCY = ['받지 않기', '주 1회 요약', '활동한 날만'] as const;
