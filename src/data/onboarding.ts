/**
 * 온보딩 질문 정의 (Figma O-02 ~ O-06-1, 2026-10-13 질문 목록 기준).
 * initial 값은 Figma 프로토타입에서 선택돼 있던 상태를 그대로 옮겼다.
 */
import type { HobbyKey } from '../components/Graphics';

export type QuestionKind = 'single' | 'multi';

export interface OptionGroupDef {
  key: string;
  label?: string;
  kind: QuestionKind;
  display: 'chips' | 'choices';
  options: readonly string[];
  initial: string | string[] | null;
  /** 복수 선택에서 다른 항목과 함께 고를 수 없는 선택지 */
  exclusive?: readonly string[];
  max?: number;
  /** 이 선택지를 고르면 입력 칸이 나타난다 */
  custom?: { option: string; type: 'amount' | 'time'; sheet: string };
}

export interface QuestionDef {
  code: string;
  rule: string;
  title: string;
  groups: OptionGroupDef[];
  note?: string;
}

export interface OnboardingStepDef {
  progress: string;
  /** 진행 막대에서 채워진 칸 수 (선택 단계는 0) */
  filled: number;
  eyebrow: string;
  title: string;
  lead: string;
  questions: QuestionDef[];
}

export const STEP1: OnboardingStepDef = {
  progress: '1/4',
  filled: 1,
  eyebrow: '1/4 · 상태 · 관심 · 목적',
  title: '지금의 취미생활을\n알려 주세요',
  lead: '로그인 정보는 다시 묻지 않아요. 모르면 ‘모르겠어요’를 골라도 돼요.',
  questions: [
    {
      code: 'Q01',
      rule: '하나만',
      title: '현재 취미생활은 어떤 상태인가요?',
      groups: [
        {
          key: 'q01',
          kind: 'single',
          display: 'choices',
          options: [
            '해보고 싶지만 아직 시작하지 못했어요',
            '무엇을 할지 모르겠어요',
            '최근 시작해 이어가고 있어요',
            '쉬거나 그만둔 취미가 있어요',
            '오래 해온 취미를 계속하고 싶어요',
            '지금은 취미를 시작할 생각이 없어요',
          ],
          initial: '해보고 싶지만 아직 시작하지 못했어요',
        },
      ],
      note: '‘지금은 생각이 없어요’를 고르면 둘러보기와 나중에 시작하기를 보여 드려요.',
    },
    {
      code: 'Q02',
      rule: '여러 개 · 3개까지 추천',
      title: '지금 해보고 싶거나 이어가고 싶은 취미가 있나요?',
      groups: [
        {
          key: 'q02',
          kind: 'multi',
          display: 'chips',
          options: [
            '커피',
            '요리 (한식·중식·양식·일식·제과·제빵)',
            '악기 (피아노·기타)',
            '독서',
            '러닝·걷기',
            '다른 취미 직접 입력',
            '아직 모르겠어요',
          ],
          initial: ['커피', '요리 (한식·중식·양식·일식·제과·제빵)', '악기 (피아노·기타)'],
          exclusive: ['아직 모르겠어요'],
        },
      ],
      note: '아직 지원하지 않는 취미는 준비 중이라고 알려 드리고, 적어 주신 내용은 보관해요. 베이킹은 요리의 제과·제빵 경로로 이어져요.',
    },
    {
      code: 'Q03',
      rule: '2개까지',
      title: '취미를 통해 가장 얻고 싶은 것은 무엇인가요?',
      groups: [
        {
          key: 'q03',
          kind: 'multi',
          display: 'chips',
          options: ['휴식·기분 전환', '건강·체력', '실력 향상·성취감', '창작·자기표현', '사람과의 교류', '새로운 경험·호기심', '아직 모르겠어요'],
          initial: ['휴식·기분 전환', '새로운 경험·호기심'],
          exclusive: ['아직 모르겠어요'],
          max: 2,
        },
      ],
      note: '추천 순서와 이유에만 써요. 목적 때문에 다른 취미를 빼지 않아요.',
    },
  ],
};

