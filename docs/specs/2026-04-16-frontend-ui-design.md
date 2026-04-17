---
title: CodeRunner 前端 UI 设计文档
type: design
status: draft
created: 2026-04-16
---

# CodeRunner 前端 UI 设计文档

## 一、项目概述

### 产品定位

单人技术博客前端，核心特色是文章中的代码块可直接编辑和运行，并集成 AI 助手（解释、调试、测试生成）。后端为 CodeRunner Server（合并了 Agent 功能），通过统一 HTTP API 提供代码执行和 AI 对话能力。

### 技术栈

| 模块 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js (App Router) | SSR + 路由开箱即用，社区生态好 |
| 代码编辑器 | Monaco Editor (`@monaco-editor/react`) | VS Code 同款，支持多语言高亮和编辑 |
| Markdown 渲染 | `react-markdown` + `rehype-highlight` | 文章渲染 + 代码块高亮 |
| 样式 | Tailwind CSS | utility-first，对后端开发者友好 |
| 状态管理 | Zustand | 轻量，API 简洁 |
| SSE 处理 | 原生 fetch + ReadableStream | 对接 Agent 流式输出 |

### 支持语言

`golang` / `python` / `javascript` / `java` / `c`（与后端 CodeRunner 一致），代码上限 64KB。

---

## 二、页面结构

### 站点地图

```
/                → 首页（文章列表 + 个人简介）
/posts/:slug     → 文章详情（核心页面）
/about           → 关于页
/tags            → 标签归档
/tags/:tag       → 按标签筛选文章
```

### 页面说明

| 页面 | 复杂度 | 说明 |
|------|--------|------|
| 首页 | 低 | 文章列表 + Hero 简介，静态渲染 |
| 文章详情 | 高 | Markdown 渲染 + 可编辑代码块 + AI 助手，核心交互页 |
| 关于 | 低 | 静态 Markdown 页面 |
| 标签 | 低 | 标签列表 + 按标签筛选 |

---

## 三、视觉风格

### 主题

暗色优先（Sandpack Dark 风格），预留亮色主题切换架构。

### 色彩系统

#### 页面层级

| 层级 | 用途 | 暗色值 |
|------|------|--------|
| surface-0 | 页面底色 | `#111122` |
| surface-nav | 导航栏 | `#13132a` |
| surface-1 | 代码块背景 | `#151515` |
| surface-2 | 代码块 header / AI 输入框 | `#1a1a1a` |
| surface-3 | 按钮 / 卡片 | `#252525` |
| border | 分割线 | `#2a2a4a` |

#### 文字

| 用途 | 暗色值 |
|------|--------|
| 标题 | `#e8e8f0` |
| 正文 | `#b0b0c8` |
| 次要文字 | `#8080a0` |
| 占位符 | `#5a5a7a` |
| 禁用 | `#3a3a5a` |

#### 语义色

| 用途 | 色值 |
|------|------|
| 强调色 / 成功 | `#90e86f` |
| 链接 / 标签 | `#77B7D7` |
| 字符串 | `#977CDC` |
| 错误 | `#ff6b6b` |
| 用户消息背景 | `#1e1e3a` |
| AI 消息背景 | `#0d1a20` |
| diff 新增行 | `#1a2e1a` |
| 执行结果背景 | `#0d150d` |

### 字体

| 类型 | 字体栈 |
|------|--------|
| 正文 | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| 代码 | `"Fira Mono", "DejaVu Sans Mono", Menlo, Consolas, monospace` |

| 属性 | 值 |
|------|------|
| 代码字号 | `13px` |
| 代码行高 | `20px` |
| 正文字号 | `15px` |
| 正文行高 | `1.8` |

### 圆角 / 间距

| 元素 | border-radius |
|------|---------------|
| 代码块容器 | `8px` |
| 按钮 | `4px` |
| 标签 | `3px` |
| 聊天气泡 | `10px`（带方向性圆角） |
| 输入框 | `8px` |

---

## 四、组件设计

