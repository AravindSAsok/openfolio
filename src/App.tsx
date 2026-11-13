import { useEffect, useMemo, useState } from "react";
import type { ButtonHTMLAttributes, Dispatch, SetStateAction } from "react";
import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, BadgeCheck, BookOpen, Check, Code2,
  ExternalLink, Github, Globe2, Layers3, LoaderCircle, LogOut, Palette, Plus,
  Rocket, Settings2, ShieldCheck, Sparkles, Trash2, UserRound, WandSparkles, X
} from "lucide-react";
import { api } from "./api";
import { emptyPortfolio, type PortfolioData, type Project, type RecordItem, type ThemeId } from "./types";

type MeResponse = {
  user: null | { login: string; name: string | null; avatarUrl: string | null };
  connected?: boolean;
  sync?: { lastSyncAt: number | null; nextSyncAt: number | null } | null;
  portfolio: null | { slug: string; isPublished: boolean; theme: ThemeId; data: PortfolioData };
};
type Repo = {
  repositoryId: string; name: string; fullName: string; description: string | null;
  htmlUrl: string; homepage: string | null; language: string | null; stars: number; forks: number; isArchived: number;
};

const navigation = [
  { id: "overview", label: "Overview", icon: Layers3 },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "projects", label: "Projects", icon: Code2 },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "experience", label: "Experience", icon: BookOpen },
  { id: "education", label: "Education", icon: BadgeCheck },
  { id: "certifications", label: "Certificates", icon: BadgeCheck },
  { id: "socialLinks", label: "Social links", icon: Globe2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "publish", label: "Publish", icon: Rocket },
  { id: "settings", label: "Settings", icon: Settings2 }
] as const;

const fields: Record<string, { key: string; label: string; placeholder: string }[]> = {
  experience: [
    { key: "role", label: "Role", placeholder: "Software Engineer" },
    { key: "company", label: "Company", placeholder: "Company or organization" },
    { key: "startDate", label: "Start date", placeholder: "2023" },
    { key: "endDate", label: "End date", placeholder: "Present" },
    { key: "description", label: "What you did", placeholder: "Describe your contribution" }
  ],
  education: [
    { key: "degree", label: "Qualification", placeholder: "B.Tech Computer Science" },
    { key: "school", label: "Institution", placeholder: "University or college" },
    { key: "startDate", label: "Start date", placeholder: "2020" },
    { key: "endDate", label: "End date", placeholder: "2024" },
    { key: "description", label: "Details", placeholder: "Optional details" }
  ],
  certifications: [
    { key: "name", label: "Certificate", placeholder: "AWS Certified Developer" },
    { key: "issuer", label: "Issuer", placeholder: "Issuing organization" },
    { key: "date", label: "Date", placeholder: "2025" },
    { key: "url", label: "Credential URL", placeholder: "https://..." }
  ],
  socialLinks: [
    { key: "label", label: "Platform", placeholder: "LinkedIn" },
    { key: "url", label: "URL", placeholder: "https://linkedin.com/in/..." }
  ]
};

