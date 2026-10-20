import { motion as Motion } from "motion/react";
import World from "./World";
import { EASE } from "../../lib/motion";
import { dim, draw, fade, pop, quiet, resetAfterFade, rise, steps, t, T0, loop } from "../../lib/worlds";

/**
 * DEV — writing in public. A sheet of paper rises centre-right with a folded
 * corner, its heading types itself out in monospace, then a pen sweeps across
 * and underlines it in one hand-drawn stroke (the signature moment). Four body
 * rules draw on beneath and a cursor keeps blinking at the end of the draft.
 * In the margin under the glyph: a note bracket, a dim squiggle and an
 * asterisk, the editor's marks.
 */

// Paper outline with a dog-ear at the top-right; the flap is a second subpath
// so one `draw` traces both and the fill closes the flap into a triangle.
const PAPER = "M92 40 H236 L258 62 V212 H92 Z";
const FLAP = "M236 40 V62 H258";

// Lucide "pencil" (ISC), scaled so its tip sits on the start of the underline.
const PEN_SCALE = 1.15;
const PEN =
  "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z M15 5l4 4";

const UNDERLINE = "M108 92 c 30 -3, 60 2, 92 -1 s 30 1, 46 -2";
const BODY = [
  "M108 118 H232",
  "M108 140 H240",
  "M108 162 H214",
  "M108 184 H190",
];

export default function DevWorld({ reduce }) {
  const v = (full, delay) => (reduce ? quiet(delay) : full);

  // Typewriter clip for the heading: the rect's width steps across the text.
  const typeClip = {
    rest: { width: 0, opacity: 0, transition: resetAfterFade() },
    hover: { width: 146, opacity: 1, transition: { ...t(0.4, 0.55), ease: steps(19) } },
  };

  // The pen: lands on the page, rides the underline as it draws, lifts off.
  // It animates inside the scaled group, so its offsets are in pen units.
  const pen = {
    rest: { opacity: 0, x: 0, y: -6 / PEN_SCALE, transition: resetAfterFade() },
    hover: {
      opacity: [0, 1, 1, 0],
      x: [0, 0, 138, 142].map((n) => n / PEN_SCALE),
      y: [-6, 0, 0, -8].map((n) => n / PEN_SCALE),
      transition: { ...t(0.95, 0.65), times: [0, 0.077, 0.77, 1], ease: ["linear", EASE, "linear"] },
    },
  };

  // Blinking cursor at the end of the draft.
  const cursor = {
    rest: { opacity: 0, transition: { duration: 0.2 } },
    hover: { opacity: [0, 1, 1, 0, 0], transition: { ...loop(1.0), delay: T0 + 2.4, times: [0, 0.02, 0.62, 0.64, 1] } },
  };

  return (
    <World>
      {/* Paper: translucent sheet rises in, then the outline traces around it */}
      <Motion.path d={`${PAPER} ${FLAP}`} fill="currentColor" fillOpacity={0.12} stroke="none" variants={v(rise(0, { y: 8, duration: 0.45 }), 0)} />
      <Motion.path d={`${PAPER} ${FLAP}`} strokeWidth="3" variants={v(draw(0.05, 0.7), 0.05)} />

      {/* Heading that types itself */}
      {!reduce && (
        <clipPath id="dev-world-type">
          <Motion.rect x="106" y="68" height="20" variants={typeClip} />
        </clipPath>
      )}
      <Motion.text x="108" y="82" fontSize="12" fontWeight="700" clipPath={reduce ? undefined : "url(#dev-world-type)"} variants={v(fade(0.4, 0.05), 0.1)}>
        # Writing in public
      </Motion.text>

      {/* Signature: one hand-drawn underline, inked by the pen */}
      <Motion.path d={UNDERLINE} strokeWidth="3" variants={v(draw(1.0, 0.5), 0.2)} />
      {!reduce && (
        <g transform={`translate(${108 - 2 * PEN_SCALE} ${92 - 22 * PEN_SCALE}) scale(${PEN_SCALE})`} strokeWidth={2 / PEN_SCALE}>
          <Motion.path d={PEN} fill="currentColor" fillOpacity={0.18} variants={pen} />
        </g>
      )}

      {/* Body rules, then the cursor at the end of the last one */}
      {reduce ? (
        <Motion.path d={BODY.join(" ")} strokeWidth="2" variants={dim(quiet(0.3), 0.5)} />
      ) : (
        BODY.map((d, i) => <Motion.path key={d} d={d} strokeWidth="2" variants={dim(draw(1.5 + i * 0.12, 0.35), 0.5)} />)
      )}
      {!reduce && <Motion.rect x="196" y="177" width="2.5" height="14" fill="currentColor" stroke="none" variants={cursor} />}

      {/* Margin marks in the band under the glyph */}
      {!reduce && (
        <>
          <Motion.path d="M84 108 H79 V160 H84" strokeWidth="1.5" variants={dim(draw(1.75, 0.35), 0.6)} />
          <Motion.path d="M32 131 q 5 -6, 10 0 t 10 0 t 10 0 t 10 0" strokeWidth="1.5" variants={dim(draw(1.95, 0.4), 0.45)} />
          <Motion.path d="M46 170 V182 M40.8 173 L51.2 179 M40.8 179 L51.2 173" strokeWidth="1.5" variants={dim(pop(0.6, { scale: 0.4, rotate: -40 }), 0.5)} />
        </>
      )}
    </World>
  );
}
