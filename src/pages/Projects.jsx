import { motion as Motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import Sheet from "../components/Sheet";
import RevealLink from "../components/RevealLink";
import { TitleLine, TitleText } from "../components/TitleLines";
import { EASE, fadeChild, riseChild, useFontsReady, useMediaQuery } from "../lib/motion";
import { projectsData } from "../data/projects";
import "../styles/projects.css";

/* Editorial rhythm for the five tiles: two asymmetric splits, one full-width
   band with a stacked caption, then a side-by-side pair. */
const LAYOUT = [
  { tone: "cream", kind: "split-right" },
  { tone: "ochre", kind: "split-left" },
  { tone: "ink", kind: "wide" },
  { tone: "brick", kind: "half-left" },
  { tone: "cream", kind: "half-right" },
];

const ITEM_CLASS = {
  "split-right": "col-span-full grid-15",
  "split-left": "col-span-full grid-15",
  wide: "col-span-full",
  "half-left": "col-span-full md:col-start-1 md:col-span-7",
  "half-right": "col-span-full md:col-start-9 md:col-span-7",
};

const SPRING = { stiffness: 420, damping: 38, mass: 0.6 };

export default function Projects() {
  const ready = useFontsReady();

  return (
    <Sheet className="pb-[clamp(4rem,14vh,10rem)]" aria-labelledby="projects-heading">
      <header className="pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
        <h1 id="projects-heading" aria-label="Selected Projects" className="display display-sans m-0">
          <TitleLine as="span" className="block" start={ready} delay={0.15}>
            <TitleText>Selected</TitleText>
          </TitleLine>
          <TitleLine as="span" className="block pt-[0.12em]" start={ready} delay={0.27}>
            <TitleText align="right">Projects</TitleText>
          </TitleLine>
        </h1>
      </header>

      <ol className="grid-15 mt-[clamp(3rem,8vh,6rem)] items-start gap-y-[clamp(4rem,10vh,8rem)]">
        {projectsData.map((project, i) => (
          <ProjectItem key={project.id} project={project} index={i} {...(LAYOUT[i] ?? LAYOUT[0])} />
        ))}
      </ol>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

function ProjectItem({ project, index, tone, kind }) {
  const reduce = useReducedMotion();
  const number = String(index + 1).padStart(2, "0");
  const child = reduce ? fadeChild : riseChild;

  // The first item is in view on load: let the headline land before it moves.
  const parent = {
    hidden: {},
    visible: { transition: { delayChildren: index === 0 ? 0.45 : 0, staggerChildren: 0.12 } },
  };

  const title = (
    <Motion.h2
      variants={child}
      className="project-title m-0 text-[length:var(--fs-title)] font-normal leading-[1.05] tracking-[-0.02em]"
    >
      <span className="project-title__text">{project.title}</span>
    </Motion.h2>
  );

  const description = (extra = "") => (
    <Motion.p variants={child} className={`m-0 max-w-[38ch] text-[length:var(--fs-body)] leading-[1.35] ${extra}`}>
      {project.description}
    </Motion.p>
  );

  const links = (
    <Motion.ul variants={child} className="label mt-5 flex flex-wrap gap-x-6 gap-y-3" aria-label={`${project.title} links`}>
      <li className="inline-flex items-center gap-1">
        <RevealLink href={project.live}>Live site</RevealLink>
        <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
      </li>
      <li className="inline-flex items-center gap-1">
        <RevealLink href={project.github}>GitHub</RevealLink>
        <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
      </li>
    </Motion.ul>
  );

  let body;
  if (kind === "split-right") {
    body = (
      <>
        <ProjectTile project={project} number={number} tone={tone} index={index} className="col-span-full md:col-start-1 md:col-span-9" />
        <div className="col-span-full mt-5 md:col-start-11 md:col-span-5 md:mt-0 md:self-end">
          {title}
          {description("mt-3")}
          {links}
        </div>
      </>
    );
  } else if (kind === "split-left") {
    body = (
      <>
        <ProjectTile project={project} number={number} tone={tone} index={index} className="col-span-full md:col-start-7 md:col-span-9" />
        <div className="col-span-full mt-5 md:col-start-1 md:col-span-5 md:mt-[4rem] md:self-start">
          {title}
          {description("mt-3")}
          {links}
        </div>
      </>
    );
  } else if (kind === "wide") {
    body = (
      <>
        <ProjectTile project={project} number={number} tone={tone} index={index} className="project-tile--wide w-full" />
        <div className="grid-15 mt-5 md:mt-8">
          <div className="col-span-full md:col-start-1 md:col-span-5">{title}</div>
          <div className="col-span-full mt-3 md:col-start-7 md:col-span-8 md:mt-0">
            {description()}
            {links}
          </div>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <ProjectTile project={project} number={number} tone={tone} index={index} className="w-full" />
        <div className="mt-5 md:mt-6">
          {title}
          {description("mt-3")}
          {links}
        </div>
      </>
    );
  }

  return (
    <Motion.li
      className={`project ${ITEM_CLASS[kind]}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={parent}
    >
      {body}
    </Motion.li>
  );
}

/* ------------------------------------------------------------------ */

const tileRise = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delayChildren: 0.2 } },
};
const tileFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, delayChildren: 0.1 } },
};
const imageClip = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: { clipPath: "inset(0 0 0% 0)", transition: { duration: 0.9, ease: EASE } },
};
const imageFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

/* Coloured matte with the project screenshot bleeding off its bottom-right,
   the whole tile linking to the live site. On hover devices a small "Live"
   pill follows the pointer via spring-smoothed motion values (no React state). */
function ProjectTile({ project, number, tone, index, className = "" }) {
  const reduce = useReducedMotion();
  const hoverDevice = useMediaQuery("(hover: hover)");
  const showPill = hoverDevice && !reduce;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  const onPointerEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    x.jump(px);
    y.jump(py);
    sx.jump(px);
    sy.jump(py);
  };
  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <Motion.a
      href={project.live}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${project.title}, live site`}
      className={`project-tile tone-${tone} ${className}`}
      variants={reduce ? tileFade : tileRise}
      onPointerEnter={showPill ? onPointerEnter : undefined}
      onPointerMove={showPill ? onPointerMove : undefined}
    >
      <span
        className="absolute left-3 top-3 text-[length:var(--fs-ui)] font-medium leading-none tabular-nums tracking-[-0.02em] md:left-4 md:top-4"
        aria-hidden="true"
      >
        {number}
      </span>

      <Motion.img
        src={project.image}
        alt={project.title}
        className="project-tile__img"
        loading={index === 0 ? "eager" : "lazy"}
        fetchPriority={index === 0 ? "high" : undefined}
        decoding="async"
        variants={reduce ? imageFade : imageClip}
      />

      {showPill ? (
        <Motion.span className="project-tile__pill label bg-fill text-fill-fg" style={{ x: sx, y: sy }} aria-hidden="true">
          Live
          <ArrowUpRight size={14} weight="regular" />
        </Motion.span>
      ) : null}
    </Motion.a>
  );
}
