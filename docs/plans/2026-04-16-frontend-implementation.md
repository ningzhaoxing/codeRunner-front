# CodeRunner 前端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建 CodeRunner 技术博客前端，包含文章渲染、可编辑代码块、代码运行、AI 助手对话面板。

**Architecture:** Next.js App Router + SSG 渲染本地 Markdown 文章。代码块用 Monaco Editor 实现可编辑，通过 SSE 对接后端 `/api/execute` 和 `/api/chat` 接口。Zustand 管理文章页状态（代码块编辑状态、AI 会话、执行结果）。

**Tech Stack:** Next.js 14+, React 18, TypeScript, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), `react-markdown` + `rehype-highlight`, Zustand, SSE (fetch + ReadableStream)

**Spec:** `docs/superpowers/specs/2026-04-16-frontend-ui-design.md`

---

## 文件结构

```
codeRunner-front/
├── content/                          # Markdown 文章源文件
│   ├── posts/
│   │   └── go-concurrency.md         # 示例文章
│   └── about.md
├── src/
│   ├── app/                          # Next.js App Router 页面
│   │   ├── layout.tsx                # 根布局（Navbar + Footer + 全局样式）
│   │   ├── page.tsx                  # 首页
│   │   ├── posts/
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # 文章详情页
│   │   ├── about/
│   │   │   └── page.tsx              # 关于页
│   │   ├── tags/
│   │   │   ├── page.tsx              # 标签归档页
│   │   │   └── [tag]/
│   │   │       └── page.tsx          # 按标签筛选
│   │   └── globals.css               # Tailwind 入口 + 自定义 CSS 变量
│   ├── components/
│   │   ├── Navbar.tsx                # 导航栏
│   │   ├── Footer.tsx                # 页脚
│   │   ├── PostCard.tsx              # 文章卡片（首页列表用）
│   │   ├── ArticleHeader.tsx         # 文章头部（标题、日期、标签）
│   │   ├── MarkdownRenderer.tsx      # Markdown 渲染器（代码块替换逻辑）
│   │   ├── CodeBlock.tsx             # 核心：可编辑代码块（收起/展开两态）
│   │   ├── CodeBlockHeader.tsx       # 代码块头部栏（文件名、按钮）
│   │   ├── OutputPanel.tsx           # 执行结果输出面板
│   │   ├── AIPanel.tsx               # AI 助手面板（右侧分栏）
│   │   ├── ChatMessages.tsx          # AI 对话消息列表
│   │   ├── ChatInput.tsx             # AI 对话输入框
│   │   └── CodeSuggestion.tsx        # AI 代码建议块（diff 展示）
│   ├── lib/
│   │   ├── markdown.ts               # Markdown 解析（gray-matter + 读文件）
│   │   ├── api.ts                    # 后端 API 调用（execute, chat, confirm）
│   │   └── sse.ts                    # SSE 流处理工具函数
│   ├── store/
│   │   └── usePostStore.ts           # Zustand store（文章页状态管理）
│   └── types/
│       └── index.ts                  # TypeScript 类型定义
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
├── package.json
└── .gitignore
```

---

## Task 1: 项目初始化 + Tailwind 暗色主题

**Files:**
- Create: `codeRunner-front/package.json` (via create-next-app)
- Create: `codeRunner-front/src/app/globals.css`
- Create: `codeRunner-front/tailwind.config.ts`
- Create: `codeRunner-front/src/app/layout.tsx`
- Create: `codeRunner-front/src/app/page.tsx`

- [ ] **Step 1: 初始化 Next.js 项目**

```bash
cd /Users/ningzhaoxing/Desktop/code_runner/codeRunner-front
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

选项选择：App Router = Yes, Turbopack = Yes, 其余默认。如果目录非空（有 .git 和 mockup.html），先把 mockup.html 移到临时位置再初始化。

- [ ] **Step 2: 配置 Tailwind 暗色主题色彩系统**

修改 `tailwind.config.ts`，添加 spec 定义的自定义颜色：

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#111122",
          nav: "#13132a",
          1: "#151515",
          2: "#1a1a1a",
          3: "#252525",
        },
        border: {
          DEFAULT: "#2a2a4a",
        },
        text: {
          title: "#e8e8f0",
          body: "#b0b0c8",
          secondary: "#8080a0",
          placeholder: "#5a5a7a",
          disabled: "#3a3a5a",
        },
        accent: "#90e86f",
        tag: "#77B7D7",
        error: "#ff6b6b",
        "msg-user": "#1e1e3a",
        "msg-ai": "#0d1a20",
        "diff-add": "#1a2e1a",
        "exec-ok": "#0d150d",
      },
      fontFamily: {
        mono: ['"Fira Mono"', '"DejaVu Sans Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: 设置全局样式**

替换 `src/app/globals.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #111122;
  color: #b0b0c8;
  font-size: 15px;
  line-height: 1.8;
}
```

- [ ] **Step 4: 设置根布局**

替换 `src/app/layout.tsx`：

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeRunner Blog",
  description: "技术博客 - 代码可直接运行",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-surface-0 text-text-body">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: 写一个临时首页验证主题生效**

替换 `src/app/page.tsx`：

```tsx
export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-text-title text-2xl font-semibold mb-2">CodeRunner Blog</h1>
      <p className="text-text-secondary">暗色主题测试 - 如果你看到深蓝灰背景和这行灰色文字，说明配置成功。</p>
      <div className="mt-8 p-4 bg-surface-1 border border-border rounded-lg font-mono text-[13px] text-accent">
        fmt.Println("Hello, CodeRunner!")
      </div>
    </main>
  );
}
```

- [ ] **Step 6: 启动开发服务器验证**

```bash
cd /Users/ningzhaoxing/Desktop/code_runner/codeRunner-front
npm run dev
```

在浏览器打开 http://localhost:3000，验证：深蓝灰背景 `#111122`、灰色文字、绿色代码块。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: init Next.js project with Tailwind dark theme"
```

---

## Task 2: 类型定义 + Zustand Store

**Files:**
- Create: `src/types/index.ts`
- Create: `src/store/usePostStore.ts`

- [ ] **Step 1: 定义 TypeScript 类型**

创建 `src/types/index.ts`：

```typescript
export interface Article {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  content: string; // raw markdown body
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
```

- [ ] **Step 2: 安装 Zustand**

```bash
cd /Users/ningzhaoxing/Desktop/code_runner/codeRunner-front
npm install zustand
```

- [ ] **Step 3: 创建 Zustand store**

创建 `src/store/usePostStore.ts`：

```typescript
import { create } from "zustand";
import type { CodeBlockState, SessionState, ChatMessage, Proposal } from "@/types";

interface PostStore {
  // 代码块状态
  codeBlocks: Record<string, CodeBlockState>;
  initCodeBlock: (blockId: string, code: string, language: string) => void;
  updateCode: (blockId: string, code: string) => void;
  setOutput: (blockId: string, output: string | null, error: string | null) => void;
  setRunning: (blockId: string, running: boolean) => void;
  setExpanded: (blockId: string, expanded: boolean) => void;
  addAIMessage: (blockId: string, message: ChatMessage) => void;
  updateLastAIMessage: (blockId: string, content: string) => void;

