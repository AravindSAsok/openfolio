# Contributing to Openfolio

Thanks for helping make developer portfolios more accessible.

## Before starting

- Read the README and relevant documentation.
- Search existing issues and pull requests before large changes.
- For substantial changes, describe the user problem and proposed approach in an issue.
- Keep pull requests focused and include tests for behavior changes.

## Local setup

1. Install Node.js 22 or later.
2. Run npm install.
3. Copy .dev.vars.example to .dev.vars and configure GitHub OAuth for live authentication.
4. Apply local migrations with npm run db:migrate:local.
5. Run npm run dev.

## Quality checks

Run npm run typecheck, npm test, and npm run build before opening a PR. Do not claim checks passed unless you ran them.

## Conventions

- Use TypeScript strict mode.
- Validate server inputs.
- Keep secrets and server-only code out of browser bundles.
- Preserve user edits during GitHub synchronization.
- Prefer accessible semantic HTML and keyboard-operable interactions.
- Respect reduced-motion preferences.
- Avoid adding a dependency for a small utility.
- Document new environment variables and deployment steps.

## Themes

See docs/THEME_DEVELOPMENT.md. Themes must use the shared portfolio model, render missing data safely, support mobile, and meet the accessibility checklist.

## Pull requests

Include the problem, approach, screenshots for visible changes, test commands/results, migrations, and configuration changes. Never commit secrets, OAuth tokens, local database files, or .dev.vars.