import Link from "next/link";
import type { Repo } from "@/lib/types";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-100 text-blue-700",
  JavaScript: "bg-yellow-100 text-yellow-700",
  Python: "bg-green-100 text-green-700",
  Rust: "bg-orange-100 text-orange-700",
  Go: "bg-cyan-100 text-cyan-700",
  Java: "bg-red-100 text-red-700",
  "C++": "bg-purple-100 text-purple-700",
};

interface RepoCardProps {
  repo: Repo;
}

export function RepoCard({ repo }: RepoCardProps) {
  const [owner, name] = repo.full_name.split("/");
  const langColor = repo.language
    ? (LANGUAGE_COLORS[repo.language] ?? "bg-slate-100 text-slate-600")
    : null;

  return (
    <Link href={`/repos/${owner}/${name}`}>
      <div className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md cursor-pointer h-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {repo.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0 text-slate-500 text-xs">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {repo.stargazers_count.toLocaleString()}
          </div>
        </div>

        {repo.description && (
          <p className="text-sm text-slate-500 line-clamp-2 flex-1">
            {repo.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2">
          {repo.language && langColor && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${langColor}`}>
              {repo.language}
            </span>
          )}
          <span className="text-xs text-slate-400 ml-auto">
            {new Date(repo.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
