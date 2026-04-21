// src/app/feedback/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { submitFeedback } from "@/lib/api";

type FeedbackType = "bug" | "suggestion" | "other";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Bug 反馈",
  suggestion: "功能建议",
  other: "其他",
};

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [contentError, setContentError] = useState("");

  function validateContent(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length < 10) return "内容至少需要 10 个字符";
    if (trimmed.length > 2000) return "内容不能超过 2000 个字符";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const contentErr = validateContent(content);
    if (contentErr) {
      setContentError(contentErr);
      return;
    }

    setLoading(true);
    try {
      const result = await submitFeedback({
        type,
        content: content.trim(),
        contact: contact.trim() || undefined,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-[720px] mx-auto px-6 pt-20 pb-16">
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-6 py-8 text-center">
          <p className="text-green-400 text-lg font-medium mb-2">感谢你的反馈！</p>
          <p className="text-text-secondary text-sm mb-6">我会认真查看每一条反馈。</p>
          <Link href="/" className="text-accent text-sm hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-20 pb-16">
      <h1 className="text-text-title text-2xl font-semibold mb-2">反馈</h1>
      <p className="text-text-secondary text-sm mb-8">
        遇到问题或有建议？欢迎告诉我。
      </p>

      {error && (
        <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">反馈类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FeedbackType)}
            className="w-full bg-surface-0 border border-border rounded-md px-3 py-2 text-text-body text-sm focus:outline-none focus:border-accent"
          >
            {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">
            内容 <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (contentError) setContentError(validateContent(e.target.value));
            }}
            placeholder="请描述你遇到的问题或建议…"
            className="w-full bg-surface-0 border border-border rounded-md px-3 py-2 text-text-body text-sm resize-none focus:outline-none focus:border-accent"
          />
          {contentError && (
            <p className="mt-1 text-red-400 text-xs">{contentError}</p>
          )}
          <p className="mt-1 text-text-disabled text-xs text-right">
            {content.trim().length} / 2000
          </p>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">联系方式</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={100}
            placeholder="邮箱 / 微信 / QQ（可选，用于回复）"
            className="w-full bg-surface-0 border border-border rounded-md px-3 py-2 text-text-body text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-accent text-surface-0 rounded-md text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "提交中…" : "提交反馈"}
        </button>
      </form>
    </div>
  );
}