function Button({ tone = "primary", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "soft" | "plain" }) {
  return <button {...props} type={type} className={"btn " + tone + " " + className} />;
}
function Field({ label, value, onChange, placeholder, multiline = false }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean;
}) {
  return <label className="field"><span>{label}</span>{multiline
    ? <textarea rows={4} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    : <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}</label>;
}
function RecordsEditor({ title, description, items, itemFields, onChange }: {
  title: string; description: string; items: RecordItem[];
  itemFields: { key: string; label: string; placeholder: string }[];
  onChange: (items: RecordItem[]) => void;
}) {
  function update(index: number, key: string, value: string) {
    onChange(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }
  return <section className="panel">
    <div className="panel-heading"><div><p className="eyebrow">YOUR STORY</p><h2>{title}</h2><p>{description}</p></div>
      <Button onClick={() => onChange([...items, { id: crypto.randomUUID() }])}><Plus size={15} /> Add entry</Button></div>
    {items.length === 0 ? <Empty title="Nothing here yet" text="Add your first entry. You can edit or remove it any time." /> :
      <div className="record-list">{items.map((item, index) => <article className="record-card" key={item.id || index}>
        <div className="record-top"><strong>Entry {index + 1}</strong><button className="icon-button danger" aria-label="Remove entry" onClick={() => onChange(items.filter((_, i) => i !== index))}><Trash2 size={15} /></button></div>
        <div className="field-grid">{itemFields.map((field) => <Field key={field.key} label={field.label} value={item[field.key] || ""} placeholder={field.placeholder} onChange={(value) => update(index, field.key, value)} />)}</div>
      </article>)}</div>}
  </section>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><div className="empty-icon"><Plus size={18} /></div><strong>{title}</strong><span>{text}</span></div>;
}
function move<T>(array: T[], from: number, to: number): T[] {
  const result = [...array];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}
function dateText(value?: number | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value * 1000)) : "Not synced yet";
}
function tabHelp(tab: string) {
  const messages: Record<string, string> = {
    profile: "The introduction that helps people understand who you are.",
    projects: "Choose the work you want the world to see.",
    skills: "Show the tools and technologies you use.",
    experience: "Give context to the work behind your projects.",
    education: "Share the learning that shaped your journey.",
    certifications: "Add credentials and certificates you have earned.",
    socialLinks: "Give visitors a way to find your work elsewhere.",
    appearance: "Make the same story feel like your own.",
    publish: "Preview, publish, and share your portfolio.",
    settings: "Your account, your data, your choice."
  };
  return messages[tab] || "Your developer portfolio workspace.";
}

