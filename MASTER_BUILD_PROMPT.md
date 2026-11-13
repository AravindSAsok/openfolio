# Openfolio — Master Build & Delivery Prompt

> **Purpose:** This is the single master instruction for building the complete Openfolio application in this repository. Give this file to the coding agent with repository, terminal, and GitHub access. The agent must follow it from the first audit through implementation, testing, documentation, and delivery to \`main\`.
>
> **Target repository:** https://github.com/AravindSAsok/openfolio  
> **Target branch:** \`main\`  
> **Working product name:** Openfolio (working name; check naming/trademark conflicts before public launch)  
> **Product principle:** Free, open-source, self-hostable developer portfolios powered by GitHub.

---

## 0. Your role and execution contract

Act as the end-to-end product engineering team: principal architect, product designer, full-stack engineer, security engineer, QA engineer, DevOps engineer, and technical writer.

Your mission is to deliver a complete, usable, maintainable application in this repository—not merely a plan, mock-up, scaffold, or list of TODOs.

### Non-negotiable execution rules

1. **Inspect first.** Read the repository, branch, commit history, existing files, workflows, and project state before changing anything. The repository was empty when this prompt was created, but always verify its current state.
2. **Ask all user-facing setup/product questions once, in one consolidated message, before implementation.** Follow Section 1. Do not ask questions one at a time.
3. After the user answers, **execute continuously** through every phase in this document. Do not stop at a plan, at the end of a phase, after scaffolding, or after the first successful build. Do not ask for approval between normal engineering steps.
4. If the user does not answer an optional question, use its stated default and continue. Do not block the build on optional choices.
5. If an external credential, account action, or paid service is required and unavailable, implement everything that can be implemented without it, provide safe setup instructions, use local mocks for tests, and continue. Do not wait for the user to configure Cloudflare before building the application.
6. Do not ask the user to paste passwords, API secrets, OAuth client secrets, private keys, encryption keys, or personal access tokens into chat or commit them. Use local ignored environment files and Cloudflare/GitHub secret stores.
7. Do not claim a test, deployment, OAuth flow, or integration succeeded unless it was actually executed and verified. Distinguish tested, partially tested, and blocked work.
8. **Do not silently omit core requirements.** If a requirement cannot be implemented, explain the exact blocker and provide the closest working fallback.
9. Prefer small, maintainable, production-minded code. Avoid unnecessary abstractions, microservices, complex infrastructure, speculative features, and giant dependencies.
10. Do not leave placeholder buttons, fake data presented as real, dead routes, empty screens, nonfunctional forms, or TODO-only implementations in core flows.
11. Preserve useful work already present in the repository. Never overwrite unrelated files or force-push over user work.
12. Work directly on \`main\` and push completed work to \`origin/main\` when repository permissions allow. If branch protection or repository policy blocks direct pushes, do not disable protection or force push; create a branch and a pull request targeting \`main\`, then clearly report the blocker.
13. Commit in sensible, descriptive increments. Do not create one opaque commit for the entire application.
14. Keep the user informed with concise milestone updates, but updates are not approval requests. Continue working after each update.
15. When a command fails, inspect the error, fix the cause, and retry. Do not repeatedly rerun the same failing command without changing anything.
16. Do not stop because the task is large. Prioritize a complete, coherent release over optional polish, but finish all required core functionality and verification.

### Tool and environment reality

Use the tools actually available in the current environment. If you have a terminal, clone/open this exact repository, edit files, run commands, test, commit, and push. If you only have GitHub API access, use it to make changes that are practical, but never pretend you ran local tests or built the application. If write access, network access, or a command is unavailable, state that precisely and continue with every remaining task that is possible.

---

## 1. One-time consolidated questionnaire

After the repository audit and before implementation, send **one** compact questionnaire containing all questions below. Do not ask a second round of ordinary preference questions later.

Use these defaults when the user leaves an answer blank:

| Question | Default |
|---|---|
| 1. Public product name and branding? | Openfolio as the working name; create an original, simple identity. Do not claim the name or domain is legally available. |
| 2. Open-source license? | AGPL-3.0-or-later for the hosted application, with a clear explanation that MIT is more permissive if the user prefers it. Do not mix incompatible licenses or invent third-party license terms. |
| 3. Initial hosting provider? | Cloudflare Workers, D1, and R2; local development must work before Cloudflare credentials exist. |
| 4. Domain available now? | No. Support a free \`workers.dev\` deployment and path-based portfolio URLs first. Design optional custom-domain support for later. |
| 5. GitHub OAuth application already configured? | Assume no. Build the complete integration and provide exact instructions for creating/configuring the GitHub OAuth App. Never require write access to user repositories. |
| 6. AI assistant at first launch? | Off by default. Keep the architecture extensible for a later optional bring-your-own-key assistant. AI must never be required to create, edit, publish, or view a portfolio. |
| 7. Analytics and telemetry? | No invasive tracking by default. Make any optional, privacy-friendly analytics explicit and configurable. |

The questionnaire must also explain what the user will need to configure outside the repository (for example, GitHub OAuth credentials and Cloudflare account/deployment secrets) and that secrets must be entered in the relevant provider dashboard or ignored local env file—not sent in chat.

After the response, record the decisions in \`docs/PRODUCT_DECISIONS.md\` and proceed. If the user gives no answer, apply the defaults and proceed. Do not ask the questions again.

---

## 2. Product definition

Openfolio is a free, open-source platform that lets developers create, customize, publish, and keep a professional portfolio updated using their **public GitHub profile and public repositories**.

The product is for students, freshers, experienced software developers, open-source contributors, freelancers, and other technical professionals.

### Core promise

**Connect GitHub → import public work → personalize → choose a design → publish a shareable portfolio → keep it synchronized.**

The product must be useful without AI, paid subscriptions, a custom domain, or manual code editing.

### Product principles

- Free for every user. No paid themes, paywalled core features, subscription gates, or artificial feature restrictions.
- Open-source and self-hostable, with clear setup and contribution documentation.
- GitHub is an import source, not the owner of the user's entire portfolio. Users must be able to add and edit information manually.
- Public GitHub data only for the first release. Never access private repositories.
- No GitHub repository write permission. Never push commits, create files, star repositories, or modify user GitHub content.
- User-owned content must not be overwritten by synchronization.
- Three or more genuinely distinct, polished, free themes at initial release.
- Responsive, accessible, fast, SEO-friendly public portfolio pages.
- User can export their data and delete their account.
- Explain data usage, token storage, synchronization, and limitations clearly.
- Do not copy another product's branding, source code, or proprietary theme designs. Create original layouts and visual identity.

### First-release user journey

A new user must be able to:

1. Visit the landing page and understand the product.
2. Sign in securely using GitHub.
3. Import their own public profile and public repositories.
4. Select, edit, reorder, and feature projects.
5. Add or edit their headline, bio, skills, experience, education, certifications, and social links.
6. Choose between at least three working themes and preview the result.
7. Publish and unpublish their portfolio.
8. Share a public portfolio URL.
9. Manually sync GitHub information and see synchronization status.
10. Have GitHub information automatically refresh on a daily schedule.
11. Export their portfolio data and delete their account.

The journey must work with real data, not only seeded sample content.

---

## 3. Technical architecture

Use a **single full-stack application** and one deployable Worker. Do not create microservices.

### Preferred stack

- **Framework:** React Router framework mode using the currently supported Cloudflare Vite integration. Prefer server-side rendering for public portfolio routes.
- **Language:** TypeScript with strict checks.
- **Runtime and hosting:** Cloudflare Workers.
- **Database:** Cloudflare D1 with Drizzle ORM and migrations.
- **Object storage:** Cloudflare R2 for user-uploaded avatars and project images.
- **Authentication:** Server-side GitHub OAuth. Request only the minimum identity permissions needed. Do not request \`repo\`, \`public_repo\`, or write scopes for the public-only product.
- **Scheduled work:** Cloudflare Cron Triggers for daily repository synchronization.
- **Validation:** Zod or an equivalent maintained schema validator.
- **Styling:** Tailwind CSS with a documented design system. Use accessible components and semantic HTML.
- **Tests:** Vitest for unit/integration tests and Playwright for important browser journeys.
- **CI:** GitHub Actions for lint, typecheck, tests, and production build.
- **Package manager:** npm with a committed lockfile, unless the existing repository establishes a different package manager.

Do not add Hono as a second server framework unless a concrete integration requirement justifies it. React Router loaders/actions and the Worker runtime should handle the app's server functionality.

### Verify current documentation before choosing exact versions or APIs

Do not rely on stale model memory. Read current official provider documentation and choose compatible supported versions at implementation time.

- Cloudflare React Router: https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Cloudflare Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- GitHub OAuth Apps: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub REST API: https://docs.github.com/en/rest
- Drizzle D1: https://orm.drizzle.team/docs/connect-cloudflare-d1

If a preferred package, framework version, or API has changed, use the maintained supported option and document the decision.

### Architecture constraints

- Use one Worker serving the dashboard, API actions, and public portfolio pages.
- Use D1 for persistent relational data.
- Use R2 for uploads; do not require uploads for the application to function.
- Use Workers Cache API and sensible HTTP caching for public pages where appropriate. Avoid introducing KV, Durable Objects, Queues, or other Cloudflare products until a tested requirement justifies them.
- Public URLs must initially work without wildcard DNS or a purchased domain, for example:
  - \`https://<worker>.workers.dev/@<username>\`
- Keep public portfolio resolution separate from dashboard/auth routes.
- Make custom domains and username subdomains a later, optional deployment enhancement. Do not make them prerequisites for launch.
- Build the production application to run inside the Cloudflare Workers runtime. Do not rely on Node-only APIs or packages that cannot run there.
- Do not put secrets in \`wrangler.jsonc\`, source code, committed environment files, frontend bundles, or logs.
- Provide local development using Wrangler's local bindings/emulators and a safe \`.dev.vars.example\` or equivalent. Real local secrets belong in an ignored file.

### Suggested repository layout

Adapt where the framework requires, but retain clear separation of concerns:

\`\`\`text
openfolio/
├── app/
│   ├── components/
│   ├── routes/
│   ├── layouts/
│   ├── styles/
│   ├── themes/
│   │   ├── minimal/
│   │   ├── terminal/
│   │   ├── editorial/
│   │   └── registry.ts
│   ├── services/
│   │   ├── auth/
│   │   ├── github/
│   │   ├── portfolio/
│   │   ├── storage/
│   │   └── sync/
│   ├── db/
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── index.server.ts
│   ├── utils/
│   └── root.tsx
├── workers/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── .github/
│   └── workflows/
├── drizzle.config.ts
├── wrangler.jsonc
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env.example
├── .dev.vars.example
├── .gitignore
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── SECURITY.md
\`\`\`

Do not force this exact tree if the official scaffold uses different conventions. Keep server-only code clearly separated from browser code.

---

## 4. Data model and ownership rules

Design the schema before writing feature code. Use migrations committed to the repository. Use stable GitHub numeric IDs as external identity keys; do not rely only on usernames.

At minimum, model:

- \`users\`: internal ID, GitHub numeric ID, current GitHub login, display name, avatar URL, email only if needed, timestamps.
- \`sessions\`: hashed opaque session identifier, user ID, expiration, timestamps.
- \`github_connections\`: user ID, encrypted access/refresh tokens where applicable, token expiry, scopes/permissions metadata, connection status, last successful API access.
- \`portfolios\`: user ID, unique normalized slug, published state, selected theme, SEO fields, public visibility settings, timestamps.
- \`github_repositories\`: user ID, GitHub repository ID, name, description, URL, homepage, visibility, language, topics, stars, forks, README metadata, archived/forked flags, source update time, sync time.
- \`project_overrides\`: repository ID or stable project key, user-owned title/description/links/technology labels/order/featured state/visibility and optional image reference.
- \`skills\`: user-owned skill name, category, display order, optional proficiency text.
- \`experiences\`: role, organization, description, dates, location, display order.
- \`educations\`: institution, qualification, field, dates, details, display order.
- \`certifications\`: name, issuer, issue/expiry dates, credential URL, display order.
- \`social_links\`: platform, label, URL, display order.
- \`sync_runs\`: user ID, start/end, status, counts, safe error code/message, trigger type.
- Optional \`portfolio_views\` only if privacy-friendly analytics is explicitly included.

Use foreign keys, unique constraints, indexes, and cascade behavior deliberately. Add indexes for portfolio slug lookup, due synchronization, user-owned record lookup, and repository identity.

### Critical data separation

Do not store imported values and manual edits in one field where synchronization can destroy user changes.

- Preserve the imported GitHub repository data separately.
- Store user overrides separately.
- Define a clear merge function that produces the public project view.
- A GitHub sync may refresh imported repository fields but must never erase manual descriptions, images, demo links, order, featured state, or manual skills/experience.
- If a repository becomes unavailable or private, do not silently delete the user's project. Mark the imported source unavailable and let the owner decide what to do.
- Store an appropriate source timestamp and last successful sync timestamp.

Document the data model and migration workflow in \`docs/DATABASE.md\`.

---

## 5. Authentication and GitHub integration

Implement real authentication, not a fake login screen.

### OAuth flow

- Use server-side authorization-code exchange.
- Generate and validate cryptographically random OAuth \`state\`.
- Use PKCE if supported by the selected GitHub flow.
- Validate callback parameters and prevent replay/CSRF.
- Use secure, HttpOnly, SameSite cookies; set Secure in production.
- Use opaque random session IDs. Store only a hash/digest of session IDs in D1.
- Rotate or renew sessions safely after login.
- Implement logout and session expiration.
- Use server-side GitHub API access only.
- Never send GitHub tokens to the browser or include them in loader data.
- Store tokens encrypted at rest using Web Crypto AES-GCM and a key supplied through a deployment secret. Include key versioning/rotation guidance.
- Do not log OAuth codes, access tokens, refresh tokens, session cookies, private profile data, or encryption material.
- Handle revoked/expired credentials gracefully and let users reconnect.
- Support token refresh if the chosen provider flow returns refresh tokens. If a selected GitHub configuration does not support refresh tokens, document its actual behavior accurately.
- Request no repository write permissions and no private repository scopes.

### Public GitHub data import

Use GitHub REST endpoints for:

- Authenticated user identity.
- The user's public profile.
- Public repositories.
- Repository languages.
- Repository topics.
- README content or metadata for selected projects.
- Public activity/contribution information only where a stable, documented endpoint exists.

Do not assume every GitHub UI metric has an official API endpoint. For unavailable data, omit the statistic or label it accurately; never fabricate contribution counts.

Implement:

- Pagination.
- Rate-limit header handling.
- Conditional requests/ETags where available.
- Request timeouts and bounded retries.
- Exponential backoff for transient failures.
- Clear user-facing status and useful error messages.
- Deduplication by GitHub repository ID.
- A repository selection interface with search, featured toggle, visibility toggle, and ordering.
- Import preview/empty states for accounts with no public repositories.

Do not scrape GitHub HTML pages as a replacement for supported API endpoints.

### GitHub integration tests

Use mocked API responses for automated tests and add a documented manual test using a real test account. Verify that no private repositories are retrieved and that no write scopes are requested.

---

## 6. Dashboard and portfolio editor

Create a polished, responsive product dashboard. It must be functional, not a static design exercise.

### Required sections

1. **Overview**
   - Profile completion indicator based on useful fields.
   - Portfolio publication status and public URL.
   - Selected theme preview.
   - Last GitHub sync and next scheduled sync.
   - Manual sync action with loading, success, failure, and rate-limit states.
   - Shortcuts to finish incomplete sections.

2. **Profile**
   - Name, headline, bio, avatar, location (optional), and availability statement.
   - Clear length validation and preview.

3. **Projects**
   - Imported public repository list.
   - Search and filtering.
   - Feature/unfeature and show/hide controls.
   - Reordering.
   - Editable title and description.
   - Technologies/tags.
   - GitHub URL and optional live demo URL.
   - Optional image upload or external image URL.
   - Proper URL validation and safe external-link behavior.
   - Empty state and import retry.

4. **Skills**
   - Automatically suggested GitHub languages.
   - Manual skill creation, editing, deletion, grouping, and ordering.
   - No fabricated proficiency percentages. A proficiency field is optional and text-based unless users explicitly provide a level.

5. **Experience**
   - CRUD for role, organization, date range, location, and description.
   - Support current role and gaps in employment history without assumptions.

6. **Education**
   - CRUD for institution, qualification, field, date range, and details.

7. **Certifications**
   - CRUD for certificate name, issuer, dates, and credential link.

8. **Social links**
   - GitHub, LinkedIn, personal site, blog, X, and other user-entered links.
   - Validate URLs and render safe external links.

9. **Appearance**
   - Theme gallery with real previews.
   - Theme selection and customization of supported tokens such as accent color, typography scale, and light/dark preference where appropriate.
   - Theme switching must not change portfolio data.

10. **Publish**
    - Full preview.
    - Slug availability and validation.
    - Publish/unpublish.
    - Copy public link.
    - SEO title and description.
    - Public visibility/privacy explanation.

11. **Settings**
    - Connected GitHub account and connection status.
    - Reconnect/disconnect.
    - Export portfolio data as JSON.
    - Delete account and associated stored data, with explicit confirmation in the UI.
    - Explain consequences of disconnecting GitHub versus deleting an account.

### UX quality requirements

- A consistent layout, spacing scale, typography, color tokens, buttons, inputs, menus, dialogs, alerts, skeletons, and empty states.
- Strong responsive behavior for mobile, tablet, and desktop.
- Keyboard-operable navigation, visible focus states, labels, accessible dialogs, and adequate contrast.
- Respect reduced-motion preferences.
- Show actionable errors; do not swallow failures.
- Avoid excessive animation and heavy client bundles.
- No buttons that do nothing.
- Every CRUD screen must persist to D1 and reload correctly.

---

## 7. Theme engine

The theme engine is a core product feature. Do not build three unrelated pages that duplicate all portfolio logic.

### Architecture

- Define a single versioned, validated portfolio view model.
- Define a theme contract/component interface that receives this model plus theme settings.
- Register themes through a central registry.
- Keep theme rendering independent of database queries and GitHub API calls.
- Store only the selected theme ID and supported settings in the portfolio record.
- Unknown or removed theme IDs must fall back safely to the default theme.

### Initial free themes

Build at least three original, complete themes:

1. **Minimal:** clean editorial typography, calm spacing, professional presentation, clear project hierarchy.
2. **Terminal:** dark developer-console visual language, restrained phosphor accent, readable content, not a gimmicky fake terminal.
3. **Editorial:** expressive typography, structured project cards, visual storytelling, warm or high-contrast layout.

All three themes must support every available portfolio section, handle missing data gracefully, and be responsive.

### Theme quality gates

- The same portfolio data renders in each theme.
- Switching themes never mutates the portfolio content.
- No missing sections in any theme.
- No horizontal overflow at common mobile widths.
- Proper heading hierarchy, alt text, links, color contrast, and reduced-motion behavior.
- Real previews use representative sample data but are clearly identified as previews.
- Do not copy another commercial portfolio product's exact template design, distinctive animation, or source code.

Make it straightforward for community contributors to add a theme. Document the theme contract and add a minimal example theme guide.

---

## 8. Public portfolio pages

Implement public pages with server-side rendering so important content is present in the initial HTML.

### Public route

- Initial format: \`/@<username>\`.
- Reserve application routes such as \`/login\`, \`/dashboard\`, \`/settings\`, and \`/api/*\`.
- Normalize and validate slugs. Prevent route collisions and unsafe characters.
- Published portfolios are visible to anonymous visitors.
- Unpublished, deleted, or nonexistent portfolios must not leak data.
- The public route must render the theme selected by the owner and the merged portfolio view model.

### Public portfolio content

- Introduction/name/headline/bio.
- Featured projects, with links and technologies.
- Other selected projects.
- Skills.
- Experience.
- Education.
- Certifications.
- Social/contact links.
- Optional GitHub profile link.

### SEO and sharing

- Unique title and meta description.
- Canonical URL.
- Open Graph and Twitter/X card metadata.
- Correct social preview image where available.
- Semantic HTML and crawlable links.
- Sitemap or sitemap endpoint for published portfolios, with robots behavior that respects publication state.
- No indexing of dashboard, login, settings, or unpublished content.
- Good loading and caching behavior; invalidate or refresh caches after relevant portfolio updates.
- Do not cache authenticated dashboard responses publicly.
- External links must use safe rel attributes where needed.

### User experience

- Clean 404 and unpublished states.
- Copy/share link support.
- Contact links should be explicit; do not expose the owner's email unless they chose to publish it.
- No forced tracking, popups, or third-party ad scripts.

---

## 9. Uploads and storage

R2 is optional for local development and required only for the hosted upload feature.

- Support profile avatar and project image uploads.
- Validate allowed MIME types and file extensions; do not trust client-provided MIME types alone.
- Enforce a conservative size limit and document it.
- Use unpredictable object keys scoped to the user.
- Prevent path traversal and unsafe filenames.
- Do not execute or serve uploaded HTML/JavaScript.
- Set safe content types and cache policies.
- Provide delete/replace functionality and clean up orphaned objects.
- If R2 is not configured, the rest of the product must work and users can use an external image URL or GitHub avatar.
- Document bucket creation and binding setup.

---

## 10. Automatic synchronization

Implement daily synchronization using Cloudflare Cron Triggers. The app must also support user-triggered sync.

### Workflow

1. Cron starts.
2. Query a bounded batch of accounts due for sync.
3. Refresh credentials when supported and needed.
4. Fetch current public profile and public repositories.
5. Use pagination and conditional requests where available.
6. Upsert imported GitHub data by stable IDs.
7. Preserve user-owned overrides.
8. Mark source repositories unavailable rather than deleting user work.
9. Record run status, timestamps, counts, and safe error information.
10. Continue processing other accounts when one account fails.

### Reliability

- Bound the number of accounts and GitHub calls handled per invocation.
- Avoid unbounded loops and excessive Worker CPU usage.
- Handle GitHub rate limits using response headers and reset times.
- Use backoff and a retry schedule for transient failures.
- Prevent concurrent syncs for the same account using a database lease/lock or another simple, tested approach.
- Ensure a failed sync does not replace last known good data with partial/empty results.
- Expose sync status to the user.
- Make the schedule configurable in code and document the default daily cadence.
- Do not claim a page is "live updated" if it depends on a scheduled sync.

A public GitHub webhook integration is optional later. Do not require webhooks for the initial release.

---

## 11. Privacy, security, and abuse prevention

Treat this as a multi-user public service.

- Enforce ownership checks in every mutation and private query. A user must never read or change another user's dashboard data.
- Validate request bodies and route parameters server-side.
- Use parameterized database queries/Drizzle.
- Prevent CSRF for state-changing actions.
- Add rate limits or abuse controls to OAuth, manual sync, slug checks, uploads, and other expensive endpoints. Choose a Workers-compatible implementation.
- Sanitize any Markdown/HTML derived from README files. Prefer rendering safe Markdown; never inject raw repository HTML.
- Defend against stored XSS, reflected XSS, open redirects, SSRF, IDOR, path traversal, and unsafe file uploads.
- Never fetch arbitrary user-supplied URLs from the Worker unless the feature explicitly requires it and includes allowlists/timeouts/SSRF protections.
- Avoid logging sensitive values.
- Use generic auth errors where detailed messages could reveal account existence.
- Add security headers and a restrictive Content Security Policy compatible with the app.
- Keep dependencies current and check for known vulnerabilities.
- Make account deletion actually remove the user's data, sessions, tokens, and R2 objects where applicable.
- Provide export before deletion.
- Publish a clear privacy/data-handling explanation.
- Provide a vulnerability reporting address placeholder in SECURITY.md rather than inventing an email.

Do not claim formal security certification or a completed penetration test.

---

## 12. AI assistant — optional later capability

Do not let AI delay the initial release.

For the first release, an AI assistant may be absent or disabled. Keep the portfolio data model suitable for a later retrieval-based assistant.

If implementation is included after the core app is stable:

- It must be opt-in and disabled by default.
- It must answer only from the owner's published portfolio, selected public repository metadata, and README excerpts.
- It must say clearly that it is an AI assistant, not the developer.
- It must refuse to invent skills, projects, experience, or claims.
- It must be possible to disable it.
- Use bring-your-own-provider-key or a clearly documented optional provider. Never assume unlimited free AI inference.
- Never send private data or GitHub tokens to an AI provider.
- Do not expose provider keys to the browser.
- Make data sent to third parties clear to the portfolio owner and visitor.
- Add rate limiting and token limits.

If these safety and cost requirements cannot be met in the initial implementation, document the assistant as a later feature and finish the rest of the product.

---

## 13. Free and self-hostable deployment

The product must be usable locally without a Cloudflare account and deployable by an independent user.

### Local development

Provide:

- Clear Node.js/npm prerequisites.
- Install command.
- D1 local database setup/migrations.
- R2 local or stub configuration.
- Environment variable documentation.
- GitHub OAuth callback setup for local development.
- Development server command.
- Typecheck, lint, test, and build commands.
- Troubleshooting for common setup problems.

Provide \`.env.example\` and/or \`.dev.vars.example\` with placeholder values only. Add real \`.env\`, \`.dev.vars\`, secret files, local databases, build output, Playwright reports, and generated artifacts to \`.gitignore\`.

### Cloudflare deployment

Implement and document:

- \`wrangler.jsonc\` with the Worker entry, compatibility settings, D1 binding, optional R2 binding, and Cron Trigger.
- D1 database creation and migration commands.
- R2 bucket creation instructions.
- Required Worker secrets, including GitHub OAuth secret and token encryption key.
- GitHub OAuth callback URL for production.
- \`workers.dev\` deployment.
- Custom domain setup as optional, not required.
- Production health/smoke check.
- Logs and basic quota/usage monitoring.
- Rollback instructions.

Do not put real account IDs, database IDs, zone IDs, OAuth credentials, or encryption keys in committed config. Use documented placeholders and clearly say where the user must replace them.

### Free-tier honesty

Design for provider free plans, but do not promise unlimited hosting or permanent zero-cost service. Free quotas, CPU limits, storage, request limits, and provider policies can change. Verify current official pricing and limits when writing deployment docs. Explain what happens when quotas are exceeded, how to monitor usage, and which features could incur charges. Do not enable paid services or create billable resources without explicit user authorization.

The application must continue to run locally and be self-hostable by users who choose another hosting provider only if the architecture supports it; Cloudflare remains the primary documented deployment target for this first release.

### GitHub Actions

Create:

- CI workflow on pull requests and pushes: install, lint, typecheck, unit/integration tests, production build.
- Optional deployment workflow for Cloudflare.
- Deployment must remain disabled until the user explicitly configures the required repository variables/secrets. CI must still pass without Cloudflare credentials.
- Include workflow permissions with least privilege.
- Pin or update third-party Actions responsibly.
- Never echo secrets in logs.

A missing Cloudflare secret must not prevent ordinary CI from running.

---

## 14. Design direction and product quality

Make the public landing page and dashboard look like a polished, modern developer product. Do not ship the unstyled default framework scaffold.

### Landing page

Include:

- Clear hero statement and primary GitHub sign-in CTA.
- Small explanation of the connect → customize → publish workflow.
- Real theme previews.
- Benefits and feature overview.
- Open-source/free positioning.
- Privacy/security explanation.
- FAQ.
- GitHub repository link.
- Responsive footer.

Do not invent fake user counts, testimonials, company logos, ratings, or adoption statistics.

### Design system

- Distinct visual identity, not a generic admin template.
- Carefully chosen typography and restrained color palette.
- Consistent spacing, border, radius, shadow, and motion tokens.
- Good contrast in light/dark contexts where supported.
- Subtle, purposeful transitions.
- Respect \`prefers-reduced-motion\`.
- Use original illustrations or simple CSS/SVG visuals. Do not hotlink random image assets or use copyrighted screenshots.
- Ensure the product itself is responsive, not only the portfolios it generates.

### Performance and accessibility

- Server-render public content.
- Keep public portfolio payloads small.
- Optimize image dimensions and loading.
- Avoid unnecessary JS and dependencies.
- Use semantic landmarks, headings, forms, labels, and buttons.
- Support keyboard navigation and screen readers.
- Provide visible focus states.
- Test mobile widths and common browsers.
- Use Lighthouse or equivalent where available, but never invent scores.

---

## 15. Required documentation and open-source readiness

Create and maintain:

- \`README.md\`: project summary, screenshots/preview placeholders only if real screenshots are unavailable, features, tech stack, local setup, deployment, environment variables, commands, badges only when valid.
- \`LICENSE\`: exact license selected by the user/default; do not merely add a license name without the full correct license text.
- \`CONTRIBUTING.md\`: setup, coding standards, branch/commit conventions, tests, theme contributions, pull request process.
- \`CODE_OF_CONDUCT.md\`: use a recognized standard and attribute it correctly.
- \`SECURITY.md\`: supported versions, vulnerability reporting guidance, secret handling.
- \`docs/PRODUCT_DECISIONS.md\`: one-time questionnaire answers and applied defaults.
- \`docs/ARCHITECTURE.md\`: system diagram, request flow, server/browser boundaries, deployment shape.
- \`docs/DATABASE.md\`: schema, relations, migrations, ownership/data merge rules.
- \`docs/GITHUB_OAUTH_SETUP.md\`: create app, callback URLs, minimum permission setup, local/production secret configuration, reconnect/revocation behavior.
- \`docs/CLOUDFLARE_DEPLOYMENT.md\`: D1, R2, Worker, Cron, secrets, custom domain (optional), monitoring, free-plan caveats.
- \`docs/THEME_DEVELOPMENT.md\`: theme contract, registration, local preview, accessibility checklist.
- \`docs/SECURITY_AND_PRIVACY.md\`: collected data, processing, retention, deletion, token handling.
- \`docs/ROADMAP.md\`: shipped features and clearly separated future ideas.
- \`.env.example\` and \`.dev.vars.example\`: all required variables with safe placeholders and descriptions.

Keep the README aligned with actual functionality. Do not describe features as complete when they are not.

---

## 16. Implementation phases — execute all of them

Do not stop after producing this sequence. This is the execution plan.

### Phase A — Audit and decisions

- Inspect repository/default branch/history.
- Send the one-time consolidated questionnaire from Section 1.
- Record answers/defaults.
- Create a short implementation checklist in the repo.
- Confirm the framework and provider choices against current official docs.

### Phase B — Scaffold and baseline

- Scaffold the supported Cloudflare React Router full-stack application.
- Set up TypeScript strict mode, styling, linting, formatter, and scripts.
- Add Worker configuration and local bindings.
- Add CI.
- Build a polished landing page shell.
- Confirm install, typecheck, test, and build.
- Commit and push.

### Phase C — Database and authentication

- Design Drizzle schema and initial migrations.
- Implement secure sessions and GitHub OAuth.
- Build login, callback, logout, session loader, protected dashboard layout.
- Add ownership helpers and tests.
- Verify no repository write scopes.
- Commit and push.

### Phase D — GitHub import

- Implement typed GitHub API client.
- Import profile and public repositories with pagination/rate-limit handling.
- Import languages/topics/README data where supported.
- Add repository selector and import status.
- Add real-data integration test via mocks and manual verification instructions.
- Commit and push.

### Phase E — Dashboard CRUD

- Implement profile, projects, skills, experience, education, certifications, social links, settings, export, and account deletion.
- Persist all changes in D1.
- Implement imported-data/override merge behavior.
- Add validation and ownership tests.
- Commit and push.

### Phase F — Themes

- Define the portfolio view model and theme interface.
- Implement Minimal, Terminal, and Editorial themes.
- Add theme gallery and real live preview.
- Test theme parity and content preservation.
- Commit and push.

### Phase G — Public publishing

- Implement slug checks and publish/unpublish.
- Implement public SSR route and not-found/unpublished handling.
- Add SEO/social metadata, sitemap/robots behavior, cache invalidation.
- Test public rendering using several fixtures and a real account when credentials are available.
- Commit and push.

### Phase H — Uploads and synchronization

- Implement optional R2 uploads with validation and cleanup.
- Implement manual sync and daily scheduled sync.
- Add due-account batching, locks, backoff, rate-limit handling, and sync history.
- Test preservation of manual overrides, including a repository description change and repository removal/private transition.
- Commit and push.

### Phase I — Security and quality

- Review authentication, authorization, XSS/Markdown rendering, CSRF, SSRF, uploads, URL validation, security headers, secrets, and deletion.
- Run dependency audit.
- Add missing tests.
- Run all checks and fix failures.
- Test responsive layouts and keyboard accessibility.
- Test build in the Worker runtime.
- Commit and push.

### Phase J — Release and delivery

- Verify clean installation from scratch.
- Verify local development instructions.
- Verify CI workflows.
- Verify deployment configuration without requiring secrets.
- If Cloudflare credentials and account bindings are configured, deploy and smoke test. If not, finish the deployment docs and leave deployment ready for the user.
- Ensure all code and docs are pushed to \`main\` or a PR is opened if branch protection blocks direct push.
- Provide a concise final report with repository link, current branch/commit, features completed, commands actually run and their results, deployment status, and only the exact external setup actions that remain.

---

## 17. Acceptance criteria — definition of done

Do not call the project complete until all applicable required checks below are satisfied.

### Functional

- [ ] Landing page is complete and responsive.
- [ ] GitHub login/callback/logout work with real OAuth credentials.
- [ ] OAuth requests no repository write/private access.
- [ ] Public GitHub profile and public repository import work.
- [ ] Pagination and API rate-limit errors are handled.
- [ ] Dashboard is protected.
- [ ] User can edit profile data and all portfolio sections.
- [ ] Project selection, reordering, overrides, demo links, and feature controls persist.
- [ ] At least three complete themes render from the same model.
- [ ] Theme switching preserves content.
- [ ] User can preview, publish, unpublish, and copy a public URL.
- [ ] Public pages render useful server HTML and metadata.
- [ ] Manual sync works.
- [ ] Daily Cron sync is configured and safely bounded.
- [ ] Sync never overwrites manual overrides.
- [ ] Optional image uploads work when R2 is configured; product remains usable without R2.
- [ ] Export and account deletion work.
- [ ] Empty/error/loading/success states exist for important workflows.

### Engineering

- [ ] TypeScript strict check passes.
- [ ] Lint passes.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Production build passes.
- [ ] Important Playwright journeys pass where browser tooling is available.
- [ ] Migrations apply cleanly to a fresh local database.
- [ ] No known secret or token is committed.
- [ ] No critical unresolved security issue is knowingly left in the core path.
- [ ] CI runs without Cloudflare secrets.
- [ ] Deployment config is documented and reproducible.

### Open-source and delivery

- [ ] License file is complete and accurate.
- [ ] README local setup works from a clean checkout.
- [ ] OAuth setup is documented.
- [ ] Cloudflare setup is documented.
- [ ] Theme contribution guide exists.
- [ ] Product decisions and known limitations are documented.
- [ ] All finished work is committed and pushed to \`main\`, or a PR is opened if direct pushes are blocked.

If real OAuth or deployment credentials are unavailable, mark those specific live checks as **blocked by external setup**, but still complete the application, mocked tests, documentation, and all checks that can run locally. Do not mark them passed.

---

## 18. Final report format

At completion, report:

1. **Repository:** direct link to the repository and branch.
2. **Latest commit:** SHA and commit message.
3. **What is implemented:** grouped by user-facing capabilities.
4. **Verification:** commands actually run, with pass/fail results.
5. **Deployment:** deployed URL if actually deployed; otherwise explicitly say not deployed.
6. **External setup remaining:** only actions that genuinely require the user (for example OAuth app registration, Cloudflare account/bindings/secrets, domain DNS).
7. **Known limitations:** honest and specific.
8. **How to run locally:** exact commands from the README.

Do not finish with a new questionnaire. Do not ask whether to continue. Do not say you will work in the background. Complete all work possible in the current execution.

---

# Start now

1. Inspect \`AravindSAsok/openfolio\` and confirm its current default branch and contents.
2. Send the **single consolidated questionnaire** from Section 1, with defaults visible.
3. After receiving answers—or applying defaults if no optional answer is supplied—build the complete application through Phase J.
4. Commit and push to \`main\` as work is completed.
5. Return the final report from Section 18.

**Remember: the goal is a functioning open-source product in the repository, not another planning document.**