export const STEP2: OnboardingStepDef = {
  progress: '2/4',
  filled: 2,
  eyebrow: '2/4 · 예산 · 시간',
  title: '얼마나, 얼마 동안\n할 수 있나요?',
  lead: '첫 추천에 맞는 활동만 고르는 데 써요.',
  questions: [
    {
      code: 'Q04',
      rule: '하나만',
      title: '첫 활동에 새로 쓸 수 있는 돈은 얼마인가요?',
      groups: [
        {
          key: 'q04',
          kind: 'single',
          display: 'chips',
          options: ['0원', '1만 원까지', '3만 원까지', '5만 원까지', '직접 금액 입력', '나와 맞는지 확인한 뒤 결정', '아직 모르겠어요'],
          initial: '1만 원까지',
          custom: { option: '직접 금액 입력', type: 'amount', sheet: '/onboarding/amount-q04' },
        },
      ],
      note: '재료·물품·대여·시설·이동비를 모두 더한 첫 활동의 추가 지출이에요. ‘확인한 뒤 결정’은 0원으로 저장하지 않아요.',
    },
    {
      code: 'Q05',
      rule: '하나만',
      title: '이번 달 취미 전체에 쓸 수 있는 돈은 얼마인가요?',
      groups: [
        {
          key: 'q05',
          kind: 'single',
          display: 'chips',
          options: ['0원', '1만 원까지', '3만 원까지', '5만 원까지', '10만 원까지', '직접 금액 입력', '아직 모르겠어요'],
          initial: '직접 금액 입력',
          custom: { option: '직접 금액 입력', type: 'amount', sheet: '/onboarding/amount-q05' },
        },
      ],
      note: '첫 구매와 고른 취미들의 반복 비용을 모두 합친 한 달 한도예요. 필요하면 이미 쓴 금액·예약한 금액을 나중에 확인해요.',
    },
    {
      code: 'Q06',
      rule: '하나만',
      title: '준비·정리·이동까지 포함해, 한 번에 얼마 동안 할 수 있나요?',
      groups: [
        {
          key: 'q06',
          kind: 'single',
          display: 'chips',
          options: ['10분', '15분', '30분', '1시간', '2시간', '직접 시간 입력', '아직 모르겠어요'],
          initial: '30분',
          custom: { option: '직접 시간 입력', type: 'time', sheet: '/onboarding/time-q06' },
        },
      ],
      note: '발효·예열처럼 기다리는 시간이 있는 활동은 직접 하는 시간과 전체 걸리는 시간을 따로 알려 드려요.',
    },
    {
      code: 'Q07',
      rule: '하나만',
      title: '일주일에 어느 정도 할 수 있을 것 같나요?',
      groups: [
        {
          key: 'q07',
          kind: 'single',
          display: 'chips',
          options: ['주 1회 미만', '주 1회', '주 2~3회', '주 4회 이상', '주마다 달라요', '아직 모르겠어요'],
          initial: '주 2~3회',
        },
      ],
      note: '계획을 세울 때 참고만 해요. 매일 해야 하는 목표나 연속 기록으로 만들지 않아요.',
    },
  ],
};

