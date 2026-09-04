import { motion as Motion, useReducedMotion } from "motion/react";
import Sheet from "../components/Sheet";
import NavCard from "../components/NavCard";
import { TitleLines, TitleLine, TitleText } from "../components/TitleLines";
import { EASE, DUR, useFontsReady } from "../lib/motion";
import "../styles/notfound.css";

/* Entrance timing. The two headline lines overlap the sheet's own entrance
   (as on Home); the sentence and the card follow once the rules have drawn. */
const T = { code: 0.15, title: 0.27, copy: 0.8, card: 0.95 };

export default function NotFound() {
  const ready = useFontsReady();
  const reduce = useReducedMotion();

  const copy = reduce
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: DUR.fade, delay: T.copy } },
      }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: T.copy } },
      };

  return (
    <Sheet
      className="flex min-h-[calc(100dvh-4rem)] flex-col pb-6 md:min-h-[calc(100dvh-5rem)] md:pb-10"
      aria-labelledby="nf-title"
    >
      {/* Headline: the code in serif on the left, the message in sans on the right */}
      <header className="nf-headline pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
        <TitleLines font="serif" start={ready}>
          <TitleLine as="h1" delay={T.code} ruleClassName="mt-[0.14em]">
            <TitleText>
              4<i>0</i>4
            </TitleText>
          </TitleLine>
        </TitleLines>
        <TitleLines font="sans" start={ready}>
          <TitleLine as="p" delay={T.title} className="m-0 pt-[0.12em]">
            <TitleText align="right" nowrap={false}>
              Page not found
            </TitleText>
          </TitleLine>
        </TitleLines>
        <span id="nf-title" className="sr-only">
          404, page not found
        </span>
      </header>

      {/* The empty middle is the point: nothing lives here. The way out sits at the foot of the sheet. */}
      <div className="mt-auto pt-[clamp(5rem,14vh,10rem)] pb-[clamp(2.5rem,7vh,5.5rem)]">
        <div className="grid-15 items-end gap-y-10">
          {/* md:pb aligns the sentence baseline with the card label's baseline across the row */}
          <Motion.p
            className="col-span-full m-0 max-w-[60ch] text-[length:var(--fs-body)] leading-[1.35] md:col-span-6 md:pb-[0.68rem]"
            variants={copy}
            initial="hidden"
            animate={ready ? "visible" : "hidden"}
          >
            There is nothing at this address.
          </Motion.p>
          <NavCard
            to="/"
            label="Back home"
            number=""
            tone="cream"
            start={ready}
            delay={T.card}
            className="col-span-full w-[15rem] max-w-full md:col-span-9 md:col-start-7 md:justify-self-end"
          />
        </div>
      </div>
    </Sheet>
  );
}
