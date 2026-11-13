import { and, eq, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { githubConnections, githubRepositories, portfolios, sessions, syncRuns, users } from "./db/schema";
import { renderPortfolioHtml } from "./render";

interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket;
  ASSETS: Fetcher;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_TOKEN_ENCRYPTION_KEY?: string;
  APP_BASE_URL?: string;
  ENVIRONMENT?: string;
}

type PortfolioData = {
  profile: { name: string; headline: string; bio: string; avatarUrl: string; location: string };
  projects: Array<Record<string, any>>;
  skills: string[];
  experience: Array<Record<string, any>>;
  education: Array<Record<string, any>>;
  certifications: Array<Record<string, any>>;
  socialLinks: Array<Record<string, any>>;
  seoTitle?: string;
  seoDescription?: string;
};

const now = () => Math.floor(Date.now() / 1000);
const newId = () => crypto.randomUUID();
const responseJson = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function randomToken(bytes = 32): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function encode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}
function decode(value: string): Uint8Array {
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
async function hash(value: string): Promise<string> {
  return encode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
async function keyFromEnv(env: Env): Promise<CryptoKey> {
  if (!env.GITHUB_TOKEN_ENCRYPTION_KEY) throw new Error("GitHub token encryption is not configured.");
  const raw = decode(env.GITHUB_TOKEN_ENCRYPTION_KEY);
  if (raw.byteLength !== 32) throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encrypt(value: string, env: Env): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFromEnv(env), new TextEncoder().encode(value));
  return encode(iv) + "." + encode(new Uint8Array(ciphertext));
}
async function decrypt(value: string, env: Env): Promise<string> {
  const parts = value.split(".");
  if (parts.length !== 2) throw new Error("Stored GitHub token is invalid.");
  const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(parts[0]) }, await keyFromEnv(env), decode(parts[1]));
  return new TextDecoder().decode(clear);
}
function cookies(header: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0) {
      try { result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim()); } catch { /* ignore malformed cookies */ }
    }
  }
  return result;
}
function setCookie(name: string, value: string, age: number, secure: boolean): string {
  return name + "=" + encodeURIComponent(value) + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + age + (secure ? "; Secure" : "");
}
function origin(request: Request, env: Env): string {
  return (env.APP_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
}
function defaultData(user: { name?: string | null; login: string; avatarUrl?: string | null; bio?: string | null }): PortfolioData {
  return {
    profile: { name: user.name || user.login, headline: "Developer", bio: user.bio || "I build useful things with software.", avatarUrl: user.avatarUrl || "", location: "" },
    projects: [], skills: [], experience: [], education: [], certifications: [], socialLinks: []
  };
}
function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.toLowerCase().trim();
  const reserved = new Set(["api", "dashboard", "login", "logout", "settings", "assets", "media", "health", "about", "privacy", "terms"]);
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug) && !reserved.has(slug) ? slug : null;
}
function validData(value: any): value is PortfolioData {
  if (!value || typeof value !== "object" || !value.profile || typeof value.profile !== "object") return false;
  if (typeof value.profile.name !== "string" || value.profile.name.length > 100) return false;
  if (typeof value.profile.headline !== "string" || value.profile.headline.length > 160) return false;
  if (typeof value.profile.bio !== "string" || value.profile.bio.length > 1200) return false;
  return ["projects", "skills", "experience", "education", "certifications", "socialLinks"]
    .every((field) => Array.isArray(value[field]) && value[field].length <= 100);
}
async function currentUser(request: Request, env: Env) {
  const sessionToken = cookies(request.headers.get("cookie")).openfolio_session;
  if (!sessionToken) return null;
  const db = drizzle(env.DB);
  const tokenHash = await hash(sessionToken);
  const session = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).get();
  if (!session || session.expiresAt <= now()) {
    if (session) await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    return null;
  }
  return (await db.select().from(users).where(eq(users.id, session.userId)).get()) || null;
}
async function githubFetch(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: {
      authorization: "Bearer " + token,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "Openfolio"
    }
  });
}

