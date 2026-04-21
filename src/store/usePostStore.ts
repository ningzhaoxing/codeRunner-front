import { create } from "zustand";
import { CodeBlockState, SessionState, Proposal, ChatMessage } from "@/types";

// --- localStorage persistence helpers ---

const SESSION_KEY = (articleId: string) => `cr_post_session_${articleId}`;
const MESSAGES_KEY = (articleId: string) => `cr_post_messages_${articleId}`;
const PROPOSALS_KEY = (articleId: string) => `cr_post_proposals_${articleId}`;

function saveSession(articleId: string, sessionId: string | null) {
  if (typeof window === "undefined" || !articleId) return;
  if (sessionId) localStorage.setItem(SESSION_KEY(articleId), sessionId);
  else localStorage.removeItem(SESSION_KEY(articleId));
}

function loadSession(articleId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY(articleId));
}

function saveMessages(articleId: string, blockId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined" || !articleId) return;
  try {
    const key = MESSAGES_KEY(articleId);
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    existing[blockId] = messages;
    localStorage.setItem(key, JSON.stringify(existing));
  } catch { /* localStorage full — ignore */ }
}

function loadMessages(articleId: string, blockId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY(articleId));
    if (!raw) return [];
    return JSON.parse(raw)[blockId] ?? [];
  } catch { return []; }
}

function saveProposals(articleId: string, proposals: Record<string, Proposal>) {
  if (typeof window === "undefined" || !articleId) return;
  try {
    localStorage.setItem(PROPOSALS_KEY(articleId), JSON.stringify(proposals));
  } catch { /* localStorage full — ignore */ }
}

function loadProposals(articleId: string): Record<string, Proposal> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROPOSALS_KEY(articleId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Proposal>;
  } catch {
    return {};
  }
}

function clearPersistedSession(articleId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY(articleId));
  localStorage.removeItem(MESSAGES_KEY(articleId));
  localStorage.removeItem(PROPOSALS_KEY(articleId));
}

interface PostStore {
  codeBlocks: Record<string, CodeBlockState>;
  session: SessionState;

  // codeBlocks actions
  initCodeBlock: (blockId: string, code: string, language: string, articleId?: string) => void;
  updateCode: (blockId: string, code: string) => void;
  setOutput: (blockId: string, output: string | null, error: string | null) => void;
  setRunning: (blockId: string, running: boolean) => void;
  setExpanded: (blockId: string, expanded: boolean) => void;
  addAIMessage: (blockId: string, message: ChatMessage, articleId?: string) => void;
  updateLastAIMessage: (blockId: string, content: string, articleId?: string) => void;

