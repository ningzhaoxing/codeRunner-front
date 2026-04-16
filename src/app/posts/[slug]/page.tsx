import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/markdown";
import ArticleHeader from "@/components/ArticleHeader";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getPostBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-14 pb-16">
      <ArticleHeader article={article} />
      <MarkdownRenderer content={article.content} articleId={article.slug} articleContent={article.content} />
    </div>
  );
}
