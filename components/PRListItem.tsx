import Link from "next/link";
import Image from "next/image";
import type { PullRequest } from "@/lib/types";

interface PRListItemProps {
  pr: PullRequest;
  owner: string;
  repo: string;
}

export function PRListItem({ pr, owner, repo }: PRListItemProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
      <Image
        src={pr.user.avatar_url}
        alt={pr.user.login}
        width={40}
        height={40}
        className="rounded-full shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-400">#{pr.number}</span>
          <h3 className="font-medium text-slate-900 truncate">{pr.title}</h3>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          by <span className="font-medium">{pr.user.login}</span> ·{" "}
          {new Date(pr.created_at).toLocaleDateString()}
        </p>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">{pr.changed_files}</span> files changed
          </span>
          <span className="text-xs font-medium text-emerald-600">+{pr.additions}</span>
          <span className="text-xs font-medium text-red-500">-{pr.deletions}</span>

          <Link
            href={`/repos/${owner}/${repo}/${pr.number}`}
            className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Review →
          </Link>
        </div>
      </div>
    </div>
  );
}
