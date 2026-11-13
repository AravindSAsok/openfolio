export type ThemeId = "minimal" | "terminal" | "editorial";

export type Project = {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  demoUrl: string;
  imageUrl: string;
  featured: boolean;
  visible: boolean;
};

export type RecordItem = { id: string; [key: string]: string };

export type PortfolioData = {
  profile: { name: string; headline: string; bio: string; avatarUrl: string; location: string };
  projects: Project[];
  skills: string[];
  experience: RecordItem[];
  education: RecordItem[];
  certifications: RecordItem[];
  socialLinks: RecordItem[];
  seoTitle?: string;
  seoDescription?: string;
};

export const emptyPortfolio: PortfolioData = {
  profile: { name: "", headline: "Developer", bio: "", avatarUrl: "", location: "" },
  projects: [], skills: [], experience: [], education: [], certifications: [], socialLinks: []
};