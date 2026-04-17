# Playground 页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有博客前端中新增 `/playground` 页面，提供全屏代码编辑、运行、语言切换、localStorage 持久化、URL 分享、AI 助手功能。

**Architecture:** 新建独立的 `usePlaygroundStore` 管理 Playground 状态（不复用 `usePostStore`）。复用 Monaco Editor、OutputPanel、ChatMessages、ChatInput、CodeSuggestion 等展示组件。新建 PlaygroundToolbar、LanguageSelector、StatusBar、PlaygroundAIPanel。pako 压缩 URL 分享。

**Tech Stack:** Next.js 16, React 18, TypeScript, Tailwind v4, Monaco Editor, Zustand, pako

**Spec:** `docs/superpowers/specs/2026-04-16-playground-design.md`

---

## 文件结构

```
新建文件:
  src/lib/templates.ts              — 5 种语言的默认模板 + 文件名映射
  src/lib/share.ts                  — URL 编码/解码（pako 压缩 + base64url）
  src/store/usePlaygroundStore.ts   — Playground 独立 Zustand store
  src/components/LanguageSelector.tsx — 语言下拉选择器
  src/components/PlaygroundToolbar.tsx — 工具栏（语言选择+按钮）
  src/components/StatusBar.tsx       — 底部状态栏
  src/components/PlaygroundAIPanel.tsx — Playground 专用 AI 面板（用 playgroundStore）
  src/app/playground/page.tsx        — Playground 页面

修改文件:
  src/components/Navbar.tsx          — 加 Playground 导航链接
  src/components/CodeBlockHeader.tsx — 加"↗ Playground"按钮
```

### 关于 AIPanel 的复用决策

现有 `AIPanel` 深度耦合 `usePostStore`（通过 11 个 selector 和 action）。Playground 使用独立的 `usePlaygroundStore`。有两条路：

1. 重构 AIPanel 为 store-agnostic（接口改动大，影响文章页）
2. 新建 `PlaygroundAIPanel` 复用 ChatMessages/ChatInput/CodeSuggestion 子组件

选择方案 2 — 新建 `PlaygroundAIPanel`，复用展示层子组件，逻辑层接 `usePlaygroundStore`。代码量约 120 行，和 AIPanel 结构类似但不共享状态逻辑。

---

## Task 1: 语言模板 + URL 分享工具

**Files:**
- Create: `src/lib/templates.ts`
- Create: `src/lib/share.ts`

- [ ] **Step 1: 安装 pako**

```bash
cd /Users/ningzhaoxing/Desktop/code_runner/codeRunner-front
npm install pako
npm install -D @types/pako
```

- [ ] **Step 2: 创建语言模板**

创建 `src/lib/templates.ts`：

```typescript
export interface LangTemplate {
  filename: string;
  monacoLang: string;
  label: string;
  defaultCode: string;
}

export const SUPPORTED_LANGUAGES = ["go", "python", "javascript", "java", "c"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const templates: Record<SupportedLanguage, LangTemplate> = {
  go: {
    filename: "main.go",
    monacoLang: "go",
    label: "Go",
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  },
  python: {
    filename: "main.py",
    monacoLang: "python",
    label: "Python",
    defaultCode: `print("Hello, World!")`,
  },
  javascript: {
    filename: "index.js",
    monacoLang: "javascript",
    label: "JavaScript",
    defaultCode: `console.log("Hello, World!");`,
  },
  java: {
    filename: "Main.java",
    monacoLang: "java",
    label: "Java",
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },
  c: {
    filename: "main.c",
    monacoLang: "c",
    label: "C",
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  },
};
```

- [ ] **Step 3: 创建 URL 分享工具**

创建 `src/lib/share.ts`：

