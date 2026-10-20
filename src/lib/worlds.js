import { EASE, EASE_INOUT } from "./motion";

/* Shared vocabulary for the social "micro-worlds": tiny SVG scenes that play
   inside a tile while it is hovered or keyboard-focused. The tile propagates
   the variant labels "rest" and "hover" to every Motion element in its scene,
   so a world is just a set of elements whose variants name those two states.

   All worlds share one coordinate space (WORLD_VIEW, 1.2:1, matching the
   desktop card) and are rendered with `slice`; on the wider phone card
   (1.35:1) about 14 units are cropped top and bottom. Keep the action
   inside SAFE. */

export const WORLD_VIEW = "0 0 300 250";
export const SAFE = { x: 12, y: 16, w: 276, h: 218 }; // never put essentials outside this
export const CHROME = {
  // Tile furniture, in world units; keep the busy parts of a scene off these.
  glyph: { x: 0, y: 0, w: 72, h: 72 }, // brand mark, top-left
  handle: { x: 150, y: 0, w: 150, h: 34 }, // handle, top-right (appears on hover)
  label: { x: 0, y: 218, w: 120, h: 32 }, // platform name, bottom-left
  arrow: { x: 262, y: 216, w: 38, h: 34 }, // external arrow, bottom-right
};

/* Nothing should appear before the brand wipe has risen past the scene. */
export const T0 = 0.2;

/* Transition builders. `t` enters (ease-out), `exitT` leaves (ease-in-out). */
export const t = (delay = 0, duration = 0.5, ease = EASE) => ({ delay: T0 + delay, duration, ease });
export const exitT = (duration = 0.25) => ({ duration, ease: EASE_INOUT });

/* A continuous animation for the hover state. Motion stops it when the
   variant returns to "rest". */
export const loop = (duration, extra = {}) => ({ duration, repeat: Infinity, ease: "linear", ...extra });
export const breathe = (duration, extra = {}) => ({ duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", ...extra });

/* Stepped easing for typewriter-style reveals. */
export const steps = (n) => (p) => Math.min(1, Math.floor(p * n + 1e-6) / n);

/* On the way back to rest, fade first and only then snap positions home, so
   a plane that flew off never flies back. Spread into a rest transition. */
export const resetAfterFade = (fade = 0.25) => ({ opacity: { duration: fade, ease: EASE_INOUT }, default: { delay: fade + 0.05, duration: 0 } });

/* Variant builders. Each returns { rest, hover }. ---------------------------- */

/** Stroke draws itself on. */
export const draw = (delay = 0, duration = 0.6) => ({
  rest: { pathLength: 0, opacity: 0, transition: resetAfterFade() },
  hover: { pathLength: 1, opacity: 1, transition: { pathLength: t(delay, duration), opacity: t(delay, 0.15) } },
});

/** Pops in from a smaller scale (and an optional offset). */
export const pop = (delay = 0, { scale = 0.6, x = 0, y = 0, rotate = 0, duration = 0.5 } = {}) => ({
  rest: { opacity: 0, scale, x, y, rotate, transition: resetAfterFade() },
  hover: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, transition: t(delay, duration) },
});

/** Plain fade. */
export const fade = (delay = 0, duration = 0.4, to = 1) => ({
  rest: { opacity: 0, transition: exitT() },
  hover: { opacity: to, transition: t(delay, duration) },
});

/** Rises in from below (or any offset). */
export const rise = (delay = 0, { y = 10, x = 0, duration = 0.5 } = {}) => ({
  rest: { opacity: 0, y, x, transition: resetAfterFade() },
  hover: { opacity: 1, y: 0, x: 0, transition: t(delay, duration) },
});

/** Settles a built pair at a quieter hover opacity. Motion writes opacity to
    element.style, which beats an `opacity=""` attribute, so hierarchy lives in
    the variant rather than the markup. */
export const dim = ({ rest, hover }, to) => ({ rest, hover: { ...hover, opacity: to } });

/** Reduced motion: every builder collapses to an opacity-only reveal. */
export const quiet = (delay = 0) => ({
  rest: { opacity: 0, transition: { duration: 0.2 } },
  hover: { opacity: 1, transition: { delay: Math.min(delay, 0.3), duration: 0.3 } },
});
