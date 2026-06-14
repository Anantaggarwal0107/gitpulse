"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PRList } from "@/components/PRList";
import type { PullRequest } from "@/lib/types";

export default function RepoPRsPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const { owner, repo } = params;

  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/prs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load PRs");
        return r.json();
      })
      .then(setPRs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-sm text-blue-600 font-mono mb-1">
          {owner}/{repo}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Open Pull Requests</h1>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && <PRList prs={prs} owner={owner} repo={repo} />}
    </main>
  );
}
