"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";
import CodeSuggestion from "./CodeSuggestion";

interface ChatMessagesProps {
  messages: ChatMessage[];
  blockId: string;
}

export default function ChatMessages({ messages, blockId }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-disabled text-xs">
        点击上方快捷按钮或输入问题开始对话
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} blockId={blockId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
function MessageBubble({ message, blockId }: { message: ChatMessage; blockId: string }) {
  const { type, content } = message;

  if (type === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-msg-user rounded-[10px_10px_2px_10px] px-3 py-2 text-xs text-text-body max-w-[85%] whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>
    );
  }

  if (type === "ai") {
    return (
      <div className="flex justify-start">
        <div className="bg-msg-ai border border-[#1a2a35] rounded-[10px_10px_10px_2px] px-3 py-2 text-xs text-text-body max-w-[85%] whitespace-pre-wrap break-words">
          {content || <span className="animate-pulse text-text-disabled">思考中...</span>}
        </div>
      </div>
    );
  }

  if (type === "proposal" && message.proposalId) {
    return <CodeSuggestion proposalId={message.proposalId} blockId={blockId} />;
  }

  if (type === "execution_result") {
    const isError = content.startsWith("Error");
    return (
      <div className={`rounded-lg border px-3 py-2 text-xs font-mono ${isError ? "border-error/50 bg-error/5" : "border-accent/30 bg-exec-ok"}`}>
        <span className={isError ? "text-error" : "text-accent"}>{isError ? "✗" : "✓"} </span>
        <span className="text-text-body whitespace-pre-wrap">{content}</span>
      </div>
    );
  }

  if (type === "interrupted") {
    return <div className="text-center text-text-disabled text-[11px]">上一条回复已中断</div>;
  }

  if (type === "error") {
    return (
      <div className="text-center">
        <span className="inline-block border border-error/50 text-error text-[11px] rounded-full px-3 py-0.5">
          {content}
        </span>
      </div>
    );
  }

  // system
  return <div className="text-center text-text-disabled text-[11px]">{content}</div>;
}
