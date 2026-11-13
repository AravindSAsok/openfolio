# Database

Openfolio uses Cloudflare D1 (SQLite), Drizzle ORM schema declarations in worker/db/schema.ts, and committed SQL migrations in migrations/.

## Tables

- users: GitHub identity and public profile fields.
- sessions: SHA-256 digests of opaque session identifiers; raw session IDs are not stored.
- github_connections: AES-GCM encrypted OAuth token and synchronization schedule.
- portfolios: unique public slug, publish flag, theme, and JSON portfolio model.
- github_repositories: imported public repository metadata keyed by user and GitHub repository ID.
- sync_runs: status and safe synchronization history.

## Data ownership

GitHub repository metadata lives in github_repositories. The portfolio's project list is curated separately by the user. Sync updates the imported repository table; it does not replace user-authored project descriptions or other manual sections.

## Migrations

- Generate from schema: npm run db:generate
- Apply locally: npm run db:migrate:local
- Apply remotely: npm run db:migrate:remote

Review migration SQL before applying it to production. Back up important data before schema changes.