  // Session 状态
  session: SessionState;
  setSessionId: (id: string) => void;
  setActiveBlockId: (id: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposalStatus: (id: string, status: Proposal["status"]) => void;
  setGlobalError: (error: string | null) => void;
}

export const usePostStore = create<PostStore>((set) => ({
  codeBlocks: {},

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
    set((state) => {
      const block = state.codeBlocks[blockId];
      if (!block) return state;
      return {
        codeBlocks: {
          ...state.codeBlocks,
          [blockId]: { ...block, aiMessages: [...block.aiMessages, message] },
        },
      };
    }),

  updateLastAIMessage: (blockId, content) =>
    set((state) => {
      const block = state.codeBlocks[blockId];
      if (!block || block.aiMessages.length === 0) return state;
      const msgs = [...block.aiMessages];
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, content };
      return {
        codeBlocks: {
          ...state.codeBlocks,
          [blockId]: { ...block, aiMessages: msgs },
        },
      };
    }),

  session: {
    sessionId: null,
    activeBlockId: null,
    isStreaming: false,
    sseConnected: false,
    proposals: {},
    globalError: null,
  },

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
    set((state) => {
      const p = state.session.proposals[id];
      if (!p) return state;
      return {
        session: {
          ...state.session,
          proposals: { ...state.session.proposals, [id]: { ...p, status } },
        },
      };
    }),

  setGlobalError: (error) =>
    set((state) => ({ session: { ...state.session, globalError: error } })),
}));
```

- [ ] **Step 4: 提交**

```bash
git add src/types/index.ts src/store/usePostStore.ts package.json package-lock.json
git commit -m "feat: add TypeScript types and Zustand store"
```

---

## Task 3: Navbar + Footer + 根布局

**Files:**
- Create: `src/components/Navbar.tsx`
- Create: `src/components/Footer.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 创建 Navbar 组件**

创建 `src/components/Navbar.tsx`：

```tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-3 border-b border-border bg-surface-nav">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-accent text-base font-bold font-mono">CodeRunner</span>
        <span className="text-text-disabled text-xs">Blog</span>
      </Link>
      <div className="flex gap-6 text-sm">
        <Link href="/" className="text-text-secondary hover:text-text-title transition-colors">首页</Link>
        <Link href="/tags" className="text-text-secondary hover:text-text-title transition-colors">标签</Link>
        <Link href="/about" className="text-text-secondary hover:text-text-title transition-colors">关于</Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 创建 Footer 组件**

创建 `src/components/Footer.tsx`：

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-border px-8 py-6 text-text-disabled text-xs flex justify-between">
      <span>&copy; 2026 Ning &middot; Powered by CodeRunner</span>
      <div className="flex gap-3">
        <a href="#" className="hover:text-text-secondary">GitHub</a>
        <a href="#" className="hover:text-text-secondary">RSS</a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: 更新根布局集成 Navbar + Footer**

修改 `src/app/layout.tsx`，在 body 内加入 Navbar 和 Footer：

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeRunner Blog",
  description: "技术博客 - 代码可直接运行",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-surface-0 text-text-body flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 浏览器验证**

刷新 http://localhost:3000，验证导航栏（绿色 CodeRunner Logo + 链接）和页脚可见。

- [ ] **Step 5: 提交**

```bash
git add src/components/Navbar.tsx src/components/Footer.tsx src/app/layout.tsx
git commit -m "feat: add Navbar and Footer components"
```

---

## Task 4: Markdown 解析 + 首页文章列表

**Files:**
- Create: `src/lib/markdown.ts`
- Create: `content/posts/go-concurrency.md`
- Create: `src/components/PostCard.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 安装 Markdown 解析依赖**

```bash
cd /Users/ningzhaoxing/Desktop/code_runner/codeRunner-front
npm install gray-matter
```

- [ ] **Step 2: 创建 Markdown 解析工具**

创建 `src/lib/markdown.ts`：

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Article } from "@/types";