```typescript
import pako from "pako";

const MAX_URL_CODE_LENGTH = 2048;

export function encodeCode(code: string): string | null {
  try {
    const compressed = pako.deflateRaw(new TextEncoder().encode(code));
    const base64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    if (base64.length > MAX_URL_CODE_LENGTH) return null;
    return base64;
  } catch {
    // fallback: plain base64
    try {
      const encoded = btoa(unescape(encodeURIComponent(code)));
      if (encoded.length > MAX_URL_CODE_LENGTH) return null;
      return encoded;
    } catch {
      return null;
    }
  }
}

export function decodeCode(encoded: string): string | null {
  try {
    // Restore base64url to standard base64
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decompressed = pako.inflateRaw(bytes);
    return new TextDecoder().decode(decompressed);
  } catch {
    // fallback: try plain base64
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return null;
    }
  }
}

export async function copyShareURL(lang: string, code: string): Promise<{ ok: boolean; message: string }> {
  const encoded = encodeCode(code);
  if (!encoded) {
    return { ok: false, message: "代码过长，建议手动复制分享" };
  }
  const url = `${window.location.origin}/playground?lang=${lang}&code=${encoded}`;
  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, message: "链接已复制" };
  } catch {
    return { ok: false, message: "复制失败，请手动复制" };
  }
}
```

- [ ] **Step 4: 验证构建**

```bash
npm run build
```

- [ ] **Step 5: 提交**

```bash
git add src/lib/templates.ts src/lib/share.ts package.json package-lock.json
git commit -m "feat: add language templates and URL share utilities"
```

---

## Task 2: Playground Zustand Store

**Files:**
- Create: `src/store/usePlaygroundStore.ts`

- [ ] **Step 1: 创建 store**

创建 `src/store/usePlaygroundStore.ts`：

```typescript
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

function writeStorage(language: string, code: string, allFiles: Record<string, { code: string; lastModified: number }>) {
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
  _initFromURL: boolean;  // true if initialized from URL params

  setLanguage: (lang: SupportedLanguage) => void;
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

  addAIMessage: (message) => set((s) => ({ aiMessages: [...s.aiMessages, message] })),
  updateLastAIMessage: (content) =>
    set((s) => {
      if (s.aiMessages.length === 0) return s;
      const msgs = [...s.aiMessages];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      return { aiMessages: msgs };
    }),

  setSessionId: (id) => set({ sessionId: id }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  addProposal: (proposal) => set((s) => ({ proposals: { ...s.proposals, [proposal.id]: proposal } })),
  updateProposalStatus: (id, status) =>
    set((s) => {
      const p = s.proposals[id];
      if (!p) return s;
      return { proposals: { ...s.proposals, [id]: { ...p, status } } };
    }),

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
    const lang = (SUPPORTED_LANGUAGES.includes(stored.activeLanguage as SupportedLanguage)
      ? stored.activeLanguage
      : "go") as SupportedLanguage;
    const saved = stored.files[lang];
    set({
      language: lang,
      code: saved ? saved.code : templates[lang].defaultCode,
      _files: stored.files,
      isSaved: true,
    });
  },
}));
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

- [ ] **Step 3: 提交**

```bash
git add src/store/usePlaygroundStore.ts
git commit -m "feat: add Playground Zustand store with localStorage persistence"
```

---

## Task 3: PlaygroundToolbar + LanguageSelector + StatusBar

**Files:**
- Create: `src/components/LanguageSelector.tsx`
- Create: `src/components/PlaygroundToolbar.tsx`
- Create: `src/components/StatusBar.tsx`

- [ ] **Step 1: 创建 LanguageSelector**

创建 `src/components/LanguageSelector.tsx`：

```tsx
"use client";

