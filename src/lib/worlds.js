import { EASE, EASE_INOUT } from "./motion";

/* Shared vocabulary for the social "micro-worlds": small flat-vector scenes
   that play inside a card while it is hovered or keyboard-focused. The card
   propagates the variant labels "rest" and "hover" to every Motion element
   in its scene, so a world is a set of elements whose variants name those
   two states. Every scene plays in three phases:

     A  activation  the hero enters, supporting props follow in a stagger
     B  signature   the platform's own action (spin, type, connect, send…)
     C  ambient     small particles keep drifting until the pointer leaves

   and leaves with one short fade, after which positions snap home unseen. */

/* Stage ------------------------------------------------------------------ */

/* One coordinate space for every world (1.2:1, the desktop card), rendered
   with `slice`: the wider phone card crops ~14 units top and bottom. */
export const WORLD_VIEW = "0 0 300 250";
export const SAFE = { x: 12, y: 16, w: 276, h: 218 };
export const CHROME = {
  glyph: { x: 0, y: 0, w: 72, h: 72 }, // brand mark, top-left
  handle: { x: 150, y: 0, w: 150, h: 34 }, // handle, top-right (hover only)
  label: { x: 0, y: 218, w: 120, h: 32 }, // platform name, bottom-left
  arrow: { x: 262, y: 216, w: 38, h: 34 }, // external arrow, bottom-right
};

/* Paint ------------------------------------------------------------------ */

/* Palette roles. Each platform supplies its own colours as CSS custom
   properties on the card (see data/socials.js); touch devices remap them to
   a single ink so the still tableau sits quietly on the site mattes. */
export const C = {
  surface: "var(--w-surface)", // body of the hero and props
  surface2: "var(--w-surface-2)", // secondary planes: title bars, flaps, labels
  detail: "var(--w-detail)", // marks drawn on a surface: text, keys, icons
  shade: "var(--w-shade)", // flat drop shadow (translucent black, so it darkens anything)
  line: "var(--w-line)", // marks drawn straight on the card colour
  a1: "var(--w-a1)",
  a2: "var(--w-a2)",
  a3: "var(--w-a3)",
};

/** Inline paint for SVG elements (custom properties are reliable in `style`, not in attributes). */
export const fill = (color, opacity) => (opacity == null ? { fill: color } : { fill: color, fillOpacity: opacity });
export const stroke = (color, width = W.line, opacity) => ({ fill: "none", stroke: color, strokeWidth: width, ...(opacity == null ? {} : { strokeOpacity: opacity }) });

/* Geometry tokens: every world uses these and nothing else. */
export const R = { lg: 14, md: 8, sm: 4 }; // corner radii: hero panels, props and chips, keys
export const W = { line: 3, fine: 2 }; // the only two stroke weights: connectors / fine detail
export const LIFT = { hero: 8, prop: 5 }; // flat drop-shadow offsets (shadow = same shape, C.shade, moved down)
export const BAR = 6; // height of a "text line" pill; radius BAR / 2

/* Time ------------------------------------------------------------------- */

export const T0 = 0.12; // lets the brand wipe start rising before anything appears
export const PHASE = { A: 0, B: 0.75, C: 1.9 };

export const SPRING = [0.34, 1.32, 0.64, 1]; // gentle overshoot for entrances
export const BOUNCE = [0.34, 1.56, 0.64, 1]; // livelier, for small props and particles