const postsDir = path.join(process.cwd(), "content/posts");

export function getAllPosts(): Article[] {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date) : "",
      tags: data.tags || [],
      summary: data.summary || "",
      content,
    };
  });
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): Article | null {
  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || slug,
    date: data.date ? String(data.date) : "",
    tags: data.tags || [],
    summary: data.summary || "",
    content,
  };
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
```

- [ ] **Step 3: 创建示例文章**

创建 `content/posts/go-concurrency.md`：

```markdown
---
title: "Go 并发编程：从 Goroutine 到 Channel"
date: "2026-04-10"
tags: [Go, 并发]
summary: "深入理解 Go 并发模型，通过可运行的代码示例学习 goroutine、channel 和 select。"
---

Go 语言的并发模型基于 CSP（Communicating Sequential Processes），核心概念是 `goroutine` 和 `channel`。

## Goroutine 基础

启动一个 goroutine 非常简单，只需在函数调用前加 `go` 关键字：

```go
package main

import "fmt"

func sayHello() {
    fmt.Println("Hello from goroutine!")
}

func main() {
    go sayHello()
    fmt.Println("main function")
}
```

运行上面的代码，你会发现 `sayHello` 的输出可能不会出现。这是因为 `main` 函数退出时，所有 goroutine 会被强制终止。

## 使用 WaitGroup 等待

我们可以用 `sync.WaitGroup` 来等待 goroutine 完成：

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        fmt.Println("done!")
    }()
    wg.Wait()
}
```

> 提示：点击代码块右上角的 🤖 按钮可以唤起 AI 助手。
```

- [ ] **Step 4: 创建 PostCard 组件**

创建 `src/components/PostCard.tsx`：

```tsx
import Link from "next/link";
import type { Article } from "@/types";

export default function PostCard({ post }: { post: Article }) {
  return (
    <article className="py-4 border-t border-[#1e1e3a]">
      <div className="flex justify-between items-baseline mb-1.5">
        <Link href={`/posts/${post.slug}`} className="text-text-title text-[15px] font-medium hover:text-accent transition-colors">
          {post.title}
        </Link>
        <span className="text-text-disabled text-xs shrink-0 ml-4">{post.date}</span>
      </div>
      {post.summary && <p className="text-text-secondary text-[13px] mb-2">{post.summary}</p>}
      <div className="flex gap-1.5">
        {post.tags.map((tag) => (
          <Link key={tag} href={`/tags/${tag}`} className="bg-[#1e1e3a] text-tag px-2 py-0.5 rounded-[3px] text-[11px] border border-border hover:bg-surface-3 transition-colors">
            {tag}
          </Link>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 5: 实现首页**

替换 `src/app/page.tsx`：

```tsx
import { getAllPosts } from "@/lib/markdown";
import PostCard from "@/components/PostCard";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-text-title text-2xl font-semibold mb-2">Hi, I&apos;m Ning 👋</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Go/Agent 后端开发者。这里记录我对分布式系统、AI Agent 和编程语言的思考。
          所有代码片段都可以<span className="text-accent">直接运行</span>。
        </p>
      </div>

      {/* Post List */}
      <div>
        <div className="text-text-disabled text-[11px] uppercase tracking-wider mb-4">Recent Posts</div>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
        {posts.length === 0 && <p className="text-text-placeholder text-sm">暂无文章</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 浏览器验证**

刷新 http://localhost:3000，验证首页显示 Hero 区域和文章列表（含示例文章）。

- [ ] **Step 7: 提交**

```bash
git add src/lib/markdown.ts content/ src/components/PostCard.tsx src/app/page.tsx package.json package-lock.json
git commit -m "feat: add Markdown parsing, sample post, and homepage"
```

---

## Task 5: 文章详情页 + Markdown 渲染器（纯文本，不含代码块交互）

**Files:**
- Create: `src/components/ArticleHeader.tsx`
- Create: `src/components/MarkdownRenderer.tsx`
- Create: `src/app/posts/[slug]/page.tsx`

- [ ] **Step 1: 安装 Markdown 渲染依赖**

```bash
npm install react-markdown rehype-highlight remark-gfm
```

- [ ] **Step 2: 创建 ArticleHeader 组件**

创建 `src/components/ArticleHeader.tsx`：

```tsx
import Link from "next/link";

interface Props {
  title: string;
  date: string;
  tags: string[];
}

export default function ArticleHeader({ title, date, tags }: Props) {
  return (
    <div className="mb-8">
      <div className="flex gap-1.5 mb-3">
        {tags.map((tag) => (
          <Link key={tag} href={`/tags/${tag}`} className="bg-[#1e1e3a] text-tag px-2 py-0.5 rounded-[3px] text-[11px] border border-border">
            {tag}
          </Link>
        ))}
      </div>
      <h1 className="text-text-title text-[28px] font-semibold leading-tight mb-2">{title}</h1>
      <div className="text-text-disabled text-[13px]">{date}</div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 MarkdownRenderer（初版，代码块先用 `<pre>` 占位）**

创建 `src/components/MarkdownRenderer.tsx`：

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-text-title text-lg font-semibold mt-7 mb-3 pb-2 border-b border-[#1e1e3a]">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-text-title text-base font-semibold mt-5 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-text-body text-[15px] leading-[1.8] mb-4">{children}</p>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              // 暂时用 <pre> 渲染代码块，Task 6 替换为 CodeBlock
              return (
                <pre className="bg-surface-1 border border-border rounded-lg p-4 font-mono text-[13px] leading-[20px] overflow-x-auto my-5">
                  <code className={className} {...props}>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-[#151520] px-1.5 py-0.5 rounded-[3px] text-accent text-[13px] border border-border">{children}</code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-[3px] border-accent pl-4 py-3 bg-[#0d1a20] text-text-secondary text-sm my-5 rounded-r">{children}</blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 text-text-body">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 text-text-body">{children}</ol>,
          a: ({ href, children }) => (
            <a href={href} className="text-tag hover:text-accent underline">{children}</a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 4: 创建文章详情页**

创建 `src/app/posts/[slug]/page.tsx`：

```tsx
import { getPostBySlug, getAllPosts } from "@/lib/markdown";
import ArticleHeader from "@/components/ArticleHeader";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <ArticleHeader title={post.title} date={post.date} tags={post.tags} />
      <MarkdownRenderer content={post.content} />
    </div>
  );
}
```

- [ ] **Step 5: 浏览器验证**

访问 http://localhost:3000/posts/go-concurrency，验证文章渲染：标题、日期、标签、正文、代码块（`<pre>` 格式，暂无编辑能力）、blockquote。

- [ ] **Step 6: 提交**

```bash
git add src/components/ArticleHeader.tsx src/components/MarkdownRenderer.tsx src/app/posts/
git commit -m "feat: add post detail page with Markdown rendering"
```

---

## Task 6: CodeBlock 组件（收起状态 — Monaco Editor + Run 按钮 + Output）

**Files:**
- Create: `src/components/CodeBlock.tsx`
- Create: `src/components/CodeBlockHeader.tsx`
- Create: `src/components/OutputPanel.tsx`
- Create: `src/lib/api.ts`
- Create: `src/lib/sse.ts`
- Modify: `src/components/MarkdownRenderer.tsx`

- [ ] **Step 1: 安装 Monaco Editor**

```bash
npm install @monaco-editor/react
```

- [ ] **Step 2: 创建 SSE 工具函数**

创建 `src/lib/sse.ts`：

```typescript
export interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

