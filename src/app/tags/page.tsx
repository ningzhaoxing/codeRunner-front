import Link from "next/link";
import { getAllTags, getAllPosts } from "@/lib/markdown";

export default function TagsPage() {
  const tags = getAllTags();
  const posts = getAllPosts();

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-20 pb-16">
      <h1 className="text-text-title text-2xl font-semibold mb-6">标签</h1>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => {
          const count = posts.filter((p) => p.tags.includes(tag)).length;
          return (
            <Link key={tag} href={`/tags/${tag}`} className="bg-[#1e1e3a] text-tag px-3 py-1.5 rounded border border-border hover:bg-surface-3 text-sm transition-colors">
              {tag} <span className="text-text-disabled text-xs ml-1">({count})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
