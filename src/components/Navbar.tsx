"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import OnboardingTrigger from "./onboarding/OnboardingTrigger";

export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `text-sm transition-colors ${isActive ? "text-accent" : "text-text-secondary hover:text-text-title"}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-nav border-b border-border">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-accent font-bold font-mono text-lg">CodeRunner</span>
          <span className="text-text-disabled text-xs">Blog</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className={linkClass("/")}>首页</Link>
          <Link href="/playground" className={linkClass("/playground")} data-onboarding-target="playground-link">Playground</Link>
          <Link href="/tags" className={linkClass("/tags")}>标签</Link>
          <Link href="/about" className={linkClass("/about")}>关于</Link>
          <Link href="/feedback" className={linkClass("/feedback")}>反馈</Link>
          <OnboardingTrigger />
        </div>
      </div>
    </nav>
  );
}
