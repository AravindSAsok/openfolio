# Openfolio

**Your work, in focus.** Openfolio is a free, open-source developer portfolio platform powered by public GitHub work.

Connect GitHub, choose the projects you want to show, add your story, select a theme, and publish a shareable portfolio. Openfolio is self-hostable and has no paid themes or subscription gates.

> This is an early MVP. Local code and CI can be used without a Cloudflare account. Live GitHub OAuth and hosted deployment require setup by the operator.

## Features

- GitHub OAuth using the read:user scope.
- Import public GitHub repositories only.
- Edit profile, projects, skills, experience, education, certifications, and social links.
- Three free themes: Minimal, Terminal, and Editorial.
- Publish server-rendered public pages at /@username.
- Manual sync and daily scheduled sync.
- D1 persistence and optional R2 image uploads.
- JSON data export and account deletion.
- Responsive React dashboard.
- Cloudflare Worker API and static asset hosting.

## Stack

React, Vite, TypeScript, Cloudflare Workers, D1, R2, Drizzle ORM, GitHub OAuth, Vitest, and GitHub Actions.

## Local development

Prerequisites: Node.js 22+, npm, and a GitHub OAuth App for live authentication.

1. Install dependencies with npm install.
2. Copy .dev.vars.example to .dev.vars.
3. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .dev.vars.
4. Generate GITHUB_TOKEN_ENCRYPTION_KEY with openssl rand -base64 32.
5. Apply local D1 migrations with npm run db:migrate:local.
6. Start the application with npm run dev.

The Cloudflare Vite plugin runs the Worker and frontend together. Local OAuth callback: http://localhost:5173/api/auth/github/callback.

## Cloudflare deployment

See docs/CLOUDFLARE_DEPLOYMENT.md. Create a D1 database and optional R2 bucket, update wrangler.jsonc with the D1 database ID, configure Worker secrets, apply remote migrations, and deploy with npm run deploy.

Required Worker secrets:
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_TOKEN_ENCRYPTION_KEY

Set APP_BASE_URL to your deployed origin and ENVIRONMENT to production. The GitHub OAuth callback must be APP_BASE_URL + /api/auth/github/callback.

The initial hosting design uses a workers.dev origin and /@username URLs. A custom domain is optional.

## Commands

- npm run dev — local application.
- npm run typecheck — TypeScript checks.
- npm test — unit tests.
- npm run build — production build.
- npm run db:generate — generate migrations from the Drizzle schema.
- npm run db:migrate:local — apply local D1 migrations.
- npm run db:migrate:remote — apply remote D1 migrations.
- npm run deploy — build and deploy to Cloudflare.

## Privacy and security

Openfolio imports public GitHub profile and repository information. It does not request private repository access or repository write permissions. OAuth tokens are encrypted using AES-GCM before storage. The encryption key is a deployment secret; losing it means existing stored tokens cannot be decrypted.

Public pages show only portfolio content the owner has chosen to add and publish. Email addresses are not exposed by default. Read docs/SECURITY_AND_PRIVACY.md.

## License

AGPL-3.0-or-later. See LICENSE.

## Contributing

Contributions are welcome. Start with CONTRIBUTING.md and docs/THEME_DEVELOPMENT.md.