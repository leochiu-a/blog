import type { Project, SocialLink } from "@/types/content";

export const profile = {
  name: "Leo Chiu",
  shortName: "Leo",
  professionalPhoto: "/images/leo.webp",
  personalPhoto: "/images/leo.webp",
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