async function syncUser(userId: string, trigger: string, env: Env) {
  const db = drizzle(env.DB);
  const startedAt = now();
  const runId = newId();
  await db.insert(syncRuns).values({ id: runId, userId, triggerType: trigger, status: "running", startedAt });
  try {
    const connection = await db.select().from(githubConnections).where(eq(githubConnections.userId, userId)).get();
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!connection || !user) throw new Error("Reconnect your GitHub account to synchronize repositories.");
    const token = await decrypt(connection.tokenCiphertext, env);
    const repositories: any[] = [];
    for (let page = 1; page <= 5; page += 1) {
      const res = await githubFetch("https://api.github.com/users/" + encodeURIComponent(user.login) + "/repos?type=owner&sort=updated&per_page=100&page=" + page, token);
      if (res.status === 403 || res.status === 429) {
        const reset = res.headers.get("x-ratelimit-reset");
        throw new Error(reset ? "GitHub rate limit reached. Try again after " + new Date(Number(reset) * 1000).toLocaleTimeString() + "." : "GitHub rate limit reached. Try again later.");
      }
      if (!res.ok) throw new Error("GitHub repository request failed (" + res.status + "). Reconnect and try again.");
      const batch = await res.json() as any[];
      repositories.push(...batch.filter((repo) => repo && repo.private === false));
      if (batch.length < 100) break;
    }
    const syncedAt = now();
    await db.update(githubRepositories).set({ isUnavailable: 1 }).where(eq(githubRepositories.userId, userId));
    for (const repo of repositories) {
      const values = {
        id: userId + ":" + String(repo.id), userId, repositoryId: String(repo.id),
        name: String(repo.name || "").slice(0, 120), fullName: String(repo.full_name || "").slice(0, 200),
        description: String(repo.description || "").slice(0, 500), htmlUrl: String(repo.html_url || ""),
        homepage: typeof repo.homepage === "string" ? repo.homepage.slice(0, 500) : null,
        language: typeof repo.language === "string" ? repo.language.slice(0, 80) : null,
        stars: Number(repo.stargazers_count || 0), forks: Number(repo.forks_count || 0),
        topicsJson: "[]", isArchived: repo.archived ? 1 : 0, isUnavailable: 0,
        sourceUpdatedAt: typeof repo.updated_at === "string" ? repo.updated_at : null, syncedAt
      };
      await db.insert(githubRepositories).values(values).onConflictDoUpdate({
        target: [githubRepositories.userId, githubRepositories.repositoryId],
        set: {
          name: values.name, fullName: values.fullName, description: values.description,
          htmlUrl: values.htmlUrl, homepage: values.homepage, language: values.language,
          stars: values.stars, forks: values.forks, isArchived: values.isArchived,
          isUnavailable: 0, sourceUpdatedAt: values.sourceUpdatedAt, syncedAt
        }
      });
    }
    await db.update(githubConnections).set({ lastSyncAt: syncedAt, nextSyncAt: syncedAt + 86400, syncLockUntil: null }).where(eq(githubConnections.userId, userId));
    await db.update(syncRuns).set({ status: "success", importedCount: repositories.length, finishedAt: now(), safeMessage: "Public repositories synchronized." }).where(eq(syncRuns.id, runId));
    return { imported: repositories.length, message: "Public repositories synchronized." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Synchronization failed.";
    await db.update(githubConnections).set({ nextSyncAt: now() + 3600, syncLockUntil: null }).where(eq(githubConnections.userId, userId));
    await db.update(syncRuns).set({ status: "failed", finishedAt: now(), safeMessage: message.slice(0, 240) }).where(eq(syncRuns.id, runId));
    throw error;
  }
}

