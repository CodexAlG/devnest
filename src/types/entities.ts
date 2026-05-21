export type UserRole = "admin" | "coordinator" | "intern";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  github_username?: string;
  created_at: string;
  last_seen_at?: string;
}

export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type SprintStatus = "planning" | "active" | "completed";
export type ProjectMemberRole = "lead" | "member" | "observer";

export interface Project {
  id: string;
  name: string;
  description?: string;
  coordinator_id: string;
  github_repo_url?: string;
  status: ProjectStatus;
  created_at: string;
  member_count?: number;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role_in_project: ProjectMemberRole;
  joined_at: string;
  profile?: AppUser;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status: SprintStatus;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  sprint_id?: string | null;
  title: string;
  description?: string;
  assignee_id?: string | null;
  reporter_id?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  story_points?: number | null;
  github_pr_url?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  assignee?: AppUser;
  reporter?: AppUser;
}

export interface Channel {
  id: string;
  project_id?: string | null;
  name: string;
  type: "general" | "project" | "direct";
  created_by?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id?: string | null;
  content: string;
  is_ai_response: boolean;
  reply_to_id?: string | null;
  created_at: string;
  edited_at?: string | null;
  sender?: AppUser;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  updated_at: string;
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  html_url: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  merged_at?: string | null;
  head: { ref: string };
  base: { ref: string };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  html_url: string;
  author?: { login: string; avatar_url: string } | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: "open" | "closed";
  html_url: string;
  user: { login: string };
  created_at: string;
  labels: { name: string; color: string }[];
}