export const STEP3: OnboardingStepDef = {
  progress: '3/4',
  filled: 3,
  eyebrow: '3/4 · 물품 · 환경',
  title: '가진 물건과\n하고 싶은 환경은요?',
  lead: '넓게 골라도 괜찮아요. 꼭 필요한 것만 나중에 자세히 확인해요.',
  questions: [
    {
      code: 'Q08',
      rule: '여러 개',
      title: '지금 사용할 수 있는 물건은 무엇인가요?',
      groups: [
        {
          key: 'q08',
          kind: 'multi',
          display: 'chips',
          options: ['스마트폰', '읽을 책·전자책', '필기구', '운동화·운동복', '주방 도구', '커피 도구', '피아노·건반', '기타', '그 밖의 물건', '해당 없음', '확인이 필요해요'],
          initial: ['스마트폰', '읽을 책·전자책', '필기구', '주방 도구'],
          exclusive: ['해당 없음', '확인이 필요해요'],
        },
      ],
      note: '여기서 고른 묶음은 보유 확정이 아니에요. 관심 취미에 필요한 물건만 따로 묻고, 대여·시설이 필요하면 비용·가능 시간·이동도 확인해요.',
    },
    {
      code: 'Q09',
      rule: '두 묶음 따로',
      title: '어디서 하고 싶고, 꼭 피해야 할 조건은 무엇인가요?',
      groups: [
        {
          key: 'q09Place',
          label: '선호 장소',
          kind: 'multi',
          display: 'chips',
          options: ['집', '가까운 실내 공간', '야외', '상관없어요'],
          initial: ['집'],
          exclusive: ['상관없어요'],
        },
        {
          key: 'q09Exclude',
          label: '반드시 제외',
          kind: 'multi',
          display: 'chips',
          options: ['새 장비 구매', '야외', '외부 시설', '많은 신체 활동', '다른 사람 필수', '큰 소음', '화기 사용', '없음', '직접 입력'],
          initial: ['큰 소음'],
          exclusive: ['없음'],
        },
      ],
      note: '‘없음’은 다른 제외 조건과 함께 고를 수 없어요. 직업이나 거주 형태로 주방·소음 조건을 짐작하지 않아요.',
    },
    {
      code: 'Q10',
      rule: '하나만',
      title: '처음에는 누구와 하고 싶나요?',
      groups: [
        {
          key: 'q10',
          kind: 'single',
          display: 'chips',
          options: ['혼자', '아는 사람과', '새로운 사람도 괜찮아요', '상관없어요'],
          initial: '혼자',
        },
      ],
      note: '‘아는 사람과’를 낯선 사람 매칭으로 바꾸지 않아요. ‘혼자만 가능’처럼 꼭 지킬 조건은 따로 확인해요.',
    },
  ],
};

export const OPTIONAL: OnboardingStepDef = {
  progress: '선택',
  filled: 4,
  eyebrow: '선택 · 답하지 않아도 첫 추천을 받아요',
  title: '더 알려 주면\n더 잘 맞춰 드려요',
  lead: '건너뛰어도 괜찮아요. 나중에 MY에서 바꿀 수 있어요.',
  questions: [
    {
      code: 'Q11',
      rule: '하나만 · 기본: 2~3개 후보',
      title: '다음 활동은 어떻게 고르고 싶나요?',
      groups: [
        {
          key: 'q11',
          kind: 'single',
          display: 'choices',
          options: ['2~3개 후보 중 직접 고르기', '한 개를 제안받기', '전체 단계를 보며 고르기', '안내 없이 직접 찾기'],
          initial: '2~3개 후보 중 직접 고르기',
        },
      ],
    },
    {
      code: 'Q12',
      rule: '하나만 · 첫 활동 뒤로 미뤄도 돼요',
      title: '활동 후 기록은 어느 정도가 편한가요?',
      groups: [
        {
          key: 'q12',
          kind: 'single',
          display: 'choices',
          options: ['한 번 누르기', '누르기와 아쉬웠던 점 1개', '만족도·난이도·시간', '사진·짧은 메모', '기록하지 않기'],
          initial: '한 번 누르기',
        },
      ],
      note: '자세히 기록하지 않아도 추천을 막거나 실패로 보지 않아요.',
    },
    {
      code: 'Q13',
      rule: '여러 개',
      title: '앱에서 부담스럽게 느낄 요소가 있나요?',
      groups: [
        {
          key: 'q13',
          kind: 'multi',
          display: 'chips',
          options: ['매일 알림', '연속 기록 끊김 표시', '나무가 시드는 표현', '사용자 순위·비교', '긴 전체 로드맵', '여러 항목 기록', '기한 목표', '없음'],
          initial: ['매일 알림', '연속 기록 끊김 표시'],
          exclusive: ['없음'],
        },
      ],
      note: '하비트리는 기본으로 의무 알림·시드는 나무·연속 실패 표시·기한 강요가 없어요. 알림은 원하는 빈도를 직접 고를 때만 켜져요.',
    },
  ],
};

/** O-06 추천 취미 카드 */
export interface RecommendedHobby {
  hobby: HobbyKey;
  name: string;
  match: number;
  why: string;
  firstActivity: string;
}

