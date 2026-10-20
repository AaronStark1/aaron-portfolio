import { motion as Motion } from "motion/react";
import World from "./World";
import { t, dim, draw, fade, pop, rise, resetAfterFade, quiet } from "../../lib/worlds";
import { EASE } from "../../lib/motion";

/* Email — the Communication World.
   Hero: a large envelope (150 × 100, centre-right) draws itself on and fills
   with translucent paper; its flap flips open and a ruled letter rises out of
   the pocket. Signature moment (~1.5 s): the letter folds into a paper plane
   (one path morphing into another) and launches along a dotted arc toward the
   top-right edge, leaving the open envelope behind. Supporting: a tilted
   stamped postcard in the band under the glyph, a "1" badge that pops on the
   envelope's corner, and a second letter still waiting in the pocket. */

/* Envelope: body with rounded corners, closed flap, pocket folds. */
const BODY = "M122 104 H264 Q268 104 268 108 V200 Q268 204 264 204 H122 Q118 204 118 200 V108 Q118 104 122 104 Z";
const FLAP = "M118 104 L193 154 L268 104 Z";
const POCKET = "M118 204 L193 152 L268 204";

/* The letter (96 × 72, centred on 193,78) and the plane it folds into: both
   are four-point closed paths so Motion can morph one into the other. */
const SHEET = "M145 42 L241 42 L241 114 L145 114 Z";
const PLANE = "M165 60 L223 74 L173 94 L181 78 Z";
const CREASE = "M181 78 L223 74";
const RULES = "M157 60 H229 M157 72 H229 M157 84 H229 M157 96 H209";
const TRAIL = "M205 76 Q258 84 300 68";
/* A second letter, still in the pocket, so the open envelope never reads as a house. */
const NEXT = "M152 104 V97 Q152 94 155 94 H231 Q234 94 234 97 V104";

/* Supporting: postcard under the glyph, badge on the corner. */
const POSTCARD = "M27 150 H79 Q82 150 82 153 V187 Q82 190 79 190 H27 Q24 190 24 187 V153 Q24 150 27 150 Z";

/* Draws on, then the paper fill settles in. */
const paper = (delay, duration, fillAt, fillTo = 0.14) => ({
  rest: { pathLength: 0, opacity: 0, fillOpacity: 0, transition: resetAfterFade() },
  hover: {
    pathLength: 1,
    opacity: 1,
    fillOpacity: fillTo,
    transition: { pathLength: t(delay, duration), opacity: t(delay, 0.15), fillOpacity: t(fillAt, 0.4) },
  },
});

/* The flap draws closed, then flips about its fold line to stand open. */
const flap = {
  rest: { pathLength: 0, opacity: 0, fillOpacity: 0, scaleY: 1, transition: resetAfterFade() },
  hover: {
    pathLength: 1,
    opacity: 1,
    fillOpacity: 0.14,
    scaleY: -0.6,
    transition: {
      pathLength: t(0.2, 0.35),
      opacity: t(0.2, 0.15),
      fillOpacity: t(0.35, 0.3),
      scaleY: t(0.55, 0.45),
    },
  },
};

/* The sheet rises out of the pocket, pauses, folds (the morph lives on its
   outline), then launches along the arc and off the right edge. */
const sheet = {
  rest: { opacity: 0, x: 0, y: 62, rotate: 0, transition: resetAfterFade() },
  hover: {
    opacity: 1,
    x: [0, 0, 0, 0, 40, 84, 164],
    y: [62, 0, 0, 0, -4, -12, -28],
    rotate: [0, 0, 0, 0, -6, -14, -26],
    transition: {
      opacity: t(0.65, 0.2),
      default: { ...t(0.65, 1.55), times: [0, 0.226, 0.29, 0.58, 0.774, 0.903, 1], ease: [EASE, "linear", "linear", "linear", "linear", "linear"] },
    },
  },
};

const outline = {
  rest: { d: SHEET, opacity: 0, transition: resetAfterFade() },
  hover: { d: PLANE, opacity: 1, transition: { d: t(1.1, 0.35), opacity: t(0.65, 0.1) } },
};

