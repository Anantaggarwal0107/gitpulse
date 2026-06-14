import { Octokit } from "@octokit/rest";
import type { Repo, PullRequest } from "./types";

export function getOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export async function listRepos(accessToken: string): Promise<Repo[]> {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 50,
    type: "all",
  });
  return data as unknown as Repo[];
}

export async function listPRs(
  accessToken: string,
  owner: string,
  repo: string
): Promise<PullRequest[]> {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 30,
    sort: "updated",
  });

  const detailed = await Promise.all(
    data.map(async (pr) => {
      const { data: detail } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: pr.number,
      });
      return detail;
    })
  );

  return detailed as unknown as PullRequest[];
}

export async function getPRDiff(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const octokit = getOctokit(accessToken);
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: prNumber,
      headers: {
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );
  return response.data as unknown as string;
}
