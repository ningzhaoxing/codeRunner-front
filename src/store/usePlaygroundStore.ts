import { create } from "zustand";
import type { ChatMessage, Proposal } from "@/types";
import { templates, type SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/templates";

const STORAGE_KEY = "playground-state";
const STORAGE_VERSION = 1;
const DEBOUNCE_MS = 500;

interface PlaygroundStorage {
  version: number;
  activeLanguage: string;
  files: Record<string, { code: string; lastModified: number }>;
}

function readStorage(): PlaygroundStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PlaygroundStorage;
    if (data.version !== STORAGE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

function writeStorage(
  language: string,
  code: string,
  allFiles: Record<string, { code: string; lastModified: number }>,
) {
  const data: PlaygroundStorage = {
    version: STORAGE_VERSION,
    activeLanguage: language,
    files: { ...allFiles, [language]: { code, lastModified: Date.now() } },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

interface PlaygroundStore {
  language: SupportedLanguage;
  code: string;
  output: string | null;
  runError: string | null;
  isRunning: boolean;
  isSaved: boolean;

  isAIOpen: boolean;
  aiMessages: ChatMessage[];
  sessionId: string | null;
  isStreaming: boolean;
  proposals: Record<string, Proposal>;

  // Internal: tracks all saved files across languages
  _files: Record<string, { code: string; lastModified: number }>;
  _saveTimer: ReturnType<typeof setTimeout> | null;
  _initFromURL: boolean; // true if initialized from URL params

  setLanguage: (lang: SupportedLanguage) => boolean;
  setCode: (code: string) => void;
  setOutput: (output: string | null, error: string | null) => void;
  setRunning: (running: boolean) => void;
  toggleAI: () => void;
  addAIMessage: (message: ChatMessage) => void;
  updateLastAIMessage: (content: string) => void;
  setSessionId: (id: string) => void;
  setStreaming: (streaming: boolean) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposalStatus: (id: string, status: Proposal["status"]) => void;
  newAISession: () => void;
  initFromURL: (lang: SupportedLanguage, code: string) => void;
  loadFromStorage: () => void;
}

export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
  language: "go",
  code: templates.go.defaultCode,
  output: null,
  runError: null,
  isRunning: false,
  isSaved: true,

  isAIOpen: false,
  aiMessages: [],
  sessionId: null,
  isStreaming: false,
  proposals: {},

  _files: {},
  _saveTimer: null,
  _initFromURL: false,

  setLanguage: (lang) => {
    const state = get();
    // Save current language's code
    const updatedFiles = {
      ...state._files,
      [state.language]: { code: state.code, lastModified: Date.now() },
    };
    writeStorage(state.language, state.code, updatedFiles);

    // Load target language's code
    const saved = updatedFiles[lang];
    const code = saved ? saved.code : templates[lang].defaultCode;

    // Clear AI context
    const hadMessages = state.aiMessages.length > 0;

    set({
      language: lang,
      code,
      output: null,
      runError: null,
      isRunning: false,
      isSaved: true,
      aiMessages: [],
      sessionId: null,
      proposals: {},
      _files: updatedFiles,
      _initFromURL: false,
    });

    return hadMessages; // caller can show toast if true
  },

  setCode: (code) => {
    const state = get();
    if (state._saveTimer) clearTimeout(state._saveTimer);

    const timer = setTimeout(() => {
      const s = get();
      if (!s._initFromURL) {
        writeStorage(s.language, s.code, s._files);
      }
      set({ isSaved: true, _saveTimer: null });
    }, DEBOUNCE_MS);

    set({ code, isSaved: false, _saveTimer: timer, _initFromURL: false });
  },

  setOutput: (output, error) => set({ output, runError: error }),
  setRunning: (running) => set({ isRunning: running }),
  toggleAI: () => set((s) => ({ isAIOpen: !s.isAIOpen })),

  addAIMessage: (message) =>
    set((s) => ({ aiMessages: [...s.aiMessages, message] })),
  updateLastAIMessage: (content) =>
    set((s) => {
      if (s.aiMessages.length === 0) return s;
      const msgs = [...s.aiMessages];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      return { aiMessages: msgs };
    }),

  setSessionId: (id) => set({ sessionId: id }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  addProposal: (proposal) =>
    set((s) => ({ proposals: { ...s.proposals, [proposal.id]: proposal } })),
  updateProposalStatus: (id, status) =>
    set((s) => {
      const p = s.proposals[id];
      if (!p) return s;
      return { proposals: { ...s.proposals, [id]: { ...p, status } } };
    }),

  newAISession: () => set({ aiMessages: [], sessionId: null, proposals: {}, isStreaming: false }),

  initFromURL: (lang, code) => {
    const validLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : "go";
    set({
      language: validLang,
      code,
      output: null,
      runError: null,
      isSaved: true,
      aiMessages: [],
      sessionId: null,
      proposals: {},
      _initFromURL: true,
    });
  },

  loadFromStorage: () => {
    const stored = readStorage();
    if (!stored) return;
    const lang = (
      SUPPORTED_LANGUAGES.includes(stored.activeLanguage as SupportedLanguage)
        ? stored.activeLanguage
        : "go"
    ) as SupportedLanguage;
    const saved = stored.files[lang];
    set({
      language: lang,
      code: saved ? saved.code : templates[lang].defaultCode,
      _files: stored.files,
      isSaved: true,
    });
  },
}));
