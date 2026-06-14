"use client";

import { useState, useCallback } from "react";

interface ReviewStreamProps {
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  onReviewSaved?: (reviewId: string) => void;
}

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
  const lines = text.split("\n");
  return lines.map((line, i) => {
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

export function ReviewStream({
  owner,
  repo,
  prNumber,
  prTitle,
  prUrl,
  onReviewSaved,
}: ReviewStreamProps) {
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [reviewText, setReviewText] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const startReview = useCallback(async () => {
    setStatus("streaming");
    setReviewText("");
    setScore(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, prNumber, prTitle, prUrl }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to start review");

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
              if (event.reviewId && onReviewSaved) {
                onReviewSaved(event.reviewId);
              }
            } else if (event.type === "error") {
              setStatus("error");
            }
          } catch {}
        }
      }
    } catch {
      setStatus("error");
    }
  }, [owner, repo, prNumber, prTitle, prUrl, onReviewSaved]);

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={startReview}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
      >
        Start AI Review
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">AI Code Review</h2>
        <div className="flex items-center gap-3">
          {status === "streaming" && (
            <span className="flex items-center gap-1.5 text-xs text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Analyzing...
            </span>
          )}
          {score !== null && <ScoreBadge score={score} />}
        </div>
      </div>

      <div className="px-5 py-4 space-y-1">
        {status === "error" ? (
          <p className="text-red-600 text-sm">Review failed. Please try again.</p>
        ) : (
          renderReviewText(reviewText)
        )}
        {status === "streaming" && (
          <span className="inline-block h-4 w-0.5 bg-blue-600 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
