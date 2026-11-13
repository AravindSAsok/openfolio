import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  githubId: text("github_id").notNull().unique(),
  login: text("login").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull()
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull()
}, (table) => ({
  userIdx: index("sessions_user_idx").on(table.userId),
  expiryIdx: index("sessions_expiry_idx").on(table.expiresAt)
}));

export const githubConnections = sqliteTable("github_connections", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  tokenCiphertext: text("token_ciphertext").notNull(),
  scopes: text("scopes").notNull().default("read:user"),
  connectedAt: integer("connected_at").notNull(),
  lastSyncAt: integer("last_sync_at"),
  nextSyncAt: integer("next_sync_at"),
  syncLockUntil: integer("sync_lock_until")
});

export const portfolios = sqliteTable("portfolios", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  isPublished: integer("is_published").notNull().default(0),
  theme: text("theme").notNull().default("minimal"),
  dataJson: text("data_json").notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  updatedAt: integer("updated_at").notNull()
}, (table) => ({
  slugIdx: index("portfolios_slug_idx").on(table.slug),
  publishedIdx: index("portfolios_published_idx").on(table.isPublished)
}));

export const githubRepositories = sqliteTable("github_repositories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryId: text("repository_id").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  htmlUrl: text("html_url").notNull(),
  homepage: text("homepage"),
  language: text("language"),
  stars: integer("stars").notNull().default(0),
  forks: integer("forks").notNull().default(0),
  topicsJson: text("topics_json").notNull().default("[]"),
  isArchived: integer("is_archived").notNull().default(0),
  isUnavailable: integer("is_unavailable").notNull().default(0),
  sourceUpdatedAt: text("source_updated_at"),
  syncedAt: integer("synced_at").notNull()
}, (table) => ({
  userRepoUnique: uniqueIndex("github_repositories_user_repo_unique").on(table.userId, table.repositoryId),
  userIdx: index("github_repositories_user_idx").on(table.userId)
}));

export const syncRuns = sqliteTable("sync_runs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  triggerType: text("trigger_type").notNull(),
  status: text("status").notNull(),
  importedCount: integer("imported_count").notNull().default(0),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
  safeMessage: text("safe_message")
}, (table) => ({
  userIdx: index("sync_runs_user_idx").on(table.userId),
  startedIdx: index("sync_runs_started_idx").on(table.startedAt)
}));