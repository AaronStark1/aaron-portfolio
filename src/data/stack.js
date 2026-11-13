/**
 * Technologies in "What I work with" on /about. Data only, no presentation.
 *
 * Every entry is backed by something already public on this site, checked
 * against the sources on 2026-11-11, and nothing is listed on hearsay:
 * `basis` names the evidence (it is not rendered). The About copy covers
 * .NET and Next.js; the rest come from the package.json of a project on
 * /projects or of this site. Docker, Spring Boot and similar tools don't
 * appear in any of them, so they are left out on purpose.
 *
 * `description` is one short line in the statement voice; *asterisks* mark the
 * phrase set in italics. Keep each under ~70 characters so the line count, and
 * with it the section height, stays put while the names rotate.
 */
export const stack = [
  {
    id: "dotnet",
    name: ".NET",
    description: "Scalable, maintainable systems, shaped by DDD and *vertical slices*.",
    basis: "About copy and the Home role line (.NET with DDD and Vertical Slice Architecture at Bytestrone)",
  },
  {
    id: "nextjs",
    name: "Next.js",
    description: "Frontends alongside .NET, and the *El Conceptz* studio site.",
    basis: "About copy (.NET and Next.js at work); El Conceptz package.json (next 16.3.4)",
  },
  {
    id: "react",
    name: "React",
    description: "Interactive interfaces, from DEVentHub to *this very page*.",
    basis: "This site, DEVentHub's frontend, SpecShield QA and Gotta Match 'Em All (react 19)",
  },
  {
    id: "typescript",
    name: "TypeScript",
    description: "Typed codebases for El Conceptz and *SpecShield QA*.",
    basis: "El Conceptz and SpecShield QA package.json (typescript 5) and their .ts/.tsx sources",
  },
  {
    id: "nodejs",
    name: "Node.js",
    description: "APIs on Express and Hono, from Stripe checkout to *local AI agents*.",
    basis: "DEVentHub's backend (express 5, stripe); SpecShield QA's server (hono, @mastra/core)",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "DEVentHub’s events and users, modelled with *Mongoose*.",
    basis: "DEVentHub's backend (mongoose 9, event and user models); MongoDB credential on /achievements",
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    description: "Utility-first styling for this site, El Conceptz and *DEVentHub*.",
    basis: "This site and El Conceptz (tailwindcss 4); DEVentHub's frontend (tailwindcss 3)",
  },
  {
    id: "motion",
    name: "Motion",
    description: "Every transition on this site, *including this one*.",
    basis: "This site (motion 13) and DEVentHub's frontend (motion 12)",
  },
];
