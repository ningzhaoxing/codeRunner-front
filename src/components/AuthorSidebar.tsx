import Link from "next/link";

const AUTHOR = {
  name: "ningzhaoxing",
  title: "灵码云作者",
  avatarUrl: "https://github.com/ningzhaoxing.png",
  githubUrl: "https://github.com/ningzhaoxing",
  githubText: "github.com/ningzhaoxing",
  bio: "关注交互式代码学习、AI Agent 与工程实践，把代码片段变成可运行、可追问的学习体验。",
};

interface AuthorSidebarProps {
  postCount: number;
  tagCount: number;
}

function AuthorContent({ postCount, tagCount }: AuthorSidebarProps) {
  return (
    <>
      <div className="flex items-center gap-4 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AUTHOR.avatarUrl}
          alt={`${AUTHOR.name} avatar`}
          className="h-16 w-16 rounded-full border-2 border-accent/40 object-cover lg:h-20 lg:w-20"
        />
        <div className="min-w-0 lg:mt-4">
          <h2 className="truncate text-base font-semibold text-text-title">{AUTHOR.name}</h2>
          <p className="mt-0.5 text-xs text-accent">{AUTHOR.title}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-text-secondary">{AUTHOR.bio}</p>

      <div className="mt-5 grid grid-cols-2 gap-2 border-y border-border py-3">
        <div>
          <div className="text-lg font-semibold text-text-title">{postCount}</div>
          <div className="text-xs text-text-disabled">文章</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-text-title">{tagCount}</div>
          <div className="text-xs text-text-disabled">标签</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <a
          href={AUTHOR.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-tag transition-colors hover:text-accent"
        >
          {AUTHOR.githubText}
        </a>
        <Link href="/about" className="text-text-secondary transition-colors hover:text-text-title">
          关于作者
        </Link>
        <Link href="/feedback" className="text-text-secondary transition-colors hover:text-text-title">
          反馈建议
        </Link>
      </div>
    </>
  );
}

export default function AuthorSidebar(props: AuthorSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-20 lg:w-64 lg:shrink-0">
      <details className="mb-2 rounded-lg border border-border bg-surface-nav/70 p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-medium text-text-title">
          作者信息
        </summary>
        <div className="mt-4 border-t border-border pt-4">
          <AuthorContent {...props} />
        </div>
      </details>

      <div className="hidden rounded-lg border border-border bg-surface-nav/70 p-5 lg:block">
        <AuthorContent {...props} />
      </div>
    </aside>
  );
}
