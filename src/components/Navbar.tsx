import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-nav border-b border-border">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-accent font-bold font-mono text-lg">CodeRunner</span>
          <span className="text-text-disabled text-xs">Blog</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-text-secondary hover:text-text-title text-sm transition-colors">
            首页
          </Link>
          <Link href="/tags" className="text-text-secondary hover:text-text-title text-sm transition-colors">
            标签
          </Link>
          <Link href="/about" className="text-text-secondary hover:text-text-title text-sm transition-colors">
            关于
          </Link>
        </div>
      </div>
    </nav>
  );
}
