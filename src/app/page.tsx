import { getAllPosts } from "@/lib/markdown";
import PostCard from "@/components/PostCard";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-14">
      {/* Hero */}
      <section className="py-12">
        <h1 className="text-text-title text-2xl font-semibold mb-3">欢迎来到灵码云</h1>
        <p className="text-text-secondary text-[15px] leading-relaxed mb-4">
          灵码云不是传统意义上的技术博客，而是一种{" "}
          <span className="text-accent font-medium">可交互的新型博客</span>
          ——文章里的每一段代码都能原地运行，不用跳转、不用本地配环境。
        </p>
        <p className="text-text-secondary text-[15px] leading-relaxed">
          身边还有一个 <span className="text-accent font-medium">AI Agent</span>{" "}
          帮你把片段补全成可运行程序、解释报错、按需改写示例——
          <span className="text-text-title">读、跑、改、问</span>在同一个页面完成。
        </p>
      </section>

      {/* Post list */}
      <section className="pb-16">
        <h2 className="text-text-disabled text-xs font-medium uppercase tracking-wider mb-2">
          Recent Posts {posts.length > 0 && `(${posts.length})`}
        </h2>
        {posts.length === 0 ? (
          <p className="text-text-disabled text-sm py-8">暂无文章</p>
        ) : (
          posts.map((post, i) => <PostCard key={post.slug} post={post} isFirst={i === 0} />)
        )}
      </section>
    </div>
  );
}