### 4.1 导航栏 `<Navbar />`

固定在页面顶部。

```
┌────────────────────────────────────────────────────────┐
│ CodeRunner Blog          首页  标签  关于  ☀/🌙       │
└────────────────────────────────────────────────────────┘
```

- Logo: `CodeRunner` 绿色 monospace + `Blog` 灰色
- 导航链接：首页 / 标签 / 关于
- 右侧：主题切换按钮（预留）

### 4.2 代码块组件 `<CodeBlock />`

这是整个前端最核心的组件，有两种状态。

#### 状态1：收起（默认，嵌在文章流中）

```
┌────────────────────────────────────────────────┐
│ main.go | Go                    [▶ Run] [🤖] [⤢] │
├────────────────────────────────────────────────┤
│                                                │
│  // Monaco Editor（可编辑）                      │
│  package main                                  │
│  func main() {                                 │
│      go sayHello()                             │
│  }                                             │
│                                                │
├────────────────────────────────────────────────┤
│ ▸ Output: main function              0.12s     │
└────────────────────────────────────────────────┘
```

**Header 栏：**
- 左侧：文件名（绿色 monospace）+ 语言标签（灰色）
- 右侧按钮：
  - `▶ Run` — 提交代码执行
  - `🤖` — 展开 AI 面板（触发状态2）
  - `⤢` — 展开工作台（触发状态2，不含 AI 面板）

**编辑区：**
- Monaco Editor，可直接编辑代码
- 默认高度根据代码行数自适应，最小 80px，最大 300px
- 支持语法高亮（与 Sandpack Dark 语法色一致）

**Output 区：**
- 默认折叠，运行后展开
- 显示 stdout + stderr 合并输出
- 右侧显示执行耗时

#### 状态2：展开工作台（点击 🤖 或 ⤢ 后）

```
┌──────────────────────────────┬─────────────────────────┐
│ main.go | Go    [▶ Run] [⤡] │ 🤖 AI 助手  [解释][调试][测试] │
├──────────────────────────────┤─────────────────────────┤
│                              │                         │
│  // Monaco Editor            │  [用户消息]               │
│  // 编辑区更大               │  [AI 流式回答]            │
│  // 代码可编辑               │  [diff 建议块]            │
│                              │  [执行结果]               │
│                              │                         │
├──────────────────────────────┤                         │
│ Output                       │  ┌─────────────────────┐│
│ > Hello World        0.08s   │  │ 输入问题...       ↑ ││
└──────────────────────────────┘  └─────────────────────┘│
                                 └─────────────────────────┘
```

**展开行为：**
- 代码块在文章流中**原地展开**，通过 CSS transition 平滑动画
- 文章内容区 max-width 从 `720px` 扩展到 `960px` 以容纳 AI 面板
- 代码编辑器 flex: 6，AI 面板 flex: 4
- `⤡` 按钮收起工作台，回到状态1

**收起行为：**
- AI 面板滑出消失，编辑区恢复原宽度
- 对话历史保留在内存中，下次展开恢复

### 4.3 AI 面板 `<AIPanel />`

右侧分栏，包含以下子组件：

#### Header

```
┌─────────────────────────────────────┐
│ 🤖 AI 助手    [📖 解释] [🐛 调试] [🧪 测试] │
└─────────────────────────────────────┘
```

快捷按钮点击后自动将对应 prompt 填入输入框并发送：
- 📖 解释 → "请解释这段代码的逻辑和设计意图"
- 🐛 调试 → "请分析这段代码的问题并给出修复建议"
- 🧪 测试 → "请为这段代码生成边界测试用例"

#### 消息区 `<ChatMessages />`

消息类型及展示：