/* Ruled lines write on as the letter rises and vanish as it folds. */
const rules = {
  rest: { pathLength: 0, opacity: 0, transition: resetAfterFade() },
  hover: {
    pathLength: 1,
    opacity: [0, 1, 1, 0],
    transition: { pathLength: t(0.8, 0.3), opacity: { ...t(0.8, 0.45), times: [0, 0.22, 0.67, 1], ease: "linear" } },
  },
};

/* Reveals the dotted arc left-to-right as the plane passes. */
const trailReveal = {
  rest: { width: 0, opacity: 0, transition: resetAfterFade() },
  hover: { width: 110, opacity: 1, transition: { ...t(1.62, 0.58), ease: "linear" } },
};

export default function EmailWorld({ reduce }) {
  if (reduce) {
    return (
      <World>
        <Motion.path d="M118 104 L193 64 L268 104" fill="currentColor" fillOpacity="0.14" variants={quiet(0.1)} />
        <Motion.path d="M145 104 V42 H241 V104" fill="currentColor" fillOpacity="0.14" variants={quiet(0.2)} />
        <Motion.path d={RULES} strokeWidth="1.5" variants={quiet(0.2)} />
        <Motion.path d={BODY} strokeWidth="3" fill="currentColor" fillOpacity="0.14" variants={quiet(0)} />
        <Motion.path d={POCKET} variants={dim(quiet(0.1), 0.5)} />
      </World>
    );
  }

  return (
    <World>
      <defs>
        <clipPath id="email-pocket">
          <Motion.rect x="120" y="0" width="200" height="104" variants={fade(0)} />
        </clipPath>
        <clipPath id="email-trail">
          <Motion.rect x="198" y="30" width="0" height="60" variants={trailReveal} />
        </clipPath>
      </defs>

      {/* Flap, behind everything so the letter rises in front of it */}
      <Motion.path d={FLAP} strokeWidth="3" fill="currentColor" style={{ originX: 0.5, originY: 0 }} variants={flap} />

      {/* The letter, hidden inside the pocket until it rises; folds into the plane */}
      <g clipPath="url(#email-pocket)">
        <Motion.g variants={sheet}>
          <Motion.path d={SHEET} strokeWidth="2" fill="currentColor" fillOpacity="0.16" variants={outline} />
          <Motion.path d={RULES} strokeWidth="1.5" variants={rules} />
          <Motion.path d={CREASE} strokeWidth="1.5" variants={fade(1.3, 0.15)} />
        </Motion.g>
      </g>

      {/* Envelope body and pocket folds */}
      <Motion.path d={BODY} strokeWidth="3" fill="currentColor" variants={paper(0, 0.5, 0.3)} />
      <Motion.path d={POCKET} variants={dim(draw(0.15, 0.4), 0.5)} />

      {/* Dotted flight arc, revealed behind the plane */}
      <Motion.path d={TRAIL} strokeWidth="2" strokeDasharray="0.1 6" clipPath="url(#email-trail)" variants={fade(1.6, 0.1, 0.55)} />

      {/* "1" badge on the envelope's corner */}
      <Motion.g variants={pop(2.0, { scale: 0.4, duration: 0.4 })}>
        <Motion.circle cx="270" cy="100" r="12" fill="currentColor" fillOpacity="0.18" variants={fade(2.0, 0.2)} />
        <Motion.text x="270" y="105.5" fontSize="15" fontWeight="700" textAnchor="middle" variants={fade(2.0, 0.2)}>
          1
        </Motion.text>
      </Motion.g>

      {/* The next letter, peeking out of the pocket once the plane has gone */}
      <Motion.path d={NEXT} strokeWidth="2" fill="currentColor" fillOpacity="0.14" variants={dim(rise(1.9, { y: 6, duration: 0.4 }), 0.6)} />

      {/* A stamped postcard waiting in the band under the glyph */}
      <Motion.g variants={dim(pop(1.75, { scale: 0.9, y: 8 }), 0.75)}>
        <g transform="rotate(-5 53 170)">
          <Motion.path d={POSTCARD} fill="currentColor" fillOpacity="0.12" variants={fade(1.75, 0.3)} />
          <Motion.path
            d="M65 155 h11 v13 h-11 z M31 170 H57 M31 177 H51 M31 184 H54 M60 157 Q63 160 60 163 M62 155 Q65 160 62 165"
            strokeWidth="1.5"
            variants={fade(1.85, 0.3, 0.7)}
          />
        </g>
      </Motion.g>
    </World>
  );
}
