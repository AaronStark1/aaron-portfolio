import { motion as Motion } from "motion/react";
import World from "./World";
import { Particle, Glyph } from "./kit";
import { rrect, circle } from "./shapes";
import { C, R, W, LIFT, BAR, PHASE, T0, fill, stroke, steps, t, motionKit } from "../../lib/worlds";

/* GitHub — the terminal.
   A   the window lands, its body lights up under the title bar, a starred-repo card
       slides out from behind it and the prompt appears with its cursor;
   B   `git merge feat` types itself, then a Git graph draws inside the
       window: main runs in, a feature branch peels off, commits pop in and
       the merge commit lands, answered by a purple "merged" label;
   C   the cursor keeps blinking while a few code marks drift around. */

const TERM = { x: 100, y: 62, w: 174, h: 134, bar: 24 };
const BODY_Y = TERM.y + TERM.bar;

/* Command line: "$" prompt, then 14 characters on an 8-unit monospace grid. */
const CMD = { x: 132, y: 111, n: 14, adv: 8 };
const CMD_W = CMD.n * CMD.adv;
const TYPE = { at: 0.72, dur: 0.36 };

/* Git graph: main lane under a feature lane. */
const LANE = { main: 166, feat: 134 };
const FORK = 138;
const MERGE = 230;
const BRANCH = `M${FORK} ${LANE.main}C${FORK + 16} ${LANE.main} ${FORK + 12} ${LANE.feat} ${FORK + 28} ${LANE.feat}H${MERGE - 28}C${MERGE - 12} ${LANE.feat} ${MERGE - 16} ${LANE.main} ${MERGE} ${LANE.main}`;

/* Props: a starred-repo card behind the window, a "merged" label in front of it. */
const CARD = { cx: 86, cy: 104, w: 60, h: 50, turn: -8 };
const BADGE = { x: 194, y: 187, w: 72, h: 26 };

/* Rounded rectangle with square top corners (the window body under its title bar). */
const bottomRounded = (x, y, w, h, r) => `M${x} ${y}H${x + w}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}Z`;

/* Three title-bar dots as one shape. */
const dots = [0, 11, 22].map((dx) => circle(TERM.x + 14 + dx, TERM.y + 12, 3.5)).join("");

