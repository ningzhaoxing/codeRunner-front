export interface OnboardingStep {
  id: string;
  targetSelector: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  route?: string;
  advanceOnRoute?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    targetSelector: '[data-onboarding-target="first-post"]',
    content:
      "👋 欢迎来到 CodeRunner！这里的代码块不只是展示，还能直接运行。点击这篇文章试试看 →",
    position: "bottom",
    route: "/",
    advanceOnRoute: "/posts/",
  },
  {
    id: "run-code",
    targetSelector: '[data-onboarding-target="run-button"]',
    content: "▶️ 点击 Run 按钮执行代码，输出会实时显示在下方面板",
    position: "bottom",
  },
  {
    id: "ai-assistant",
    targetSelector: '[data-onboarding-target="ai-button"]',
    content:
      "🤖 不止是 AI 助手 — 代码学习 Agent 能读懂整篇文章上下文：解释代码、分析报错、生成测试，甚至帮你把不完整的代码片段自动补全成可运行程序。生成代码后回一句「好的」它就帮你跑。",
    position: "bottom",
  },
  {
    id: "playground",
    targetSelector: '[data-onboarding-target="playground-link"]',
    content: "🎨 想自由编写代码？Playground 支持 5 种语言，代码自动保存",
    position: "bottom",
    advanceOnRoute: "/playground",
  },
  {
    id: "feedback",
    targetSelector: '[data-onboarding-target="feedback-link"]',
    content: "💬 遇到问题或有建议？点击「反馈」告诉我，我会认真查看每一条",
    position: "bottom",
    route: "/playground",
  },
  {
    id: "complete",
    targetSelector: ".monaco-editor",
    content:
      "✅ 你已掌握核心功能！提示：Ctrl+Enter 快速运行代码。随时按 Shift+? 重新查看引导",
    position: "top",
    route: "/playground",
  },
];
