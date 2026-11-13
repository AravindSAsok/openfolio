# Cloudflare deployment

The React dashboard, Worker API, database, and optional object storage can run on Cloudflare. The free plan has quotas and is not unlimited; verify current provider terms before public launch.

## Create resources

1. Sign in to Cloudflare and install dependencies with npm install.
2. Create a D1 database: npx wrangler d1 create openfolio.
3. Copy the returned database_id into wrangler.jsonc.
4. R2 is optional. The application works without image uploads. To enable uploads, create a bucket with npx wrangler r2 bucket create openfolio-assets, then add the optional BUCKET binding shown below to wrangler.jsonc.

To enable R2 uploads, add this top-level binding to wrangler.jsonc after creating the bucket:

```jsonc
"r2_buckets": [
  {
    "binding": "BUCKET",
    "bucket_name": "openfolio-assets"
  }
]
```

## Apply migrations

- Local: npm run db:migrate:local
- Remote: npm run db:migrate:remote

## Configure secrets

Use Wrangler secrets for GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_TOKEN_ENCRYPTION_KEY. Generate the encryption key with openssl rand -base64 32. Never commit real credentials.

Set APP_BASE_URL to the final workers.dev origin and ENVIRONMENT to production. Configure the GitHub OAuth callback as APP_BASE_URL + /api/auth/github/callback.

## Deploy

Run npm run deploy. Verify /api/health, then test GitHub OAuth and publish a test portfolio.

## GitHub Actions

The manual workflow in .github/workflows/deploy.yml requires the CLOUDFLARE_API_TOKEN secret and CLOUDFLARE_ACCOUNT_ID repository variable.

## Custom domain

A custom domain is optional. Add it to the Worker only after you own and configure the domain's DNS.

## Quotas and monitoring

Review current limits:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/r2/pricing/

Monitor Worker invocations, CPU, D1 reads/writes, object storage, and R2 operations. The scheduled task processes at most five due users per invocation. If quotas are exceeded, requests or scheduled work may fail until usage resets or the plan changes.
