# Feedback Form Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/feedback` page with a type/content/contact form that POSTs to `POST /api/feedback` and shows success/error states; add a "反馈" nav link in the Navbar.

**Architecture:** Next.js App Router — one new `"use client"` page component at `src/app/feedback/page.tsx`, one new API function in `src/lib/api.ts`, one Navbar link change. No new shared components needed.

**Tech Stack:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS (existing design tokens), `fetch` for HTTP.

**Spec reference:** `docs/superpowers/specs/2026-04-20-feedback-form-design.md` (sections 4.1–4.3)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/components/Navbar.tsx` | Add「反馈」link after「关于」 |
| Create | `src/app/feedback/page.tsx` | Feedback form page (client component) |
| Modify | `src/lib/api.ts` | Add `submitFeedback()` function |

---

## Task 1: Add `submitFeedback` API function

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add the function at the bottom of `src/lib/api.ts`**

```typescript
export async function submitFeedback(payload: {
  type: "bug" | "suggestion" | "other";
  content: string;
  contact?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) {
    return { success: false, message: "提交过于频繁，请稍后再试" };
  }
  const body = await res.json().catch(() => ({ success: false, message: res.statusText }));
  if (!res.ok) {
    return { success: false, message: body.message || "提交失败，请稍后重试" };
  }
  return body as { success: boolean; message: string };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ningzhaoxing/Desktop/code_runner/codeRunner-front
npx tsc --noEmit
```
Expected: no errors related to `api.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add submitFeedback API client function"
```

---

## Task 2: Add「反馈」link to Navbar

**Files:**
- Modify: `src/components/Navbar.tsx`

Current nav links (from file): 首页 → Playground → 标签 → 关于 → OnboardingTrigger

- [ ] **Step 1: Insert「反馈」link after「关于」in Navbar.tsx**

Find this block in `src/components/Navbar.tsx`:
```tsx
          <Link href="/about" className={linkClass("/about")}>关于</Link>
          <OnboardingTrigger />
```

Replace with:
```tsx
          <Link href="/about" className={linkClass("/about")}>关于</Link>
          <Link href="/feedback" className={linkClass("/feedback")}>反馈</Link>
          <OnboardingTrigger />
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add 反馈 nav link to Navbar"
```

---

## Task 3: Create Feedback Form Page

**Files:**
- Create: `src/app/feedback/page.tsx`

- [ ] **Step 1: Create the page file**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Start dev server and manually test the page**

```bash
npm run dev
```

Open http://localhost:3000/feedback and verify:
- Form renders correctly with type dropdown, textarea, contact input, submit button
- Navbar shows「反馈」link, highlighted when on `/feedback`
- Submitting with content < 10 chars shows inline error without calling API
- Character counter updates as you type
- (Backend not running) submit → network error shown in red banner at top
- Submitted state shows green success card with「返回首页」link

- [ ] **Step 4: Commit**

```bash
git add src/app/feedback/
git commit -m "feat: add feedback form page at /feedback"
```

---

## Task 4: End-to-End Smoke Test (requires running backend)

- [ ] Start backend with `MAIL_PASSWORD` configured and `mail.enabled: true`
- [ ] Submit valid feedback from browser → confirm email received in QQ mailbox
- [ ] Submit 4 times within 1 minute from same IP → 4th shows「提交过于频繁，请稍后再试」
- [ ] Submit with < 10 chars → client-side error shown immediately (no API call)
- [ ] Submit with `mail.enabled: false` in backend → verify 500 is surfaced gracefully

---

## Notes

- **Navbar.tsx vs Header.tsx:** The spec mentions `src/components/Header.tsx` as an example path. This file does not exist in the codebase; `src/components/Navbar.tsx` is the confirmed nav component (verified by reading `src/app/layout.tsx`).
- The page uses existing CSS design tokens (`surface-0`, `text-body`, `accent`, `border`, etc.) from `globals.css` — no new styles needed.
- `API_BASE` is `NEXT_PUBLIC_API_BASE` env var, defaulting to `http://localhost:50012`. The `/api/feedback` path matches the backend route registered in `router.go`.
- Backend plan is at: `codeRunner-backend/docs/superpowers/plans/2026-04-21-feedback-form-backend.md`
