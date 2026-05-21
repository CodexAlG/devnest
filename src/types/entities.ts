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
