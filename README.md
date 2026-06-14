# GitPulse

AI-powered GitHub PR reviews — sign in with GitHub, pick a pull request, and get a structured code review streamed in seconds via Groq.

## Features

- GitHub OAuth sign-in (NextAuth.js)
- Browse your repositories and open pull requests
- Syntax-highlighted unified diff view
- Streaming AI review via Groq (llama3-70b): summary, severity-tagged issues, suggestions, complexity score
- Review history per PR saved to Supabase
- Shareable public links for completed reviews (no account required to view)

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js + GitHub OAuth |
| GitHub API | Octokit (@octokit/rest) |
| AI | Groq SDK (llama3-70b-8192) |
| Database | Supabase (PostgreSQL) |
| UI | shadcn/ui + Tailwind CSS |
| Syntax highlighting | react-syntax-highlighter (Prism) |

## Quickstart

### 1. Clone and install

```bash
git clone <your-repo-url> gitpulse
cd gitpulse
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|----------|----------------|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App (step 3) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App (step 3) |
| `GROQ_API_KEY` | https://console.groq.com |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → Service role |

### 3. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### 4. Create Supabase table

In your Supabase dashboard → SQL editor, run the schema from `supabase/schema.sql`.

### 5. Run

```bash
npm run dev
```

Visit http://localhost:3000, sign in with GitHub, and pick a pull request to review.

## License

MIT
