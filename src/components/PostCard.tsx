import Link from "next/link";
import type { Article } from "@/types";

export default function PostCard({ post }: { post: Article }) {
  return (
    <article className="py-5 border-b border-border">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/posts/${post.slug}`}
          className="text-text-title text-[15px] font-medium hover:text-accent transition-colors"
        >
          {post.title}
        </Link>
        <span className="text-text-disabled text-xs shrink-0 mt-[3px]">{post.date}</span>
      </div>
      {post.summary && (
        <p className="text-text-secondary text-[13px] mt-1.5 leading-relaxed">{post.summary}</p>
      )}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="bg-[#1e1e3a] text-tag text-[11px] px-2 py-0.5 rounded-full hover:text-accent transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
