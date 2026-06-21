# GitPulse

AI-powered GitHub PR code reviewer — sign in with GitHub, pick a pull request, and get a streaming LLM review with severity-tagged issues and a complexity score.

## What it does

Sign in with your GitHub account. Select any repository and open pull request. GitPulse fetches the raw diff, sends it to Groq's llama3-70b model, and streams back a structured code review — flagging bugs, style issues, and security concerns by severity. The complexity score is extracted from the response and the full review is persisted to Supabase with a shareable public link.

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, shadcn/ui, react-syntax-highlighter
- **Auth**: NextAuth.js + GitHub OAuth
- **GitHub API**: Octokit (@octokit/rest)
- **AI**: Groq SDK (llama3-70b-8192)
- **Database**: Supabase PostgreSQL
- **Streaming**: Server-Sent Events (SSE)

## Key Technical Features

- **GitHub OAuth** — full NextAuth.js integration with token-scoped Octokit API access
- **Parallelized API calls** — PR detail fetches run in parallel across up to 30 open PRs per repo
- **Streaming reviews** — SSE chunks stream review text in real time as the LLM generates it
- **Diff truncation** — diffs over 8000 characters are truncated to stay within LLM context limits
- **Persistent shareable reviews** — stored in Supabase with `github_user_id`, `repo_full_name`, `pr_number`, `complexity_score`; each review gets a public link

## Running locally

1. Set up a GitHub OAuth app and a Supabase project
2. Copy `.env.example` to `.env.local` and fill in credentials
3. Run:

```bash
npm install
npm run dev
```