| 类型 | 样式 |
|------|------|
| 用户消息 | 右对齐，`#1e1e3a` 背景，圆角 `10px 10px 2px 10px` |
| AI 文本回复 | 左对齐，`#0d1a20` 背景，流式逐字输出 |
| AI 代码建议 | 嵌在 AI 消息中的 diff 块，绿色 `+` 标记新增行 |
| 执行结果（成功） | 左对齐，`#0d150d` 绿色边框，显示 ✓ + 耗时 + 输出 |
| 执行结果（失败） | 左对齐，`#1a0d0d` 红色边框，显示 ✗ + 错误信息 |
| 错误通知 | 居中，`#1a0d0d` 红色边框，如"AI 服务暂时不可用" |
| 中断提示 | 居中，灰色小字"上一条回复已中断"（`interrupted` 事件触发） |
| 系统提示 | 居中，灰色小字，如"Session 已过期，请刷新页面" |

#### AI 代码建议块 `<CodeSuggestion />`

```
┌─────────────────────────────┐
│ 建议修改                     │
│  func main() {              │
│ + var wg sync.WaitGroup     │  ← 绿色背景
│ + wg.Add(1)                 │  ← 绿色背景
│    go func() {              │
│ + defer wg.Done()           │  ← 绿色背景
│      sayHello()             │
│    }()                      │
│ + wg.Wait()                 │  ← 绿色背景
│  }                          │
├─────────────────────────────┤
│ [✅ 应用到编辑器] [▶ 确认运行] │
│ ⏳ 剩余 08:23               │
└─────────────────────────────┘
```

- diff 新增行用 `#1a2e1a` 背景 + `+` 前缀
- **应用到编辑器**：纯前端操作，将 AI 建议的完整代码替换到 Monaco Editor 中，用户 review 后可手动 Run
- **确认运行**：调用 `POST /api/confirm`，触发后端执行 AI 提议的代码
- **剩余时间**：显示 proposal 剩余有效期（后端默认 10 分钟 TTL）；过期后两个按钮变灰不可点击，显示"此建议已过期，请让 AI 重新生成"

#### 输入框 `<ChatInput />`

```
┌─────────────────────────────────────┐
│ 输入你的问题...                   ↑ │
└─────────────────────────────────────┘
```

- Enter 发送，Shift+Enter 换行
- 发送后清空输入框
- 发送时附带当前代码块的 block_id 和代码内容

### 4.4 文章页 `<PostPage />`

Markdown 渲染，代码块替换为 `<CodeBlock />` 组件。

#### Markdown 渲染规则

| Markdown 元素 | 渲染为 |
|---------------|--------|
| ` ```language ` 代码围栏 | `<CodeBlock />` 组件（可编辑 + 可运行） |
| 行内 `` `code` `` | `<code>` 标签，绿色高亮 |
| `> blockquote` | 绿色左边框引用块 |
| `# ## ###` 标题 | 白色，`h2` 带下划线 |
| 正文段落 | `#b0b0c8` 颜色 |

#### 文章页状态管理

```typescript
interface PostPageState {
  // 文章数据
  article: Article;

  // 各代码块的状态，key 为 block_id
  codeBlocks: Record<string, {
    code: string;           // 当前编辑器中的代码（用户可能已修改）
    originalCode: string;   // 原始代码（来自文章）
    language: string;
    output: string | null;
    isRunning: boolean;
    runError: string | null;      // Run 失败的错误信息
    isExpanded: boolean;          // 是否展开为工作台模式
    aiMessages: ChatMessage[];    // 该代码块独立的 AI 对话历史
  }>;

  // 跨代码块的 AI 会话状态
  session: {
    sessionId: string | null;      // 整个文章共享一个 session_id
    activeBlockId: string | null;  // 当前哪个代码块的 AI 面板展开中
    isStreaming: boolean;          // 是否正在接收 SSE 流
    sseConnected: boolean;         // SSE 连接状态
    proposals: Record<string, Proposal>;  // 所有 proposal，key 为 proposal_id
    globalError: string | null;    // 全局错误（如 session 过期）
  };
}

interface Proposal {
  id: string;
  blockId: string;        // 归属于哪个代码块
  code: string;
  language: string;
  description: string;
  createdAt: number;      // 用于计算剩余时间
  expiresAt: number;      // createdAt + 10min
  status: 'pending' | 'confirmed' | 'executed' | 'expired';
}

interface ChatMessage {
  id: string;
  blockId: string;        // 归属于哪个代码块的对话
  type: 'user' | 'ai' | 'proposal' | 'execution_result' | 'interrupted' | 'error' | 'system';
  content: string;
  proposalId?: string;    // 关联的 proposal（用于 proposal / execution_result 类型）
  timestamp: number;
}
```