export const RECOMMENDED: RecommendedHobby[] = [
  { hobby: '커피', name: '커피', match: 96, why: '가진 컵 하나로 시작 · 한 번에 10분', firstActivity: '향을 내 말로 세 단어' },
  { hobby: '독서', name: '독서', match: 92, why: '도서관 대출이면 0원 · 쉬면서 기분 전환', firstActivity: '표지와 첫 문장으로 골라보기' },
  { hobby: '러닝', name: '러닝', match: 85, why: '운동화만 있으면 · 혼자 내 속도로', firstActivity: '빠르게 걷기 20분' },
  { hobby: '요리', name: '요리', match: 71, why: '가진 주방 도구로 · 한 번에 15분', firstActivity: '계량해서 간장 드레싱 만들기' },
  { hobby: '악기', name: '악기 연주', match: 78, why: '전자건반·헤드폰이면 집에서도 · 소리 조건은 다음에 확인', firstActivity: '피아노 첫 소리 내기' },
];

export const INITIAL_PICKED: HobbyKey[] = ['커피', '독서', '요리', '악기'];
export const MAX_TREES = 5;

/** O-06-1 추가 확인 (B01~B06) */
export interface HobbyCheckDef {
  code: string;
  title: string;
  options: readonly string[];
  initial: string;
}

export const HOBBY_CHECKS: Record<HobbyKey, { firstActivity: string; checks: HobbyCheckDef[]; note?: string }> = {
  요리: {
    firstActivity: '계량해서 간장 드레싱 만들기',
    checks: [
      { code: 'B01', title: '요리는 어느 정도 해보셨나요?', options: ['처음', '조금 해봄', '이어가는 중', '쉬었다가 복귀'], initial: '처음' },
      { code: 'B02', title: '계량스푼을 실제로 쓸 수 있나요?', options: ['보유', '빌림', '대여·시설', '구입 예정', '없음', '미확인'], initial: '보유' },
      { code: 'B03', title: '반드시 제외할 재료나 작업 조건이 있나요?', options: ['없어요', '제외할 재료 입력', '화기 사용 어려움', '미확인'], initial: '없어요' },
    ],
  },
  커피: {
    firstActivity: '향을 내 말로 세 단어',
    checks: [
      { code: 'B01', title: '커피는 어느 정도 해보셨나요?', options: ['처음', '조금 해봄', '이어가는 중', '쉬었다가 복귀'], initial: '조금 해봄' },
      { code: 'B03', title: '음료에서 제외할 것이 있나요?', options: ['없어요', '카페인은 적게', '뜨거운 물 사용 어려움', '미확인'], initial: '카페인은 적게' },
    ],
  },
  악기: {
    firstActivity: '피아노 첫 소리 내기',
    checks: [
      { code: 'B01', title: '악기는 어느 정도 해보셨나요?', options: ['처음', '조금 해봄', '이어가는 중', '쉬었다가 복귀'], initial: '처음' },
      { code: 'B02', title: '피아노·전자건반을 쓸 수 있나요?', options: ['보유', '빌림', '대여·시설', '구입 예정', '없음', '미확인'], initial: '미확인' },
      { code: 'B04', title: '연습할 장소와 소리 조건은 어떤가요?', options: ['집에서 소리 가능', '전자악기·헤드폰 가능', '연습실 사용 가능', '아직 모름'], initial: '전자악기·헤드폰 가능' },
    ],
    note: '헤드폰이 어쿠스틱 기타 소리까지 줄여 주지는 않아요. 대여·연습실은 비용·가능 시간·이동을 확인한 뒤에 추천해요.',
  },
  독서: {
    firstActivity: '표지와 첫 문장으로 골라보기',
    checks: [
      { code: 'B01', title: '독서는 어느 정도 해보셨나요?', options: ['처음', '조금 해봄', '이어가는 중', '쉬었다가 복귀'], initial: '조금 해봄' },
    ],
  },
  러닝: {
    firstActivity: '빠르게 걷기 20분',
    checks: [
      { code: 'B01', title: '러닝은 어느 정도 해보셨나요?', options: ['처음', '조금 해봄', '이어가는 중', '쉬었다가 복귀'], initial: '처음' },
      { code: 'B05', title: '러닝 시작 안내를 확인했나요?', options: ['확인했어요', '아직이에요'], initial: '확인했어요' },
    ],
    note: '몸을 쓰는 활동이라 시작 전 검토된 안내만 확인해요. 병력·진단명은 묻지 않아요.',
  },
};
