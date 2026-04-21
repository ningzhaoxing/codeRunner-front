"use client";

import { useMemo, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { Components } from "react-markdown";
import CodeBlock from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
  articleId?: string;
  articleContent?: string;
}

function extractCodeBlocks(content: string): { language: string; code: string }[] {
  const blocks: { language: string; code: string }[] = [];
  const regex = /```(\w+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ language: match[1], code: match[2].trim() });
  }
  return blocks;
}

export default function MarkdownRenderer({ content, articleId, articleContent }: MarkdownRendererProps) {
  const blockCounterRef = useRef(0);
  blockCounterRef.current = 0;

  const allCodeBlocks = useMemo(() => extractCodeBlocks(content), [content]);

  const components = useMemo<Components>(
    () => ({
      h2: ({ children, ...props }) => (
        <h2
          className="text-text-title text-[18px] font-semibold mt-8 mb-3 pb-1 border-b border-border"
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="text-text-title text-[16px] font-semibold mt-6 mb-2" {...props}>
          {children}
        </h3>
      ),
      p: ({ children, ...props }) => (
        <p className="text-text-body text-[15px] leading-[1.8] mb-4" {...props}>
          {children}
        </p>
      ),
      code: ({ className, children, ...props }) => {
        const isBlock = Boolean(className?.startsWith("language-"));
        if (isBlock) {
          const lang = className?.replace("language-", "") || "text";
          const blockIndex = blockCounterRef.current++;
          const blockId = `${articleId || "post"}-block-${blockIndex}`;
          const codeText = String(children).replace(/\n$/, "");
          return (
            <CodeBlock
              blockId={blockId}
              blockIndex={blockIndex}
              code={codeText}
              language={lang}
              articleId={articleId}
              articleContent={articleContent}
              allCodeBlocks={allCodeBlocks}
            />
          );
        }
        return (
          <code
            className="bg-[#151520] text-accent text-[13px] px-1.5 py-0.5 rounded border border-border font-mono"
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }) => <>{children}</>,
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="border-l-[3px] border-accent bg-[#0d1a20] pl-4 py-2 my-4 rounded-r"
          {...props}
        >
          {children}
        </blockquote>
      ),
      a: ({ href, children, ...props }) => {
        if (href?.startsWith("/")) {
          return (
            <Link href={href} className="text-tag hover:text-accent transition-colors" {...props}>
              {children}
            </Link>
          );
        }
        return (
          <a
            href={href}
            className="text-tag hover:text-accent transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      },
      ul: ({ children, ...props }) => (
        <ul className="list-disc list-inside text-text-body text-[15px] mb-4 space-y-1" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="list-decimal list-inside text-text-body text-[15px] mb-4 space-y-1" {...props}>
          {children}
        </ol>
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [articleId, articleContent, allCodeBlocks]
  );

  return (
    <div className="prose-custom">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
