"use client";

import { useCallback, useRef } from "react";
import { usePostStore } from "@/store/usePostStore";
import { chatWithAgent } from "@/lib/api";
import type { SSEEvent } from "@/lib/sse";
import type { Proposal, ChatMessage } from "@/types";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

interface AIPanelProps {
  blockId: string;
  articleId: string;
  articleContent: string;
  allCodeBlocks: { block_id: string; language: string; code: string }[];
}

let msgIdCounter = 0;
function nextMsgId() {
  return `msg-${Date.now()}-${++msgIdCounter}`;
}

export default function AIPanel({ blockId, articleId, articleContent, allCodeBlocks }: AIPanelProps) {
  const block = usePostStore((s) => s.codeBlocks[blockId]);
  const session = usePostStore((s) => s.session);
  const addAIMessage = usePostStore((s) => s.addAIMessage);
  const updateLastAIMessage = usePostStore((s) => s.updateLastAIMessage);
  const setStreaming = usePostStore((s) => s.setStreaming);
  const setSessionId = usePostStore((s) => s.setSessionId);
  const addProposal = usePostStore((s) => s.addProposal);
  const updateProposalStatus = usePostStore((s) => s.updateProposalStatus);
  const setOutput = usePostStore((s) => s.setOutput);

  const abortRef = useRef<AbortController | null>(null);
  const sentArticleCtx = useRef(false);
  const sendMessage = useCallback(
    async (text: string) => {
      if (session.isStreaming) return;

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        blockId,
        type: "user",
        content: text,
        timestamp: Date.now(),
      };
      addAIMessage(blockId, userMsg);

      const aiMsg: ChatMessage = {
        id: nextMsgId(),
        blockId,
        type: "ai",
        content: "",
        timestamp: Date.now(),
      };
      addAIMessage(blockId, aiMsg);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const currentCode = usePostStore.getState().codeBlocks[blockId]?.code ?? "";
      const currentSessionId = usePostStore.getState().session.sessionId;

      const articleCtx =
        !sentArticleCtx.current && !currentSessionId
          ? { article_id: articleId, article_content: articleContent, code_blocks: allCodeBlocks }
          : undefined;

      if (articleCtx) sentArticleCtx.current = true;

      let aiContent = "";

      try {
        await chatWithAgent(
          {
            session_id: currentSessionId ?? "",
            user_message: text,
            active_block_id: blockId,
            current_code: currentCode,
            article_ctx: articleCtx,
          },
          (event: SSEEvent) => {
            if (event.type === "session" && typeof event.session_id === "string") {
              setSessionId(event.session_id);
            } else if (event.type === "chunk" && typeof event.content === "string") {
              aiContent += event.content;
              updateLastAIMessage(blockId, aiContent);
            } else if (event.type === "proposal") {
              const p = event as unknown as {
                proposal_id: string;
                code: string;
                language: string;
                description: string;
              };
              const proposal: Proposal = {
                id: p.proposal_id,
                blockId,
                code: p.code,
                language: p.language,
                description: p.description,
                createdAt: Date.now(),
                expiresAt: Date.now() + 10 * 60 * 1000,
                status: "pending",
              };
              addProposal(proposal);
              addAIMessage(blockId, {
                id: nextMsgId(),
                blockId,
                type: "proposal",
                content: "",
                proposalId: proposal.id,
                timestamp: Date.now(),
              });
            } else if (event.type === "execution_result") {
              const output = (event.output as string) ?? "";
              const error = (event.error as string) ?? null;
              setOutput(blockId, output || null, error);
              addAIMessage(blockId, {
                id: nextMsgId(),
                blockId,
                type: "execution_result",
                content: error ? `Error: ${error}` : output,
                timestamp: Date.now(),
              });
              if (typeof event.proposal_id === "string") {
                updateProposalStatus(event.proposal_id as string, "executed");
              }
            } else if (event.type === "interrupted") {
              addAIMessage(blockId, {
                id: nextMsgId(),
                blockId,
                type: "interrupted",
                content: "",
                timestamp: Date.now(),
              });
            } else if (event.type === "error") {
              addAIMessage(blockId, {
                id: nextMsgId(),
                blockId,
                type: "error",
                content: (event.message as string) ?? "未知错误",
                timestamp: Date.now(),
              });
            }
          },
          controller.signal
        );
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          addAIMessage(blockId, {
            id: nextMsgId(),
            blockId,
            type: "error",
            content: "网络错误，请重试",
            timestamp: Date.now(),
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [blockId, articleId, articleContent, allCodeBlocks, session.isStreaming, addAIMessage, updateLastAIMessage, setStreaming, setSessionId, addProposal, updateProposalStatus, setOutput]
  );

  const messages = block?.aiMessages ?? [];
  const isStreaming = session.isStreaming;

  const shortcuts = [
    { label: "📖 解释", prompt: "请解释这段代码的逻辑和设计意图" },
    { label: "🐛 调试", prompt: `请分析这段代码的问题并给出修复建议。当前输出是：${block?.output || "(无)"}` },
    { label: "🧪 测试", prompt: "请为这段代码生成边界测试用例" },
  ];

  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs text-text-title font-medium">🤖 AI 助手</span>
        <div className="flex gap-1">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              onClick={() => sendMessage(s.prompt)}
              disabled={isStreaming}
              className="text-[11px] px-1.5 py-0.5 rounded bg-surface-3 text-text-secondary hover:text-text-body hover:bg-surface-2 transition-colors disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <ChatMessages messages={messages} blockId={blockId} />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
