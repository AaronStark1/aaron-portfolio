import { useEffect, useMemo, useState } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";
import Sheet from "../components/Sheet";
import NavCard from "../components/NavCard";
import { TitleLines, TitleLine, TitleText } from "../components/TitleLines";
import { EASE, getIntroScale, useFontsReady, useMediaQuery } from "../lib/motion";

/* Live clock for Kochi, kept from the original Home */
function TimeDisplay() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="ml-2 inline-block tabular-nums tracking-[-0.02em]" aria-live="off">
      {time}
    </span>
  );
}

const CARDS = {
  about: {
    to: "/about",
    label: "About",
    number: "01",
    tone: "cream",
    description: ".NET developer passionate about clean architecture & UX.",
  },
  projects: {
    to: "/projects",
    label: "Projects",
    number: "02",
    tone: "brick",
    description: "Explore selected work & experiments.",
  },
  contact: {
    to: "/contact",
    label: "Contact",
    number: "03",
    tone: "ochre",
    description: "Let's collaborate or say hi.",
  },
};

export default function Home() {
  const ready = useFontsReady();
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 1024px)");
  // First visit plays the full choreography, later visits a compressed one
  const s = useMemo(() => getIntroScale(), []);

  const t = {
    name: 0.2 * s,
    meta: 1.0 * s,
    row1: 1.15 * s,
    row2: 1.3 * s,
    cards: 1.85 * s,
  };

  return (
    <Sheet
      className="flex min-h-[calc(100dvh-4rem)] flex-col pb-6 md:min-h-[calc(100dvh-5rem)] md:pb-10"
      aria-labelledby="home-name"
    >
      {/* Name */}
      <header className="pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
        <TitleLines font="serif" start={ready}>
          <TitleLine as="h1" delay={t.name} innerClassName="grid-15 items-end" ruleClassName="mt-[0.14em]">
            <TitleText col="1 / span 8">
              A<i>a</i>ron
            </TitleText>
            <TitleText col="9 / -1" align="right">
              Corr<i>e</i>ya
            </TitleText>
          </TitleLine>
        </TitleLines>
        <span id="home-name" className="sr-only">
          Aaron Correya
        </span>

        <MetaRow start={ready} delay={t.meta} reduce={reduce} />
      </header>

      {/* Statement + navigation */}
      {desktop ? (
        <DesktopStatement ready={ready} t={t} />
      ) : (
        <StackedStatement ready={ready} t={t} />
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

function MetaRow({ start, delay, reduce }) {
  const items = [
    { key: "role", node: ".NET Developer", cls: "hidden md:block md:col-span-3" },
    { key: "work", node: "Junior Software Engineer @ Bytestrone", cls: "col-span-7 md:col-span-5 md:col-start-4" },
    {
      key: "email",
      node: (
        <a href="mailto:djaaronmirage123@gmail.com" className="hover:underline">
          djaaronmirage123@gmail.com
        </a>
      ),
      cls: "hidden md:block md:col-span-4 md:col-start-9",
    },
    {
      key: "place",
      node: (
        <>
          Kochi
          <TimeDisplay />
        </>
      ),
      cls: "col-span-8 text-right md:col-span-3 md:col-start-13",
    },
  ];

  return (
    <Motion.ul
      className="grid-15 label mt-4 gap-y-2 md:mt-5"
      initial="hidden"
      animate={start ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { delayChildren: delay, staggerChildren: 0.08 } } }}
    >
      {items.map((it) => (
        <Motion.li
          key={it.key}
          className={`overflow-hidden ${it.cls}`}
          variants={{
            hidden: reduce ? { opacity: 0 } : { opacity: 0, y: "140%" },
            visible: reduce
              ? { opacity: 1, transition: { duration: 0.4 } }
              : { opacity: 1, y: "0%", transition: { duration: 0.6, ease: EASE } },
          }}
        >
          {it.node}
        </Motion.li>
      ))}
    </Motion.ul>
  );
}

/* Desktop (>= 1024): the reference composition.
   Row 1: [About]  .NET Developer  [Contact]
   Row 2: Based in   [Projects]    Kochi                                   */
function DesktopStatement({ ready, t }) {
  const cardW = "w-[clamp(11rem,16.6vw,15rem)]";
  const cardH = "clamp(5.5rem, 7.2vw, 6.5rem)";
  return (
    <section
      className="mt-auto pt-[clamp(5rem,14vh,10rem)] pb-[clamp(2.5rem,7vh,5.5rem)]"
      aria-label="Introduction"
    >
      <TitleLines font="sans" start={ready} style={{ fontSize: "var(--fs-statement-lg)" }}>
        <TitleLine
          as="div"
          delay={t.row1}
          innerClassName="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-x-6"
          ruleClassName="mt-0"
        >
          <NavCard {...CARDS.about} start={ready} delay={t.cards} className={cardW} height={cardH} />
          <p className="m-0 min-w-0 text-center">
            <TitleText as="span" className="inline-block">
              .NET Developer
            </TitleText>
          </p>
          <NavCard {...CARDS.contact} start={ready} delay={t.cards + 0.2} className={cardW} height={cardH} />
        </TitleLine>

        <TitleLine
          as="div"
          delay={t.row2}
          innerClassName="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-6 pt-[0.12em]"
          ruleClassName="mt-0"
        >
          <p className="m-0">
            <TitleText>Based in</TitleText>
          </p>
          <NavCard {...CARDS.projects} start={ready} delay={t.cards + 0.1} className={cardW} height={cardH} />
          <p className="m-0 text-right">
            <TitleText align="right">Kochi</TitleText>
          </p>
        </TitleLine>
      </TitleLines>
    </section>
  );
}

/* Tablet and mobile: statement lines alternate alignment, cards stack below. */
function StackedStatement({ ready, t }) {
  return (
    <section className="mt-auto pt-[clamp(4rem,12vh,9rem)] pb-4" aria-label="Introduction">
      <TitleLines font="sans" start={ready}>
        <TitleLine as="p" delay={t.row1} className="m-0">
          <TitleText nowrap={false}>.NET Developer</TitleText>
        </TitleLine>
        <TitleLine as="p" delay={t.row2} className="m-0 pt-[0.12em]">
          <TitleText align="right" nowrap={false}>
            Based in Kochi
          </TitleText>
        </TitleLine>
      </TitleLines>

      <nav aria-label="Sections" className="mt-10 grid gap-0 md:grid-cols-3 md:gap-2">
        {[CARDS.about, CARDS.projects, CARDS.contact].map((c, i) => (
          <NavCard key={c.to} {...c} start={ready} delay={t.cards + i * 0.1} height="clamp(5.5rem, 24vw, 8rem)" />
        ))}
      </nav>
    </section>
  );
}
