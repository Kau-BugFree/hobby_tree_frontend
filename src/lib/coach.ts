import { ChatMessage, CoachContext, FALLBACK_REPLY, MOCK_REPLIES } from '../data/chat';

/**
 * 하비 코치 답변 요청 (지금은 MOCK, 0.9초 지연)
 *
 * TODO(AI) 실제 연동 시:
 * - 앱 → 백엔드 → LLM 순서로만 호출 (API 키를 앱에 넣지 않음)
 * - 스트리밍(SSE/fetch ReadableStream)으로 토큰을 받아 마지막 coach 말풍선에 이어 붙이기
 * - AbortController로 화면 이탈·재전송 시 요청 취소, 타임아웃·재시도·오류 말풍선 처리
 * - 응답에 source(근거 문서)와 linked(활동 id) 구조화 필드를 함께 받기
 * - 안전 필터: 화기·칼·전기 등 위험 활동은 서버 정책 문구로 대체
 */
export async function askCoach(text: string, _context: CoachContext, signal?: AbortSignal): Promise<ChatMessage> {
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 900);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
  const reply = MOCK_REPLIES[text] ?? FALLBACK_REPLY;
  return { id: `c-${Date.now()}`, role: 'coach', ...reply };
}