export async function fetchSSE(
  url: string,
  body: Record<string, unknown>,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          onEvent(data as SSEEvent);
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}
```

- [ ] **Step 3: 创建 API 调用层**

创建 `src/lib/api.ts`：

```typescript
import { fetchSSE, type SSEEvent } from "./sse";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8081";

export async function executeCode(
  id: string,
  language: string,
  codeBlock: string,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  await fetchSSE(
    `${API_BASE}/api/execute`,
    { id, language, codeBlock },
    onEvent,
    signal
  );
}

export async function chatWithAgent(
  params: {
    session_id: string;
    user_message: string;
    active_block_id: string;
    current_code: string;
    article_ctx?: {
      article_id: string;
      article_content: string;
      code_blocks: { block_id: string; language: string; code: string }[];
    };
  },
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  await fetchSSE(`${API_BASE}/api/chat`, params, onEvent, signal);
}

export async function confirmProposal(
  sessionId: string,
  proposalId: string
): Promise<{ request_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, proposal_id: proposalId }),
  });
  return res.json();
}
```

- [ ] **Step 4: 创建 OutputPanel 组件**

创建 `src/components/OutputPanel.tsx`：

```tsx
interface Props {
  output: string | null;
  error: string | null;
  isRunning: boolean;
}

export default function OutputPanel({ output, error, isRunning }: Props) {
  if (!output && !error && !isRunning) return null;

  return (
    <div className="bg-[#0d0d15] px-4 py-2.5 border-t border-border font-mono text-xs min-h-[40px]">
      {isRunning && <span className="text-text-placeholder animate-pulse">执行中...</span>}
      {error && <span className="text-error">{error}</span>}
      {output && !error && <span className="text-text-secondary">{output}</span>}
    </div>
  );
}
```

- [ ] **Step 5: 创建 CodeBlockHeader 组件**

创建 `src/components/CodeBlockHeader.tsx`：

```tsx
interface Props {
  filename: string;
  language: string;
  isRunning: boolean;
  onRun: () => void;
  onToggleAI: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
}

