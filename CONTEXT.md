# GitPulse — Reference Document

## What It Is

GitPulse is an AI-powered GitHub pull request code reviewer built as a resume project. It authenticates users via GitHub OAuth, fetches PR diffs using the GitHub API, streams an AI-generated structured review via Groq's llama3-70b model, persists reviews in Supabase, and supports sharing public review links.

**Resume bullet:** "Built full-stack AI code review app (Next.js 15, Groq LLM, Supabase) with GitHub OAuth, real-time SSE streaming, and shareable public links."

---

## Architecture

```
Browser
  |
  | GitHub OAuth (NextAuth.js v4)
  v
Next.js 15 App Router (TypeScript)
  |-- Server Components (fetch data, no client JS)
  |-- Client Components (ReviewStream SSE, ShareButton, etc.)
  |
  |-- /api/auth/[...nextauth]  → NextAuth GitHub provider
  |-- /api/review              → POST: fetch diff → stream Groq → save Supabase
  |-- /api/review/share        → POST: mark review is_public=true
  |
  |-- Octokit (@octokit/rest)  → GitHub REST API (repos, PRs, diffs)
  |-- groq-sdk (Groq)          → llama3-70b-8192 streaming completions
  |-- @supabase/supabase-js    → PostgreSQL via service role key (no RLS)
```

---

## File Map

### App Routes

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page (server component). Redirects to /repos if session exists. Shows hero, feature grid, example review output, sign-in button. |
| `app/layout.tsx` | Root layout with SessionProvider wrapper. |
| `app/repos/page.tsx` | Lists authenticated user's GitHub repos with search/filter. Server component. |
| `app/repos/[owner]/[repo]/page.tsx` | Lists open PRs for a repo. Server component. |
| `app/repos/[owner]/[repo]/[pr]/page.tsx` | PR review page. Fetches PR metadata + diff server-side, renders DiffViewer + ReviewStream + ReviewHistory. |
| `app/share/[reviewId]/page.tsx` | Public share page. Fetches review by ID where is_public=true. No auth required. |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler. |
| `app/api/review/route.ts` | POST: validates session, fetches diff via Octokit, streams Groq completions as SSE (data: JSON\n\n), extracts complexity score regex, inserts to Supabase, emits done event with reviewId + score. |
| `app/api/review/share/route.ts` | POST: validates session + githubId ownership, sets is_public=true on review row. IDOR prevention: `.eq("github_user_id", session.user.githubId)`. |

### Components

| File | Purpose |
|------|---------|
| `components/DiffViewer.tsx` | Client component. Wraps react-syntax-highlighter Prism with "diff" language, vscDarkPlus theme, line numbers, max 400px height. macOS-style traffic-light dots decoration. |
| `components/ReviewStream.tsx` | Client component. SSE consumer: POST /api/review → ReadableStream reader → parses `data: {...}` lines → accumulates text. Renders structured review with CRITICAL/WARNING/INFO badges, score badge. Cursor animation while streaming. |
| `components/ReviewHistory.tsx` | Client component. Collapsible list of past reviews for a PR. Toggle expand/collapse per review. Includes ShareButton per review. |
| `components/ShareButton.tsx` | Client component. Calls /api/review/share to mark public then copies URL to clipboard. Shows checkmark on success. |
| `components/SignInButton.tsx` | Client component. Calls `signIn("github", { callbackUrl: "/repos" })`. |
| `components/PRList.tsx` | Client component. Renders list of PRs with stats (files changed, +additions, -deletions). |
| `components/PRListItem.tsx` | Client component. Single PR row with author avatar, title, metadata. |
| `components/RepoCard.tsx` | Client component. Repo card with language, stars, description. |
| `components/RepoSearch.tsx` | Client component. Search/filter input for repos list. |

### Lib

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth config. GitHub provider with `read:user repo` scope. JWT strategy: stores `accessToken` + `githubId` in token, passes to session. Extends NextAuth Session + JWT types inline. |
| `lib/github.ts` | Octokit wrapper. `getOctokit(token)`, `listRepos`, `listPRs` (N+1 fetch for per-PR stats), `getPRDiff` (Accept: application/vnd.github.v3.diff header). |
| `lib/groq.ts` | Exports `groqClient = new Groq({ apiKey })`. Uses `groq-sdk` package. |
| `lib/supabase/server.ts` | `createServerClient()` returns service role Supabase client. No SSR cookies pattern. `autoRefreshToken: false, persistSession: false`. |
| `lib/types.ts` | Shared TypeScript interfaces: `Repo`, `PullRequest`, `Review`. |
| `lib/utils.ts` | shadcn `cn()` utility (clsx + tailwind-merge). |

### Database

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Single `reviews` table: `id` (uuid PK), `github_user_id` (text), `pr_url`, `repo_full_name`, `pr_number`, `pr_title`, `review_text`, `complexity_score` (int nullable), `is_public` (bool, default false), `created_at`. Index on `pr_url`. No RLS (service role only). |

