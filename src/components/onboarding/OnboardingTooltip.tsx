"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { ONBOARDING_STEPS, type OnboardingStep } from "./steps";

interface Position {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export default function OnboardingTooltip() {
  const { isActive, currentStep, totalSteps, targetElement, next, skip, complete } =
    useOnboardingStore();
  const [position, setPosition] = useState<Position>({});
  const [isMobile, setIsMobile] = useState(false);

  const step: OnboardingStep | undefined = ONBOARDING_STEPS[currentStep];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isActive || !targetElement || !step) {
      return;
    }

    function calculatePosition() {
      if (!targetElement || !step) return;

      if (isMobile) {
        setPosition({ bottom: 16, left: 16, right: 16 });
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      const gap = 16;

      let pos: Position = {};

      switch (step.position) {
        case "bottom":
          pos = {
            top: rect.bottom + gap,
            left: Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2),
          };
          break;
        case "top":
          pos = {
            bottom: window.innerHeight - rect.top + gap,
            left: Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2),
          };
          break;
        case "left":
          pos = {
            top: Math.max(16, rect.top + rect.height / 2 - tooltipHeight / 2),
            right: window.innerWidth - rect.left + gap,
          };
          break;
        case "right":
          pos = {
            top: Math.max(16, rect.top + rect.height / 2 - tooltipHeight / 2),
            left: rect.right + gap,
          };
          break;
      }

      setPosition(pos);
    }

    calculatePosition();
    window.addEventListener("scroll", calculatePosition, true);
    window.addEventListener("resize", calculatePosition);

    return () => {
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [isActive, targetElement, step, isMobile]);

  if (!isActive || !step) return null;

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className="fixed z-[9999] bg-msg-ai border border-surface-3 rounded-lg p-4 shadow-2xl max-w-[320px] pointer-events-auto"
      style={position}
    >
      <div className="flex gap-1 mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentStep ? "bg-accent" : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      <div className="text-text-body text-sm leading-relaxed mb-4 whitespace-pre-line">
        {step.content}
      </div>

      <div className="flex gap-2 justify-end">
        {!isLastStep && (
          <button
            onClick={skip}
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-body transition-colors"
          >
            跳过
          </button>
        )}
        <button
          onClick={isLastStep ? complete : next}
          className="px-4 py-1.5 text-sm bg-accent text-surface-0 rounded hover:bg-accent/90 transition-colors font-medium"
        >
          {isLastStep ? "完成" : "下一步"}
        </button>
      </div>
    </div>
  );
}
