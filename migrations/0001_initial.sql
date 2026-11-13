CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  github_id TEXT NOT NULL UNIQUE,
  login TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS github_connections (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_ciphertext TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT 'read:user',
  connected_at INTEGER NOT NULL,
  last_sync_at INTEGER,
  next_sync_at INTEGER,
  sync_lock_until INTEGER
);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  is_published INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'minimal',
  data_json TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS portfolios_slug_idx ON portfolios(slug);
CREATE INDEX IF NOT EXISTS portfolios_published_idx ON portfolios(is_published);

CREATE TABLE IF NOT EXISTS github_repositories (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repository_id TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  homepage TEXT,
  language TEXT,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  topics_json TEXT NOT NULL DEFAULT '[]',
  is_archived INTEGER NOT NULL DEFAULT 0,
  is_unavailable INTEGER NOT NULL DEFAULT 0,
  source_updated_at TEXT,
  synced_at INTEGER NOT NULL,
  UNIQUE(user_id, repository_id)
);
CREATE INDEX IF NOT EXISTS github_repositories_user_idx ON github_repositories(user_id);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL,
  imported_count INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  safe_message TEXT
);
CREATE INDEX IF NOT EXISTS sync_runs_user_idx ON sync_runs(user_id);
CREATE INDEX IF NOT EXISTS sync_runs_started_idx ON sync_runs(started_at);