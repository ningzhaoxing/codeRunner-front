"use client";

interface OutputPanelProps {
  output: string | null;
  error: string | null;
  isRunning: boolean;
}

export default function OutputPanel({ output, error, isRunning }: OutputPanelProps) {
  if (!isRunning && !output && !error) return null;

  const borderColor = error ? "#ff6b6b" : "#90e86f";
  const labelColor = error ? "text-error" : "text-accent";
  const dotColor = error ? "bg-error" : "bg-accent";

  return (
    <div
      className="bg-[#0a0a12] rounded-md mx-3 mb-3 px-4 py-3 font-mono text-xs max-h-[220px] overflow-y-auto"
      style={{
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 12px ${borderColor}40, inset 0 0 20px ${borderColor}10`,
      }}
    >
      {isRunning && (
        <span className="text-accent animate-pulse">执行中...</span>
      )}
      {!isRunning && (output || error) && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/60">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
          <span className={`${labelColor} text-[10px] font-semibold uppercase tracking-wider`}>
            Output
          </span>
        </div>
      )}
      {error && <pre className="text-error whitespace-pre-wrap leading-relaxed">{error}</pre>}
      {output && !error && (
        <pre className="text-text-title whitespace-pre-wrap leading-relaxed">{output}</pre>
      )}
    </div>
  );
}