import { templates, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/templates";

interface Props {
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

export default function LanguageSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SupportedLanguage)}
      className="bg-surface-3 text-text-body text-xs border border-border rounded px-2 py-1 outline-none cursor-pointer hover:bg-surface-2 transition-colors"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {templates[lang].label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: 创建 PlaygroundToolbar**

创建 `src/components/PlaygroundToolbar.tsx`：

```tsx
"use client";

import LanguageSelector from "./LanguageSelector";
import { templates, type SupportedLanguage } from "@/lib/templates";

interface Props {
  language: SupportedLanguage;
  isRunning: boolean;
  isAIOpen: boolean;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRun: () => void;
  onToggleAI: () => void;
  onShare: () => void;
}

export default function PlaygroundToolbar({
  language, isRunning, isAIOpen, onLanguageChange, onRun, onToggleAI, onShare,
}: Props) {
  const filename = templates[language].filename;

  return (
    <div className="flex items-center justify-between bg-surface-2 border-b border-border px-4 py-2">
      <div className="flex items-center gap-3">
        <LanguageSelector value={language} onChange={onLanguageChange} />
        <span className="text-accent text-xs font-mono">{filename}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="text-accent bg-surface-3 hover:bg-surface-2 px-3 py-1 rounded text-xs font-mono border border-border transition-colors disabled:opacity-50"
        >
          {isRunning ? "⏳" : "▶ Run"}
        </button>
        <button
          onClick={onToggleAI}
          className={`px-2.5 py-1 rounded text-xs border border-border transition-colors ${isAIOpen ? "bg-accent/20 text-accent" : "bg-surface-3 text-text-secondary hover:bg-surface-2"}`}
        >
          🤖 AI
        </button>
        <button
          onClick={onShare}
          className="bg-surface-3 text-text-secondary hover:bg-surface-2 px-2.5 py-1 rounded text-xs border border-border transition-colors"
          title="分享链接"
        >
          🔗
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 StatusBar**

创建 `src/components/StatusBar.tsx`：

```tsx
"use client";

import { templates, type SupportedLanguage } from "@/lib/templates";

interface Props {
  language: SupportedLanguage;
  code: string;
  isSaved: boolean;
}

export default function StatusBar({ language, code, isSaved }: Props) {
  const lines = code.split("\n").length;
  const chars = code.length;

  return (
    <div className="flex items-center justify-between bg-surface-nav border-t border-border px-4 py-1.5 text-[11px] text-text-disabled">
      <div className="flex items-center gap-3">
        <span>{templates[language].label}</span>
        <span>{chars} chars</span>
        <span>{lines} lines</span>
      </div>
      <span className={isSaved ? "text-text-disabled" : "text-accent"}>
        {isSaved ? "已保存" : "保存中..."}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: 验证构建**

```bash
npm run build
```

- [ ] **Step 5: 提交**

```bash
git add src/components/LanguageSelector.tsx src/components/PlaygroundToolbar.tsx src/components/StatusBar.tsx
git commit -m "feat: add PlaygroundToolbar, LanguageSelector, StatusBar"
```

---

## Task 4: Playground 页面 + PlaygroundAIPanel

**Files:**
- Create: `src/components/PlaygroundAIPanel.tsx`
- Create: `src/app/playground/page.tsx`

- [ ] **Step 1: 创建 PlaygroundAIPanel**

创建 `src/components/PlaygroundAIPanel.tsx` — 与 `AIPanel` 结构类似，但使用 `usePlaygroundStore`：

```tsx
"use client";

import { useCallback, useRef } from "react";
import { usePlaygroundStore } from "@/store/usePlaygroundStore";
import { chatWithAgent } from "@/lib/api";
import type { SSEEvent } from "@/lib/sse";
import type { Proposal, ChatMessage } from "@/types";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

let msgIdCounter = 0;
function nextMsgId() {
  return `pg-msg-${Date.now()}-${++msgIdCounter}`;
}

export default function PlaygroundAIPanel() {
  const store = usePlaygroundStore();
  const abortRef = useRef<AbortController | null>(null);
  const sentCtx = useRef(false);

  const sendMessage = useCallback(async (text: string) => {
    if (store.isStreaming) return;

    store.addAIMessage({ id: nextMsgId(), blockId: "playground", type: "user", content: text, timestamp: Date.now() });
    store.addAIMessage({ id: nextMsgId(), blockId: "playground", type: "ai", content: "", timestamp: Date.now() });
    store.setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const currentState = usePlaygroundStore.getState();
    const articleCtx = !sentCtx.current && !currentState.sessionId
      ? { article_id: "", article_content: "", code_blocks: [{ block_id: "playground", language: currentState.language, code: currentState.code }] }
      : undefined;
    if (articleCtx) sentCtx.current = true;

    let aiContent = "";

    try {
      await chatWithAgent(
        {
          session_id: currentState.sessionId ?? "",
          user_message: text,
          active_block_id: "playground",
          current_code: currentState.code,
          article_ctx: articleCtx,
        },
        (event: SSEEvent) => {
          if (event.type === "session" && typeof event.session_id === "string") {
            store.setSessionId(event.session_id);
          } else if (event.type === "chunk" && typeof event.content === "string") {
            aiContent += event.content;
            store.updateLastAIMessage(aiContent);
          } else if (event.type === "proposal") {
            const p = event as unknown as { proposal_id: string; code: string; language: string; description: string };
            const proposal: Proposal = {
              id: p.proposal_id, blockId: "playground", code: p.code, language: p.language,
              description: p.description, createdAt: Date.now(), expiresAt: Date.now() + 600000, status: "pending",
            };
            store.addProposal(proposal);
            store.addAIMessage({ id: nextMsgId(), blockId: "playground", type: "proposal", content: "", proposalId: proposal.id, timestamp: Date.now() });
          } else if (event.type === "execution_result") {
            const output = (event.output as string) ?? "";
            const error = (event.error as string) ?? null;
            store.setOutput(output || null, error);
            store.addAIMessage({ id: nextMsgId(), blockId: "playground", type: "execution_result", content: error ? `Error: ${error}` : output, timestamp: Date.now() });
            if (typeof event.proposal_id === "string") store.updateProposalStatus(event.proposal_id, "executed");
          } else if (event.type === "interrupted") {
            store.addAIMessage({ id: nextMsgId(), blockId: "playground", type: "interrupted", content: "", timestamp: Date.now() });
          } else if (event.type === "error") {
            store.addAIMessage({ id: nextMsgId(), blockId: "playground", type: "error", content: (event.message as string) ?? "未知错误", timestamp: Date.now() });
          }
        },
        controller.signal,
      );
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        store.addAIMessage({ id: nextMsgId(), blockId: "playground", type: "error", content: "网络错误，请重试", timestamp: Date.now() });
      }
    } finally {
      store.setStreaming(false);
      abortRef.current = null;
    }
  }, [store]);

  const shortcuts = [
    { label: "📖 解释", prompt: "请解释这段代码的逻辑和设计意图" },
    { label: "🐛 调试", prompt: `请分析这段代码的问题并给出修复建议。当前输出是：${store.output || "(无)"}` },
    { label: "🧪 测试", prompt: "请为这段代码生成边界测试用例" },
  ];

  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs text-text-title font-medium">🤖 AI 助手</span>
        <div className="flex gap-1">
          {shortcuts.map((s) => (
            <button key={s.label} onClick={() => sendMessage(s.prompt)} disabled={store.isStreaming}
              className="text-[11px] px-1.5 py-0.5 rounded bg-surface-3 text-text-secondary hover:text-text-body hover:bg-surface-2 transition-colors disabled:opacity-40">
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <ChatMessages messages={store.aiMessages} blockId="playground" />
      <ChatInput onSend={sendMessage} disabled={store.isStreaming} />
    </div>
  );
}
```

Note: `CodeSuggestion` component used by `ChatMessages` reads proposals from `usePostStore`. For Playground, we need `CodeSuggestion` to also work with `usePlaygroundStore`. The simplest fix: pass the proposal data and callbacks as props to `CodeSuggestion` instead of reading from store. BUT this would be a refactor. For MVP, simpler approach: have the Playground page also write proposals into `usePostStore.session.proposals` (just the proposals map, not the full state). OR: modify `CodeSuggestion` to accept an optional `proposal` prop + callbacks.

Actually, the cleanest MVP approach: `CodeSuggestion` currently reads `usePostStore((s) => s.session.proposals[proposalId])`. For Playground proposals to work, modify `CodeSuggestion` to accept `proposal` as an optional prop. If provided, use it. If not, read from store (existing behavior).

The implementer should handle this — add `proposal?: Proposal` and `onApply?: () => void` and `onConfirm?: () => void` optional props to `CodeSuggestion`. When in Playground context (these props provided), use them. When in article context (props not provided), use store.

- [ ] **Step 2: 创建 Playground 页面**

创建 `src/app/playground/page.tsx`：

这是 "use client" 组件。核心布局：

```tsx
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { usePlaygroundStore } from "@/store/usePlaygroundStore";
import { executeCode } from "@/lib/api";
import { decodeCode, copyShareURL } from "@/lib/share";
import { templates, type SupportedLanguage } from "@/lib/templates";
import PlaygroundToolbar from "@/components/PlaygroundToolbar";
import OutputPanel from "@/components/OutputPanel";
import StatusBar from "@/components/StatusBar";
import PlaygroundAIPanel from "@/components/PlaygroundAIPanel";

const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <div className="flex-1 bg-[#1e1e1e]" />,
});

export default function PlaygroundPage() {
  const store = usePlaygroundStore();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  // Initialize from URL or localStorage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const urlLang = searchParams.get("lang") as SupportedLanguage | null;
    const urlCode = searchParams.get("code");

    if (urlLang && urlCode) {
      const decoded = decodeCode(urlCode);
      if (decoded) {
        store.initFromURL(urlLang, decoded);
        return;
      }
      // decode failed — show toast and fallback
      // (toast implementation: simple alert or state-based)
    }
    store.loadFromStorage();
  }, [searchParams, store]);

  const handleRun = useCallback(async () => {
    const s = usePlaygroundStore.getState();
    if (s.isRunning) return;
    store.setOutput(null, null);
    store.setRunning(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      await executeCode("playground", s.language, s.code, (event) => {
        if (event.type === "result") {
          store.setOutput((event.output as string) ?? null, (event.error as string) ?? null);
        } else if (event.type === "error") {
          store.setOutput(null, (event.message as string) ?? "执行出错");
        }
      }, controller.signal);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        store.setOutput(null, "执行超时");
      } else {
        store.setOutput(null, "网络错误，请重试");
      }
    } finally {
      clearTimeout(timeout);
      store.setRunning(false);
    }
  }, [store]);

  const handleShare = useCallback(async () => {
    const s = usePlaygroundStore.getState();
    const result = await copyShareURL(s.language, s.code);
    // Show toast (alert for MVP, can be replaced later)
    alert(result.message);
  }, []);

  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    const hadMessages = store.setLanguage(lang);
    if (hadMessages) {
      alert("AI 对话已清空"); // toast for MVP
    }
  }, [store]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        alert("已保存"); // toast
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]"> {/* 56px = navbar height */}
      <PlaygroundToolbar
        language={store.language}
        isRunning={store.isRunning}
        isAIOpen={store.isAIOpen}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onToggleAI={() => store.toggleAI()}
        onShare={handleShare}
      />

      <div className="flex flex-1 min-h-0">
        {/* Editor + Output */}
        <div className={`flex flex-col ${store.isAIOpen ? "flex-[6]" : "flex-1"} border-r border-border`}>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={templates[store.language].monacoLang}
              value={store.code}
              onChange={(val) => store.setCode(val ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineHeight: 20,
                padding: { top: 12 },
                renderLineHighlight: "gutter",
                scrollbar: { vertical: "auto", horizontal: "auto" },
              }}
            />
          </div>
          <div className="h-[160px] border-t border-border overflow-auto">
            <OutputPanel output={store.output} error={store.runError} isRunning={store.isRunning} />
          </div>
        </div>

        {/* AI Panel */}
        {store.isAIOpen && (
          <div className="flex-[4] min-w-[280px]">
            <PlaygroundAIPanel />
          </div>
        )}
      </div>

      <StatusBar language={store.language} code={store.code} isSaved={store.isSaved} />
    </div>
  );
}
```

Note about `useSearchParams`: In Next.js App Router, `useSearchParams` must be used inside a `Suspense` boundary when the page uses static rendering. Since Playground is a client component, wrap it with Suspense in the page or use `"use client"` at page level (which is what we're doing). If build complains, add a `loading.tsx` or wrap with Suspense.

- [ ] **Step 3: Handle CodeSuggestion store coupling**

Modify `src/components/CodeSuggestion.tsx` to accept optional props for Playground compatibility:
- Add optional `proposal?: Proposal` prop (if provided, use it instead of reading from store)
- Add optional `onApply?: () => void` prop
- Add optional `onConfirm?: () => void` prop
- Existing behavior (reading from usePostStore) remains the default when these props are not provided

- [ ] **Step 4: 验证构建**

```bash
npm run build
```

- [ ] **Step 5: 提交**

```bash
git add src/components/PlaygroundAIPanel.tsx src/components/CodeSuggestion.tsx src/app/playground/
git commit -m "feat: add Playground page with AI panel"
```

---

## Task 5: 修改已有组件（Navbar + CodeBlockHeader）

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/CodeBlockHeader.tsx`

- [ ] **Step 1: 给 Navbar 加 Playground 链接**

在 Navbar 的导航链接中添加 "Playground"，放在"首页"之后：

```tsx
<Link href="/playground" className="text-text-secondary hover:text-text-title text-sm transition-colors">
  Playground
</Link>
```

- [ ] **Step 2: 给 CodeBlockHeader 加"↗"按钮**

在 CodeBlockHeader 的按钮区域（⤢ 按钮之后）添加跳转按钮。

需要新增 props:
- `onOpenPlayground?: () => void` — 可选，有则显示按钮

```tsx
{onOpenPlayground && (
  <button
    onClick={onOpenPlayground}
    className="hover:bg-surface-3 px-1.5 py-0.5 rounded text-xs transition-colors"
    title="在 Playground 中打开"
  >
    ↗
  </button>
)}
```

在 `CodeBlock.tsx` 中，传入 `onOpenPlayground` 回调：

```tsx
import { useRouter } from "next/navigation";
import { encodeCode } from "@/lib/share";

// In component:
const router = useRouter();

const handleOpenPlayground = () => {
  const encoded = encodeCode(currentCode);
  if (encoded) {
    router.push(`/playground?lang=${langInfo.monacoLang}&code=${encoded}`);
  }
};

// In JSX:
<CodeBlockHeader ... onOpenPlayground={handleOpenPlayground} />
```

- [ ] **Step 3: 验证构建 + 导航测试**

```bash
npm run build
```

验证：
- 导航栏出现 Playground 链接
- 文章代码块出现 ↗ 按钮
- 点击 ↗ 跳转到 /playground 并带入代码

- [ ] **Step 4: 提交**

```bash
git add src/components/Navbar.tsx src/components/CodeBlockHeader.tsx src/components/CodeBlock.tsx
git commit -m "feat: add Playground link to Navbar and open-in-playground button"
```

---

## Task 6: 最终验证

- [ ] **Step 1: 完整流程验证**

1. 首页 → 导航栏有 Playground 链接
2. 点击 Playground → /playground 页面加载，Go 默认模板
3. 编辑代码 → 状态栏显示 "保存中..." → 500ms 后 "已保存"
4. 切换到 Python → 编辑器加载 Python 模板，Go 代码已保存
5. 切换回 Go → 之前编辑的 Go 代码恢复
6. 刷新页面 → 恢复 localStorage 中的状态
7. 点击 ▶ Run → 显示 loading → Output 显示结果或错误
8. 点击 🤖 AI → 右侧展开 AI 面板
9. 点击 🔗 分享 → 复制 URL → 新标签打开 → 代码正确加载
10. 文章页代码块 ↗ 按钮 → 跳转到 Playground 并带入代码
11. Ctrl+Enter → 运行代码

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: Playground page complete"
```

---

## 任务依赖图

```
Task 1 (模板 + 分享工具)
  ↓
Task 2 (Zustand Store)
  ↓
Task 3 (Toolbar + Selector + StatusBar)
  ↓
Task 4 (Playground 页面 + AI Panel)  ← 核心
  ↓
Task 5 (修改 Navbar + CodeBlockHeader)
  ↓
Task 6 (最终验证)
```
