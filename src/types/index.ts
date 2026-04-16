export interface Article {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  content: string;
}

export interface CodeBlockState {
  code: string;
  originalCode: string;
  language: string;
  output: string | null;
  isRunning: boolean;
  runError: string | null;
  isExpanded: boolean;
  aiMessages: ChatMessage[];
}

export interface SessionState {
  sessionId: string | null;
  activeBlockId: string | null;
  isStreaming: boolean;
  sseConnected: boolean;
  proposals: Record<string, Proposal>;
  globalError: string | null;
}

export interface Proposal {
  id: string;
  blockId: string;
  code: string;
  language: string;
  description: string;
  createdAt: number;
  expiresAt: number;
  status: "pending" | "confirmed" | "executed" | "expired";
}

export interface ChatMessage {
  id: string;
  blockId: string;
  type: "user" | "ai" | "proposal" | "execution_result" | "interrupted" | "error" | "system";
  content: string;
  proposalId?: string;
  timestamp: number;
}
