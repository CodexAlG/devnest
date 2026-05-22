import { Octokit } from "@octokit/rest";
import { supabase } from "./supabase";

let octokitInstance: Octokit | null = null;

export function getOctokit(token: string): Octokit {
  if (!octokitInstance) {
    octokitInstance = new Octokit({ 
      auth: token,
      request: {
        fetch: (url: string | URL | Request, init?: RequestInit) => window.fetch(url, init)
      }
    })
  }
  return octokitInstance;
}

export function resetOctokit() {
  octokitInstance = null;
}

export async function getGitHubToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("profiles")
    .select("github_access_token")
    .eq("id", session.user.id)
    .single();

  return data?.github_access_token ?? null;
}

export async function saveGitHubToken(token: string, scope: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  await supabase
    .from("profiles")
    .update({
      github_access_token: token,
      github_token_scope: scope,
    })
    .eq("id", session.user.id);
}

export async function fetchOrgRepos(token: string, org: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.listForOrg({
    org,
    type: "all",
    per_page: 100,
    sort: "updated",
  });
  return data;
}

export async function fetchUserRepos(token: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: "updated",
    affiliation: "owner,organization_member",
  });
  return data;
}

export async function fetchRepoPRs(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "all",
    per_page: 50,
    sort: "updated",
  });
  return data;
}

export async function fetchRepoCommits(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: 30,
  });
  return data;
}

export async function fetchRepoIssues(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 50,
  });
  return data.filter((issue) => !issue.pull_request);
}

export async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });
  const data = await response.json();
  if (data.access_token) {
    await saveGitHubToken(data.access_token, data.scope);
    return data.access_token;
  }
  throw new Error(data.error_description || "Failed to exchange code for token");
}