**关键设计说明：**

- **AI 对话按代码块隔离**：`aiMessages` 存储在每个 `codeBlocks[blockId]` 下，确保不同代码块的对话历史互不干扰。用户在代码块 A 聊的内容不会出现在代码块 B 的 AI 面板中
- **Session 全文章共享**：虽然对话 UI 按代码块分隔，但后端 session 是文章级别的，所有代码块的对话共享一个 `session_id`。这与后端 Agent 的文章级 session 模型对齐
- **同一时间只有一个 AI 面板激活**：`activeBlockId` 确保 SSE 连接复用；切换代码块打开 AI 面板时，需要关闭当前 SSE 连接（但不清空历史消息），打开新的 SSE 连接

### 4.5 首页 `<HomePage />`

```
┌────────────────────────────────────────────┐
│ Nav                                        │
├────────────────────────────────────────────┤
│                                            │
│ Hi, I'm Ning 👋                            │
│ Go/Agent 后端开发者...                      │
│                                            │
│ ─────── Recent Posts ───────               │
│                                            │
│ Go 并发编程：从 Goroutine...   2026-04-10  │
│ 简介文字...                                │
│ [Go] [并发]                                │
│                                            │
│ 用 ReAct 模式构建...          2026-04-05  │
│ 简介文字...                                │
│ [Agent] [AI]                               │
│                                            │
├────────────────────────────────────────────┤
│ Footer                                     │
└────────────────────────────────────────────┘
```

---

## 五、后端 API 对接

### 说明

当前后端 CodeRunner Server 仅暴露 gRPC 接口和 WebSocket 端点。**以下 HTTP 接口为前端所需的待实现接口**，由合并后的 CodeRunner Server 统一提供。后端需要新增 HTTP handler，内部包装 gRPC Execute 调用和 Agent 逻辑。

前端对接一个后端，三个核心接口：

#### 1. 代码执行（待后端实现）

```
POST /api/execute
Content-Type: application/json

Request:
{
  "id": "uuid",
  "language": "golang",
  "codeBlock": "package main..."
}

Response: SSE stream
data: {"type":"running"}
data: {"type":"result","output":"Hello World","error":"","duration":"0.12s"}
data: {"type":"error","message":"execution timeout"}
```

> **实现说明**：后端 HTTP handler 内部调用 gRPC `Execute`，设置 `callBackUrl` 指向自身内部回调端点，收到回调后通过 SSE 推送给前端。对前端来说是同步 SSE 流。

#### 2. AI 对话

```
POST /api/chat
Headers: X-Agent-API-Key: {api_key}
Content-Type: application/json

Request:
{
  "session_id": "",              // 首次为空
  "user_message": "为什么没输出?",
  "active_block_id": "block-1",  // 当前操作的代码块
  "current_code": "package main...",  // 编辑器中的最新代码（可能已被用户修改）
  "article_ctx": {               // 首次传入，后续可省略
    "article_id": "go-concurrency",
    "article_content": "...",
    "code_blocks": [
      {"block_id": "block-1", "language": "golang", "code": "..."}
    ]
  }
}

Response: SSE stream
data: {"type":"session","session_id":"uuid"}
data: {"type":"chunk","content":"因为..."}
data: {"type":"proposal","proposal_id":"uuid","code":"...","language":"golang","description":"修复了..."}
data: {"type":"done"}
data: {"type":"execution_result","proposal_id":"uuid","result":"Hello","err":""}
data: {"type":"error","message":"..."}
data: {"type":"interrupted"}
```

