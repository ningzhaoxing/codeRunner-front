"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePostStore } from "@/store/usePostStore";
import { executeCode } from "@/lib/api";
import { encodeCode } from "@/lib/share";
import CodeBlockHeader from "./CodeBlockHeader";
import OutputPanel from "./OutputPanel";
import AIPanel from "./AIPanel";

// Monaco Editor only runs on the client. Load it dynamically with ssr: false.
const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1e1e1e] text-text-secondary text-xs font-mono px-4 py-3">
      Loading editor...
    </div>
  ),
});

// Disable Monaco's built-in diagnostics (red squiggles) for all languages
function handleEditorMount(_editor: unknown, monaco: { languages: { typescript: { javascriptDefaults: { setDiagnosticsOptions: (opts: Record<string, boolean>) => void }; typescriptDefaults: { setDiagnosticsOptions: (opts: Record<string, boolean>) => void } } } }) {
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });
}

interface CodeBlockProps {
  blockId: string;
  blockIndex?: number;
  code: string;
  language: string;
  articleId?: string;
  articleContent?: string;
  allCodeBlocks?: { language: string; code: string }[];
}

interface LangInfo {
  filename: string;
  monacoLang: string;
  label: string;
}

function resolveLanguage(lang: string): LangInfo {
  const normalized = lang.toLowerCase();
  switch (normalized) {
    case "go":
    case "golang":
      return { filename: "main.go", monacoLang: "go", label: "go" };
    case "python":
    case "py":
      return { filename: "main.py", monacoLang: "python", label: "python" };
    case "javascript":
    case "js":
      return { filename: "index.js", monacoLang: "javascript", label: "javascript" };
    case "java":
      return { filename: "Main.java", monacoLang: "java", label: "java" };
    case "c":
      return { filename: "main.c", monacoLang: "c", label: "c" };
    default:
      return { filename: `code.${normalized}`, monacoLang: normalized, label: normalized };
  }
}

export default function CodeBlock({ blockId, blockIndex, code, language, articleId, articleContent, allCodeBlocks }: CodeBlockProps) {
  const langInfo = useMemo(() => resolveLanguage(language), [language]);

  const [showAI, setShowAI] = useState(false);

  const block = usePostStore((s) => s.codeBlocks[blockId]);
  const session = usePostStore((s) => s.session);
  const initCodeBlock = usePostStore((s) => s.initCodeBlock);
  const updateCode = usePostStore((s) => s.updateCode);
  const setOutput = usePostStore((s) => s.setOutput);
  const setRunning = usePostStore((s) => s.setRunning);
  const setExpanded = usePostStore((s) => s.setExpanded);

  const abortRef = useRef<AbortController | null>(null);

  const router = useRouter();

  // Initialize the block on first mount (or when blockId changes) if not present.
  useEffect(() => {
    const current = usePostStore.getState().codeBlocks[blockId];
    if (!current) {
      initCodeBlock(blockId, code, language, articleId);
    }
  }, [blockId, code, language, initCodeBlock]);

  // Cancel any in-flight execution on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const currentCode = block?.code ?? code;
  const isRunning = block?.isRunning ?? false;
  const output = block?.output ?? null;
  const runError = block?.runError ?? null;
  const isExpanded = block?.isExpanded ?? false;

  const lineCount = currentCode.split("\n").length;
  const editorHeight = Math.max(80, Math.min(300, lineCount * 20 + 16));

  const handleOpenPlayground = useCallback(() => {
    const encoded = encodeCode(currentCode);
    if (encoded) {
      // Save session data to sessionStorage for Playground to restore
      const sessionData = {
        sessionId: session.sessionId,
        messages: block?.aiMessages ?? [],
      };
      sessionStorage.setItem("playground-session-transfer", JSON.stringify(sessionData));
      router.push(`/playground?lang=${langInfo.monacoLang}&code=${encoded}&restore=1`);
    }
  }, [currentCode, langInfo.monacoLang, router, session.sessionId, block?.aiMessages]);

  const handleRun = async () => {
    if (isRunning) return;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("onboarding:code-ran"));
    }

    setOutput(blockId, null, null);
    setRunning(blockId, true);

    try {
      const resp = await executeCode(langInfo.monacoLang, currentCode);
      setOutput(blockId, resp.result || null, resp.err || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "网络错误，请重试";
      setOutput(blockId, null, msg);
    } finally {
      setRunning(blockId, false);
    }
  };

  const handleToggleAI = () => {
    setShowAI((v) => {
      const nextVal = !v;
      if (nextVal && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("onboarding:ai-opened"));
      }
      return nextVal;
    });
  };

  const handleToggleExpand = () => {
    setExpanded(blockId, !isExpanded);
  };

  const handleEditorChange = (value: string | undefined) => {
    updateCode(blockId, value ?? "");
  };

  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 20,
    padding: { top: 12 },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollbar: { vertical: "hidden" as const, horizontal: "auto" as const },
  };

  if (isExpanded) {
    return (
      <>
        <div className="my-4 border border-border rounded-lg overflow-hidden bg-surface-1 shadow-xl">
          <div className="flex flex-col" style={{ height: 600 }}>
            <CodeBlockHeader
              filename={langInfo.filename}
              language={langInfo.label}
              isRunning={isRunning}
              isExpanded={true}
              showAI={showAI}
              onRun={handleRun}
              onToggleAI={handleToggleAI}
              onToggleExpand={handleToggleExpand}
              onOpenPlayground={handleOpenPlayground}
            />
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={langInfo.monacoLang}
                value={currentCode}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={editorOptions}
              />
            </div>
            <OutputPanel output={output} error={runError} isRunning={isRunning} />
          </div>
        </div>
        {showAI && (
          <div className="my-4 border border-border rounded-lg overflow-hidden bg-surface-1" style={{ height: 480 }}>
            <AIPanel
              blockId={blockId}
              blockIndex={blockIndex}
              articleId={articleId ?? ""}
              articleContent={articleContent ?? ""}
              allCodeBlocks={allCodeBlocks ?? []}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="my-4 border border-border rounded-lg overflow-hidden bg-surface-1">
        <CodeBlockHeader
          filename={langInfo.filename}
          language={langInfo.label}
          isRunning={isRunning}
          isExpanded={isExpanded}
          showAI={showAI}
          onRun={handleRun}
          onToggleAI={handleToggleAI}
          onToggleExpand={handleToggleExpand}
          onOpenPlayground={handleOpenPlayground}
        />
        <div style={{ height: editorHeight }}>
          <Editor
            height="100%"
            language={langInfo.monacoLang}
            value={currentCode}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={editorOptions}
          />
        </div>
        <OutputPanel output={output} error={runError} isRunning={isRunning} />
      </div>
      {showAI && (
        <div className="my-4 border border-border rounded-lg overflow-hidden bg-surface-1" style={{ height: 480 }}>
          <AIPanel
            blockId={blockId}
            blockIndex={blockIndex}
            articleId={articleId ?? ""}
            articleContent={articleContent ?? ""}
            allCodeBlocks={allCodeBlocks ?? []}
          />
        </div>
      )}
    </>
  );
}
