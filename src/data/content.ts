import type { Project, SocialLink } from "@/types/content";

export const profile = {
  name: "Leo Chiu",
  shortName: "Leo",
  professionalPhoto: "/images/leo.webp",
  personalPhoto: "/images/leo.webp",
};

/**
 * The author entity, in one place.
 *
 * Every post renders this as a byline bio and emits it as schema.org `Person`,
 * so "who wrote this and why should you believe them" is answerable by a reader
 * and by a crawler from any post, not only from the home page.
 */
export const author = {
  name: "Leo Chiu",
  jobTitle: "Senior Software Engineer",
  company: "KKday",
  photo: "/images/leo.webp",
  bio: "資深軟體工程師，任職於 KKday Growth Team，主導網站 SEO / AEO（AI 搜尋優化）策略落地。平常在團隊裡推動 AI agent 的開發流程與效能優化。",
};

/**
 * The newsletter's own words, written once.
 *
 * The subscribe page and the foot of every Issue both make the same offer, and
 * a pitch that reads differently depending on which page you met it on is a
 * pitch nobody wrote on purpose. `pitch` is split where it may wrap: Chinese
 * breaks per character, so each piece is set inline-block and a line can only
 * break in the gaps between them.
 */
export const newsletter = {
  headline: "工程上真的踩過的東西",
  pitch: ["每兩週，分享寫作與所見。", "每天進步一點點，", "一起在終點遇見更好的自己。"],
  unsubscribe: "隨時可以退訂，一鍵，不會問你為什麼。",
};

export const about = {
  professional: ["Senior Software Engineer. Currently working at KKday."],
  personal: ["下班之後，想的都是些無關緊要的小事。"],
};

// Ordered by how actively I post there — the footer renders this list as-is,
// and every href doubles as a schema.org `sameAs` entry on the home page.
export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/leochiu-a" },
  { label: "Threads", href: "https://www.threads.com/@leo.web.dev" },
  { label: "Instagram", href: "https://www.instagram.com/leo.web.dev/" },
  { label: "Medium", href: "https://airwaves.medium.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/leochiu-frontend-engineer/" },
  { label: "CodePen", href: "https://codepen.io/leochiu-a" },
];

export const projects: Project[] = [
  {
    title: "CodeReel",
    description:
      "Turns your code into short, polished walkthroughs — animate every highlight, share every step.",
    live: "https://www.codereel.dev",
    image: "/images/projects/code-reel.webp",
    video: "/images/projects/code-reel.mp4",
  },
  {
    title: "slidev-workspace",
    description:
      "Slidev Workspace is a specialized command-line tool designed to manage and showcase multiple Slidev presentations.",
    github: "https://github.com/leochiu-a/slidev-workspace",
    image: "https://opengraph.githubassets.com/1/leochiu-a/slidev-workspace",
  },
  {
    title: "git-pr-ai",
    description:
      "A CLI tool that empowers developers to create GitHub Pull Requests faster and more efficiently with the help of AI.",
    github: "https://github.com/leochiu-a/git-pr-ai",
    image: "https://opengraph.githubassets.com/1/leochiu-a/git-pr-ai",
  },
  {
    title: "elden-ring-github",
    description:
      "An Elden Ring–inspired Chrome extension that makes your GitHub workflow legendary.",
    github: "https://github.com/leochiu-a/elden-ring-github",
    image: "/images/projects/elden-ring-github-cover.webp",
    video: "/images/projects/elden-ring-github.mp4",
  },
  {
    title: "universal-agents",
    description: "The Lightest Shared Standard for AI Agents.",
    github: "https://github.com/leochiu-a/universal-agents",
    image: "https://opengraph.githubassets.com/1/leochiu-a/universal-agents",
  },
  {
    title: "open-resume",
    description: "A online tool to create a resume.",
    github: "https://github.com/leochiu-a/open-resume",
    image: "https://opengraph.githubassets.com/1/leochiu-a/open-resume",
  },
];