> **`active_block_id` + `current_code`**：每次 `/chat` 请求携带用户当前正在操作的代码块 ID 和编辑器中的最新代码。这样 AI 看到的是用户修改后的代码，而不是文章中的原始代码。

#### 3. 确认执行 AI 提议的代码

```
POST /api/confirm
Headers: X-Agent-API-Key: {api_key}
Content-Type: application/json

Request:
{
  "session_id": "uuid",
  "proposal_id": "uuid"
}

Response:
{"request_id": "uuid", "status": "accepted"}

执行结果通过已建立的 SSE 连接推送（execution_result 事件）
```

> **确认机制**：前端提供两种确认方式，统一走 `POST /api/confirm`：
> 1. 用户在对话中回复确认语（"好的"/"运行吧"）→ 前端识别关键词 → 自动调 `/api/confirm`
> 2. 代码建议块上的"确认运行"按钮 → 直接调 `/api/confirm`
>
> 不依赖 AI 端识别确认意图，前端自行处理。

### SSE 连接生命周期

- `/api/chat` 的 SSE 连接在 `done` 事件后**保持打开**，等待异步执行结果
- 用户发新消息时，旧连接收到 `interrupted` → 新连接替代
- 用户离开文章页时，前端主动关闭连接
- Session TTL: 1 小时
- **断线重连**：SSE 断开后等待 3 秒自动重连，重连时携带 `session_id`，后端注入断连期间的 `PendingResults`

---

## 六、交互流程

### 6.1 代码运行流程

```
用户编辑代码 → 前端校验（代码长度 ≤ 64KB，语言是否支持）
  ✗ 校验失败 → Run 按钮显示红色提示 tooltip
  ✓ 校验通过 → 点击 ▶ Run
  → POST /api/execute
  → 按钮变为 loading 状态（旋转图标）
  → SSE 接收结果
    - result 事件 → Output 区绿色展示 stdout/stderr + 耗时
    - error 事件 → Output 区红色展示错误信息
  → 按钮恢复
  → 异常处理：
    - 网络失败 → Output 区显示"网络错误，请重试"，按钮显示可重试状态
    - 超时（30s 无响应）→ 显示"执行超时"，取消请求
```

### 6.2 AI 对话流程

```
用户点击 🤖
  → 代码块展开为工作台模式（isExpanded = true）
  → 若 session_id 不存在 → 首次请求携带完整 article_ctx
  → 用户输入问题 → POST /api/chat（带 active_block_id + current_code）
  → 打开 SSE 流，按钮变为 loading 状态
  → 流式接收事件：
    - session 事件 → 保存 session_id（仅首次）
    - chunk 事件 → 追加到当前 AI 消息，逐字渲染
    - proposal 事件 → 渲染 <CodeSuggestion /> 块
    - done 事件 → 当前消息完成，输入框可用，连接保持
    - execution_result 事件 → 渲染执行结果消息（异步到达）
    - interrupted 事件 → 当前 AI 消息标记为"已中断"，关闭连接
    - error 事件 → 渲染错误消息，保留 session

  → 用户发新消息（已有进行中的流）：
    - 旧连接收到 interrupted → UI 标记中断
    - 打开新连接

  → 用户离开文章页：
    - 主动关闭 SSE 连接
    - 保留 session_id 在本地（可选，用于返回时恢复）
```

### 6.3 快捷操作流程

```
用户点击 [📖 解释] / [🐛 调试] / [🧪 测试]
  → 自动生成对应 prompt：
    - 解释 → "请解释这段代码的逻辑和设计意图"
    - 调试 → "请分析这段代码的问题并给出修复建议。当前输出是：[Output 区内容]"
    - 测试 → "请为这段代码生成边界测试用例"
  → 等同于用户手动输入该问题
  → 走 6.2 标准 AI 对话流程
```

### 6.4 代码建议应用与执行流程

