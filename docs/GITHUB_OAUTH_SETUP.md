# GitHub OAuth setup

Openfolio uses a GitHub OAuth App for identity and access to the user's public profile. It requests only read:user. Repository import uses the public user repositories endpoint; no private repository permission or repository write scope is requested.

## Create an OAuth App

1. Open GitHub Settings → Developer settings → OAuth Apps.
2. Create a new OAuth App.
3. Set the homepage URL to your local or deployed Openfolio origin.
4. Set the authorization callback URL:
   - Local: http://localhost:5173/api/auth/github/callback
   - Production: https://YOUR-WORKER.workers.dev/api/auth/github/callback
5. Copy the Client ID and generate a Client Secret.

## Configure local development

Copy .dev.vars.example to .dev.vars and enter GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_TOKEN_ENCRYPTION_KEY.

Generate the encryption key using openssl rand -base64 32. It must decode to exactly 32 bytes. Keep it backed up; existing encrypted tokens cannot be decrypted if this key is lost.

Use APP_BASE_URL=http://localhost:5173 and ENVIRONMENT=development locally.

## Configure production

Use Wrangler secrets:
- npx wrangler secret put GITHUB_CLIENT_ID
- npx wrangler secret put GITHUB_CLIENT_SECRET
- npx wrangler secret put GITHUB_TOKEN_ENCRYPTION_KEY

Set APP_BASE_URL and ENVIRONMENT=production as Worker variables. Keep the OAuth callback URL exactly aligned with APP_BASE_URL.

## Permissions and revocation

The only requested OAuth scope is read:user. Openfolio does not request write access or private repository access. Users can revoke the OAuth App in GitHub Settings → Applications. OAuth App tokens do not automatically imply a refresh capability; reconnect if GitHub rejects a stored token.