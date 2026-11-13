type RecordValue = Record<string, any>;

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[character] || character;
  });
}

function safeUrl(value: unknown): string {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:" ? escapeHtml(url.toString()) : "#";
  } catch {
    return "#";
  }
}

function section(title: string, body: string): string {
  return body ? '<section class="section"><p class="eyebrow">' + escapeHtml(title) + '</p>' + body + '</section>' : "";
}

export function renderPortfolioHtml(input: { slug: string; theme: string; data: RecordValue; baseUrl: string }): string {
  const data = input.data || {};
  const profile = data.profile || {};
  const projects = Array.isArray(data.projects) ? data.projects.filter((project: RecordValue) => project && project.visible !== false) : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const certifications = Array.isArray(data.certifications) ? data.certifications : [];
  const socialLinks = Array.isArray(data.socialLinks) ? data.socialLinks : [];
  const name = profile.name || input.slug;
  const headline = profile.headline || "Developer";
  const bio = profile.bio || "A developer sharing projects, skills, and experience.";
  const theme = ["minimal", "terminal", "editorial"].includes(input.theme) ? input.theme : "minimal";
  const projectMarkup = projects.map((project: RecordValue) => {
    const tags = Array.isArray(project.technologies) ? project.technologies : [];
    const links = (project.githubUrl ? '<a href="' + safeUrl(project.githubUrl) + '" target="_blank" rel="noopener noreferrer">Source ↗</a>' : "") +
      (project.demoUrl ? '<a href="' + safeUrl(project.demoUrl) + '" target="_blank" rel="noopener noreferrer">Live demo ↗</a>' : "");
    return '<article class="project"><div class="project-top"><span class="dot"></span><span>' + escapeHtml(tags.slice(0, 4).join(" · ")) + '</span></div><h3>' + escapeHtml(project.title || "Untitled project") + '</h3><p>' + escapeHtml(project.description || "") + '</p><div class="project-links">' + links + '</div></article>';
  }).join("");
  const experienceMarkup = experience.map((item: RecordValue) => '<article class="list-item"><h3>' + escapeHtml(item.role || "Experience") + '</h3><p>' + escapeHtml([item.company, item.startDate, item.endDate || (item.current ? "Present" : "")].filter(Boolean).join(" · ")) + '</p><div>' + escapeHtml(item.description || "") + '</div></article>').join("");
  const educationMarkup = education.map((item: RecordValue) => '<article class="list-item"><h3>' + escapeHtml(item.degree || "Education") + '</h3><p>' + escapeHtml([item.school, item.startDate, item.endDate].filter(Boolean).join(" · ")) + '</p><div>' + escapeHtml(item.description || "") + '</div></article>').join("");
  const certificationMarkup = certifications.map((item: RecordValue) => '<article class="list-item"><h3>' + escapeHtml(item.name || "Certification") + '</h3><p>' + escapeHtml([item.issuer, item.date].filter(Boolean).join(" · ")) + '</p></article>').join("");
  const socialsMarkup = socialLinks.map((item: RecordValue) => '<a href="' + safeUrl(item.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.label || "Link") + ' ↗</a>').join("");
  const skillsMarkup = skills.map((skill: unknown) => '<span class="skill">' + escapeHtml(typeof skill === "string" ? skill : (skill as RecordValue).name) + '</span>').join("");
  const avatar = profile.avatarUrl
    ? '<img class="avatar" src="' + safeUrl(profile.avatarUrl) + '" alt="' + escapeHtml(name) + ' portrait">'
    : '<div class="avatar avatar-fallback">' + escapeHtml(String(name).slice(0, 1).toUpperCase()) + '</div>';
  const pageTitle = String(data.seoTitle || name + " — " + headline);
  const description = String(data.seoDescription || bio).slice(0, 220);
  const canonical = input.baseUrl + "/@" + encodeURIComponent(input.slug);

  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(pageTitle) + '</title><meta name="description" content="' + escapeHtml(description) + '"><link rel="canonical" href="' + escapeHtml(canonical) + '"><meta property="og:title" content="' + escapeHtml(pageTitle) + '"><meta property="og:description" content="' + escapeHtml(description) + '"><meta property="og:type" content="profile"><meta property="og:url" content="' + escapeHtml(canonical) + '"><meta name="theme-color" content="#111318"><style>' +
    '*,*::before,*::after{box-sizing:border-box}body{margin:0;background:#f6f5f1;color:#191a1c;font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.65}.wrap{max-width:1000px;margin:auto;padding:72px 28px 100px}.hero{padding-bottom:64px;border-bottom:1px solid #d9d8d2}.avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;margin-bottom:24px}.avatar-fallback{display:grid;place-items:center;background:#191a1c;color:white;font-size:30px}.eyebrow{font:600 11px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#777;margin:0 0 18px}.hero h1{font-size:clamp(42px,8vw,82px);letter-spacing:-.07em;line-height:.98;margin:0 0 16px}.headline{font-size:clamp(18px,3vw,25px);color:#64645f;margin:0 0 16px}.bio{max-width:660px;color:#555650;font-size:17px}.section{padding:48px 0;border-bottom:1px solid #deddd7}.project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.project,.list-item{background:#fff;border:1px solid #e6e4dc;border-radius:18px;padding:24px}.project h3,.list-item h3{font-size:20px;letter-spacing:-.03em;margin:12px 0 8px}.project p,.list-item p,.list-item div{color:#686862;margin:0 0 12px}.project-top{display:flex;align-items:center;gap:9px;color:#898980;font:11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}.dot{width:7px;height:7px;border-radius:50%;background:#8a9a70}.project-links,.socials{display:flex;flex-wrap:wrap;gap:14px}.project-links a,.socials a{color:#345d4d;text-decoration:none;font-size:13px;font-weight:650}.skills{display:flex;flex-wrap:wrap;gap:9px}.skill{border:1px solid #d9d8d2;border-radius:999px;padding:7px 13px;font-size:13px}.footer{padding-top:28px;color:#9a9991;font:11px ui-monospace,monospace}.theme-terminal{background:#0b1110;color:#d8ffe7}.theme-terminal .hero,.theme-terminal .section{border-color:#20342b}.theme-terminal .eyebrow,.theme-terminal .project-top{color:#78ad8d}.theme-terminal .headline,.theme-terminal .bio,.theme-terminal .project p,.theme-terminal .list-item p,.theme-terminal .list-item div{color:#9cb8a6}.theme-terminal .project,.theme-terminal .list-item{background:#101b17;border-color:#234333}.theme-terminal .skill{border-color:#345741}.theme-terminal .project-links a,.theme-terminal .socials a{color:#9df0b5}.theme-editorial{background:#eee6d8;color:#33251f}.theme-editorial .hero h1{font-family:Georgia,serif;font-weight:400;letter-spacing:-.06em}.theme-editorial .project,.theme-editorial .list-item{background:#faf6ed;border-color:#d8c8ae}.theme-editorial .dot{background:#d9784d}.theme-editorial .project-links a,.theme-editorial .socials a{color:#9a492d}@media(max-width:680px){.wrap{padding:42px 20px 64px}.project-grid{grid-template-columns:1fr}.section{padding:34px 0}.project,.list-item{padding:20px}}' +
    '</style></head><body class="theme-' + theme + '"><main class="wrap"><header class="hero">' + avatar + '<p class="eyebrow">' + escapeHtml(profile.location || "Developer portfolio") + '</p><h1>' + escapeHtml(name) + '</h1><p class="headline">' + escapeHtml(headline) + '</p><p class="bio">' + escapeHtml(bio) + '</p></header>' +
    section("Selected work", projectMarkup ? '<div class="project-grid">' + projectMarkup + '</div>' : "") +
    section("Skills", skillsMarkup ? '<div class="skills">' + skillsMarkup + '</div>' : "") +
    section("Experience", experienceMarkup) + section("Education", educationMarkup) +
    section("Certifications", certificationMarkup) + section("Find me elsewhere", socialsMarkup ? '<div class="socials">' + socialsMarkup + '</div>' : "") +
    '<footer class="footer">MADE WITH OPENFOLIO · <a href="' + escapeHtml(input.baseUrl) + '" style="color:inherit">Create your own portfolio</a></footer></main></body></html>';
}