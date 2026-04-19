# CodeRunner Front

一个基于 Next.js 构建的交互式技术博客平台。文章中的代码片段可以直接运行，并内置 AI 助手提供代码解释、调试和重构能力。

## 项目介绍

CodeRunner Front 是 CodeRunner 项目的前端部分，旨在将传统的技术博客阅读体验升级为交互式学习体验。读者不仅可以阅读文章，还可以：

- 直接在浏览器中运行文章中的代码示例
- 使用独立的 Playground 编写和执行代码
- 借助 AI 助手理解、调试和优化代码
- 通过 URL 分享代码片段

后端代码执行引擎提供安全的沙箱环境，目前支持 **Go、Python、JavaScript、Java、C** 五种语言。

## 技术栈

| 类别           | 技术                         | 版本    |
| -------------- | ---------------------------- | ------- |
| 框架           | Next.js (App Router)         | 16      |
| UI             | React                        | 19      |
| 语言           | TypeScript                   | 5       |
| 样式           | Tailwind CSS                 | 4       |
| 代码编辑器     | Monaco Editor                | 4.7     |
| 状态管理       | Zustand                      | 5       |
| Markdown 渲染  | react-markdown + remark-gfm  | 10 / 4  |
| 压缩           | pako                         | 2       |

## 产品功能

### 交互式博客

- 基于 Markdown 的文章系统，支持 YAML front matter 定义标题、日期、标签和摘要
- 文章中的代码块自动识别语言并渲染为可交互的编辑器
- 支持按标签浏览和筛选文章

### 代码执行

- 文章内嵌代码块支持一键运行，输出实时通过 SSE 流式返回
- 独立 Playground 页面，支持多语言切换和代码编辑
- 30 秒执行超时保护，支持手动中断
- 代码自动保存至 localStorage（Playground）

### AI 助手

- 上下文感知对话：AI 了解当前文章内容和所有代码块
- 快捷操作：解释代码、调试分析、生成测试用例
- 代码建议（Proposal）机制：AI 提出代码修改建议，用户可预览后应用或直接执行
- 建议 10 分钟有效期，带倒计时显示
- 多轮对话支持，流式输出

### 代码分享

- 代码通过 pako 压缩后编码至 URL 参数
- 一键复制分享链接
- 访问分享链接自动还原语言和代码内容

### 界面设计

- 深色主题，定制色彩体系
- 响应式布局
- 键盘快捷键：`Ctrl+Enter` 运行代码，`Ctrl+S` 保存
- 代码块支持展开视图，左侧编辑器 + 右侧 AI 面板并排显示

## 项目结构

```text
src/
├── app/                        # 页面路由
│   ├── page.tsx               # 首页（文章列表）
│   ├── layout.tsx             # 根布局（导航栏 + 页脚）
│   ├── playground/page.tsx    # 独立代码编辑器
│   ├── posts/[slug]/page.tsx  # 文章详情页
│   ├── tags/page.tsx          # 标签总览
│   ├── tags/[tag]/page.tsx    # 按标签筛选
│   └── about/page.tsx         # 关于页面
│
├── components/                 # UI 组件
│   ├── Navbar.tsx             # 顶部导航
│   ├── Footer.tsx             # 页脚
│   ├── PostCard.tsx           # 文章卡片
│   ├── CodeBlock.tsx          # 可交互代码块
│   ├── CodeBlockHeader.tsx    # 代码块头部（运行/AI/展开）
│   ├── OutputPanel.tsx        # 执行输出面板
│   ├── MarkdownRenderer.tsx   # Markdown 渲染器
│   ├── PlaygroundToolbar.tsx  # Playground 工具栏
│   ├── PlaygroundAIPanel.tsx  # Playground AI 面板
│   ├── AIPanel.tsx            # 文章代码块 AI 面板
│   ├── ChatMessages.tsx       # 聊天消息渲染
│   ├── ChatInput.tsx          # 聊天输入框
│   ├── CodeSuggestion.tsx     # AI 代码建议展示
│   ├── LanguageSelector.tsx   # 语言选择器
│   └── StatusBar.tsx          # 状态栏（字符/行数统计）
│
├── lib/                        # 工具函数
│   ├── api.ts                 # 后端 API 调用
│   ├── templates.ts           # 语言模板和默认代码
│   ├── markdown.ts            # Markdown 解析与文章加载
│   ├── share.ts               # 代码压缩/分享
│   └── sse.ts                 # SSE 流式请求处理
│
├── store/                      # 状态管理
│   ├── usePlaygroundStore.ts  # Playground 全局状态
│   └── usePostStore.ts        # 文章代码块状态
│
└── types/index.ts              # TypeScript 类型定义

content/                        # 博客内容
├── posts/                     # 文章 Markdown 文件
└── about.md                   # 关于页面内容
```

## 本地部署

### 前置条件

- Node.js >= 20
- npm
- CodeRunner 后端服务已运行（本地默认 `http://localhost:50012`，生产 `http://your-server:7979`）

### 安装步骤

1. 克隆仓库并进入前端目录：

```bash
cd codeRunner-front
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，确认后端地址：

```bash
# 后端 API 地址
NEXT_PUBLIC_API_BASE=http://localhost:50012
```

4. 启动开发服务器：

```bash
npm run dev
```

5. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
npm run build
npm start
```

### Docker 部署

```bash
# 构建镜像（可通过 build-arg 指定后端地址）
docker build -t coderunner-front \
  --build-arg NEXT_PUBLIC_API_BASE=http://your-api-host:7979 .

# 运行容器
docker run -p 3000:3000 coderunner-front
```

## 编写文章

在 `content/posts/` 下创建 Markdown 文件，格式如下：

```markdown
---
title: "文章标题"
date: "2026-04-17"
tags: [Go, 并发]
summary: "文章摘要"
---

正文内容...

代码块会自动变为可运行的交互式编辑器：

​```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
​```
```

支持的代码语言：`go`、`python`、`javascript`、`java`、`c`

## 后端 API

前端依赖以下后端接口：

| 接口             | 方法   | 说明                                                  |
| ---------------- | ------ | ----------------------------------------------------- |
| `/api/execute`   | POST   | 执行代码，返回 SSE 流                                 |
| `/api/chat`      | POST   | AI 对话，返回 SSE 流（含文本、代码建议、执行结果）    |
| `/api/confirm`   | POST   | 确认并执行 AI 代码建议                                |