async function oauthStart(request: Request, env: Env): Promise<Response> {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_TOKEN_ENCRYPTION_KEY) {
    return responseJson({ error: "GitHub OAuth is not configured. Follow docs/GITHUB_OAUTH_SETUP.md." }, 503);
  }
  const state = randomToken(24);
  const target = new URL("https://github.com/login/oauth/authorize");
  target.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  target.searchParams.set("redirect_uri", origin(request, env) + "/api/auth/github/callback");
  target.searchParams.set("scope", "read:user");
  target.searchParams.set("state", state);
  return new Response(null, { status: 302, headers: { location: target.toString(), "set-cookie": setCookie("openfolio_oauth_state", state, 600, env.ENVIRONMENT !== "development") } });
}
async function oauthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const expected = cookies(request.headers.get("cookie")).openfolio_oauth_state;
  if (!expected || url.searchParams.get("state") !== expected) return responseJson({ error: "OAuth state validation failed. Please try again." }, 400);
  const code = url.searchParams.get("code");
  if (!code || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_TOKEN_ENCRYPTION_KEY) return responseJson({ error: "GitHub OAuth setup is incomplete." }, 400);
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST", headers: { accept: "application/json", "content-type": "application/json", "user-agent": "Openfolio" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: origin(request, env) + "/api/auth/github/callback" })
  });
  const tokenBody = await tokenRes.json() as any;
  if (!tokenRes.ok || !tokenBody.access_token) return responseJson({ error: "GitHub authorization failed. Check the OAuth App callback URL." }, 400);
  const token = String(tokenBody.access_token);
  const profileRes = await githubFetch("https://api.github.com/user", token);
  if (!profileRes.ok) return responseJson({ error: "Could not read your GitHub profile. Please authorize again." }, 400);
  const profile = await profileRes.json() as any;
  if (!profile?.id || !profile?.login) return responseJson({ error: "GitHub returned an incomplete profile." }, 400);

  const db = drizzle(env.DB);
  const timestamp = now();
  const githubId = String(profile.id);
  await db.insert(users).values({
    id: newId(), githubId, login: String(profile.login), name: profile.name || null,
    avatarUrl: profile.avatar_url || null, bio: profile.bio || null,
    createdAt: timestamp, updatedAt: timestamp
  }).onConflictDoUpdate({
    target: users.githubId,
    set: { login: String(profile.login), name: profile.name || null, avatarUrl: profile.avatar_url || null, bio: profile.bio || null, updatedAt: timestamp }
  });
  const user = await db.select().from(users).where(eq(users.githubId, githubId)).get();
  if (!user) return responseJson({ error: "Could not create your account." }, 500);
  const existing = await db.select().from(portfolios).where(eq(portfolios.userId, user.id)).get();
  if (!existing) {
    const candidate = normalizeSlug(String(profile.login)) || ("developer-" + githubId.slice(-6));
    const collision = await db.select().from(portfolios).where(eq(portfolios.slug, candidate)).get();
    await db.insert(portfolios).values({
      id: newId(), userId: user.id, slug: collision ? candidate + "-" + githubId.slice(-5) : candidate,
      isPublished: 0, theme: "minimal", dataJson: JSON.stringify(defaultData(user)), updatedAt: timestamp
    });
  }
  const encrypted = await encrypt(token, env);
  await db.insert(githubConnections).values({
    userId: user.id, tokenCiphertext: encrypted, scopes: "read:user", connectedAt: timestamp, nextSyncAt: timestamp
  }).onConflictDoUpdate({
    target: githubConnections.userId,
    set: { tokenCiphertext: encrypted, scopes: "read:user", connectedAt: timestamp, nextSyncAt: timestamp }
  });
  const sessionToken = randomToken();
  await db.insert(sessions).values({ tokenHash: await hash(sessionToken), userId: user.id, expiresAt: timestamp + 60 * 60 * 24 * 30, createdAt: timestamp });
  const headers = new Headers({ location: "/dashboard" });
  headers.append("set-cookie", setCookie("openfolio_session", sessionToken, 60 * 60 * 24 * 30, env.ENVIRONMENT !== "development"));
  headers.append("set-cookie", setCookie("openfolio_oauth_state", "", 0, env.ENVIRONMENT !== "development"));
  return new Response(null, { status: 302, headers });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  const db = drizzle(env.DB);
  if (path === "/api/health" && request.method === "GET") return responseJson({ status: "ok", service: "openfolio" });
  if (path === "/api/config" && request.method === "GET") return responseJson({ githubOAuthEnabled: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_TOKEN_ENCRYPTION_KEY) });
  if (path === "/api/auth/github" && request.method === "GET") return oauthStart(request, env);
  if (path === "/api/auth/github/callback" && request.method === "GET") return oauthCallback(request, env);
  if (path === "/api/logout" && request.method === "POST") {
    const session = cookies(request.headers.get("cookie")).openfolio_session;
    if (session) await db.delete(sessions).where(eq(sessions.tokenHash, await hash(session)));
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", setCookie("openfolio_session", "", 0, env.ENVIRONMENT !== "development"));
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  const user = await currentUser(request, env);
  if (path === "/api/me" && request.method === "GET") {
    if (!user) return responseJson({ user: null, portfolio: null });
    const portfolio = await db.select().from(portfolios).where(eq(portfolios.userId, user.id)).get();
    const connection = await db.select().from(githubConnections).where(eq(githubConnections.userId, user.id)).get();
    return responseJson({
      user: { login: user.login, name: user.name, avatarUrl: user.avatarUrl },
      connected: Boolean(connection),
      sync: connection ? { lastSyncAt: connection.lastSyncAt, nextSyncAt: connection.nextSyncAt } : null,
      portfolio: portfolio ? { slug: portfolio.slug, isPublished: Boolean(portfolio.isPublished), theme: portfolio.theme, data: JSON.parse(portfolio.dataJson) } : null
    });
  }
  if (path.startsWith("/api/") && !user) return responseJson({ error: "Authentication required." }, 401);

  if (path === "/api/portfolio" && request.method === "PUT" && user) {
    const body = await request.json() as any;
    const current = await db.select().from(portfolios).where(eq(portfolios.userId, user.id)).get();
    if (!current) return responseJson({ error: "Portfolio not found." }, 404);
    const data = body.data ?? JSON.parse(current.dataJson);
    if (!validData(data)) return responseJson({ error: "Portfolio data is invalid or exceeds allowed field limits." }, 400);
    const theme = ["minimal", "terminal", "editorial"].includes(body.theme) ? body.theme : current.theme;
    const slug = body.slug === undefined ? current.slug : normalizeSlug(body.slug);
    if (!slug) return responseJson({ error: "Use 3–40 lowercase letters, numbers, and hyphens for your portfolio URL." }, 400);
    const collision = await db.select().from(portfolios).where(eq(portfolios.slug, slug)).get();
    if (collision && collision.userId !== user.id) return responseJson({ error: "That portfolio URL is already in use." }, 409);
    const published = body.isPublished === undefined ? current.isPublished : (body.isPublished ? 1 : 0);
    await db.update(portfolios).set({
      dataJson: JSON.stringify(data), theme, slug, isPublished: published,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle.slice(0, 120) : current.seoTitle,
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription.slice(0, 220) : current.seoDescription,
      updatedAt: now()
    }).where(eq(portfolios.userId, user.id));
    return responseJson({ ok: true, portfolio: { slug, isPublished: Boolean(published), theme, data } });
  }

  if (path === "/api/github/repos" && request.method === "GET" && user) {
    const repositories = await db.select().from(githubRepositories).where(eq(githubRepositories.userId, user.id)).all();
    return responseJson({ repositories });
  }
  if (path === "/api/sync" && request.method === "POST" && user) {
    try { return responseJson(await syncUser(user.id, "manual", env)); }
    catch (error) { return responseJson({ error: error instanceof Error ? error.message : "GitHub sync failed." }, 400); }
  }
  if (path === "/api/export" && request.method === "GET" && user) {
    const portfolio = await db.select().from(portfolios).where(eq(portfolios.userId, user.id)).get();
    const repositories = await db.select().from(githubRepositories).where(eq(githubRepositories.userId, user.id)).all();
    return responseJson({ exportedAt: new Date().toISOString(), user: { login: user.login, name: user.name, avatarUrl: user.avatarUrl }, portfolio, repositories });
  }
  if (path === "/api/upload" && request.method === "POST" && user) {
    if (!env.BUCKET) return responseJson({ error: "Image storage is not configured. Use your GitHub avatar or an HTTPS image URL." }, 503);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return responseJson({ error: "Choose an image file." }, 400);
    if (file.size < 1 || file.size > 3 * 1024 * 1024) return responseJson({ error: "Images must be smaller than 3 MB." }, 400);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return responseJson({ error: "Only JPEG, PNG, and WebP images are allowed." }, 400);
    const key = user.id + "/" + newId();
    await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
    return responseJson({ url: "/media/" + key });
  }
  if (path === "/api/account" && request.method === "DELETE" && user) {
    if (env.BUCKET) {
      const listing = await env.BUCKET.list({ prefix: user.id + "/", limit: 1000 });
      if (listing.objects.length) await env.BUCKET.delete(listing.objects.map((object) => object.key));
    }
    await db.delete(users).where(eq(users.id, user.id));
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", setCookie("openfolio_session", "", 0, env.ENVIRONMENT !== "development"));
    return new Response(JSON.stringify({ ok: true }), { headers });
  }
  return responseJson({ error: "Not found." }, 404);
}

