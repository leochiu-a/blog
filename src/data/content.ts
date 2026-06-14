import type { Project } from "@/types/content";

export const profile = {
  name: "Leo Chiu",
  shortName: "Leo",
  professionalPhoto: "/images/leo.jpg",
  personalPhoto: "/images/leo.jpg",
};

export const about = {
  professional: ["Senior Frontend Engineer. Currently working at KKday."],
  personal: ["Trying to pay attention."],
};

export const projects: Project[] = [
  {
    title: "slidev-workspace",
    description:
      "Slidev Workspace is a specialized command-line tool designed to manage and showcase multiple Slidev presentations.",
    href: "https://github.com/leochiu-a/slidev-workspace",
    image: "https://opengraph.githubassets.com/1/leochiu-a/slidev-workspace",
  },
  {
    title: "git-pr-ai",
    description:
      "A CLI tool that empowers developers to create GitHub Pull Requests faster and more efficiently with the help of AI.",
    href: "https://github.com/leochiu-a/git-pr-ai",
    image: "https://opengraph.githubassets.com/1/leochiu-a/git-pr-ai",
  },
  {
    title: "elden-ring-github",
    description:
      "An Elden Ring–inspired Chrome extension that makes your GitHub workflow legendary.",
    href: "https://github.com/leochiu-a/elden-ring-github",
    image: "https://opengraph.githubassets.com/1/leochiu-a/elden-ring-github",
  },
  {
    title: "universal-agents",
    description: "The Lightest Shared Standard for AI Agents.",
    href: "https://github.com/leochiu-a/universal-agents",
    image: "https://opengraph.githubassets.com/1/leochiu-a/universal-agents",
  },
  {
    title: "simple-resume",
    description: "A online tool to create a resume.",
    href: "https://github.com/leochiu-a/simple-resume",
    image: "https://opengraph.githubassets.com/1/leochiu-a/simple-resume",
  },
];
