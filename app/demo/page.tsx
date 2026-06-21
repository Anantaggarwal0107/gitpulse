"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { DiffViewer } from "@/components/DiffViewer";
import { DEMO_DIFF, DEMO_PR_TITLE } from "@/lib/demo-data";

// ─── Severity-tagged review renderer (mirrors ReviewStream internals) ─────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score <= 4
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score <= 7
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-red-100 text-red-700 border-red-200";

  const label = score <= 4 ? "Low" : score <= 7 ? "Medium" : "High";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${color}`}
    >
      Complexity: {score}/10 · {label}
    </span>
  );
}

function renderReviewText(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-2 first:mt-0">
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.match(/^- \[CRITICAL\]/)) {
      return (
        <div key={i} className="flex gap-2 items-start py-1">
          <span className="shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
            CRITICAL
          </span>
          <p className="text-sm text-slate-700">{line.replace(/^- \[CRITICAL\]\s*/, "")}</p>
        </div>
      );
    }
    if (line.match(/^- \[WARNING\]/)) {
      return (
        <div key={i} className="flex gap-2 items-start py-1">
          <span className="shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
            WARNING
          </span>
          <p className="text-sm text-slate-700">{line.replace(/^- \[WARNING\]\s*/, "")}</p>
        </div>
      );
    }
    if (line.match(/^- \[INFO\]/)) {
      return (
        <div key={i} className="flex gap-2 items-start py-1">
          <span className="shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
            INFO
          </span>
          <p className="text-sm text-slate-700">{line.replace(/^- \[INFO\]\s*/, "")}</p>
        </div>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-2 items-start py-0.5">
          <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
          <p className="text-sm text-slate-700">{line.replace(/^- /, "")}</p>
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return (
      <p key={i} className="text-sm text-slate-700 leading-relaxed">
        {line}
      </p>
    );
  });
}

// ─── Demo page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [reviewText, setReviewText] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const startReview = useCallback(async () => {
    setStatus("streaming");
    setReviewText("");
    setScore(null);

    try {
      const res = await fetch("/api/review/demo");
      if (!res.ok || !res.body) throw new Error("Failed to start demo review");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "chunk") {
              setReviewText((prev) => prev + event.content);
            } else if (event.type === "done") {
              setScore(event.score);
              setStatus("done");
            } else if (event.type === "error") {
              setStatus("error");
            }
          } catch {}
        }
      }
    } catch {
      setStatus("error");
    }
  }, []);

  const reset = () => {
    setStatus("idle");
    setReviewText("");
    setScore(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Demo banner */}
      <div className="bg-blue-600 text-white text-center text-sm font-medium py-2.5 px-4">
        Demo Mode — No login required. Reviewing a hardcoded sample PR with real Groq AI.
        <Link href="/" className="ml-3 underline underline-offset-2 opacity-80 hover:opacity-100">
          Back to home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Live Demo · Powered by Groq · llama3-70b
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            AI Code Review — Demo
          </h1>
          <p className="text-slate-500 text-sm">
            This is a sample pull request diff. Click{" "}
            <span className="font-semibold text-slate-700">Generate AI Review</span> to see the AI
            review stream in real time — no GitHub account needed.
          </p>
        </div>

        {/* PR meta */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4 flex items-start gap-4">
          <div className="shrink-0 h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
            🔀
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono mb-0.5">
              demo-org/backend-api · PR #42
            </p>
            <p className="font-semibold text-slate-900 text-sm">{DEMO_PR_TITLE}</p>
            <p className="text-xs text-slate-400 mt-0.5">+67 lines · Python · FastAPI</p>
          </div>
        </div>

        {/* Diff viewer */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Pull Request Diff</h2>
          <DiffViewer diff={DEMO_DIFF} />
        </div>

        {/* Review section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">AI Review</h2>

          {status === "idle" && (
            <button
              type="button"
              onClick={startReview}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Generate AI Review
            </button>
          )}

          {status !== "idle" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">AI Code Review</h3>
                <div className="flex items-center gap-3">
                  {status === "streaming" && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-600">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      Analyzing...
                    </span>
                  )}
                  {score !== null && <ScoreBadge score={score} />}
                  {status === "done" && (
                    <button
                      type="button"
                      onClick={reset}
                      className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
                    >
                      Run again
                    </button>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 space-y-1">
                {status === "error" ? (
                  <p className="text-red-600 text-sm">
                    Review failed — check that GROQ_API_KEY is set and try again.
                  </p>
                ) : (
                  renderReviewText(reviewText)
                )}
                {status === "streaming" && (
                  <span className="inline-block h-4 w-0.5 bg-blue-600 animate-pulse ml-0.5" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 text-center">
          <p className="text-sm text-slate-600 mb-3">
            Want reviews on your own pull requests?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-lg shadow-slate-900/20"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </Link>
        </div>
      </div>
    </main>
  );
}
