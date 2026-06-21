import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignInButton } from "@/components/SignInButton";

const EXAMPLE_REVIEW = `## Summary
This PR adds a Redis-based rate limiter middleware to the API gateway, throttling requests per user token at 100 req/min.

## Issues Found
- [CRITICAL] No fallback when Redis is unavailable — all requests will be blocked if the cache is down
- [WARNING] Rate limit headers (X-RateLimit-Remaining) are not set on responses
- [INFO] Consider extracting the 100 req/min constant to an environment variable

## Suggestions
- Add a circuit breaker or fail-open mode when Redis is unreachable
- Return 429 with Retry-After header instead of a generic 500
- Write integration tests covering the Redis failure path

## Complexity Score: 6/10
Moderate complexity — the core logic is clean but the missing error handling and lack of tests increase risk.`;

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/repos");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Powered by Groq · llama3-70b
        </div>

        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          AI-powered GitHub PR reviews
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Connect your GitHub account, pick any open pull request, and get a structured code review
          — with severity-tagged issues, suggestions, and a complexity score — streamed in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <SignInButton />
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/20"
          >
            Try Demo — No Login Required
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Only requests read access to your repositories
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="bg-slate-800 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              myorg/api-gateway · PR #142 · rate-limiter
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300">
              6/10 · Medium
            </span>
          </div>

          <div className="p-6">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {EXAMPLE_REVIEW}
            </pre>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Example output — your actual reviews are generated live from real PR diffs
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            icon: "⚡",
            title: "Streamed in real-time",
            body: "Groq's inference API delivers reviews faster than you can read them.",
          },
          {
            icon: "🔍",
            title: "Severity-tagged issues",
            body: "Every issue is labeled CRITICAL, WARNING, or INFO so you know what to fix first.",
          },
          {
            icon: "🔗",
            title: "Shareable links",
            body: "Share a public link to any saved review — no account needed to read it.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
            <p className="text-sm text-slate-500">{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
