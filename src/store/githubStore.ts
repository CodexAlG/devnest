import { create } from "zustand";
import {
  getGitHubToken,
  saveGitHubToken,
  fetchUserRepos,
  fetchRepoPRs,
  fetchRepoCommits,
  fetchRepoIssues,
  exchangeCodeForToken,
  resetOctokit,
} from "../services/github";
import type { GitHubRepo, GitHubPR, GitHubCommit, GitHubIssue } from "../types/entities";

interface GitHubState {
  isConnected: boolean;
  token: string | null;
  repos: GitHubRepo[];
  prs: GitHubPR[];
  commits: GitHubCommit[];
  issues: GitHubIssue[];
  loading: boolean;
  error: string | null;

  connect: (token: string) => Promise<void>;
  connectWithCode: (code: string) => Promise<void>;
  disconnect: () => void;
  fetchRepos: () => Promise<void>;
  fetchPRs: (owner: string, repo: string) => Promise<void>;
  fetchCommits: (owner: string, repo: string) => Promise<void>;
  fetchIssues: (owner: string, repo: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGitHubStore = create<GitHubState>((set, get) => ({
  isConnected: false,
  token: null,
  repos: [],
  prs: [],
  commits: [],
  issues: [],
  loading: false,
  error: null,

  connect: async (token) => {
    set({ loading: true, error: null });
    try {
      await saveGitHubToken(token, "repo");
      set({ isConnected: true, token, loading: false });
      get().fetchRepos();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error connecting to GitHub",
        loading: false,
      });
    }
  },

  connectWithCode: async (code) => {
    set({ loading: true, error: null });
    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new Error("GitHub credentials not configured");

      const token = await exchangeCodeForToken(code, clientId, clientSecret);
      set({ isConnected: true, token, loading: false });
      get().fetchRepos();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error connecting to GitHub",
        loading: false,
      });
    }
  },

  disconnect: () => {
    resetOctokit();
    set({ isConnected: false, token: null, repos: [], prs: [], commits: [], issues: [] });
  },

  fetchRepos: async () => {
    const token = get().token || (await getGitHubToken());
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const repos = await fetchUserRepos(token);
      set({ repos, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error fetching repos",
        loading: false,
      });
    }
  },

  fetchPRs: async (owner, repo) => {
    const token = get().token || (await getGitHubToken());
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const prs = await fetchRepoPRs(token, owner, repo);
      set({ prs, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error fetching PRs",
        loading: false,
      });
    }
  },

  fetchCommits: async (owner, repo) => {
    const token = get().token || (await getGitHubToken());
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const commits = await fetchRepoCommits(token, owner, repo);
      set({ commits, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error fetching commits",
        loading: false,
      });
    }
  },

  fetchIssues: async (owner, repo) => {
    const token = get().token || (await getGitHubToken());
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const issues = await fetchRepoIssues(token, owner, repo);
      set({ issues, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error fetching issues",
        loading: false,
      });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default useGitHubStore;
