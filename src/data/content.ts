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
    title: "One More Multiverse",
    description:
      "A YC backed gaming company that I ran for 5 years. We scaled to over a million users, went viral on tiktok.",
    href: "https://www.playmultiverse.com",
    image: "/images/multiverse.jpg",
  },
  {
    title: "LatentLit",
    description: "A tool for creating and sharing LLM-powered AI agents.",
    href: "https://latentlit.goodfire.ai",
    image: "/images/latentlit.gif",
  },
  {
    title: "Quick Edit",
    description: "AI Copyediting with great UX.",
    href: "https://quickedits.thariq.io",
    image: "/images/quickedit.gif",
  },
  {
    title: "Sherpa",
    description: "An email agent that prioritizes your emails based on your contacts and goals.",
    href: "/blog/sherpa",
    image: "/images/sherpa.jpeg",
    tags: ["Prototype"],
  },
  {
    title: "AI World Building",
    description: "An experiment in AI-aided world building for roleplaying games.",
    href: "/blog/worldbuilding",
    image: "/images/worldbuilding.png",
    tags: ["Prototype"],
  },
  {
    title: "Edgeout.gg",
    description: "A bootstrapped gaming analytics platform I made. Sold to blitz.gg",
    href: "https://blitz.gg",
    image: "/images/edgeout.png",
    tags: ["Acquisition"],
  },
  {
    title: "Pubpub.org",
    description: "A non-profit academic publishing platform that I co-founded.",
    href: "https://pubpub.org",
    image: "/images/pubpub.jpeg",
  },
  {
    title: "Chime",
    description: "A startup that I co-founded in undergrad and was acquired by Hubspot.",
    href: "https://techcrunch.com/2013/03/28/hubspot-acquires-chime-prepwork/",
    image: "/images/chime.png",
    tags: ["Acquisition"],
    hn: {
      href: "https://news.ycombinator.com/item?id=5176630",
      points: 161,
      comments: 116,
    },
  },
];