export const t = (delay = 0, duration = 0.5, ease = EASE) => ({ delay: T0 + delay, duration, ease });
export const exitT = (duration = 0.22) => ({ duration, ease: EASE_INOUT });
export const loop = (duration, extra = {}) => ({ duration, repeat: Infinity, ease: "linear", ...extra });
export const breathe = (duration, extra = {}) => ({ duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", ...extra });
export const steps = (n) => (p) => Math.min(1, Math.floor(p * n + 1e-6) / n);

/* Leaving: fade first, then snap transforms home while invisible, so nothing
   visibly travels back. Spread into a rest transition. */
export const resetAfterFade = (fade = 0.22) => ({ opacity: exitT(fade), default: { delay: fade + 0.04, duration: 0 } });

/** Settles a built pair at a quieter hover opacity (Motion owns `opacity`, so attributes would be ignored). */
export const dim = ({ rest, hover }, to) => ({ rest, hover: { ...hover, opacity: to } });

/* Deterministic variety: a stable pseudo-random in [0, 1) for index i. */
export const seed = (i, salt = 0) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/* Variant builders --------------------------------------------------------- */

const NONE = { rest: {}, hover: {} };
const HIDDEN = { rest: { opacity: 0, transition: exitT() }, hover: { opacity: 0 } };
const quiet = (delay = 0, to = 1) => ({
  rest: { opacity: 0, transition: exitT() },
  hover: { opacity: to, transition: { delay: Math.min(delay, 0.3), duration: 0.3 } },
});

/**
 * The world's motion kit. With `reduce` (reduced motion, or a touch device
 * showing the still tableau) every entrance collapses to a short fade, every
 * loop to nothing, and transient effects are hidden, so the scene settles on
 * its final composition without movement.
 */
export function motionKit(reduce) {
  return {
    reduce,

    /** Hero or prop entrance: rises, scales up with a gentle overshoot, optional turn. */
    enter: (delay = 0, { y = 14, x = 0, scale = 0.9, rotate = 0, duration = 0.6, ease = SPRING, to = 1 } = {}) =>
      reduce
        ? quiet(delay, to)
        : {
            rest: { opacity: 0, x, y, scale, rotate, transition: resetAfterFade() },
            hover: { opacity: to, x: 0, y: 0, scale: 1, rotate: 0, transition: { opacity: t(delay, 0.2), default: t(delay, duration, ease) } },
          },

    /** Small things popping in. */
    pop: (delay = 0, { scale = 0.3, x = 0, y = 0, rotate = 0, duration = 0.45, ease = BOUNCE, to = 1 } = {}) =>
      reduce
        ? quiet(delay, to)
        : {
            rest: { opacity: 0, scale, x, y, rotate, transition: resetAfterFade() },
            hover: { opacity: to, scale: 1, x: 0, y: 0, rotate: 0, transition: { opacity: t(delay, 0.15), default: t(delay, duration, ease) } },
          },

    fade: (delay = 0, duration = 0.35, to = 1) =>
      reduce ? quiet(delay, to) : { rest: { opacity: 0, transition: exitT() }, hover: { opacity: to, transition: t(delay, duration) } },

    /** Stroke draws itself on (connectors, branches, waves). Needs a stroke. */
    draw: (delay = 0, duration = 0.6, to = 1) =>
      reduce
        ? quiet(delay, to)
        : {
            rest: { pathLength: 0, opacity: 0, transition: resetAfterFade() },
            hover: { pathLength: 1, opacity: to, transition: { pathLength: t(delay, duration), opacity: t(delay, 0.12) } },
          },

    /** Grows from one edge (text bars, equalizer bars). Set style originX / originY on the element. */
    grow: (delay = 0, { axis = "x", duration = 0.4, ease = EASE, to = 1 } = {}) => {
      const k = axis === "x" ? "scaleX" : "scaleY";
      return reduce
        ? quiet(delay, to)
        : {
            rest: { opacity: 0, [k]: 0, transition: resetAfterFade() },
            hover: { opacity: to, [k]: 1, transition: { opacity: t(delay, 0.1), [k]: t(delay, duration, ease) } },
          };
    },

    /** Typewriter: animate the width of a clipPath rect in n steps. */
    type: (width, delay = 0, duration = 0.6, n = 12) =>
      reduce
        ? { rest: { width: 0 }, hover: { width, transition: { duration: 0 } } }
        : { rest: { width: 0, transition: resetAfterFade() }, hover: { width, transition: { ...t(delay, duration), ease: steps(n) } } },

    /* Phase C ambients. Put these on an INNER group, inside the element's
       entrance group, so the entrance and the loop never fight over a
       property. `at` is when the loop starts (defaults to phase C). */

    /** Gentle bob, with optional sway and tilt. */
    float: ({ at = PHASE.C, amp = 4, period = 3.2, sway = 0, tilt = 0 } = {}) =>
      reduce
        ? NONE
        : {
            rest: { x: 0, y: 0, rotate: 0, transition: { delay: 0.26, duration: 0 } },
            hover: {
              y: [0, -amp],
              ...(sway ? { x: [0, sway] } : {}),
              ...(tilt ? { rotate: [-tilt, tilt] } : {}),
              transition: {
                y: breathe(period / 2, { delay: T0 + at }),
                x: breathe(period * 0.71, { delay: T0 + at }),
                rotate: breathe(period * 0.87, { delay: T0 + at }),
              },
            },
          },

    /** Continuous rotation (records, gears, sparkles). Set transform origin on the element. */
    spin: ({ at = PHASE.B, period = 3, direction = 1 } = {}) =>
      reduce ? NONE : { rest: { rotate: 0, transition: { delay: 0.26, duration: 0 } }, hover: { rotate: 360 * direction, transition: loop(period, { delay: T0 + at }) } },

    /** Soft scale pulse (notification dots, hearts). */
    pulse: ({ at = PHASE.C, period = 1.6, to = 1.12 } = {}) =>
      reduce ? NONE : { rest: { scale: 1, transition: { delay: 0.26, duration: 0 } }, hover: { scale: [1, to], transition: breathe(period / 2, { delay: T0 + at }) } },

    /** Opacity shimmer for sparkles. Use on an inner group. */
    twinkle: ({ at = PHASE.C, period = 2.4, low = 0.35 } = {}) =>
      reduce ? NONE : { rest: { opacity: 1 }, hover: { opacity: [1, low, 1], transition: loop(period, { delay: T0 + at, ease: "easeInOut" }) } },

    /**
     * A particle that is emitted again and again: travels by (dx, dy) while
     * fading in and out, then waits and repeats. Hidden in the still tableau.
     */
    emit: ({ at = PHASE.C, dx = 0, dy = -40, period = 2.4, wait = 1.2, rotate = 0, to = 1 } = {}) =>
      reduce
        ? HIDDEN
        : {
            rest: { opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.6, transition: resetAfterFade() },
            hover: {
              opacity: [0, to, to, 0],
              x: [0, dx * 0.35, dx * 0.75, dx],
              y: [0, dy * 0.35, dy * 0.75, dy],
              rotate: [0, rotate * 0.5, rotate, rotate],
              scale: [0.6, 1, 1, 0.9],
              transition: { duration: period, delay: T0 + at, times: [0, 0.2, 0.75, 1], ease: "easeOut", repeat: Infinity, repeatDelay: wait },
            },
          },

    /** Shown in the full sequence only (e.g. something that flies away). */
    transient: (variants) => (reduce ? HIDDEN : variants),
    /** Shown in the still tableau only (e.g. the end state of a transient). */
    still: (delay = 0, to = 1) => (reduce ? quiet(delay, to) : HIDDEN),

    /** Use a custom pair in full motion, a fade in the still tableau. */
    custom: (variants, delay = 0, to = 1) => (reduce ? quiet(delay, to) : variants),
  };
}
