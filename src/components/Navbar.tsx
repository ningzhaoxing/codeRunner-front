"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import OnboardingTrigger from "./onboarding/OnboardingTrigger";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, loginWithGitHub, logout } = useAuth();

  const linkClass = (href: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `text-sm transition-colors ${isActive ? "text-accent" : "text-text-secondary hover:text-text-title"}`;
  };

  const handleLogin = () => {
    loginWithGitHub(pathname || "/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-nav border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-accent font-bold text-lg tracking-wide">灵码云</span>
          <span className="hidden sm:inline text-text-disabled text-xs">交互式博客</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className={linkClass("/")}>首页</Link>
          <Link href="/playground" className={linkClass("/playground")} data-onboarding-target="playground-link">代码编辑区</Link>
          <Link href="/tags" className={`${linkClass("/tags")} hidden sm:inline`}>标签</Link>
          <Link href="/about" className={`${linkClass("/about")} hidden sm:inline`}>关于</Link>
          <Link href="/feedback" className={linkClass("/feedback")} data-onboarding-target="feedback-link">反馈</Link>
          <OnboardingTrigger />
          <div className="h-6 w-px bg-border" aria-hidden="true" />
          {loading ? (
            <span className="h-8 w-16 rounded border border-border bg-surface-1" aria-label="加载登录状态" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span
                className="h-7 w-7 rounded-full bg-surface-1 border border-border bg-cover bg-center"
                style={user.avatar_url ? { backgroundImage: `url(${user.avatar_url})` } : undefined}
                aria-hidden="true"
              />
              <span className="hidden md:inline max-w-24 truncate text-sm text-text-secondary">
                {user.name || user.login}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-sm text-text-secondary transition-colors hover:text-text-title"
              >
                退出
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="whitespace-nowrap rounded border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              GitHub 登录
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
