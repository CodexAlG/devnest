-- Add GitHub integration columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_token_scope TEXT;

-- Add github_repo_url to projects table (if not exists)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_url TEXT;

-- Add github_pr_url to tasks table (if not exists)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_pr_url TEXT;
