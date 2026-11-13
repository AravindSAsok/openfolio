# Product decisions

The implementation uses the defaults from MASTER_BUILD_PROMPT.md because no alternate choices were provided.

| Topic | Decision |
|---|---|
| Product name | Openfolio (working name; not a legal or domain clearance) |
| License | AGPL-3.0-or-later |
| Hosting | Cloudflare Workers + D1 + optional R2 |
| Domain | workers.dev and /@username routes first; custom domain later |
| GitHub access | OAuth read:user scope; public repositories only; no write scope |
| AI assistant | Not included in the first release; never required for core use |
| Analytics | No invasive analytics or third-party trackers |

Architecture note: the application uses Cloudflare's React + Vite Worker API pattern. The dashboard is a React SPA served by Workers static assets, while the Worker generates public portfolio HTML with metadata. This keeps one deployment and a small runtime surface. The public page renderer is separate from database access and escapes user-controlled text.