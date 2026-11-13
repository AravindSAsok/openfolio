import { describe, expect, it } from "vitest";

const reserved = new Set(["api", "dashboard", "login", "logout", "settings", "assets", "media", "health", "about", "privacy", "terms"]);
function validateSlug(value: string): boolean {
  const slug = value.toLowerCase().trim();
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug) && !reserved.has(slug);
}
function mergeProjects(imported: { id: string; name: string; description: string }[], overrides: Record<string, unknown>[]) {
  return imported.map((repo) => {
    const override = overrides.find((item) => item.repositoryId === repo.id) || {};
    return { title: repo.name, description: repo.description, ...override };
  });
}

describe("portfolio rules", () => {
  it("accepts normalized slugs", () => {
    expect(validateSlug("aravind-dev")).toBe(true);
    expect(validateSlug("Aravind")).toBe(true);
  });
  it("rejects short, reserved, and malformed slugs", () => {
    expect(validateSlug("ab")).toBe(false);
    expect(validateSlug("dashboard")).toBe(false);
    expect(validateSlug("../admin")).toBe(false);
    expect(validateSlug("-bad")).toBe(false);
  });
  it("preserves user-authored content over imported project metadata", () => {
    const projects = mergeProjects(
      [{ id: "42", name: "repo", description: "GitHub description" }],
      [{ repositoryId: "42", description: "My curated project story" }]
    );
    expect(projects[0].description).toBe("My curated project story");
  });
});