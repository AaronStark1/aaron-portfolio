import { motion as Motion } from "motion/react";
import World from "./World";
import { T0, t, dim, loop, steps, draw, pop, fade, rise, resetAfterFade, quiet } from "../../lib/worlds";

/* GitHub — a terminal window, centre-right, that types `git merge feat/worlds`
   and answers with a Git graph drawing itself inside the window: main runs in,
   a feature branch peels off, three commits pop in, and it comes home.
   Signature moment: the merge dot lands (~1.5 s) with a ring that ripples out,
   then a "merged" tag rises under it. The cursor keeps blinking at the end of
   the command. Supporting: `</>` in the band under the glyph.
   Reduced motion: window, prompt, the whole graph and the merge dot (5 marks). */

/* Window geometry */
const WIN = { x: 96, y: 44, w: 184, h: 162 };

/* Typewriter */
const CMD = "$ git merge feat/worlds";
const CHARS = CMD.length;
const FS = 11; // monospace, ≥ 11 units
const CH = FS * 0.602; // advance of Menlo / SF Mono; textLength pins other fonts to it
const TYPE_X = 108;
const TYPED_W = CHARS * CH;
const TYPE_AT = 0.25;
const TYPE_DUR = 0.55;

/* Graph geometry (inside the window) */
const MAIN_Y = 170;
const BRANCH_Y = 140;
const FORK_X = 138;
const MERGE_X = 244;
const BRANCH_DOTS = [162, 190, 218];

export default function GithubWorld({ reduce }) {
  if (reduce) {
    return (
      <World>
        <Motion.rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="8" fill="currentColor" fillOpacity="0.12" strokeWidth="3" variants={quiet(0)} />
        <Motion.path d="M108 55 h0.01 M119 55 h0.01 M130 55 h0.01" strokeWidth="6" variants={quiet(0.05)} />
        <Motion.text x={TYPE_X} y="82" fontSize={FS} variants={quiet(0.1)}>
          {CMD}
        </Motion.text>
        <Motion.path
          d={`M112 ${MAIN_Y} H264 M${FORK_X} ${MAIN_Y} C ${FORK_X} 152, 146 ${BRANCH_Y}, 162 ${BRANCH_Y} L 218 ${BRANCH_Y} C 234 ${BRANCH_Y}, ${MERGE_X} 152, ${MERGE_X} ${MAIN_Y}`}
          strokeWidth="2.5"
          variants={quiet(0.2)}
        />
        <Motion.circle cx={MERGE_X} cy={MAIN_Y} r="5.5" fill="currentColor" stroke="none" variants={quiet(0.3)} />
      </World>
    );
  }

  /* Typewriter clip: the rect's width steps one character at a time. */
  const typeClip = {
    rest: { width: 0, opacity: 0, transition: resetAfterFade() },
    hover: { width: TYPED_W + 4, opacity: 1, transition: t(TYPE_AT, TYPE_DUR, steps(CHARS)) },
  };
  /* Cursor: steps along with the clip, blinks from the first keystroke on. */
  const cursor = {
    rest: { opacity: 0, x: 0, transition: resetAfterFade() },
    hover: {
      opacity: [0, 1, 1, 0, 0],
      x: TYPED_W,
      transition: {
        x: t(TYPE_AT, TYPE_DUR, steps(CHARS)),
        opacity: loop(1.1, { delay: T0 + TYPE_AT, times: [0, 0.02, 0.55, 0.57, 1] }),
      },
    },
  };
  /* Merge-ring ripple: grows from the dot and fades; never lingers. */
  const ripple = {
    rest: { opacity: 0, r: 6, transition: resetAfterFade() },
    hover: { opacity: [0, 0.8, 0], r: [6, 22], transition: t(1.35, 0.7) },
  };

  return (
    <World>
      {/* the window */}
      <Motion.rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="8" fill="currentColor" fillOpacity="0.12" strokeWidth="3" variants={rise(0, { y: 8, duration: 0.45 })} />
      <Motion.path d="M108 55 h0.01 M119 55 h0.01 M130 55 h0.01" strokeWidth="6" variants={fade(0.15, 0.3)} />

      {/* prompt line, typed */}
      <clipPath id="github-type">
        <Motion.rect x={TYPE_X - 2} y="70" width="0" height="16" variants={typeClip} />
      </clipPath>
      <Motion.text x={TYPE_X} y="82" fontSize={FS} textLength={TYPED_W} lengthAdjust="spacing" clipPath="url(#github-type)" variants={fade(TYPE_AT, 0.01)}>
        {CMD}
      </Motion.text>
      <Motion.rect x={TYPE_X} y="72" width="6" height="13" rx="1" fill="currentColor" stroke="none" variants={cursor} />

      {/* dim output fragments */}
      <Motion.text x={TYPE_X} y="100" fontSize={FS} variants={fade(0.8, 0.3, 0.45)}>
        Merge made by 'ort'.
      </Motion.text>

      {/* the graph: main runs in, the branch peels off and comes home */}
      <Motion.path d={`M112 ${MAIN_Y} H264`} strokeWidth="2.5" variants={draw(0.7, 0.35)} />
      <Motion.path d={`M124 ${MAIN_Y} h0.01 M${FORK_X} ${MAIN_Y} h0.01`} strokeWidth="8" variants={fade(0.85, 0.25)} />
      <Motion.path
        d={`M${FORK_X} ${MAIN_Y} C ${FORK_X} 152, 146 ${BRANCH_Y}, 162 ${BRANCH_Y} L 218 ${BRANCH_Y} C 234 ${BRANCH_Y}, ${MERGE_X} 152, ${MERGE_X} ${MAIN_Y}`}
        strokeWidth="2.5"
        variants={draw(0.9, 0.5)}
      />
      {BRANCH_DOTS.map((cx, i) => (
        <Motion.circle key={cx} cx={cx} cy={BRANCH_Y} r="3.5" fill="currentColor" stroke="none" variants={pop(1.0 + i * 0.13, { scale: 0.2, duration: 0.3 })} />
      ))}

      {/* the merge: signature moment */}
      <Motion.circle cx={MERGE_X} cy={MAIN_Y} r="5.5" fill="currentColor" stroke="none" variants={pop(1.3, { scale: 0.1, duration: 0.4 })} />
      <Motion.circle cx={MERGE_X} cy={MAIN_Y} r="6" strokeWidth="1.5" variants={ripple} />

      {/* merged tag */}
      <Motion.rect x="212" y="180" width="58" height="16" rx="8" fill="currentColor" fillOpacity="0.14" strokeWidth="1.5" variants={rise(1.55, { y: 6, duration: 0.4 })} />
      <Motion.text x="221" y="192" fontSize={FS} variants={rise(1.55, { y: 6, duration: 0.4 })}>
        merged
      </Motion.text>

      {/* supporting mark in the band under the glyph */}
      <Motion.text x="24" y="158" fontSize="26" fontWeight="500" variants={dim(rise(0.5, { y: 8, duration: 0.6 }), 0.4)}>
        {"</>"}
      </Motion.text>
    </World>
  );
}
