import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getOctokit, getPRDiff } from "@/lib/github";
import { createServerClient } from "@/lib/supabase/server";
import { DiffViewer } from "@/components/DiffViewer";
import { ReviewStream } from "@/components/ReviewStream";
import { ReviewHistory } from "@/components/ReviewHistory";
import { ShareButton } from "@/components/ShareButton";
import type { Review } from "@/lib/types";

interface PRReviewPageProps {
  params: Promise<{ owner: string; repo: string; pr: string }>;
}

export default async function PRReviewPage({ params }: PRReviewPageProps) {
  const { owner, repo, pr } = await params;
  const prNumber = parseInt(pr, 10);

  const session = await getServerSession(authOptions);
  if (!session?.accessToken) redirect("/api/auth/signin");

  const octokit = getOctokit(session.accessToken);
  const { data: prData } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const prUrl = prData.html_url;
  const prTitle = prData.title;

  let diff = "";
  try {
    diff = await getPRDiff(session.accessToken, owner, repo, prNumber);
    if (diff.length > 8000) diff = diff.slice(0, 8000) + "\n...[diff truncated for display]";
  } catch {}

  const supabase = createServerClient();
  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("pr_url", prUrl)
    .order("created_at", { ascending: false })
    .limit(5);

  const latestReview = existingReviews?.[0] as (Review & { is_public: boolean }) | undefined;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <p className="text-sm font-mono text-blue-600 mb-1">
          {owner}/{repo} · PR #{prNumber}
        </p>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{prTitle}</h1>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm text-slate-500 hover:text-blue-600"
          >
            View on GitHub →
          </a>
        </div>
        <div className="flex gap-4 mt-2 text-sm text-slate-500">
          <span>{prData.changed_files} files changed</span>
          <span className="text-emerald-600">+{prData.additions}</span>
          <span className="text-red-500">-{prData.deletions}</span>
        </div>
      </div>

      <div className="space-y-6">
        {diff && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Diff
            </h2>
            <DiffViewer diff={diff} />
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              AI Review
            </h2>
            {latestReview && (
              <ShareButton reviewId={latestReview.id} isPublic={latestReview.is_public ?? false} />
            )}
          </div>

          {latestReview ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400">
                  Saved {new Date(latestReview.created_at).toLocaleString()}
                </span>
                {latestReview.complexity_score !== null && (
                  <span className="text-sm font-semibold text-slate-700">
                    Complexity: {latestReview.complexity_score}/10
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                {latestReview.review_text}
              </div>
            </div>
          ) : (
            <ReviewStream
              owner={owner}
              repo={repo}
              prNumber={prNumber}
              prTitle={prTitle}
              prUrl={prUrl}
            />
          )}
        </section>

        {existingReviews && existingReviews.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Review History
            </h2>
            <ReviewHistory reviews={existingReviews as Review[]} />
          </section>
        )}
      </div>
    </main>
  );
}