export default function GithubWorld({ reduce }) {
  const m = motionKit(reduce);

  /* The cursor rides along with the typing, one character per step, holds
     through the merge and blinks from phase C on (its group brings it in). */
  const cursor = m.custom({
    rest: { x: -CMD_W, opacity: 1, transition: { delay: 0.26, duration: 0 } },
    hover: {
      x: 0,
      opacity: [1, 1, 0, 0],
      transition: {
        x: { ...t(TYPE.at, TYPE.dur), ease: steps(CMD.n) },
        opacity: { duration: 1.1, times: [0, 0.5, 0.5, 1], ease: "linear", repeat: Infinity, delay: T0 + PHASE.C },
      },
    },
  });

  return (
    <World>
      <defs>
        <clipPath id="github-cmd">
          <Motion.rect x={CMD.x} y={CMD.y - 16} height="22" variants={m.type(CMD_W + 1, TYPE.at, TYPE.dur, CMD.n)} />
        </clipPath>
      </defs>

      {/* Starred-repo card, behind the window: slides out from under it */}
      <g transform={`rotate(${CARD.turn} ${CARD.cx} ${CARD.cy})`}>
        <Motion.g variants={m.enter(0.28, { x: 30, y: 4, rotate: 8, scale: 0.94 })}>
          <path d={rrect(CARD.cx - CARD.w / 2, CARD.cy - CARD.h / 2 + LIFT.prop, CARD.w, CARD.h, R.md)} style={fill(C.shade)} />
          <rect x={CARD.cx - CARD.w / 2} y={CARD.cy - CARD.h / 2} width={CARD.w} height={CARD.h} rx={R.md} style={fill(C.a3)} />
          <Glyph glyph="star" x={77} y={104} size={26} color={C.surface} />
        </Motion.g>
      </g>

      {/* The terminal */}
      <Motion.g variants={m.enter(0, { y: 16, scale: 0.92 })}>
        <path d={rrect(TERM.x, TERM.y + LIFT.hero, TERM.w, TERM.h, R.lg)} style={fill(C.shade)} />
        <rect x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} rx={R.lg} style={fill(C.surface2)} />
        <path d={dots} style={fill(C.detail, 0.32)} />
        <rect x={TERM.x + TERM.w / 2 - 22} y={TERM.y + 12 - BAR / 2} width="44" height={BAR} rx={BAR / 2} style={fill(C.detail, 0.18)} />

        {/* body lights up under the title bar */}
        <Motion.path d={bottomRounded(TERM.x, BODY_Y, TERM.w, TERM.h - TERM.bar, R.lg)} style={{ ...fill(C.surface), originY: 0 }} variants={m.grow(0.18, { axis: "y", duration: 0.38 })} />

        {/* prompt and cursor appear, then the command types itself */}
        <Motion.g variants={m.fade(0.42, 0.2)}>
          <text x={CMD.x - 15} y={CMD.y} fontSize="14" fontWeight="600" textLength={CMD.adv} lengthAdjust="spacing" style={fill(C.a1)}>
            $
          </text>
          <Motion.rect x={CMD.x + CMD_W + 1} y={CMD.y - 12} width="8" height="15" style={fill(C.detail, 0.85)} variants={cursor} />
        </Motion.g>
        <text x={CMD.x} y={CMD.y} fontSize="14" textLength={CMD_W} lengthAdjust="spacing" clipPath="url(#github-cmd)" style={fill(C.detail)}>
          git merge feat
        </text>

        {/* Git graph */}
        <Motion.path d={`M${TERM.x + 16} ${LANE.main}H${TERM.x + TERM.w - 16}`} style={stroke(C.a1, W.line)} variants={m.draw(1.08, 0.42)} />
        <Motion.path d={BRANCH} style={stroke(C.a2, W.line)} variants={m.draw(1.12, 0.38)} />
        <Motion.circle cx={TERM.x + 24} cy={LANE.main} r="6" style={fill(C.a1)} variants={m.pop(1.08, { scale: 0.2 })} />
        <Motion.circle cx={FORK + 32} cy={LANE.feat} r="6" style={fill(C.a2)} variants={m.pop(1.2, { scale: 0.2 })} />
        <Motion.circle cx={MERGE - 32} cy={LANE.feat} r="6" style={fill(C.a2)} variants={m.pop(1.3, { scale: 0.2 })} />
        <Motion.g variants={m.pop(1.4, { scale: 0.1, duration: 0.5 })}>
          <circle cx={MERGE} cy={LANE.main} r="14" style={{ ...stroke(C.a1, W.fine, 0.35), ...fill(C.surface) }} />
          <circle cx={MERGE} cy={LANE.main} r="8.5" style={fill(C.a1)} />
          <circle cx={MERGE} cy={LANE.main} r="3.5" style={fill(C.surface)} />
        </Motion.g>
      </Motion.g>

      {/* "Merged" label, in front of the window's bottom edge */}
      <Motion.g variants={m.pop(1.5, { scale: 0.5, y: 8 })}>
        <path d={rrect(BADGE.x, BADGE.y + LIFT.prop, BADGE.w, BADGE.h, BADGE.h / 2)} style={fill(C.shade)} />
        <rect x={BADGE.x} y={BADGE.y} width={BADGE.w} height={BADGE.h} rx={BADGE.h / 2} style={fill(C.a2)} />
        <Glyph glyph="merge" x={BADGE.x + 17} y={BADGE.y + BADGE.h / 2} size={16} color={C.line} />
        <rect x={BADGE.x + 31} y={BADGE.y + BADGE.h / 2 - BAR / 2} width="28" height={BAR} rx={BAR / 2} style={fill(C.line, 0.9)} />
      </Motion.g>

      {/* Supporting particles: code marks and primitives, varied motion */}
      <Particle m={m} glyph="commit" x={40} y={152} size={30} color={C.line} enter={0.5} amp={4} period={3.8} tilt={6} />
      <Particle m={m} glyph="branch" x={124} y={45} size={22} rotate={90} color={C.a3} enter={0.6} amp={5} period={3.2} tilt={5} />
      <Particle m={m} glyph="dot" x={226} y={48} size={9} color={C.a2} enter={0.68} amp={3} period={2.6} sway={-2} />
      <Particle m={m} glyph="spark" x={288} y={128} size={13} color={C.a1} enter={0.8} motion="twinkle" period={2.2} />
      <Particle m={m} glyph="ring" x={66} y={198} size={11} color={C.line} enter={0.86} amp={3} period={3.4} sway={-2} />
    </World>
  );
}
