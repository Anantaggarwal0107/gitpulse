export interface Repo {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export interface PullRequest {
  number: number;
  title: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  changed_files: number;
  additions: number;
  deletions: number;
  html_url: string;
}

export interface Review {
  id: string;
  pr_url: string;
  pr_title: string;
  review_text: string;
  complexity_score: number | null;
  created_at: string;
}