async function publicPortfolio(request: Request, env: Env, slug: string): Promise<Response> {
  const db = drizzle(env.DB);
  const portfolio = await db.select().from(portfolios).where(and(eq(portfolios.slug, slug), eq(portfolios.isPublished, 1))).get();
  if (!portfolio) return new Response("Portfolio not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const data = JSON.parse(portfolio.dataJson);
  const html = renderPortfolioHtml({ slug: portfolio.slug, theme: portfolio.theme, data, baseUrl: origin(request, env) });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60, s-maxage=300", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      if (url.pathname.startsWith("/media/") && request.method === "GET") {
        if (!env.BUCKET) return new Response("Not found", { status: 404 });
        const key = decodeURIComponent(url.pathname.slice("/media/".length));
        if (!/^[a-f0-9-]+\/[a-f0-9-]+$/.test(key)) return new Response("Not found", { status: 404 });
        const object = await env.BUCKET.get(key);
        if (!object) return new Response("Not found", { status: 404 });
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=31536000, immutable");
        headers.set("x-content-type-options", "nosniff");
        return new Response(object.body, { headers });
      }
      const match = url.pathname.match(/^\/@([a-z0-9-]{3,40})$/);
      if (match && request.method === "GET") return publicPortfolio(request, env, match[1]);
      if (url.pathname === "/health") return responseJson({ status: "ok" });
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Openfolio request failed:", error instanceof Error ? error.message : "Unknown error");
      return url.pathname.startsWith("/api/")
        ? responseJson({ error: "Something went wrong. Please retry." }, 500)
        : new Response("Internal server error", { status: 500 });
    }
  },
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const db = drizzle(env.DB);
    const due = await db.select({ userId: githubConnections.userId })
      .from(githubConnections).where(lte(githubConnections.nextSyncAt, now())).limit(5).all();
    for (const account of due) {
      try { await syncUser(account.userId, "scheduled", env); }
      catch (error) { console.error("Scheduled sync failed for account:", account.userId, error instanceof Error ? error.message : "Unknown error"); }
    }
  }
};