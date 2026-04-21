"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { usePlaygroundStore } from "@/store/usePlaygroundStore";
import { templates } from "@/lib/templates";
import { decodeCode } from "@/lib/share";
import { copyShareURL } from "@/lib/share";
import { executeCode } from "@/lib/api";
import type { SupportedLanguage } from "@/lib/templates";
import { SUPPORTED_LANGUAGES } from "@/lib/templates";
import PlaygroundToolbar from "@/components/PlaygroundToolbar";
import StatusBar from "@/components/StatusBar";
import OutputPanel from "@/components/OutputPanel";
import PlaygroundAIPanel from "@/components/PlaygroundAIPanel";

const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-[#1e1e1e] text-text-secondary text-xs font-mono px-4 py-3">
      Loading editor...
    </div>
  ),
});

function PlaygroundContent() {
  const searchParams = useSearchParams();

  const language = usePlaygroundStore((s) => s.language);
  const code = usePlaygroundStore((s) => s.code);
  const output = usePlaygroundStore((s) => s.output);
  const runError = usePlaygroundStore((s) => s.runError);
  const isRunning = usePlaygroundStore((s) => s.isRunning);
  const isSaved = usePlaygroundStore((s) => s.isSaved);
  const isAIOpen = usePlaygroundStore((s) => s.isAIOpen);
  const setCode = usePlaygroundStore((s) => s.setCode);
  const setLanguage = usePlaygroundStore((s) => s.setLanguage);
  const setOutput = usePlaygroundStore((s) => s.setOutput);
  const setRunning = usePlaygroundStore((s) => s.setRunning);
  const toggleAI = usePlaygroundStore((s) => s.toggleAI);
  const initFromURL = usePlaygroundStore((s) => s.initFromURL);
  const loadFromStorage = usePlaygroundStore((s) => s.loadFromStorage);

  const abortRef = useRef<AbortController | null>(null);
  const initRef = useRef(false);

  // Init from URL or localStorage
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const langParam = searchParams.get("lang");
    const codeParam = searchParams.get("code");
    const restoreParam = searchParams.get("restore");

    if (langParam && codeParam) {
      const decoded = decodeCode(codeParam);
      if (decoded) {
        const validLang = SUPPORTED_LANGUAGES.includes(langParam as SupportedLanguage)
          ? (langParam as SupportedLanguage)
          : "go";
        initFromURL(validLang, decoded);

        // Restore session from CodeBlock if restore=1
        if (restoreParam === "1") {
          try {
            const stored = sessionStorage.getItem("playground-session-transfer");
            if (stored) {
              const { sessionId, messages } = JSON.parse(stored);
              usePlaygroundStore.setState({
                sessionId,
                aiMessages: messages,
              });
              sessionStorage.removeItem("playground-session-transfer");
            }
          } catch (err) {
            console.error("Failed to restore session:", err);
          }
        }
        return;
      } else {
        alert("分享链接中的代码解码失败，已加载本地存储");
      }
    }

    loadFromStorage();
  }, [searchParams, initFromURL, loadFromStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunning) return;

    setOutput(null, null);
    setRunning(true);

    const currentCode = usePlaygroundStore.getState().code;
    const currentLang = usePlaygroundStore.getState().language;

    try {
      const resp = await executeCode(templates[currentLang].monacoLang, currentCode);
      setOutput(resp.result || null, resp.err || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "网络错误，请重试";
      setOutput(null, msg);
    } finally {
      setRunning(false);
    }
  }, [isRunning, setOutput, setRunning]);

  const handleShare = useCallback(async () => {
    const currentCode = usePlaygroundStore.getState().code;
    const currentLang = usePlaygroundStore.getState().language;
    const result = await copyShareURL(currentLang, currentCode);
    alert(result.message);
  }, []);

  const handleLanguageChange = useCallback(
    (lang: SupportedLanguage) => {
      const hadMessages = setLanguage(lang);
      if (hadMessages) {
        alert("AI 对话已清空");
      }
    },
    [setLanguage],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      } else if (isMod && e.key === "s") {
        e.preventDefault();
        alert("已保存");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      setCode(value ?? "");
    },
    [setCode],
  );

  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 20,
    padding: { top: 12 },
    renderLineHighlight: "gutter" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollbar: { vertical: "visible" as const, horizontal: "auto" as const },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] mt-14">
      <PlaygroundToolbar
        language={language}
        isRunning={isRunning}
        isAIOpen={isAIOpen}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onToggleAI={toggleAI}
        onShare={handleShare}
      />

      <div className="flex flex-1 min-h-0">
        {/* Editor + Output area */}
        <div className={`flex flex-col min-w-0 ${isAIOpen ? "flex-[6]" : "flex-1"}`}>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={templates[language].monacoLang}
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={editorOptions}
            />
          </div>
          <div className="h-[160px] shrink-0 overflow-y-auto border-t border-border bg-[#0d0d15]">
            <OutputPanel output={output} error={runError} isRunning={isRunning} />
            {!isRunning && !output && !runError && (
              <div className="px-4 py-3 text-xs text-text-disabled font-mono">
                点击 Run 或按 Ctrl+Enter 运行代码
              </div>
            )}
          </div>
        </div>

        {/* AI Panel */}
        {isAIOpen && (
          <div className="flex-[4] min-w-0 border-l border-border">
            <PlaygroundAIPanel />
          </div>
        )}
      </div>

      <StatusBar language={language} code={code} isSaved={isSaved} />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-surface-0" />}>
      <PlaygroundContent />
    </Suspense>
  );
}
