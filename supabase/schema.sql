create table reviews (
  id uuid primary key default gen_random_uuid(),
  github_user_id text not null,
  pr_url text not null,
  repo_full_name text not null,
  pr_number int not null,
  pr_title text not null,
  review_text text not null,
  complexity_score int,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_pr_url_idx on reviews(pr_url);
-- No RLS needed — service role key used server-side only