---

## Key Implementation Patterns

### NextAuth Token Passthrough
GitHub OAuth access token stored in JWT (`token.accessToken = account.access_token`), then exposed on session (`session.accessToken = token.accessToken`). Server components call `getServerSession(authOptions)` to get the token for Octokit. Session type augmented in `lib/auth.ts` via `declare module "next-auth"`.

### N+1 Octokit Fetch for PR Stats
`listPRs` in `lib/github.ts` first fetches the list, then `Promise.all(data.map(...))` calls `octokit.pulls.get` for each PR to get `changed_files`, `additions`, `deletions` (not in list response). This is intentional for the UI stats display.

### Streaming SSE Review
`/api/review/route.ts` creates a `ReadableStream` with `start(controller)`. For each Groq streaming chunk, it encodes `data: {"type":"chunk","content":"..."}\\n\\n`. After the stream ends, it regex-extracts the complexity score, inserts to Supabase, then emits `data: {"type":"done","reviewId":"...","score":N}\\n\\n`. Client (`ReviewStream.tsx`) splits buffer on `\n\n` and parses SSE lines.

### IDOR Prevention in Share Route
`/api/review/share/route.ts` updates only rows matching BOTH `id = reviewId` AND `github_user_id = session.user.githubId`. This prevents one user from making another user's private review public by guessing a UUID.

### Diff Truncation
Both the PR page (server, for display) and the review API (for LLM context) truncate diffs at 8000 chars to avoid token limits. The display version appends `...[diff truncated for display]`.

---

## Gotchas

### `groq-sdk` vs `groq`
The npm package for Groq's official SDK is `groq-sdk` (import: `import Groq from "groq-sdk"`). The `groq` package is Sanity's GROQ query language — completely unrelated. This caused a removal commit (`chore: remove unused groq (Sanity) package, keep groq-sdk`).

### Next.js 15 Async Params
In Next.js 15 App Router, route params are typed as `Promise<{...}>` and must be awaited:
```typescript
interface PageProps { params: Promise<{ owner: string; repo: string; pr: string }> }
export default async function Page({ params }: PageProps) {
  const { owner, repo, pr } = await params
}
```
Using `params.owner` directly (Next.js 14 style) causes a TypeScript error.

### Service Role Client vs SSR Cookies Pattern
The Supabase client uses the service role key (bypasses RLS) rather than the `@supabase/ssr` cookies-based pattern (user JWT). This means no RLS policies are needed. The `@supabase/ssr` package is installed but unused — the auth is handled entirely by NextAuth, not Supabase Auth.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY` in README but Not Code
The README mentions `NEXT_PUBLIC_SUPABASE_ANON_KEY` but the actual server client only uses `SUPABASE_SERVICE_ROLE_KEY`. The anon key is not used anywhere in the codebase.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | Yes | e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | Random string: `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret |
| `GROQ_API_KEY` | Yes | From https://console.groq.com (free tier available) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (Settings → API) |

---

## How to Run

```bash
# 1. Install
cd gitpulse
npm install

# 2. Create .env.local with variables above

# 3. Run Supabase schema
# Open Supabase dashboard → SQL Editor → paste supabase/schema.sql → Run

# 4. Create GitHub OAuth App
# https://github.com/settings/developers → New OAuth App
# Homepage URL: http://localhost:3000
# Callback URL: http://localhost:3000/api/auth/callback/github

# 5. Dev server
npm run dev
# Visit http://localhost:3000
```

---

## Git History

```
db7243d feat(gitpulse): PR review page, share, history, landing — project complete
277513d feat: add PR list API route, PRListItem, PRList, and repo PR page
e29eb53 feat: add repo list API route, RepoSearch, RepoCard, and /repos page
f90f513 feat: add Groq streaming review API route with SSE and Supabase persistence
9b89ed4 chore: remove unused groq (Sanity) package, keep groq-sdk
5d365a6 feat: add Octokit GitHub API wrapper (listRepos, listPRs, getPRDiff)
3ada662 feat: add Supabase schema, clients, and shared TypeScript types
f8b4f02 feat: scaffold Next.js app with GitHub OAuth via NextAuth
36309ac Initial commit from Create Next App
```

---

## Demo Script (2 minutes)

1. Visit http://localhost:3000 — see landing page with example review
2. Click "Sign in with GitHub" → GitHub OAuth consent → redirect to /repos
3. Browse repo list (searchable) → click a repo with open PRs
4. Click a PR → see syntax-highlighted diff and "Start AI Review" button
5. Click "Start Review" → watch AI stream structured review with CRITICAL/WARNING/INFO badges in real time
6. Complexity score badge appears on completion (e.g. "7/10 · Medium")
7. Review is auto-saved; click "Share" on any past review → URL copied to clipboard
8. Open the share link in incognito → full review visible, no login required
