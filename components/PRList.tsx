import type { PullRequest } from "@/lib/types";
import { PRListItem } from "./PRListItem";

interface PRListProps {
  prs: PullRequest[];
  owner: string;
  repo: string;
}

export function PRList({ prs, owner, repo }: PRListProps) {
  if (prs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">No open pull requests</p>
        <p className="text-sm mt-1">This repo has no open PRs right now.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {prs.map((pr) => (
        <PRListItem key={pr.number} pr={pr} owner={owner} repo={repo} />
      ))}
    </div>
  );
}