  // session actions
  setSessionId: (id: string | null, articleId?: string) => void;
  setActiveBlockId: (id: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposalStatus: (id: string, status: Proposal["status"]) => void;
  setGlobalError: (error: string | null) => void;
  newSession: (blockId: string, articleId?: string) => void;
  loadPersistedSession: (articleId: string) => string | null;
  loadPersistedProposals: (articleId: string) => void;
}

const initialSession: SessionState = {
  sessionId: null,
  activeBlockId: null,
  articleId: null,
  isStreaming: false,
  sseConnected: false,
  proposals: {},
  globalError: null,
};

export const usePostStore = create<PostStore>((set) => ({
  codeBlocks: {},
  session: initialSession,

  initCodeBlock: (blockId, code, language, articleId) =>
    set((state) => {
      const existing = state.codeBlocks[blockId];
      const persisted = articleId ? loadMessages(articleId, blockId) : [];
      const storedProposals = articleId ? loadProposals(articleId) : {};
      const nextSession = articleId
        ? {
            ...state.session,
            articleId,
            proposals: { ...storedProposals, ...state.session.proposals },
          }
        : state.session;
      if (existing) {
        return nextSession === state.session ? state : { session: nextSession };
      }
      return {
        session: nextSession,
        codeBlocks: {
          ...state.codeBlocks,
          [blockId]: {
            code,
            originalCode: code,
            language,
            output: null,
            isRunning: false,
            runError: null,
            isExpanded: false,
            aiMessages: persisted,
          },
        },
      };
    }),

  updateCode: (blockId, code) =>
    set((state) => ({
      codeBlocks: {
        ...state.codeBlocks,
        [blockId]: { ...state.codeBlocks[blockId], code },
      },
    })),

  setOutput: (blockId, output, error) =>
    set((state) => ({
      codeBlocks: {
        ...state.codeBlocks,
        [blockId]: { ...state.codeBlocks[blockId], output, runError: error },
      },
    })),

  setRunning: (blockId, running) =>
    set((state) => ({
      codeBlocks: {
        ...state.codeBlocks,
        [blockId]: { ...state.codeBlocks[blockId], isRunning: running },
      },
    })),

  setExpanded: (blockId, expanded) =>
    set((state) => ({
      codeBlocks: {
        ...state.codeBlocks,
        [blockId]: { ...state.codeBlocks[blockId], isExpanded: expanded },
      },
    })),

  addAIMessage: (blockId, message, articleId) =>
    set((state) => {
      const block = state.codeBlocks[blockId];
      if (!block) return state;
      const aiMessages = [...block.aiMessages, message];
      if (articleId) saveMessages(articleId, blockId, aiMessages);
      return {
        codeBlocks: {
          ...state.codeBlocks,
          [blockId]: { ...block, aiMessages },
        },
      };
    }),

  updateLastAIMessage: (blockId, content, articleId) =>
    set((state) => {
      const block = state.codeBlocks[blockId];
      if (!block || block.aiMessages.length === 0) return state;
      const messages = [...block.aiMessages];
      messages[messages.length - 1] = { ...messages[messages.length - 1], content };
      if (articleId) saveMessages(articleId, blockId, messages);
      return {
        codeBlocks: {
          ...state.codeBlocks,
          [blockId]: { ...block, aiMessages: messages },
        },
      };
    }),

  setSessionId: (id, articleId) => {
    if (articleId) saveSession(articleId, id);
    set((state) => ({
      session: {
        ...state.session,
        sessionId: id,
        articleId: articleId ?? state.session.articleId,
      },
    }));
  },

  setActiveBlockId: (id) =>
    set((state) => ({ session: { ...state.session, activeBlockId: id } })),

  setStreaming: (streaming) =>
    set((state) => ({ session: { ...state.session, isStreaming: streaming } })),

  addProposal: (proposal) =>
    set((state) => {
      const proposals = { ...state.session.proposals, [proposal.id]: proposal };
      if (state.session.articleId) saveProposals(state.session.articleId, proposals);
      return {
        session: { ...state.session, proposals },
      };
    }),

  updateProposalStatus: (id, status) =>
    set((state) => {
      const existing = state.session.proposals[id];
      if (!existing) return state;
      const proposals = {
        ...state.session.proposals,
        [id]: { ...existing, status },
      };
      if (state.session.articleId) saveProposals(state.session.articleId, proposals);
      return {
        session: { ...state.session, proposals },
      };
    }),

  setGlobalError: (error) =>
    set((state) => ({ session: { ...state.session, globalError: error } })),

  newSession: (blockId, articleId) =>
    set((state) => {
      if (articleId) clearPersistedSession(articleId);
      const block = state.codeBlocks[blockId];
      return {
        session: { ...initialSession, articleId: articleId ?? null },
        codeBlocks: block
          ? { ...state.codeBlocks, [blockId]: { ...block, aiMessages: [] } }
          : state.codeBlocks,
      };
    }),

  loadPersistedSession: (articleId) => loadSession(articleId),

  loadPersistedProposals: (articleId) =>
    set((state) => {
      if (!articleId) return state;
      const stored = loadProposals(articleId);
      const merged = { ...stored, ...state.session.proposals };
      return {
        session: {
          ...state.session,
          articleId,
          proposals: merged,
        },
      };
    }),
}));
