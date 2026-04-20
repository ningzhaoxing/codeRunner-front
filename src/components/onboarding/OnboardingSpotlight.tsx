"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/store/useOnboardingStore";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

export default function OnboardingSpotlight() {
  const { isActive, targetElement } = useOnboardingStore();
  const [rect, setRect] = useState<Rect | null>(null);

  // Elevate target element above the overlay so it's naturally clickable
  useEffect(() => {
    if (!isActive || !targetElement) return;

    const prev = {
      position: targetElement.style.position,
      zIndex: targetElement.style.zIndex,
      borderRadius: targetElement.style.borderRadius,
    };

    targetElement.style.position = "relative";
    targetElement.style.zIndex = "9999";

    return () => {
      targetElement.style.position = prev.position;
      targetElement.style.zIndex = prev.zIndex;
      targetElement.style.borderRadius = prev.borderRadius;
    };
  }, [isActive, targetElement]);

  useEffect(() => {
    if (!isActive || !targetElement) {
      setRect(null);
      return;
    }

    function update() {
      if (!targetElement) return;
      const r = targetElement.getBoundingClientRect();
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    }

    update();

    const observer = new ResizeObserver(update);
    observer.observe(targetElement);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isActive, targetElement]);

  if (!isActive || !rect) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none"
      style={{ background: "transparent" }}
    >
      <div
        className="absolute rounded-lg transition-all duration-300 ease-out"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