export default function CodeBlockHeader({
  filename, language, isRunning, onRun, onToggleAI, onToggleExpand, isExpanded,
}: Props) {
  return (
    <div className="bg-surface-2 px-4 py-2 flex justify-between items-center border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-accent text-xs font-mono">{filename}</span>
        <span className="text-text-disabled text-[10px]">|</span>
        <span className="text-text-placeholder text-[11px]">{language}</span>
      </div>
      <div className="flex gap-1.5 items-center">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="bg-surface-3 text-accent px-3 py-1 rounded text-[11px] border border-[#2F2F2F] hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors"
        >
          {isRunning ? "⏳" : "▶"} Run
        </button>
        <button
          onClick={onToggleAI}
          className="bg-surface-3 text-text-secondary px-2.5 py-1 rounded text-[11px] border border-[#2F2F2F] hover:bg-[#2a2a2a] transition-colors"
        >
          🤖
        </button>
        <button
          onClick={onToggleExpand}
          className="bg-surface-3 text-text-secondary px-2.5 py-1 rounded text-[11px] border border-[#2F2F2F] hover:bg-[#2a2a2a] transition-colors"
        >
          {isExpanded ? "⤡" : "⤢"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 创建 CodeBlock 组件（收起状态）**

创建 `src/components/CodeBlock.tsx`：

```tsx
"use client";

import { useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { usePostStore } from "@/store/usePostStore";
import { executeCode } from "@/lib/api";
import CodeBlockHeader from "./CodeBlockHeader";
import OutputPanel from "./OutputPanel";
import { v4 as uuidv4 } from "uuid";

interface Props {
  blockId: string;
  code: string;
  language: string;
}

const langToFilename: Record<string, string> = {
  go: "main.go",
  golang: "main.go",
  python: "main.py",
  javascript: "index.js",
  java: "Main.java",
  c: "main.c",
};

const langToMonaco: Record<string, string> = {
  go: "go",
  golang: "go",
  python: "python",
  javascript: "javascript",
  java: "java",
  c: "c",
};

export default function CodeBlock({ blockId, code, language }: Props) {
  const store = usePostStore();
  const block = store.codeBlocks[blockId];

  useEffect(() => {
    if (!store.codeBlocks[blockId]) {
      store.initCodeBlock(blockId, code, language);
    }
  }, [blockId, code, language, store]);

  const handleRun = useCallback(async () => {
    if (!block) return;
    store.setRunning(blockId, true);
    store.setOutput(blockId, null, null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      await executeCode(uuidv4(), block.language, block.code, (event) => {
        if (event.type === "result") {
          store.setOutput(blockId, event.output as string, event.error as string || null);
        } else if (event.type === "error") {
          store.setOutput(blockId, null, event.message as string);
        }
      }, controller.signal);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        store.setOutput(blockId, null, "执行超时");
      } else {
        store.setOutput(blockId, null, "网络错误，请重试");
      }
    } finally {
      clearTimeout(timeout);
      store.setRunning(blockId, false);
    }
  }, [block, blockId, store]);

  if (!block) return null;

  const filename = langToFilename[block.language] || "code";
  const monacoLang = langToMonaco[block.language] || block.language;
  const lineCount = block.code.split("\n").length;
  const editorHeight = Math.max(80, Math.min(300, lineCount * 20 + 16));

  return (
    <div className={`rounded-lg overflow-hidden border border-border my-5 shadow-lg transition-all duration-300 ${block.isExpanded ? "" : ""}`}>
      <CodeBlockHeader
        filename={filename}
        language={block.language}
        isRunning={block.isRunning}
        onRun={handleRun}
        onToggleAI={() => store.setExpanded(blockId, !block.isExpanded)}
        onToggleExpand={() => store.setExpanded(blockId, !block.isExpanded)}
        isExpanded={block.isExpanded}
      />
      <Editor
        height={editorHeight}
        language={monacoLang}
        value={block.code}
        onChange={(val) => store.updateCode(blockId, val || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 12 },
          renderLineHighlight: "none",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: { vertical: "hidden", horizontal: "auto" },
        }}
      />
      <OutputPanel output={block.output} error={block.runError} isRunning={block.isRunning} />
    </div>
  );
}
```

- [ ] **Step 7: 安装 uuid 依赖**

```bash
npm install uuid
npm install -D @types/uuid
```

- [ ] **Step 8: 修改 MarkdownRenderer 使用 CodeBlock 组件**

修改 `src/components/MarkdownRenderer.tsx`，将代码块替换逻辑改为使用 `<CodeBlock />`。在 `code` 组件处理中，对块级代码使用 CodeBlock：

将块级代码的 `<pre>` 渲染替换为：

```tsx
// 在文件顶部添加
import CodeBlock from "./CodeBlock";
import { useRef } from "react";

// 在组件内添加 counter ref
const blockCounter = useRef(0);

// 重置 counter（每次渲染前）
blockCounter.current = 0;

// code 组件中的块级分支替换为：
if (isBlock) {
  const lang = className?.replace("language-", "") || "text";
  const blockId = `block-${blockCounter.current++}`;
  const codeText = String(children).replace(/\n$/, "");
  return <CodeBlock blockId={blockId} code={codeText} language={lang} />;
}
```

注意：`react-markdown` 对 code 围栏的渲染方式在不同版本略有不同。如果 `className` 为空但有 `node?.properties?.className`，按实际情况适配。关键是识别出块级代码（有 language class）并提取语言和代码文本。

- [ ] **Step 9: 浏览器验证**

访问 http://localhost:3000/posts/go-concurrency，验证：
1. 代码块使用 Monaco Editor 渲染（可编辑、有语法高亮）
2. 右上角有 Run / 🤖 / ⤢ 按钮
3. 点击 Run（后端未启动时应显示"网络错误，请重试"）
4. Output 区域正确显示

- [ ] **Step 10: 提交**

```bash
git add src/components/ src/lib/api.ts src/lib/sse.ts package.json package-lock.json
git commit -m "feat: add CodeBlock with Monaco Editor, Run button, and Output panel"
```

---

## Task 7: AI 面板（展开工作台 + 对话 UI）

**Files:**
- Create: `src/components/AIPanel.tsx`
- Create: `src/components/ChatMessages.tsx`
- Create: `src/components/ChatInput.tsx`
- Create: `src/components/CodeSuggestion.tsx`
- Modify: `src/components/CodeBlock.tsx`

- [ ] **Step 1: 创建 CodeSuggestion 组件**

创建 `src/components/CodeSuggestion.tsx`：

```tsx
"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "@/store/usePostStore";

interface Props {
  proposalId: string;
  blockId: string;
}

export default function CodeSuggestion({ proposalId, blockId }: Props) {
  const store = usePostStore();
  const proposal = store.session.proposals[proposalId];
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!proposal) return;
    const interval = setInterval(() => {
      const remaining = proposal.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft("已过期");
        store.updateProposalStatus(proposalId, "expired");
        clearInterval(interval);
      } else {
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [proposal, proposalId, store]);

  if (!proposal) return null;

  const isExpired = proposal.status === "expired";
  const isConfirmed = proposal.status === "confirmed" || proposal.status === "executed";

  const handleApply = () => {
    store.updateCode(blockId, proposal.code);
  };

  const handleConfirm = async () => {
    const { confirmProposal } = await import("@/lib/api");
    const sessionId = store.session.sessionId;
    if (!sessionId) return;
    store.updateProposalStatus(proposalId, "confirmed");
    try {
      await confirmProposal(sessionId, proposalId);
    } catch {
      store.updateProposalStatus(proposalId, "pending");
    }
  };

  // 简单 diff 展示：所有行加 + 前缀
  const lines = proposal.code.split("\n");

  return (
    <div className="bg-surface-1 border border-border rounded-md overflow-hidden my-2">
      <div className="px-3 py-1.5 text-text-placeholder text-[9px] uppercase tracking-wider">
        建议修改 — {proposal.description}
      </div>
      <div className="px-3 py-2 font-mono text-[11px] leading-[18px] max-h-[200px] overflow-auto">
        {lines.map((line, i) => (
          <div key={i} className="bg-diff-add px-1 rounded-sm">
            <span className="text-accent mr-1">+</span>
            <span className="text-white">{line}</span>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border flex items-center gap-2">
        <button
          onClick={handleApply}
          disabled={isExpired}
          className="text-[10px] px-2 py-1 rounded bg-surface-3 text-accent border border-border hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✅ 应用到编辑器
        </button>
        <button
          onClick={handleConfirm}
          disabled={isExpired || isConfirmed}
          className="text-[10px] px-2 py-1 rounded bg-surface-3 text-accent border border-border hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isConfirmed ? "执行中..." : "▶ 确认运行"}
        </button>
        <span className={`text-[10px] ml-auto ${isExpired ? "text-error" : "text-text-placeholder"}`}>
          ⏳ {isExpired ? "已过期" : `剩余 ${timeLeft}`}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 ChatMessages 组件**

创建 `src/components/ChatMessages.tsx`：

```tsx
"use client";

import type { ChatMessage } from "@/types";
import CodeSuggestion from "./CodeSuggestion";

interface Props {
  messages: ChatMessage[];
  blockId: string;
}

export default function ChatMessages({ messages, blockId }: Props) {
  return (
    <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5">
      {messages.map((msg) => {
        switch (msg.type) {
          case "user":
            return (
              <div key={msg.id} className="self-end max-w-[88%]">
                <div className="bg-msg-user px-3 py-2.5 rounded-[10px_10px_2px_10px] text-xs text-[#c8c8e0] leading-relaxed">
                  {msg.content}
                </div>
              </div>
            );
          case "ai":
            return (
              <div key={msg.id} className="self-start max-w-[92%]">
                <div className="bg-msg-ai border border-[#1a2a35] px-3 py-2.5 rounded-[10px_10px_10px_2px] text-xs text-[#c5e8b5] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            );
          case "proposal":
            return (
              <div key={msg.id} className="self-start max-w-[92%] w-full">
                <CodeSuggestion proposalId={msg.proposalId!} blockId={blockId} />
              </div>
            );
          case "execution_result":
            return (
              <div key={msg.id} className="self-start max-w-[92%]">
                <div className={`border rounded-[10px_10px_10px_2px] px-3 py-2.5 text-xs ${msg.content.startsWith("Error") ? "bg-[#1a0d0d] border-error/30" : "bg-exec-ok border-[#1a3a1a]"}`}>
                  <div className="text-[10px] mb-1.5">
                    {msg.content.startsWith("Error") ? <span className="text-error">✗ 执行失败</span> : <span className="text-accent">✓ 执行成功</span>}
                  </div>
                  <div className="bg-surface-1 rounded px-2.5 py-2 font-mono text-[11px] text-accent leading-[18px]">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          case "interrupted":
            return (
              <div key={msg.id} className="text-center text-text-disabled text-[10px] py-1">
                上一条回复已中断
              </div>
            );
          case "error":
            return (
              <div key={msg.id} className="text-center">
                <div className="inline-block bg-[#1a0d0d] border border-error/30 rounded px-3 py-1.5 text-error text-[11px]">
                  {msg.content}
                </div>
              </div>
            );
          case "system":
            return (
              <div key={msg.id} className="text-center text-text-disabled text-[10px] py-1">
                {msg.content}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
```

- [ ] **Step 3: 创建 ChatInput 组件**

创建 `src/components/ChatInput.tsx`：

```tsx
"use client";

import { useState, useCallback, type KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-2.5 border-t border-border">
      <div className="bg-[#1e1e3a] border border-border rounded-lg flex items-end gap-2 px-3 py-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-xs text-[#c8c8e0] placeholder-text-placeholder resize-none outline-none leading-relaxed max-h-[80px]"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="text-accent text-base leading-none disabled:opacity-30 shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 AIPanel 组件**

创建 `src/components/AIPanel.tsx`：

```tsx
"use client";

import { useCallback } from "react";
import { usePostStore } from "@/store/usePostStore";
import { chatWithAgent } from "@/lib/api";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage } from "@/types";

interface Props {
  blockId: string;
  articleId: string;
  articleContent: string;
  allCodeBlocks: { block_id: string; language: string; code: string }[];
}

export default function AIPanel({ blockId, articleId, articleContent, allCodeBlocks }: Props) {
  const store = usePostStore();
  const block = store.codeBlocks[blockId];

  const sendMessage = useCallback(async (message: string) => {
    if (!block) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      blockId,
      type: "user",
      content: message,
      timestamp: Date.now(),
    };
    store.addAIMessage(blockId, userMsg);

    // Add placeholder AI message for streaming
    const aiMsgId = uuidv4();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      blockId,
      type: "ai",
      content: "",
      timestamp: Date.now(),
    };
    store.addAIMessage(blockId, aiMsg);
    store.setStreaming(true);

    const isFirstMessage = !store.session.sessionId;

    try {
      await chatWithAgent(
        {
          session_id: store.session.sessionId || "",
          user_message: message,
          active_block_id: blockId,
          current_code: block.code,
          article_ctx: isFirstMessage
            ? { article_id: articleId, article_content: articleContent, code_blocks: allCodeBlocks }
            : undefined,
        },
        (event) => {
          switch (event.type) {
            case "session":
              store.setSessionId(event.session_id as string);
              break;
            case "chunk":
              store.updateLastAIMessage(blockId, (store.codeBlocks[blockId]?.aiMessages.at(-1)?.content || "") + (event.content as string));
              break;
            case "proposal": {
              const proposal = {
                id: event.proposal_id as string,
                blockId,
                code: event.code as string,
                language: event.language as string,
                description: event.description as string,
                createdAt: Date.now(),
                expiresAt: Date.now() + 10 * 60 * 1000,
                status: "pending" as const,
              };
              store.addProposal(proposal);
              store.addAIMessage(blockId, {
                id: uuidv4(),
                blockId,
                type: "proposal",
                content: "",
                proposalId: proposal.id,
                timestamp: Date.now(),
              });
              break;
            }
            case "execution_result":
              store.addAIMessage(blockId, {
                id: uuidv4(),
                blockId,
                type: "execution_result",
                content: (event.result as string) || (event.err as string) || "",
                proposalId: event.proposal_id as string,
                timestamp: Date.now(),
              });
              if (event.proposal_id) {
                store.updateProposalStatus(event.proposal_id as string, "executed");
              }
              store.setOutput(blockId, (event.result as string) || null, (event.err as string) || null);
              break;
            case "interrupted":
              store.addAIMessage(blockId, {
                id: uuidv4(),
                blockId,
                type: "interrupted",
                content: "",
                timestamp: Date.now(),
              });
              break;
            case "error":
              store.addAIMessage(blockId, {
                id: uuidv4(),
                blockId,
                type: "error",
                content: event.message as string,
                timestamp: Date.now(),
              });
              break;
          }
        }
      );
    } catch {
      store.addAIMessage(blockId, {
        id: uuidv4(),
        blockId,
        type: "error",
        content: "网络错误，请重试",
        timestamp: Date.now(),
      });
    } finally {
      store.setStreaming(false);
    }
  }, [block, blockId, store, articleId, articleContent, allCodeBlocks]);

  const shortcuts = [
    { label: "📖 解释", prompt: "请解释这段代码的逻辑和设计意图" },
    { label: "🐛 调试", prompt: `请分析这段代码的问题并给出修复建议。当前输出是：${block?.output || "(无)"}` },
    { label: "🧪 测试", prompt: "请为这段代码生成边界测试用例" },
  ];

  if (!block) return null;

  return (
    <div className="flex flex-col bg-surface-nav min-w-[280px] h-full">
      {/* Header */}
      <div className="px-3.5 py-2 border-b border-border flex justify-between items-center">
        <span className="text-text-title text-xs font-medium">🤖 AI 助手</span>
        <div className="flex gap-1">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              onClick={() => sendMessage(s.prompt)}
              disabled={store.session.isStreaming}
              className="bg-[#1e1e3a] text-text-secondary px-2 py-0.5 rounded text-[10px] border border-border hover:bg-surface-3 disabled:opacity-40 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ChatMessages messages={block.aiMessages} blockId={blockId} />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={store.session.isStreaming} />
    </div>
  );
}
```

- [ ] **Step 5: 修改 CodeBlock 组件支持展开工作台 + AI 面板**

在 `src/components/CodeBlock.tsx` 中，当 `block.isExpanded` 为 true 时，渲染左右分栏布局（左 Editor + 右 AIPanel）。

关键修改：
- 展开时外层容器变为 `flex`
- 编辑器区域 `flex: 6`
- AIPanel 区域 `flex: 4`
- 展开时编辑器高度改为 `400px`

在 CodeBlock 组件的 return 中，将布局改为条件渲染：

```tsx
// 展开时
if (block.isExpanded) {
  return (
    <div className="rounded-lg overflow-hidden border border-border my-5 shadow-xl">
      <div className="flex" style={{ minHeight: 400 }}>
        {/* Left: Editor */}
        <div className="flex-[6] flex flex-col border-r border-border">
          <CodeBlockHeader ... isExpanded={true} />
          <div className="flex-1">
            <Editor height="100%" ... />
          </div>
          <OutputPanel ... />
        </div>
        {/* Right: AI Panel */}
        <div className="flex-[4]">
          <AIPanel blockId={blockId} articleId={...} articleContent={...} allCodeBlocks={...} />
        </div>
      </div>
    </div>
  );
}
```

AI 面板需要文章上下文信息。这些 props 需要从 `MarkdownRenderer` → `CodeBlock` → `AIPanel` 传递。修改 `MarkdownRenderer` 将 `articleId`, `articleContent` 作为 props 传入 `CodeBlock`，再由 `CodeBlock` 传给 `AIPanel`。

- [ ] **Step 6: 浏览器验证**

访问文章页，验证：
1. 代码块默认收起正常
2. 点击 🤖 或 ⤢ → 代码块展开为左右分栏
3. AI 面板显示 Header（快捷按钮）+ 空消息区 + 输入框
4. 可在输入框输入文字，Enter 发送（后端未启动时应显示错误消息）
5. 点击 ⤡ → 收起回到原始状态

- [ ] **Step 7: 提交**

```bash
git add src/components/
git commit -m "feat: add AI panel with chat messages, input, and code suggestion"
```

---

## Task 8: 标签页 + 关于页

**Files:**
- Create: `src/app/tags/page.tsx`
- Create: `src/app/tags/[tag]/page.tsx`
- Create: `src/app/about/page.tsx`
- Create: `content/about.md`

- [ ] **Step 1: 创建标签归档页**

创建 `src/app/tags/page.tsx`：

```tsx
import Link from "next/link";
import { getAllTags, getAllPosts } from "@/lib/markdown";

export default function TagsPage() {
  const tags = getAllTags();
  const posts = getAllPosts();

  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <h1 className="text-text-title text-2xl font-semibold mb-6">标签</h1>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => {
          const count = posts.filter((p) => p.tags.includes(tag)).length;
          return (
            <Link key={tag} href={`/tags/${tag}`} className="bg-[#1e1e3a] text-tag px-3 py-1.5 rounded border border-border hover:bg-surface-3 text-sm transition-colors">
              {tag} <span className="text-text-disabled text-xs ml-1">({count})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建按标签筛选页**

创建 `src/app/tags/[tag]/page.tsx`：

```tsx
import { getAllPosts, getAllTags } from "@/lib/markdown";
import PostCard from "@/components/PostCard";

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export default function TagFilterPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const posts = getAllPosts().filter((p) => p.tags.includes(tag));

  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <h1 className="text-text-title text-2xl font-semibold mb-2">标签: {tag}</h1>
      <p className="text-text-secondary text-sm mb-6">{posts.length} 篇文章</p>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 创建关于页**

创建 `content/about.md`：

```markdown
---
title: 关于
---

Go/Agent 后端开发者，专注于分布式系统和 AI Agent 设计。

这个博客的所有代码片段都可以直接运行 — 由 CodeRunner 分布式代码执行引擎驱动。
```

创建 `src/app/about/page.tsx`：

```tsx
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function AboutPage() {
  const raw = fs.readFileSync(path.join(process.cwd(), "content/about.md"), "utf-8");
  const { content } = matter(raw);

  return (
    <div className="max-w-[720px] mx-auto px-6 py-10">
      <h1 className="text-text-title text-2xl font-semibold mb-6">关于</h1>
      <MarkdownRenderer content={content} />
    </div>
  );
}
```

- [ ] **Step 4: 浏览器验证**

验证 /tags、/tags/Go、/about 页面正常渲染。

- [ ] **Step 5: 提交**

```bash
git add src/app/tags/ src/app/about/ content/about.md
git commit -m "feat: add tags and about pages"
```

---

## Task 9: 最终集成验证 + 清理

**Files:**
- Modify: various files for polish
- Delete: `mockup.html` (已不需要)

- [ ] **Step 1: 验证完整流程**

1. 首页 → 文章列表 → 点击文章 → 文章详情页
2. 文章详情页 → 代码块 Monaco Editor 可编辑
3. 点击 Run → Output 区显示（后端未启动时显示错误）
4. 点击 🤖 → 展开工作台 + AI 面板
5. AI 面板输入消息 → 发送（后端未启动时显示错误）
6. 点击 ⤡ → 收起工作台
7. 标签页 → 按标签筛选
8. 关于页

- [ ] **Step 2: 清理临时文件**

```bash
rm /Users/ningzhaoxing/Desktop/code_runner/codeRunner-front/mockup.html
```

- [ ] **Step 3: 添加 .env.local 示例**

创建 `.env.local.example`：

```
# 后端 API 地址
NEXT_PUBLIC_API_BASE=http://localhost:8081
```

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete frontend integration and cleanup"
```

---

## 任务依赖图

```
Task 1 (项目初始化)
  ↓
Task 2 (类型 + Store)
  ↓
Task 3 (Navbar + Footer)
  ↓
Task 4 (Markdown 解析 + 首页)
  ↓
Task 5 (文章详情页 + Markdown 渲染)
  ↓
Task 6 (CodeBlock: Monaco + Run + Output)  ← 核心
  ↓
Task 7 (AI 面板: 展开工作台 + 对话)       ← 核心
  ↓
Task 8 (标签页 + 关于页)                   ← 可并行
  ↓
Task 9 (集成验证)
```
