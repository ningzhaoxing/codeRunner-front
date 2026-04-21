export interface OnboardingStep {
  id: string;
  targetSelector: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  route?: string;
  advanceOnRoute?: string;
  /** Auto-advance when this custom DOM event fires on window */
  advanceOnEvent?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    targetSelector: '[data-onboarding-target="first-post"]',
    content:
      "👋 欢迎来到 CodeRunner！先打开这篇 Go 并发博客，我带你体验最核心的能力 —— 博客代码片段直接补全并运行。点击文章标题进入 →",
    position: "bottom",
    route: "/",
    advanceOnRoute: "/posts/",
  },
  {
    id: "run-code",
    targetSelector: '[data-onboarding-target="run-button"]',
    content:
      "▶️ 第一步：先点这个 Run 按钮试试。这段 fetchAll 只是一个函数，没有 main、没有 import —— 你会看到它跑不起来，这就是博客代码片段的典型痛点。\n\n👉 现在点 Run 按钮",
    position: "bottom",
    advanceOnEvent: "onboarding:code-ran",
  },
  {
    id: "ai-assistant",
    targetSelector: '[data-onboarding-target="ai-button"]',
    content:
      "🤖 看到报错了吧？现在轮到 AI 助手登场。点击这个 🤖 按钮打开它 —— 它已经知道你正在看 Block 1 的 fetchAll，会帮你把缺失的 package / import / main 全部补齐。\n\n👉 点击 🤖 按钮",
    position: "bottom",
    advanceOnEvent: "onboarding:ai-opened",
  },
  {
    id: "ai-ask",
    targetSelector: '[data-onboarding-target="ai-input"]',
    content:
      "💬 在下方输入框里告诉它你想要什么。复制下面这句粘贴进去（或自己输入）：\n\n「帮我把这段代码补全成可运行程序，传入 [\"api.a.com\", \"api.b.com\", \"api.c.com\"]」\n\n👉 发送消息后会自动进入下一步",
    position: "left",
    advanceOnEvent: "onboarding:ai-message-sent",
  },
  {
    id: "ai-confirm",
    targetSelector: '[data-onboarding-target="ai-input"]',
    content:
      "✅ Agent 会先流式解释它补了什么，然后提议执行 —— 注意这里的关键设计：不需要点按钮，回一句「好的」或「运行」它就识别意图执行，stdout 实时回流。\n\n试试基于真实输出继续追问：「为什么三次 fetching 顺序不一样？」",
    position: "left",
  },
  {
    id: "playground",
    targetSelector: '[data-onboarding-target="playground-link"]',
    content:
      "🎨 看完博客想自己动手？Playground 支持 Go / Python / JavaScript / Java / C 五种语言，代码自动保存到本地。点这里进入 →",
    position: "bottom",
    advanceOnRoute: "/playground",
  },
  {
    id: "feedback",
    targetSelector: '[data-onboarding-target="feedback-link"]',
    content: "💬 用得不爽或有建议？点「反馈」告诉我，我会认真看每一条",
    position: "bottom",
    route: "/playground",
  },
  {
    id: "complete",
    targetSelector: ".monaco-editor",
    content:
      "✅ 引导完成！提示：Ctrl+Enter 快速运行代码，Shift+? 随时重新查看引导。开始探索吧 🚀",
    position: "top",
    route: "/playground",
  },
];
