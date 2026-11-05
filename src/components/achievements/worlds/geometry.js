import { T0, exitT } from "../../../lib/worlds";

/* Shared geometry for the featured-tile worlds on /achievements. They follow
   the social worlds (lib/worlds.js): the tile is the variant root ("rest" /
   "hover"), every shape names a palette role from `C`, and scenes play in
   the same three phases (A activation, B signature, C ambient). What differs
   is the stage: the tiles are 16:9 (16:10 on phones), so the scene is drawn
   on 480 × 270 and sliced to the tile, and the badge artwork sits in the
   middle of it, on top. Everything is composed around that badge.

   Keep clear of the tile furniture: the number (top left), the issuer (top
   right) and the Verify call (bottom right), and remember phones crop about
   24 units off each side. */

export const STAGE = "0 0 480 270";
export const MID = { x: 240, y: 135 };
export const BADGE = { x: 164, y: 59, s: 152 }; // the square the artwork is fitted into

/* Stroke weights at this scale (the stage renders at ~0.8 to ~2.2 px/unit). */
export const SW = { bold: 2.5, line: 1.75, hair: 1.1 };

export const n1 = (v) => Number(v.toFixed(1));
export const rad = (deg) => (deg * Math.PI) / 180;

/** Polyline to path data. */
export const poly = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");

/** n + 1 points at equal spacing along a polyline, as x / y offsets from its first point. */
export function along(points, n = 24) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    segs.push({ x0, y0, x1, y1, len, start: total });
    total += len;
  }
  const x = [];
  const y = [];
  for (let k = 0; k <= n; k += 1) {
    const d = (total * k) / n;
    const s = segs.find((g) => d <= g.start + g.len + 1e-6) ?? segs[segs.length - 1];
    const u = s.len ? (d - s.start) / s.len : 0;
    x.push(n1(s.x0 + (s.x1 - s.x0) * u - points[0][0]));
    y.push(n1(s.y0 + (s.y1 - s.y0) * u - points[0][1]));
  }
  return { x, y };
}

/** Pivot for rotations and scales about a point of the stage. */
export const pivot = (x, y) => ({ transformBox: "view-box", originX: `${x}px`, originY: `${y}px` });

/**
 * A data pulse that runs along `samples` (from `along`) again and again,
 * fading in at the start and out at the end. Hidden in the still tableau.
 */
export const travel = (m, samples, { at, duration = 0.9, wait = 1.4, to = 1 }) =>
  m.transient({
    rest: { opacity: 0, x: 0, y: 0, transition: { opacity: exitT(), default: { delay: 0.26, duration: 0 } } },
    hover: {
      x: samples.x,
      y: samples.y,
      opacity: samples.x.map((_, i, a) => (i === 0 || i === a.length - 1 ? 0 : to)),
      transition: { duration, delay: T0 + at, ease: "linear", repeat: Infinity, repeatDelay: wait },
    },
  });

/**
 * A ring that flashes out once per `period`, first at `at` (seconds into the
 * sequence). Used for pings that keep time with a loop elsewhere in a scene.
 */
export const ping = (m, { at, period, to = 0.9, grow = 1.9 }) =>
  m.transient({
    rest: { opacity: 0, scale: 0.6, transition: { opacity: exitT(), default: { delay: 0.26, duration: 0 } } },
    hover: {
      opacity: [0, to, 0, 0],
      scale: [0.6, 0.7, grow, grow],
      transition: { duration: period, delay: T0 + at, times: [0, 0.02, 0.2, 1], ease: "easeOut", repeat: Infinity },
    },
  });
