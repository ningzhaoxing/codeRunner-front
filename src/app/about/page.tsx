import fs from "fs";
import path from "path";
import matter from "gray-matter";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function AboutPage() {
  const raw = fs.readFileSync(path.join(process.cwd(), "content/about.md"), "utf-8");
  const { content } = matter(raw);

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-20 pb-16">
      <h1 className="text-text-title text-2xl font-semibold mb-6">关于</h1>
      <MarkdownRenderer content={content} articleId="" articleContent="" />
    </div>
  );
}
