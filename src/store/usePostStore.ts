import { create } from "zustand";
import { CodeBlockState, SessionState, Proposal, ChatMessage } from "@/types";

interface PostStore {
  codeBlocks: Record<string, CodeBlockState>;
  session: SessionState;

  // codeBlocks actions
  initCodeBlock: (blockId: string, code: string, language: string) => void;
  updateCode: (blockId: string, code: string) => void;
  setOutput: (blockId: string, output: string | null, error: string | null) => void;
  setRunning: (blockId: string, running: boolean) => void;
  setExpanded: (blockId: string, expanded: boolean) => void;
  addAIMessage: (blockId: string, message: ChatMessage) => void;
  updateLastAIMessage: (blockId: string, content: string) => void;

  // session actions
  setSessionId: (id: string | null) => void;
  setActiveBlockId: (id: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposalStatus: (id: string, status: Proposal["status"]) => void;
  setGlobalError: (error: string | null) => void;
  newSession: (blockId: string) => void;  // generate new session + clear AI messages
}

const initialSession: SessionState = {
  sessionId: null,
  activeBlockId: null,
  isStreaming: false,
  sseConnected: false,
  proposals: {},
  globalError: null,
};

export const usePostStore = create<PostStore>((set) => ({
  codeBlocks: {},
  session: initialSession,

  initCodeBlock: (blockId, code, language) =>
    set((state) => ({
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
          aiMessages: [],
        },
      },
    })),

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

  addAIMessage: (blockId, message) =>
    set((state) => ({
      codeBlocks: {
        ...state.codeBlocks,
        [blockId]: {
          ...state.codeBlocks[blockId],
          aiMessages: [...state.codeBlocks[blockId].aiMessages, message],
        },
      },
    })),

  updateLastAIMessage: (blockId, content) =>
    set((state) => {
      const block = state.codeBlocks[blockId];
      if (!block || block.aiMessages.length === 0) return state;
      const messages = [...block.aiMessages];
      messages[messages.length - 1] = { ...messages[messages.length - 1], content };
      return {
        codeBlocks: {
          ...state.codeBlocks,
          [blockId]: { ...block, aiMessages: messages },
        },
      };
    }),

  setSessionId: (id) =>
    set((state) => ({ session: { ...state.session, sessionId: id } })),

  setActiveBlockId: (id) =>
    set((state) => ({ session: { ...state.session, activeBlockId: id } })),

  setStreaming: (streaming) =>
    set((state) => ({ session: { ...state.session, isStreaming: streaming } })),

  addProposal: (proposal) =>
    set((state) => ({
      session: {
        ...state.session,
        proposals: { ...state.session.proposals, [proposal.id]: proposal },
      },
    })),

  updateProposalStatus: (id, status) =>
    set((state) => ({
      session: {
        ...state.session,
        proposals: {
          ...state.session.proposals,
          [id]: { ...state.session.proposals[id], status },
        },
      },
    })),

  setGlobalError: (error) =>
    set((state) => ({ session: { ...state.session, globalError: error } })),

  newSession: (blockId) =>
    set((state) => {
      const block = state.codeBlocks[blockId];
      return {
        session: { ...initialSession, sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}` },
        codeBlocks: block
          ? { ...state.codeBlocks, [blockId]: { ...block, aiMessages: [] } }
          : state.codeBlocks,
      };
    }),
}));
