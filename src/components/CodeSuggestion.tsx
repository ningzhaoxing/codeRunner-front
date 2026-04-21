"use client";

import { useEffect, useState } from "react";
import { usePostStore } from "@/store/usePostStore";
import { usePlaygroundStore } from "@/store/usePlaygroundStore";
import { confirmProposal } from "@/lib/api";
import type { SSEEvent } from "@/lib/sse";
import type { Proposal, ChatMessage } from "@/types";

let confirmMsgId = 0;
function nextConfirmMsgId() {
  return `confirm-msg-${Date.now()}-${++confirmMsgId}`;
}

interface CodeSuggestionProps {
  proposalId: string;
  blockId: string;
}

export default function CodeSuggestion({ proposalId, blockId }: CodeSuggestionProps) {
  const postStoreProposal = usePostStore((s) => s.session.proposals[proposalId]);
  const playgroundProposal = usePlaygroundStore((s) => s.proposals[proposalId]);
  const proposal = playgroundProposal || postStoreProposal;

  const postSessionId = usePostStore((s) => s.session.sessionId);
  const playgroundSessionId = usePlaygroundStore((s) => s.sessionId);

  const isPlayground = !!playgroundProposal;
  const sessionId = isPlayground ? playgroundSessionId : postSessionId;

  const postUpdateCode = usePostStore((s) => s.updateCode);
  const playgroundSetCode = usePlaygroundStore((s) => s.setCode);

  const postUpdateProposalStatus = usePostStore((s) => s.updateProposalStatus);
  const playgroundUpdateProposalStatus = usePlaygroundStore((s) => s.updateProposalStatus);
  const updateProposalStatus = isPlayground ? playgroundUpdateProposalStatus : postUpdateProposalStatus;

  // Store methods for handling confirm SSE events
  const postAddMessage = usePostStore((s) => s.addAIMessage);
  const postUpdateLastMessage = usePostStore((s) => s.updateLastAIMessage);
  const postAddProposal = usePostStore((s) => s.addProposal);

  const pgAddMessage = usePlaygroundStore((s) => s.addAIMessage);
  const pgUpdateLastMessage = usePlaygroundStore((s) => s.updateLastAIMessage);
  const pgAddProposal = usePlaygroundStore((s) => s.addProposal);

  const [remaining, setRemaining] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!proposal || proposal.status === "expired") return;

    const tick = () => {
      const left = proposal.expiresAt - Date.now();
      if (left <= 0) {
        updateProposalStatus(proposalId, "expired");
        setRemaining("已过期");
        return;
      }
      const min = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [proposal, proposalId, updateProposalStatus]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("onboarding:proposal-shown"));
    }
  }, []);

  if (!proposal) return null;

  const isExpired = proposal.status === "expired";
  const isConfirmed = proposal.status === "confirmed" || proposal.status === "executed";

  const handleApply = () => {
    if (isPlayground) {
      playgroundSetCode(proposal.code);
    } else {
      postUpdateCode(blockId, proposal.code);
    }
  };

  const handleConfirm = async () => {
    if (!sessionId || isExpired || isConfirmed || confirming) return;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("onboarding:proposal-confirmed"));
    }
    setConfirming(true);
    updateProposalStatus(proposalId, "confirmed");

    // Add a placeholder AI message for the confirm response
    const aiMsgId = nextConfirmMsgId();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      blockId,
      type: "ai",
      content: "",
      timestamp: Date.now(),
    };

    if (isPlayground) {
      pgAddMessage(aiMsg);
    } else {
      postAddMessage(blockId, aiMsg);
    }

    let aiContent = "";

    try {
      await confirmProposal(sessionId, proposalId, (event: SSEEvent) => {
        if (event.type === "message" && typeof event.content === "string") {
          // execution status message (e.g. "executing")
        } else if (event.type === "stream_chunk" && typeof event.content === "string") {
          aiContent += event.content;
          if (isPlayground) {
            pgUpdateLastMessage(aiContent);
          } else {
            postUpdateLastMessage(blockId, aiContent);
          }
        } else if (event.type === "interrupt") {
          const p = (event as unknown as { proposal: { proposal_id: string; code: string; language: string; description?: string } }).proposal;
          const newProposal: Proposal = {
            id: p.proposal_id,
            blockId,
            code: p.code,
            language: p.language,
            description: p.description ?? "",
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000,
            status: "pending",
          };
          if (isPlayground) {
            pgAddProposal(newProposal);
            pgAddMessage({
              id: nextConfirmMsgId(),
              blockId,
              type: "proposal",
              content: "",
              proposalId: newProposal.id,
              timestamp: Date.now(),
            });
          } else {
            postAddProposal(newProposal);
            postAddMessage(blockId, {
              id: nextConfirmMsgId(),
              blockId,
              type: "proposal",
              content: "",
              proposalId: newProposal.id,
              timestamp: Date.now(),
            });
          }
        } else if (event.type === "error") {
          const errMsg = (event.error as string) ?? "确认执行失败";
          if (isPlayground) {
            pgAddMessage({
              id: nextConfirmMsgId(),
              blockId,
              type: "error",
              content: errMsg,
              timestamp: Date.now(),
            });
          } else {
            postAddMessage(blockId, {
              id: nextConfirmMsgId(),
              blockId,
              type: "error",
              content: errMsg,
              timestamp: Date.now(),
            });
          }
        }
      });
      updateProposalStatus(proposalId, "executed");
    } catch {
      // ignore abort errors
    } finally {
      setConfirming(false);
    }
  };

  const lines = proposal.code.split("\n");

  return (
    <div className="rounded-lg border border-border bg-[#111122] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-2 border-b border-border">
        <span className="text-text-secondary">{proposal.description || "代码建议"}</span>
        <span className={`font-mono ${isExpired ? "text-error" : "text-accent"}`}>
          {remaining}
        </span>
      </div>
      <div className="px-3 py-2 font-mono overflow-x-auto max-h-[200px] overflow-y-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex bg-diff-add">
            <span className="text-accent select-none w-5 shrink-0">+</span>
            <span className="text-text-body whitespace-pre">{line}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-3 py-2 border-t border-border">
        <button
          onClick={handleApply}
          disabled={isExpired}
          className="px-2 py-1 rounded bg-surface-3 text-text-body hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          应用到编辑器
        </button>
        <button
          onClick={handleConfirm}
          disabled={isExpired || isConfirmed || confirming}
          data-onboarding-target="proposal-confirm-button"
          className="px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isConfirmed ? "已确认" : confirming ? "执行中..." : "确认运行"}
        </button>
      </div>
    </div>
  );
}
