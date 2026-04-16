import { getAllPosts } from "@/lib/markdown";
import PostCard from "@/components/PostCard";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-14">
      {/* Hero */}
      <section className="py-12">
        <h1 className="text-text-title text-2xl font-semibold mb-3">Hi, I&apos;m Ning 👋</h1>
        <p className="text-text-secondary text-[15px] leading-relaxed">
          这里记录我的技术思考与探索。博客中的代码块支持{" "}
          <span className="text-accent font-medium">代码可直接运行</span>，配合 AI 助手一起学习。
        </p>
      </section>

      {/* Post list */}
      <section className="pb-16">
        <h2 className="text-text-disabled text-xs font-medium uppercase tracking-wider mb-2">
          Recent Posts
        </h2>
        {posts.length === 0 ? (
          <p className="text-text-disabled text-sm py-8">暂无文章</p>
        ) : (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </section>
    </div>
  );
}