export default function App() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [oauthEnabled, setOauthEnabled] = useState(false);
  const [data, setData] = useState<PortfolioData>(emptyPortfolio);
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState<ThemeId>("minimal");
  const [tab, setTab] = useState("overview");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [skillDraft, setSkillDraft] = useState("");
  const [projectDraft, setProjectDraft] = useState({ title: "", description: "", githubUrl: "", demoUrl: "", technologies: "" });

  function hydrate(result: MeResponse) {
    setMe(result);
    if (result.portfolio) {
      setData(result.portfolio.data);
      setSlug(result.portfolio.slug);
      setTheme(result.portfolio.theme);
    }
  }
  async function refresh() {
    const result = await api<MeResponse>("/api/me");
    hydrate(result);
  }
  useEffect(() => {
    Promise.all([api<{ githubOAuthEnabled: boolean }>("/api/config"), api<MeResponse>("/api/me")])
      .then(([config, result]) => { setOauthEnabled(config.githubOAuthEnabled); hydrate(result); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load Openfolio."))
      .finally(() => setLoading(false));
  }, []);

  const completion = useMemo(() => {
    const items = [!!data.profile.name, !!data.profile.headline, !!data.profile.bio, data.projects.length > 0, data.skills.length > 0, data.socialLinks.length > 0];
    return Math.round(items.filter(Boolean).length / items.length * 100);
  }, [data]);

  async function save(extra: Record<string, unknown> = {}) {
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await api<{ portfolio: { slug: string; isPublished: boolean; theme: ThemeId; data: PortfolioData } }>("/api/portfolio", {
        method: "PUT", body: JSON.stringify({ data, theme, slug, ...extra })
      });
      setMe((previous) => previous ? { ...previous, portfolio: result.portfolio } : previous);
      setMessage("Your changes are saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save changes.");
    } finally { setSaving(false); }
  }
  async function sync() {
    setSyncing(true); setError(""); setMessage("");
    try {
      const result = await api<{ imported: number; message: string }>("/api/sync", { method: "POST" });
      setMessage(result.message + " " + result.imported + " repositories found.");
      await loadRepos();
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "GitHub sync failed."); }
    finally { setSyncing(false); }
  }
  async function loadRepos() {
    try {
      const result = await api<{ repositories: Repo[] }>("/api/github/repos");
      setRepos(result.repositories);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load repositories."); }
  }
  function updateProfile(key: keyof PortfolioData["profile"], value: string) {
    setData((previous) => ({ ...previous, profile: { ...previous.profile, [key]: value } }));
  }
  function updateProject(projectId: string, patch: Partial<Project>) {
    setData((previous) => ({ ...previous, projects: previous.projects.map((project) => project.id === projectId ? { ...project, ...patch } : project) }));
  }
  function addRepo(repo: Repo) {
    if (data.projects.some((project) => project.githubUrl === repo.htmlUrl)) return;
    const project: Project = {
      id: crypto.randomUUID(), title: repo.name, description: repo.description || "",
      technologies: [repo.language].filter(Boolean) as string[], githubUrl: repo.htmlUrl,
      demoUrl: repo.homepage || "", imageUrl: "", featured: data.projects.length < 3, visible: true
    };
    setData((previous) => ({ ...previous, projects: [...previous.projects, project] }));
    setMessage("Project added. Save changes to keep it in your portfolio.");
  }
  function addProject() {
    if (!projectDraft.title.trim()) return;
    const project: Project = {
      id: crypto.randomUUID(), title: projectDraft.title.trim(), description: projectDraft.description.trim(),
      technologies: projectDraft.technologies.split(",").map((item) => item.trim()).filter(Boolean),
      githubUrl: projectDraft.githubUrl, demoUrl: projectDraft.demoUrl, imageUrl: "",
      featured: false, visible: true
    };
    setData((previous) => ({ ...previous, projects: [...previous.projects, project] }));
    setProjectDraft({ title: "", description: "", githubUrl: "", demoUrl: "", technologies: "" });
  }
  async function logout() {
    await api("/api/logout", { method: "POST" });
    setMe(null); setData(emptyPortfolio);
  }
  async function exportData() {
    const response = await fetch("/api/export");
    if (!response.ok) { setError("Could not export your portfolio."); return; }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "openfolio-export.json"; link.click();
    URL.revokeObjectURL(url);
  }
  async function deleteAccount() {
    if (!window.confirm("Delete your Openfolio account and all stored portfolio data? This cannot be undone.")) return;
    try {
      await api("/api/account", { method: "DELETE" });
      setMe(null); setData(emptyPortfolio); setMessage("Your account has been deleted.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete account."); }
  }
  function updateRecords(key: "experience" | "education" | "certifications" | "socialLinks", items: RecordItem[]) {
    setData((previous) => ({ ...previous, [key]: items }));
  }

  if (loading) return <div className="boot"><div className="brand-mark">of</div><span>Preparing your workspace…</span></div>;
  if (!me?.user) return <Landing oauthEnabled={oauthEnabled} error={error} />;

  const activeNav = navigation.find((item) => item.id === tab) || navigation[0];
  const ActiveIcon = activeNav.icon;
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">of</span><span>openfolio<small>YOUR WORK, IN FOCUS</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">{navigation.map((item) => {
        const Icon = item.icon;
        return <button key={item.id} className={tab === item.id ? "nav-item active" : "nav-item"} onClick={() => {
          setTab(item.id); setError("");
          if (item.id === "projects") void loadRepos();
        }}><Icon size={16} /><span>{item.label}</span>{item.id === "publish" && me.portfolio?.isPublished ? <span className="nav-live" /> : null}</button>;
      })}</nav>
      <div className="sidebar-bottom">
        <div className="account-chip"><img src={me.user.avatarUrl || ""} alt="" /><span><strong>{me.user.name || me.user.login}</strong><small>@{me.user.login}</small></span></div>
        <button className="nav-item" onClick={logout}><LogOut size={16} /><span>Sign out</span></button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="crumb">Workspace</span><span className="crumb-sep">/</span><ActiveIcon size={14} /><strong>{activeNav.label}</strong></div><div className="top-actions">
        {me.portfolio?.isPublished ? <a className="public-link" href={"/@" + slug} target="_blank" rel="noreferrer"><EyeIcon /> View site <ArrowUpRight size={14} /></a> : <span className="draft-pill">Draft portfolio</span>}
        <Button tone="soft" onClick={() => save()} disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />} Save changes</Button>
      </div></header>
      <div className="page-wrap">
        <div className="welcome-row"><div><p className="eyebrow">OPENFOLIO STUDIO</p><h1>{tab === "overview" ? "Your work, in focus." : activeNav.label}</h1><p className="page-subtitle">{tab === "overview" ? "Shape the story behind the code. Your portfolio stays yours." : tabHelp(tab)}</p></div><span className="sync-indicator"><span /> Connected to GitHub</span></div>
        {error ? <div className="notice error"><X size={16} />{error}<button onClick={() => setError("")}>Dismiss</button></div> : null}
        {message ? <div className="notice success"><Check size={16} />{message}<button onClick={() => setMessage("")}>Dismiss</button></div> : null}

        {tab === "overview" ? <div className="overview-grid">
          <section className="panel welcome-panel"><div className="welcome-copy"><span className="micro-label">YOUR PORTFOLIO</span><h2>Make your next<br /><em>opportunity</em> easier to find.</h2><p>Build a home for your projects, experience, and ideas. No templates to code and no subscription to pay.</p><div className="button-row"><Button onClick={() => setTab("profile")}>Continue editing <ArrowRight size={15} /></Button><Button tone="plain" onClick={sync} disabled={syncing}>{syncing ? <LoaderCircle size={15} className="spin" /> : <Github size={15} />} Sync GitHub</Button></div></div><div className="orbital-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core">of<span>✳</span></div><div className="orbit-caption">BUILD · SHOW · GROW</div></div></section>
          <section className="panel completion-panel"><div className="panel-heading"><div><p className="eyebrow">PROFILE HEALTH</p><h2>{completion}% complete</h2></div><span className="completion-icon"><WandSparkles size={17} /></span></div><div className="progress"><span style={{ width: completion + "%" }} /></div><p className="muted">A complete profile gives visitors a clearer picture of your work.</p><div className="checklist">{[["Add your headline", !!data.profile.headline], ["Write a short bio", !!data.profile.bio], ["Feature a project", data.projects.length > 0], ["Add your skills", data.skills.length > 0], ["Add a social link", data.socialLinks.length > 0]].map(([label, done]) => <div key={String(label)}><span className={done ? "check done" : "check"}>{done ? <Check size={11} /> : null}</span>{label}</div>)}</div></section>
          <section className="panel stat-panel"><div><p className="eyebrow">GITHUB SYNC</p><h3>{dateText(me.sync?.lastSyncAt)}</h3><p className="muted">Last successful sync</p></div><Button tone="soft" onClick={sync} disabled={syncing}>{syncing ? <LoaderCircle size={15} className="spin" /> : <ArrowDown size={15} />} Sync now</Button></section>
          <section className="panel stat-panel"><div><p className="eyebrow">PUBLIC ADDRESS</p><h3 className="slug-label">/@{slug || me.user.login}</h3><p className="muted">{me.portfolio?.isPublished ? "Your portfolio is visible to everyone." : "Publish when you're ready to share."}</p></div><Button tone="soft" onClick={() => setTab("publish")}>{me.portfolio?.isPublished ? "Manage site" : "Publish"} <ArrowRight size={15} /></Button></section>
        </div> : null}

        {tab === "profile" ? <section className="panel"><div className="panel-heading"><div><p className="eyebrow">THE INTRODUCTION</p><h2>Tell people who you are.</h2><p>This is the first thing visitors learn about you.</p></div><div className="avatar-preview">{data.profile.avatarUrl ? <img src={data.profile.avatarUrl} alt="" /> : <UserRound />}</div></div><div className="field-grid">
          <Field label="Display name" value={data.profile.name} onChange={(value) => updateProfile("name", value)} placeholder="Your name" />
          <Field label="Headline" value={data.profile.headline} onChange={(value) => updateProfile("headline", value)} placeholder="Backend engineer · Building useful things" />
          <Field label="Location" value={data.profile.location} onChange={(value) => updateProfile("location", value)} placeholder="City, Country (optional)" />
          <Field label="Avatar image URL" value={data.profile.avatarUrl} onChange={(value) => updateProfile("avatarUrl", value)} placeholder="https://..." />
          <Field label="About you" value={data.profile.bio} onChange={(value) => updateProfile("bio", value)} placeholder="A short introduction and what you enjoy building." multiline />
        </div><div className="form-footer"><span className="muted">Your profile is only public after you publish.</span><Button onClick={() => save()} disabled={saving}>Save profile</Button></div></section> : null}

        {tab === "projects" ? <div className="stack">
          <section className="panel"><div className="panel-heading"><div><p className="eyebrow">FROM YOUR GITHUB</p><h2>Bring your best work forward.</h2><p>Import public repositories, then refine the story for each project.</p></div><Button tone="soft" onClick={sync} disabled={syncing}>{syncing ? <LoaderCircle size={15} className="spin" /> : <Github size={15} />} Sync repositories</Button></div>
            {repos.length === 0 ? <Empty title="No repositories imported yet" text="Sync your public GitHub repositories to choose projects." /> :
              <div className="repo-grid">{repos.filter((repo) => !data.projects.some((project) => project.githubUrl === repo.htmlUrl)).map((repo) => <div className="repo-card" key={repo.repositoryId}><div className="repo-title"><Github size={15} /><strong>{repo.name}</strong>{repo.isArchived ? <span className="tag">Archived</span> : null}</div><p>{repo.description || "No repository description yet."}</p><div className="repo-meta"><span>{repo.language || "Code"}</span><span>★ {repo.stars}</span><span>⑂ {repo.forks}</span></div><Button tone="soft" onClick={() => addRepo(repo)}><Plus size={14} /> Add to portfolio</Button></div>)}</div>}
          </section>
          <section className="panel"><div className="panel-heading"><div><p className="eyebrow">MANUAL PROJECT</p><h2>Add a project</h2><p>Include work that isn't represented by a public repository.</p></div></div><div className="field-grid">
            <Field label="Project title" value={projectDraft.title} onChange={(value) => setProjectDraft({ ...projectDraft, title: value })} placeholder="Project name" />
            <Field label="Technologies" value={projectDraft.technologies} onChange={(value) => setProjectDraft({ ...projectDraft, technologies: value })} placeholder="TypeScript, Node.js, PostgreSQL" />
            <Field label="GitHub URL" value={projectDraft.githubUrl} onChange={(value) => setProjectDraft({ ...projectDraft, githubUrl: value })} placeholder="https://github.com/..." />
            <Field label="Live demo URL" value={projectDraft.demoUrl} onChange={(value) => setProjectDraft({ ...projectDraft, demoUrl: value })} placeholder="https://..." />
            <Field label="Description" value={projectDraft.description} onChange={(value) => setProjectDraft({ ...projectDraft, description: value })} placeholder="What does this project do?" multiline />
          </div><div className="form-footer"><span className="muted">Add it first, then edit it below.</span><Button onClick={addProject} disabled={!projectDraft.title.trim()}><Plus size={14} /> Add project</Button></div></section>
          <section className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR PORTFOLIO</p><h2>Selected projects ({data.projects.length})</h2><p>Feature your strongest projects and control what visitors see.</p></div></div>
            {data.projects.length === 0 ? <Empty title="No projects selected" text="Add repositories or create a manual project above." /> :
              <div className="project-edit-list">{data.projects.map((project, index) => <article className="project-edit-card" key={project.id}>
                <div className="project-edit-top"><div><strong>{project.title || "Untitled project"}</strong><span>{project.technologies.join(" · ") || "No technologies added"}</span></div><div className="inline-actions">
                  <button className="icon-button" disabled={index === 0} onClick={() => setData({ ...data, projects: move(data.projects, index, index - 1) })} aria-label="Move up"><ArrowUp size={14} /></button>
                  <button className="icon-button" disabled={index === data.projects.length - 1} onClick={() => setData({ ...data, projects: move(data.projects, index, index + 1) })} aria-label="Move down"><ArrowDown size={14} /></button>
                  <button className="icon-button danger" onClick={() => setData({ ...data, projects: data.projects.filter((item) => item.id !== project.id) })} aria-label="Delete project"><Trash2 size={14} /></button>
                </div></div>
                <div className="field-grid"><Field label="Title" value={project.title} onChange={(value) => updateProject(project.id, { title: value })} /><Field label="Technologies (comma separated)" value={project.technologies.join(", ")} onChange={(value) => updateProject(project.id, { technologies: value.split(",").map((item) => item.trim()).filter(Boolean) })} /><Field label="Description" value={project.description} onChange={(value) => updateProject(project.id, { description: value })} multiline /><Field label="Demo URL" value={project.demoUrl} onChange={(value) => updateProject(project.id, { demoUrl: value })} placeholder="https://..." /></div>
                <div className="project-controls"><label><input type="checkbox" checked={project.featured} onChange={(event) => updateProject(project.id, { featured: event.target.checked })} /> Featured</label><label><input type="checkbox" checked={project.visible} onChange={(event) => updateProject(project.id, { visible: event.target.checked })} /> Visible on site</label></div>
              </article>)}</div>}
          </section>
        </div> : null}

        {tab === "skills" ? <section className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR TOOLKIT</p><h2>Skills & technologies.</h2><p>Add tools and technologies you can confidently talk about.</p></div></div><form className="skill-add" onSubmit={(event) => { event.preventDefault(); const skill = skillDraft.trim(); if (skill && !data.skills.includes(skill)) setData({ ...data, skills: [...data.skills, skill] }); setSkillDraft(""); }}><input value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} placeholder="Add a skill, e.g. TypeScript" /><Button type="submit" disabled={!skillDraft.trim()}><Plus size={14} /> Add skill</Button></form><div className="skill-cloud">{data.skills.map((skill) => <span className="skill-chip" key={skill}>{skill}<button aria-label={"Remove " + skill} onClick={() => setData({ ...data, skills: data.skills.filter((item) => item !== skill) })}><X size={13} /></button></span>)}</div>{data.skills.length === 0 ? <Empty title="Your skills will appear here" text="Add the technologies you use most confidently." /> : null}</section> : null}

        {["experience", "education", "certifications", "socialLinks"].includes(tab) ? <RecordsEditor
          title={navigation.find((item) => item.id === tab)?.label || tab}
          description={tabHelp(tab)}
          items={data[tab as keyof PortfolioData] as RecordItem[]}
          itemFields={fields[tab]}
          onChange={(items) => updateRecords(tab as "experience" | "education" | "certifications" | "socialLinks", items)}
        /> : null}

        {tab === "appearance" ? <section className="panel"><div className="panel-heading"><div><p className="eyebrow">A DIFFERENT POINT OF VIEW</p><h2>Choose your look.</h2><p>All themes use the same content. Switch whenever you like.</p></div></div><div className="theme-grid">{themeCards.map((item) => <button key={item.id} className={"theme-card " + (theme === item.id ? "selected" : "")} onClick={() => setTheme(item.id)}><ThemeArt theme={item.id} /><div className="theme-card-footer"><span><strong>{item.name}</strong><small>{item.description}</small></span><span className="radio-dot">{theme === item.id ? <Check size={12} /> : null}</span></div></button>)}</div><div className="form-footer"><span className="muted">Theme changes never modify your portfolio content.</span><Button onClick={() => save()}>Save appearance</Button></div></section> : null}

        {tab === "publish" ? <section className="panel"><div className="panel-heading"><div><p className="eyebrow">MAKE IT PUBLIC</p><h2>Your portfolio, one link away.</h2><p>Publish when the introduction and projects are ready to share.</p></div><span className={me.portfolio?.isPublished ? "status-live" : "status-draft"}>{me.portfolio?.isPublished ? "LIVE" : "DRAFT"}</span></div><div className="publish-card">
          <label className="field"><span>Portfolio URL slug</span><div className="slug-input"><span>/@</span><input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /></div></label>
          <div className="url-preview"><Globe2 size={16} /><span>{window.location.origin}/@{slug || "your-name"}</span><button onClick={() => navigator.clipboard?.writeText(window.location.origin + "/@" + slug)} aria-label="Copy portfolio URL"><ExternalLink size={15} /></button></div>
          <label className="toggle-row"><span><strong>Publish portfolio</strong><small>Anyone with the link can view the information you selected.</small></span><input type="checkbox" checked={Boolean(me.portfolio?.isPublished)} onChange={(event) => void save({ isPublished: event.target.checked })} /></label>
          <div className="privacy-note"><ShieldCheck size={18} /><span>Only the sections you add to your portfolio are displayed. Your email and GitHub credentials are never published by default.</span></div>
        </div><div className="form-footer"><span className="muted">Public pages are served at /@your-username.</span><Button onClick={() => save()} disabled={saving}>Save publishing settings</Button></div></section> : null}

        {tab === "settings" ? <div className="stack"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h2>Keep control of your data.</h2><p>Export your portfolio or delete your Openfolio account.</p></div></div><div className="settings-row"><div><strong>Connected GitHub account</strong><span>@{me.user.login} · Public profile access</span></div><span className="status-live">CONNECTED</span></div><div className="settings-row"><div><strong>Export portfolio data</strong><span>Download your profile, portfolio content, and imported repository data.</span></div><Button tone="soft" onClick={exportData}>Export JSON <ArrowDown size={15} /></Button></div></section><section className="panel danger-zone"><p className="eyebrow">DANGER ZONE</p><h2>Delete your account</h2><p className="muted">This removes Openfolio data and uploaded assets. It does not affect your GitHub account or repositories.</p><Button tone="plain" onClick={deleteAccount}>Delete Openfolio account <Trash2 size={14} /></Button></section></div> : null}
        <footer className="app-footer"><span>Openfolio · Free and open source</span><a href="https://github.com/AravindSAsok/openfolio" target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a></footer>
      </div>
    </main>
  </div>;
}

