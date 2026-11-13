# Architecture

Openfolio is one Cloudflare Worker deployment with a React/Vite dashboard, Worker APIs, D1, and optional R2.

## Request flow

- Vite builds the React dashboard and assets.
- /api/* requests are handled by worker/index.ts.
- GitHub OAuth is handled server-side; the browser never receives an access token.
- D1 stores users, hashed sessions, encrypted GitHub tokens, portfolios, imported public repositories, and sync history.
- R2 is optional and stores user-uploaded image objects.
- /@username is rendered by the Worker into HTML with metadata and the selected theme.
- A Cron Trigger starts a bounded daily synchronization process.

## Data ownership

The dashboard reads and changes only the authenticated user's records. Public portfolio routes read published portfolio JSON only. Imported GitHub repository metadata is stored separately from user-curated portfolio content so scheduled sync does not overwrite manual edits.

## Components

- worker/index.ts: routing, OAuth, session handling, APIs, sync, and cron.
- worker/db/schema.ts: Drizzle schema.
- worker/render.ts: safe server-side public HTML rendering.
- src/App.tsx: dashboard and landing page.
- src/types.ts: shared portfolio model.
- migrations/: D1 SQL migrations.

## Runtime

Cloudflare Workers + D1 are the primary production target. Local development uses Cloudflare's Vite plugin and local D1 emulation. Keep credentials and token handling on the server.