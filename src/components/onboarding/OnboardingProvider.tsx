"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useOnboardingStore, shouldShowOnboarding } from "@/store/useOnboardingStore";
import { ONBOARDING_STEPS } from "./steps";
import OnboardingSpotlight from "./OnboardingSpotlight";
import OnboardingTooltip from "./OnboardingTooltip";

export default function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isActive, currentStep, start, next, setTargetElement } = useOnboardingStore();
  const pathname = usePathname();

  useEffect(() => {
    if (shouldShowOnboarding()) {
      const timer = setTimeout(() => start(), 800);
      return () => clearTimeout(timer);
    }
  }, [start]);

  // Auto-advance when user navigates to the expected route
  useEffect(() => {
    if (!isActive) return;
    const step = ONBOARDING_STEPS[currentStep];
    if (!step?.advanceOnRoute) return;

    if (pathname.startsWith(step.advanceOnRoute)) {
      next();
    }
  }, [isActive, currentStep, pathname, next]);

  const findTarget = useCallback(() => {
    if (!isActive) return;
    const step = ONBOARDING_STEPS[currentStep];
    if (!step) return;

    const el = document.querySelector<HTMLElement>(step.targetSelector);

    if (el) {
      setTargetElement(el);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      console.warn(`[Onboarding] Target not found: ${step.targetSelector}`);
    }
  }, [isActive, currentStep, setTargetElement]);

  useEffect(() => {
    if (!isActive) return;

    findTarget();

    const retryTimers = [100, 300, 600, 1000].map((delay) =>
      setTimeout(findTarget, delay)
    );

    return () => retryTimers.forEach(clearTimeout);
  }, [findTarget, isActive]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        start();
      }
      if (e.key === "Escape" && isActive) {
        useOnboardingStore.getState().skip();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, start]);

  return (
    <>
      {children}
      <OnboardingSpotlight />
      <OnboardingTooltip />
    </>
  );
}
