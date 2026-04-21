"use client";

interface CodeBlockHeaderProps {
  filename: string;
  language: string;
  isRunning: boolean;
  isExpanded: boolean;
  showAI?: boolean;
  onRun: () => void;
  onToggleAI: () => void;
  onToggleExpand: () => void;
  onOpenPlayground?: () => void;
}

export default function CodeBlockHeader({
  filename,
  language,
  isRunning,
  isExpanded,
  showAI,
  onRun,
  onToggleAI,
  onToggleExpand,
  onOpenPlayground,
}: CodeBlockHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-surface-2 border-b border-border px-3 py-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-accent font-mono">{filename}</span>
        <span className="text-text-disabled">|</span>
        <span className="text-text-secondary">{language}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="text-accent bg-surface-3 hover:bg-surface-2 px-2 py-0.5 rounded text-xs font-mono transition-colors disabled:opacity-50"
          data-onboarding-target="run-button"
        >
          {isRunning ? "⏳" : "▶ Run"}
        </button>
        <button
          onClick={onToggleAI}
          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${showAI ? "bg-accent/20 text-accent" : "hover:bg-surface-3"}`}
          title="AI Assistant"
          data-onboarding-target="ai-button"
        >
          🤖
        </button>
        <button
          onClick={onToggleExpand}
          className="hover:bg-surface-3 px-1.5 py-0.5 rounded text-xs transition-colors"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "⤡" : "⤢"}
        </button>
        {onOpenPlayground && (
          <button
            onClick={onOpenPlayground}
            className="hover:bg-surface-3 px-1.5 py-0.5 rounded text-xs transition-colors"
            title="在 Playground 中打开"
          >
            ↗
          </button>
        )}
      </div>
    </div>
  );
}