```
AI 返回 proposal 事件
  → 对话区渲染 <CodeSuggestion /> 块（diff 绿色高亮）
  → 显示剩余有效期倒计时

用户选择路径 A：应用到编辑器后手动运行
  → 点击 [✅ 应用到编辑器]
  → Monaco Editor 内容替换为 proposal.code
  → 用户可以在编辑器中继续修改
  → 用户点击 ▶ Run → 走 6.1 代码运行流程

用户选择路径 B：直接确认运行 AI 的提议
  → 点击 [▶ 确认运行] 或对话回复"好的"/"运行"/"确认"等关键词
  → 前端调用 POST /api/confirm（带 session_id + proposal_id）
  → 按钮变为"执行中..."状态
  → 等待 SSE 推送 execution_result 事件
  → 对话区渲染执行结果消息
  → 同时更新对应代码块的 Output 区

异常处理：
  - proposal 已过期（10min）→ 按钮置灰 + 提示"请让 AI 重新生成"
  - proposal 重复确认（后端返回 409）→ 显示"已提交执行，请等待结果"
  - session 过期（后端返回 404）→ 显示"会话已过期，请刷新页面重新开始"
```

### 6.5 SSE 断线重连流程

```
SSE 连接意外断开（网络波动）
  → 前端检测到连接关闭
  → 等待 3 秒
  → 自动发起 /api/chat 请求（带 session_id，不重发消息）
  → 后端识别 session_id 已有 PendingResults → 通过新连接推送
  → UI 追加"断连期间到达的结果"到对话流

连续断开 3 次：
  → 停止自动重连
  → 显示"连接已断开，点击重连"按钮，交给用户手动触发
```

---

## 七、组件树

```
<App>
  <Navbar />
  <Routes>
    <HomePage>
      <HeroSection />
      <PostList>
        <PostCard />
      </PostList>
    </HomePage>

    <PostPage>
      <ArticleHeader />
      <ArticleBody>
        <MarkdownRenderer>
          <CodeBlock>                    ← 核心组件
            <CodeBlockHeader />
            <MonacoEditor />
            <OutputPanel />
            <AIPanel>                    ← 展开时渲染
              <AIPanelHeader />
              <ChatMessages>
                <UserMessage />
                <AIMessage />
                <CodeSuggestion />
                <ExecutionResult />
              </ChatMessages>
              <ChatInput />
            </AIPanel>
          </CodeBlock>
        </MarkdownRenderer>
      </ArticleBody>
    </PostPage>

    <AboutPage />
    <TagsPage />
    <TagFilterPage />
  </Routes>
  <Footer />
</App>
```

---

## 八、文章数据来源

文章存储为本地 Markdown 文件，使用 Next.js 的 SSG（Static Site Generation）在构建时渲染。

```
content/
  posts/
    go-concurrency.md       # 文章 Markdown 源文件
    react-agent-design.md
    p2c-load-balancing.md
  about.md                  # 关于页内容
```

每篇文章的 Markdown 文件包含 frontmatter 元数据：

```yaml
---
title: Go 并发编程：从 Goroutine 到 Channel
date: 2026-04-10
tags: [Go, 并发]
summary: 深入理解 Go 并发模型...
---
```

**渲染策略**：
- 使用 `generateStaticParams` 在构建时生成所有文章页
- Markdown 中的代码围栏（` ```language `）由自定义 `rehype` 插件替换为 `<CodeBlock />` 组件
- 每个代码围栏自动分配 `block_id`（基于在文章中的顺序：`block-0`、`block-1`...）

---

## 九、不在本期范围

| 功能 | 原因 |
|------|------|
| 用户系统 / 评论 | 单人博客不需要 |
| 亮色主题实现 | 暗色优先，仅预留切换架构 |
| 移动端适配 | 代码编辑器在移动端体验差，优先桌面端 |
| 文章管理后台 | 文章数据直接通过 Markdown 文件或 API 获取 |
| 代码自动补全 | 与对话式交互定位不同 |
| 跨文章对话历史 | 每篇文章独立 session |
