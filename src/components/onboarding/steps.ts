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
    content: "🤖 遇到问题？试试 AI 助手，可以解释代码、调试错误、生成测试",
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
    id: "complete",
    targetSelector: ".monaco-editor",
    content:
      "✅ 你已掌握核心功能！提示：Ctrl+Enter 快速运行代码。随时按 Shift+? 重新查看引导",
    position: "top",
    route: "/playground",
  },
];
