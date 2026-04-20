"use client";

import { useOnboardingStore, shouldShowOnboarding } from "@/store/useOnboardingStore";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingTrigger() {
  const { start } = useOnboardingStore();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!shouldShowOnboarding());
  }, []);

  // Only show on homepage to avoid interrupting article reading
  if (!show || pathname !== "/") return null;

  return (
    <button
      onClick={start}
      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-body"
      title="查看新手引导 (Shift+?)"
      aria-label="查看新手引导"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>
  );
}
