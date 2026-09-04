import { useRef, useState } from "react";
import { motion as Motion, useInView, useReducedMotion } from "motion/react";
import Sheet from "../components/Sheet";
import { TitleLines, TitleLine, TitleText } from "../components/TitleLines";
import { EASE, STAGGER, fadeChild, riseChild, riseParent, useFontsReady } from "../lib/motion";

const PARAGRAPHS = [
  <>
    I’m <span className="font-medium">Aaron Correya</span>, a <span className="font-medium">.NET developer</span> based in Kochi who loves
    building fast, interactive and visually polished web applications with clean architecture.
  </>,
  <>
    Currently working as <span className="font-medium">Junior Software Engineer at Bytestrone</span>, I practice{" "}
    <span className="font-medium">Spec-Driven Development using Domain Driven Design and Vertical Slice Architecture</span>,
    building scalable, maintainable systems with <span className="font-medium">.NET and Next.js</span>.
  </>,
  <>
    Beyond coding, I enjoy experimenting with animations, design systems and UI/UX concepts, combining performance
    and creativity to build digital experiences that feel good to use.
  </>,
  <>
    I’m always open to collaboration, learning opportunities and exciting projects, whether it&apos;s .NET backend
    systems, Next.js frontends, or something entirely new.
  </>,
];

const FACTS = [
  { term: "Currently", detail: "Junior Software Engineer @ Bytestrone" },
  { term: "Stack", detail: ".NET, Next.js" },
  { term: "Approach", detail: "Spec-Driven Dev · DDD · Vertical Slice" },
  { term: "Based in", detail: "Kochi" },
  { term: "Updated", detail: "September 2026" },
];

export default function About() {
  const ready = useFontsReady();
  const reduce = useReducedMotion();
  const [proseDone, setProseDone] = useState(false);
  const child = reduce ? fadeChild : riseChild;
  /* The statement follows the headline (0.4s) and precedes the prose (0.5s). */
  const statement = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: 0.4 } } }
    : { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.4 } } };

  return (
    <Sheet className="pb-[clamp(4rem,14vh,10rem)]" aria-labelledby="about-title">
      {/* Headline: "About" left, "Me" right, each line carrying its own hairline */}
      <header className="pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
        <h1 id="about-title" className="sr-only">
          About Me
        </h1>
        <div aria-hidden="true">
          <TitleLines font="sans" start={ready}>
            <TitleLine as="div" delay={0.15} innerClassName="grid-15 items-end">
              <TitleText col="1 / span 8">About</TitleText>
            </TitleLine>
            <TitleLine as="div" delay={0.27} innerClassName="grid-15 items-end pt-[0.12em]">
              <TitleText col="9 / -1" align="right">
                Me
              </TitleText>
            </TitleLine>
          </TitleLines>
        </div>
      </header>

      {/* Statement left, prose right; stacked on small screens */}
      <div className="grid-15 mt-[clamp(3rem,8vh,6rem)] gap-y-10 md:gap-y-0">
        <Motion.h2
          className="col-span-full m-0 font-serif text-[length:var(--fs-statement)] font-normal leading-[1.2] tracking-[-0.01em] md:col-span-4"
          variants={statement}
          initial="hidden"
          animate={ready ? "visible" : "hidden"}
        >
          A little more about who I am, what I do, and what <em>drives me</em>.
        </Motion.h2>

        <div className="col-span-full md:col-span-8 md:col-start-7">
          <Motion.div
            className="flex max-w-[60ch] flex-col gap-5 text-[length:var(--fs-body)] leading-[1.35]"
            variants={riseParent(0.5)}
            initial="hidden"
            animate={ready ? "visible" : "hidden"}
          >
            {PARAGRAPHS.map((node, i) => (
              <Motion.p
                key={i}
                className="m-0"
                variants={child}
                onAnimationComplete={
                  i === PARAGRAPHS.length - 1 ? (def) => def === "visible" && setProseDone(true) : undefined
                }
              >
                {node}
              </Motion.p>
            ))}
          </Motion.div>

          <Facts go={proseDone} child={child} />
        </div>
      </div>
    </Sheet>
  );
}

/* Fact rows: wait for the prose to land, then rise in when scrolled into view. */
function Facts({ go, child }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.2 });

  return (
    <Motion.dl
      ref={ref}
      className="m-0 mt-[clamp(4rem,10vh,6rem)] max-w-[60ch] text-[length:var(--fs-body)] leading-[1.35]"
      variants={riseParent(0.1, STAGGER.item)}
      initial="hidden"
      animate={go && seen ? "visible" : "hidden"}
    >
      {FACTS.map((f) => (
        <Motion.div key={f.term} className="flex justify-between gap-6 border-b border-rule py-3" variants={child}>
          <dt className="text-fg-muted">{f.term}</dt>
          <dd className="m-0 text-right">{f.detail}</dd>
        </Motion.div>
      ))}
    </Motion.dl>
  );
}
