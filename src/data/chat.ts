/**
 * 하비 코치(C-01 · C-02) MOCK_DATA
 * TODO(AI): POST /coach/messages (스트리밍 SSE) — 요청에 hobby·stage·현재 활동 id·예산/시간 조건을 함께 보냄
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
  hobby: '커피',
  stage: 1,
  stageLabel: '1단계 새싹',
  activityTitle: '머신 없이 아이스 밀크커피 만들기',
};

export const PANEL_QUICK = ['핸드드립 물 온도는?', '2만 원으로 장비 맞추기', '오늘 30분 뭐 하지?', '3단계 미리 보기'];
export const CONVERSATION_QUICK = ['입문 원두 추천', '그라인더 꼭 필요해?', '클래스 찾아줘'];

export interface LinkedActivity {
  title: string;
  hobby: HobbyKey;
  stage: number;
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
  { id: 'm1', role: 'me', text: '핸드드립 물 온도는 몇 도가 좋아요?' },
  {
    id: 'm2',
    role: 'coach',
    text: '처음엔 90~93℃로 시작해 보세요. 끓인 물을 다른 주전자에 한 번 옮겨 담으면 비슷한 온도가 돼요.\n\n• 쓴맛이 강하면 → 온도를 2~3℃ 낮춰요\n• 맛이 밍밍하면 → 온도를 올려요',
    source: '하비트리 커피 2단계 가이드',
    linked: { title: '물 온도 기록 비교', hobby: '커피', stage: 4 },
  },
  // Figma C-02 마지막 상태: 내 질문 + 코치 입력 중(Typing) — 화면이 열리면 답변을 요청한다
  { id: 'm3', role: 'me', text: '2만 원 안에서 장비를 맞추려면요?' },
];

/** 오프라인 데모용 답변 — 실제 앱에서는 서버 AI 응답으로 교체 */
export const MOCK_REPLIES: Record<string, Omit<ChatMessage, 'id' | 'role'>> = {
  '2만 원 안에서 장비를 맞추려면요?': {
    text: '2만 원이면 드리퍼 + 종이 필터 조합이 가장 알맞아요. 원두는 분쇄된 소포장(100g)으로 시작하면 그라인더 없이도 돼요.\n\n• 드리퍼·필터 세트 · 약 1만 원대\n• 분쇄 원두 100g · 약 7천 원',
    source: '하비트리 커피 장비 가이드',
    linked: { title: '드립백으로 첫 추출', hobby: '커피', stage: 2 },
  },
};

export const FALLBACK_REPLY: Omit<ChatMessage, 'id' | 'role'> = {
  text: '좋은 질문이에요. 지금 커피 나무 1단계 기준으로 보면, 오늘은 15분 안에 끝나는 활동부터 해 보는 걸 추천해요. 더 자세히 알려 주시면 맞춰서 골라 드릴게요.',
};