function EyeIcon() { return <span aria-hidden="true">◉</span>; }
const themeCards: { id: ThemeId; name: string; description: string }[] = [
  { id: "minimal", name: "Minimal", description: "Quiet, clear, and professional" },
  { id: "terminal", name: "Terminal", description: "A technical point of view" },
  { id: "editorial", name: "Editorial", description: "Expressive type and warm structure" }
];

function ThemeArt({ theme }: { theme: ThemeId }) {
  return <div className={"theme-art " + theme}><div className="art-bar" /><div className="art-title" /><div className="art-line" /><div className="art-projects"><i /><i /><i /></div></div>;
}

function Landing({ oauthEnabled, error }: { oauthEnabled: boolean; error: string }) {
  return <div className="landing">
    <header className="landing-nav"><a className="brand" href="/"><span className="brand-mark">of</span><span>openfolio<small>YOUR WORK, IN FOCUS</small></span></a><a className="nav-source" href="https://github.com/AravindSAsok/openfolio" target="_blank" rel="noreferrer"><Github size={16} /> Open source</a></header>
    <main>
      <section className="hero-landing"><div className="hero-copy"><span className="announcement"><span /> FREE. OPEN SOURCE. YOURS.</span><h1>Your work deserves<br /><em>a better place.</em></h1><p>Turn your public GitHub work into a thoughtful developer portfolio. Shape your story, choose your style, and share it with the world.</p><div className="hero-actions">{oauthEnabled ? <a className="btn primary" href="/api/auth/github"><Github size={17} /> Continue with GitHub <ArrowRight size={16} /></a> : <span className="btn disabled"><Github size={17} /> GitHub sign-in <ArrowRight size={16} /></span>}<a className="btn plain" href="#how-it-works">See how it works <ArrowDown size={15} /></a></div>{!oauthEnabled ? <p className="setup-hint">GitHub sign-in is waiting for the owner to configure OAuth. See the setup guide in the repository.</p> : null}{error ? <p className="landing-error">{error}</p> : null}<div className="hero-proof"><span><Check size={14} /> No subscription</span><span><Check size={14} /> No paid themes</span><span><Check size={14} /> Your data stays yours</span></div></div>
        <div className="hero-visual"><div className="visual-glow" /><div className="browser-card"><div className="browser-top"><span /><span /><span /><small>openfolio / preview</small></div><div className="preview-page"><div className="preview-aside"><div className="preview-avatar">A</div><div className="preview-mini-line" /><div className="preview-mini-line short" /><div className="preview-tags"><i /><i /><i /></div></div><div className="preview-main"><span className="preview-kicker">DEVELOPER PORTFOLIO</span><div className="preview-name">Build with<br /><em>intention.</em></div><div className="preview-copy" /><div className="preview-copy tiny" /><div className="preview-work"><div /><div /><div /></div></div></div></div><div className="floating-badge badge-code"><Code2 size={15} /> Public GitHub work</div><div className="floating-badge badge-theme"><Palette size={15} /> Three free themes</div><div className="floating-dot">✳</div></div>
      </section>
      <section id="how-it-works" className="how-section"><div className="section-intro"><p className="eyebrow">A SIMPLE WAY TO GET THERE</p><h2>From repositories to<br /><em>real opportunities.</em></h2></div><div className="steps-grid"><article><span className="step-number">01</span><div className="step-icon"><Github /></div><h3>Connect GitHub</h3><p>Import your public profile and repositories. Private work stays private.</p></article><article><span className="step-number">02</span><div className="step-icon"><WandSparkles /></div><h3>Make it yours</h3><p>Choose projects, write your story, add experience, and find a theme that fits.</p></article><article><span className="step-number">03</span><div className="step-icon"><Rocket /></div><h3>Share your work</h3><p>Publish a portfolio link and keep public GitHub information in sync.</p></article></div></section>
      <section className="themes-section"><div className="section-intro"><p className="eyebrow">ONE STORY, THREE EXPRESSIONS</p><h2>Find your <em>point of view.</em></h2><p>Every theme is free. Switch any time without losing your content.</p></div><div className="landing-theme-grid">{themeCards.map((theme) => <div className="landing-theme" key={theme.id}><ThemeArt theme={theme.id} /><strong>{theme.name}</strong><span>{theme.description}</span></div>)}</div></section>
      <section className="open-section"><div><p className="eyebrow">BUILT IN THE OPEN</p><h2>A portfolio platform<br />without the paywall.</h2><p>Openfolio is free software you can inspect, improve, and host yourself. No premium themes. No locked core features. No surprise subscriptions.</p><a className="btn dark-btn" href="https://github.com/AravindSAsok/openfolio" target="_blank" rel="noreferrer">Explore the repository <ArrowUpRight size={16} /></a></div><div className="open-stamp"><span>FREE</span><strong>AS IN<br />FREEDOM</strong><small>AGPL-3.0-OR-LATER</small></div></section>
    </main><footer className="landing-footer"><a className="brand" href="/"><span className="brand-mark">of</span><span>openfolio<small>YOUR WORK, IN FOCUS</small></span></a><span>Made for the work you want people to see.</span><a href="https://github.com/AravindSAsok/openfolio">GitHub <ArrowUpRight size={13} /></a></footer>
  </div>;
}
