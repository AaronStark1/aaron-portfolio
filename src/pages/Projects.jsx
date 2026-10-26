import { useCallback, useEffect, useRef, useState } from "react";
import { motion as Motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowUpRight, Pause, Play } from "@phosphor-icons/react";
import Sheet from "../components/Sheet";
import RevealLink from "../components/RevealLink";
import ShowcaseModal from "../components/ShowcaseModal";
import { TitleLine, TitleText } from "../components/TitleLines";
import { EASE, fadeChild, riseChild, useFontsReady, useMediaQuery } from "../lib/motion";
import { claimPreview, stopPreviews } from "../lib/showcase";
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
  const [showcase, setShowcase] = useState(null);
  const openShowcase = useCallback((project, index, trigger) => setShowcase({ project, index, trigger }), []);
  const closeShowcase = useCallback(() => setShowcase(null), []);

  return (
    <Sheet className="pb-[clamp(4rem,14vh,10rem)]" aria-labelledby="projects-heading">
      <header className="pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
        <h1 id="projects-heading" aria-label="Selected Projects" className="display display-sans m-0">
          <TitleLine as="span" className="block" start={ready} delay={0.15}>
            <TitleText>Selected</TitleText>
          </TitleLine>
          <TitleLine as="span" className="block pt-[0.12em]" start={ready} delay={0.27} descenders>
            <TitleText align="right">Projects</TitleText>
          </TitleLine>
        </h1>
      </header>

      <ol className="grid-15 mt-[clamp(3rem,8vh,6rem)] items-start gap-y-[clamp(4rem,10vh,8rem)]">
        {projectsData.map((project, i) => (
          <ProjectItem key={project.id} project={project} index={i} onWatch={openShowcase} {...(LAYOUT[i] ?? LAYOUT[0])} />
        ))}
      </ol>

      <ShowcaseModal
        project={showcase ? showcase.project : null}
        number={showcase ? String(showcase.index + 1).padStart(2, "0") : ""}
        trigger={showcase ? showcase.trigger : null}
        onClose={closeShowcase}
      />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

function ProjectItem({ project, index, tone, kind, onWatch }) {
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
        <ProjectTile project={project} number={number} tone={tone} index={index} onWatch={onWatch} className="col-span-full md:col-start-1 md:col-span-9" />
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
        <ProjectTile project={project} number={number} tone={tone} index={index} onWatch={onWatch} className="col-span-full md:col-start-7 md:col-span-9" />
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
        <ProjectTile project={project} number={number} tone={tone} index={index} onWatch={onWatch} className="project-tile--wide w-full" />
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
        <ProjectTile project={project} number={number} tone={tone} index={index} onWatch={onWatch} className="w-full" />
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
   pill follows the pointer via spring-smoothed motion values (no React state).

   Projects with a reel crossfade the screenshot into a muted preview: on hover
   or keyboard focus where hovering is possible and motion is welcome, otherwise
   through an explicit Preview toggle (touch, reduced motion). "Watch showcase"
   opens the full reel in the modal. Playback status comes from the media
   events, so the poster only gives way once a frame is really on screen. */
function ProjectTile({ project, number, tone, index, onWatch, className = "" }) {
  const reduce = useReducedMotion();
  const hoverDevice = useMediaQuery("(hover: hover)");
  const showPill = hoverDevice && !reduce;
  const hasVideo = Boolean(project.video);
  const autoPreview = hasVideo && hoverDevice && !reduce;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  const onPillEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    x.jump(px);
    y.jump(py);
    sx.jump(px);
    sy.jump(py);
  };
  const onPillMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  /* Preview playback */
  const videoRef = useRef(null);
  const [armed, setArmed] = useState(false); // near the viewport once: worth fetching metadata
  const [wanted, setWanted] = useState(false); // visitor intent (hover, focus, toggle)
  const [status, setStatus] = useState("idle"); // idle | playing | failed, from media events

  const releaseRef = useRef(null);
  // Stable identity: the registry compares stop functions to know the owner.
  const halt = useCallback(() => {
    videoRef.current?.pause();
    setWanted(false);
    releaseRef.current?.();
    releaseRef.current = null;
  }, []);

  const start = () => {
    const v = videoRef.current;
    if (!v || wanted) return;
    releaseRef.current = claimPreview(halt);
    setWanted(true);
    v.muted = true;
    const attempt = v.play();
    // Autoplay refused: drop the intent so the poster and controls stay honest.
    // (AbortError is just a play() cut short by our own pause(): nothing to do.)
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch((err) => {
        if (err?.name !== "AbortError") halt();
      });
    }
  };
  const stop = () => {
    if (wanted) halt();
  };

  // Unmounting (route change) ends the preview and frees the slot
  useEffect(() => () => halt(), [halt]);

  const hoverProps = autoPreview
    ? {
        onPointerEnter: (e) => e.pointerType !== "touch" && start(),
        onPointerMove: (e) => e.pointerType !== "touch" && start(),
        onPointerLeave: (e) => e.pointerType !== "touch" && stop(),
        onFocus: (e) => e.target.matches(":focus-visible") && start(),
        onBlur: (e) => !e.currentTarget.contains(e.relatedTarget) && stop(),
      }
    : {};

  return (
    <Motion.div
      className={`project-tile tone-${tone} ${className}`}
      data-preview={status === "playing" ? "playing" : undefined}
      variants={reduce ? tileFade : tileRise}
      viewport={{ margin: "200px 0px" }}
      onViewportEnter={hasVideo ? () => setArmed(true) : undefined}
      onViewportLeave={hasVideo ? halt : undefined}
      {...hoverProps}
    >
      <a
        href={project.live}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.title}, live site`}
        className="project-tile__link"
        onPointerEnter={showPill ? onPillEnter : undefined}
        onPointerMove={showPill ? onPillMove : undefined}
      >
        <span
          className="absolute left-3 top-3 text-[length:var(--fs-ui)] font-medium leading-none tabular-nums tracking-[-0.02em] md:left-4 md:top-4"
          aria-hidden="true"
        >
          {number}
        </span>

        <Motion.div className="project-tile__media" variants={reduce ? imageFade : imageClip}>
          <img
            src={project.image}
            alt={project.title}
            className="project-tile__img"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : undefined}
            decoding="async"
          />
          {hasVideo && status !== "failed" ? (
            <video
              ref={videoRef}
              className="project-tile__video"
              src={project.video}
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              preload={armed ? "metadata" : "none"}
              tabIndex={-1}
              aria-hidden="true"
              onPlaying={() => setStatus("playing")}
              onPause={() => setStatus("idle")}
              onError={() => {
                setStatus("failed");
                halt();
              }}
            />
          ) : null}
        </Motion.div>

        {showPill ? (
          <Motion.span className="project-tile__pill label bg-fill text-fill-fg" style={{ x: sx, y: sy }} aria-hidden="true">
            Live
            <ArrowUpRight size={14} weight="regular" />
          </Motion.span>
        ) : null}
      </a>

      {hasVideo ? (
        <div className="project-tile__actions">
          {!autoPreview && status !== "failed" ? (
            <button
              type="button"
              className="project-tile__btn"
              aria-pressed={wanted}
              aria-label={wanted ? `Pause ${project.title} preview` : `Play ${project.title} preview`}
              onClick={() => (wanted ? stop() : start())}
            >
              {wanted ? <Pause size={13} weight="fill" aria-hidden="true" /> : <Play size={13} weight="fill" aria-hidden="true" />}
              <span>{wanted ? "Pause" : "Preview"}</span>
            </button>
          ) : null}
          <button
            type="button"
            className="project-tile__btn project-tile__btn--watch"
            aria-label={`Watch ${project.title} showcase`}
            onClick={(e) => {
              stopPreviews();
              onWatch(project, index, e.currentTarget);
            }}
          >
            <Play size={13} weight="fill" aria-hidden="true" />
            <span>Watch showcase</span>
          </button>
        </div>
      ) : null}
    </Motion.div>
  );
}
