import { create } from "zustand";
import { ONBOARDING_STEPS } from "@/components/onboarding/steps";

const STORAGE_KEY = "coderunner-onboarding-completed";

interface OnboardingStore {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  targetElement: HTMLElement | null;

  start: () => void;
  next: () => void;
  skip: () => void;
  complete: () => void;
  setTargetElement: (el: HTMLElement | null) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  isActive: false,
  currentStep: 0,
  totalSteps: ONBOARDING_STEPS.length,
  targetElement: null,

  start: () => {
    set({ isActive: true, currentStep: 0 });
  },

  next: () => {
    set((state) => {
      const nextStep = state.currentStep + 1;
      if (nextStep >= state.totalSteps) {
        localStorage.setItem(STORAGE_KEY, "true");
        return { isActive: false, currentStep: 0, targetElement: null };
      }
      return { currentStep: nextStep };
    });
  },

  skip: () => {
    localStorage.setItem(STORAGE_KEY, "skipped");
    set({ isActive: false, currentStep: 0, targetElement: null });
  },

  complete: () => {
    localStorage.setItem(STORAGE_KEY, "true");
    set({ isActive: false, currentStep: 0, targetElement: null });
  },

  setTargetElement: (el) => {
    set({ targetElement: el });
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ isActive: false, currentStep: 0, targetElement: null });
  },
}));

export function shouldShowOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  const completed = localStorage.getItem(STORAGE_KEY);
  return !completed;
}
