"use client";

import { useEffect, useState } from "react";
import { RepoSearch } from "@/components/RepoSearch";
import { RepoCard } from "@/components/RepoCard";
import type { Repo } from "@/lib/types";

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load repos");
        return r.json();
      })
      .then(setRepos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Your Repositories</h1>
        <p className="text-slate-500">Select a repo to view open pull requests</p>
      </div>

      <RepoSearch value={search} onChange={setSearch} />

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((repo) => (
              <RepoCard key={repo.full_name} repo={repo} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-16">No repositories found.</p>
          )}
        </>
      )}
    </main>
  );
}
