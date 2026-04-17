import { getAllPosts, getAllTags } from "@/lib/markdown";
import PostCard from "@/components/PostCard";

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export default async function TagFilterPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getAllPosts().filter((p) => p.tags.includes(decodedTag));

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-20 pb-16">
      <h1 className="text-text-title text-2xl font-semibold mb-2">标签: {decodedTag}</h1>
      <p className="text-text-secondary text-sm mb-6">{posts.length} 篇文章</p>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
