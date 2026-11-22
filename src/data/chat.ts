/**
 * 하비 코치(C-01 · C-02) 데이터
 * 코치(활동코치 V3)는 현재 요리(cooking)만 지원한다 → 빠른 질문·시연 시나리오는 요리만 준비한다.
 * 로그인 상태에서는 POST /api/v1/coach/chat 으로 보내고, 응답의 conversationId를 다음 질문에 그대로 담는다 (멀티턴).
 */
import type { HobbyKey, TreeStageNo } from '../components/Graphics';

export interface CoachContext {
  hobby: HobbyKey;
  stage: TreeStageNo;
  stageLabel: string;
  activityTitle: string;
}

/** 대화 기준 나무 — 실제로는 마지막으로 본 나무(홈 캐러셀 위치)나 진입한 활동에서 받는다 */
export const DEFAULT_CONTEXT: CoachContext = {
  hobby: '요리',
  stage: 1,
  stageLabel: '1단계 새싹',
  activityTitle: '계량해서 간장 드레싱 만들기',
};

/**
 * 시연 시나리오 (요리만) — 코치 서버가 분류하는 발화 유형 순서대로
 *   추천 → 선택 → 준비물 → 시작 → 단계 설명 → 문제 → 완료
 * ‘완료했어’ 대신 ‘활동 완료했어’: 코치가 되물은 질문이 남아 있으면 ‘완료했어’는 그 답으로 처리돼 기록되지 않는다 (명세 2.1)
 */
export const COOKING_SCENARIO = [
  '오늘 20분 안에 할 요리 활동 추천해줘',
  '두 번째 걸로 할게',
  '준비물 알려줘',
  '활동 시작할게',
  '현재 단계를 쉽게 설명해줘',
  '2단계 계량이 잘 안돼',
  '활동 완료했어',
] as const;

export const PANEL_QUICK = ['20분 요리 활동 추천해줘', '준비물 알려줘', '단계 쉽게 설명해줘', '계량이 잘 안돼'];
export const CONVERSATION_QUICK = [...COOKING_SCENARIO];

export interface LinkedActivity {
  title: string;
  hobby: HobbyKey;
  /** 없으면(서버 추천 활동) ‘활동 보기’ 버튼 없이 이름만 */
  stage?: number;
  reason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'me' | 'coach';
  text: string;
  /** 답변 근거 (RAG 출처) */
  source?: string;
  linked?: LinkedActivity;
}

export const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'me', text: '계량스푼이 없으면 어떻게 해요?' },
  {
    id: 'm2',
    role: 'coach',
    text: '밥숟가락으로 대신할 수 있어요. 수북하지 않게 깎아 담으면 큰술과 비슷해요.\n\n• 큰술 1 ≈ 밥숟가락 1 (깎아서)\n• 작은술 1 ≈ 밥숟가락 1/3',
    source: '하비트리 요리 0단계 가이드',
    linked: { title: '계량해서 간장 드레싱 만들기', hobby: '요리', stage: 1 },
  },
  // Figma C-02 마지막 상태: 내 질문 + 코치 입력 중(Typing) — 화면이 열리면 답변을 요청한다
  { id: 'm3', role: 'me', text: '오늘 20분 안에 할 요리 활동 추천해줘' },
];

/** 오프라인 데모용 답변 (체험 모드) — 로그인 상태에서는 서버 코치 응답 */
export const MOCK_REPLIES: Record<string, Omit<ChatMessage, 'id' | 'role'>> = {
  '오늘 20분 안에 할 요리 활동 추천해줘': {
    text: '20분 안에 끝나는 활동을 찾았어요. 번호로 고르면 준비물과 순서를 이어서 알려 드릴게요.\n1. 주방 탐험: 도구 이름과 위생 습관\n2. 계량해서 간장 드레싱 만들기',
    source: '하비트리 요리 활동 목록',
  },
  '두 번째 걸로 할게': {
    text: '‘계량해서 간장 드레싱 만들기’를 골랐어요. 준비물이나 순서를 물어보세요.',
    linked: { title: '계량해서 간장 드레싱 만들기', hobby: '요리', stage: 1 },
  },
  '준비물 알려줘': {
    text: '준비물이에요.\n• 도구: 계량스푼, 작은 그릇, 숟가락\n• 재료: 간장 2큰술, 식초 1큰술, 설탕 1작은술, 참기름 약간',
    source: '계량해서 간장 드레싱 만들기',
  },
};

export const FALLBACK_REPLY: Omit<ChatMessage, 'id' | 'role'> = {
  text: '체험 모드에서는 준비된 요리 질문에만 답해요. 로그인하면 하비 코치가 요리 활동 추천·준비물·단계 설명을 이어서 도와드려요.',
};
