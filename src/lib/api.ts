import { fetchSSE, type SSEEvent } from "./sse";
import { getVisitorId } from "./session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:50012";

export async function executeCode(
  language: string,
  codeBlock: string,
): Promise<{ id: string; result: string; err: string; language: string }> {
  const res = await fetch(`${API_BASE}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code_block: codeBlock }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function chatWithAgent(
  params: {
    session_id: string;
    user_message: string;
    article_ctx?: {
      article_id: string;
      article_content: string;
      code_blocks: { language: string; code: string }[];
      focused_block_index?: number;
    };
  },
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  await fetchSSE(`${API_BASE}/agent/chat`, { ...params, visitor_id: getVisitorId() }, onEvent, signal);
}

export async function confirmProposal(
  sessionId: string,
  proposalId: string,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  await fetchSSE(
    `${API_BASE}/agent/confirm`,
    { session_id: sessionId, proposal_id: proposalId, visitor_id: getVisitorId() },
    onEvent,
    signal,
  );
}

export async function cancelAgent(sessionId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/agent/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, visitor_id: getVisitorId() }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// Returns { success, message } instead of throwing — UI reads errors from return value directly.
export async function submitFeedback(payload: {
  type: "bug" | "suggestion" | "other";
  content: string;
  contact?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) {
    return { success: false, message: "提交过于频繁，请稍后再试" };
  }
  const body = await res.json().catch(() => ({ success: false, message: res.statusText }));
  if (!res.ok) {
    return { success: false, message: body.message || "提交失败，请稍后重试" };
  }
  return body as { success: boolean; message: string };
}
