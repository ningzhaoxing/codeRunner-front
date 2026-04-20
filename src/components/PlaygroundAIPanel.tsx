"use client";

import { useCallback, useRef } from "react";
import { usePlaygroundStore } from "@/store/usePlaygroundStore";
import { chatWithAgent } from "@/lib/api";
import type { SSEEvent } from "@/lib/sse";
import type { Proposal, ChatMessage } from "@/types";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

let msgIdCounter = 0;
function nextMsgId() {
  return `pg-msg-${Date.now()}-${++msgIdCounter}`;
}

const BLOCK_ID = "playground";

export default function PlaygroundAIPanel() {
  const language = usePlaygroundStore((s) => s.language);
  const code = usePlaygroundStore((s) => s.code);
  const output = usePlaygroundStore((s) => s.output);
  const aiMessages = usePlaygroundStore((s) => s.aiMessages);
  const sessionId = usePlaygroundStore((s) => s.sessionId);
  const isStreaming = usePlaygroundStore((s) => s.isStreaming);
  const addAIMessage = usePlaygroundStore((s) => s.addAIMessage);
  const updateLastAIMessage = usePlaygroundStore((s) => s.updateLastAIMessage);
  const setStreaming = usePlaygroundStore((s) => s.setStreaming);
  const setSessionId = usePlaygroundStore((s) => s.setSessionId);
  const newAISession = usePlaygroundStore((s) => s.newAISession);
  const addProposal = usePlaygroundStore((s) => s.addProposal);
  const updateProposalStatus = usePlaygroundStore((s) => s.updateProposalStatus);
  const setOutput = usePlaygroundStore((s) => s.setOutput);

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        blockId: BLOCK_ID,
        type: "user",
        content: text,
        timestamp: Date.now(),
      };
      addAIMessage(userMsg);

      const aiMsg: ChatMessage = {
        id: nextMsgId(),
        blockId: BLOCK_ID,
        type: "ai",
        content: "",
        timestamp: Date.now(),
      };
      addAIMessage(aiMsg);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let aiContent = "";

      try {
        const currentCode = usePlaygroundStore.getState().code;
        const currentLang = usePlaygroundStore.getState().language;
        const currentSessionId = usePlaygroundStore.getState().sessionId;

        // Always send article_ctx when there's no session yet
        const articleCtx = !currentSessionId
          ? {
              article_id: "",
              article_content: "",
              code_blocks: [{ language: currentLang, code: currentCode }],
            }
          : undefined;


        await chatWithAgent(
          {
            session_id: currentSessionId ?? "",
            user_message: text,
            article_ctx: articleCtx,
          },
          (event: SSEEvent) => {
            if (event.type === "session_created" && typeof event.session_id === "string") {
              setSessionId(event.session_id);
            } else if (event.type === "stream_chunk" && typeof event.content === "string") {
              aiContent += event.content;
              updateLastAIMessage(aiContent);
            } else if (event.type === "message" && typeof event.content === "string") {
              aiContent += event.content;
              updateLastAIMessage(aiContent);
            } else if (event.type === "tool_result" && typeof event.content === "string") {
              addAIMessage({
                id: nextMsgId(),
                blockId: BLOCK_ID,
                type: "execution_result",
                content: event.content,
                timestamp: Date.now(),
              });
            } else if (event.type === "interrupt") {
              const p = (event as unknown as { proposal: { proposal_id: string; code: string; language: string; description?: string } }).proposal;
              const proposal: Proposal = {
                id: p.proposal_id,
                blockId: BLOCK_ID,
                code: p.code,
                language: p.language,
                description: p.description ?? "",
                createdAt: Date.now(),
                expiresAt: Date.now() + 10 * 60 * 1000,
                status: "pending",
              };
              addProposal(proposal);
              addAIMessage({
                id: nextMsgId(),
                blockId: BLOCK_ID,
                type: "proposal",
                content: "",
                proposalId: proposal.id,
                timestamp: Date.now(),
              });
            } else if (event.type === "error") {
              addAIMessage({
                id: nextMsgId(),
                blockId: BLOCK_ID,
                type: "error",
                content: (event.error as string) ?? "未知错误",
                timestamp: Date.now(),
              });
            }
          },
          controller.signal,
        );
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          addAIMessage({
            id: nextMsgId(),
            blockId: BLOCK_ID,
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
    [isStreaming, addAIMessage, updateLastAIMessage, setStreaming, setSessionId, addProposal, updateProposalStatus, setOutput],
  );

  const shortcuts = [
    { label: "📖 解释", prompt: "请解释这段代码的逻辑和设计意图" },
    { label: "🐛 调试", prompt: `请分析这段代码的问题并给出修复建议。当前输出是：${output || "(无)"}` },
    { label: "🧪 测试", prompt: "请为这段代码生成边界测试用例" },
  ];

  const handleNewSession = useCallback(() => {
    if (isStreaming) return;
    newAISession();
  }, [isStreaming, newAISession]);

  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs text-text-title font-medium">🤖 AI 助手</span>
        <div className="flex items-center gap-1">
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
          <button
            onClick={handleNewSession}
            disabled={isStreaming || aiMessages.length === 0}
            className="text-[11px] px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="开启新对话"
          >
            ↻ 新对话
          </button>
        </div>
      </div>
      <ChatMessages messages={aiMessages} blockId={BLOCK_ID} />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
