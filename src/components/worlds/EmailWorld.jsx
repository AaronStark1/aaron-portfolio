import { motion as Motion } from "motion/react";
import World from "./World";
import { Particle } from "./kit";
import { rrect, circle } from "./shapes";
import { C, R, W, BAR, LIFT, PHASE, T0, SPRING, BOUNCE, fill, stroke, exitT, resetAfterFade, motionKit } from "../../lib/worlds";
import { EASE } from "../../lib/motion";

/* Email — correspondence.
   A   the envelope rises with a small turn, a yellow envelope lands behind
       it and a notification badge pops on its corner;
   B   the flap folds open, a letter rises out of the pocket, folds into a
       paper plane, and the plane flies off along a dotted arc; the next
       letter then slides up into its place;
   C   the badge pulses softly while small mail marks drift around the scene.
   The still tableau is the final pose: the letter standing in the open
   envelope, the dotted trail of the sent one arcing away. */

/* Envelope: 154 × 98, flap and pocket notch meet 54 below the hinge. */
const ENV = { x: 116, y: 100, w: 154, h: 98 };
const X1 = ENV.x + ENV.w;
const Y1 = ENV.y + ENV.h;
const CX = ENV.x + ENV.w / 2;
const V = 54;
const K = R.md * (1 - Math.SQRT1_2); // where the corner arc meets 45°
const hinge = { transformBox: "view-box", originX: `${CX}px`, originY: `${ENV.y}px` };

/* A rounded apex: L to the point d before the tip, Q round it, on to the point d after. */
const apex = (ax, ay, tx, ty, bx, by, d = 7) => {
  const u = (px, py) => {
    const l = Math.hypot(px - tx, py - ty);
    return [tx + ((px - tx) * d) / l, ty + ((py - ty) * d) / l].map((n) => n.toFixed(1)).join(" ");
  };
  return `L${u(ax, ay)}Q${tx} ${ty} ${u(bx, by)}`;
};

/* Closed flap of a w × h envelope at (x, y): top edge with its rounded corners, down to the tip. */
const flapShut = (x, y, w, depth, d = 7) => {
  const r = R.md;
  return `M${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}${apex(x + w, y + r, x + w / 2, y + depth, x, y + r, d)}Z`;
};
/* Open flap: hinged on the top edge, tip up; leaves the corner arcs at 45°. */
const flapOpen = () => {
  const y = ENV.y;
  return `M${ENV.x + K} ${y + K}${apex(ENV.x + K, y + K, CX, y - V, X1 - K, y + K)}L${X1 - K} ${y + K}Z`;
};
/* Pocket front: the body below the V notch, rounded bottom corners. */
const POCKET = (() => {
  const r = R.md;
  return `M${ENV.x} ${ENV.y + r}${apex(ENV.x, ENV.y + r, CX, ENV.y + V, X1, ENV.y + r)}L${X1} ${ENV.y + r}V${Y1 - r}A${r} ${r} 0 0 1 ${X1 - r} ${Y1}H${ENV.x + r}A${r} ${r} 0 0 1 ${ENV.x} ${Y1 - r}Z`;
})();
/* Side folds of the pocket, faintly shaded, a paper-edge lip below the notch. */
const SIDES = (() => {
  const r = R.md;
  const lip = 4;
  const ty = ENV.y + V + lip;
  return `M${ENV.x} ${ENV.y + r + lip}L${CX} ${ty}L${ENV.x} ${Y1 - r}Z M${X1} ${ENV.y + r + lip}L${CX} ${ty}L${X1} ${Y1 - r}Z`;
})();

/* The letter: stands 40 above the envelope at the end, starts 46 lower, inside. */
const LET = { x: CX - 44, y: 60, w: 88, h: 104, drop: 46 };
const foldPivot = { transformBox: "view-box", originX: `${CX}px`, originY: "78px" };

/* Second envelope, behind the hero: 84 × 56, turned -10°. */
const BACK = { x: 60, y: 140, w: 84, h: 56 };
const BC = { x: BACK.x + BACK.w / 2, y: BACK.y + BACK.h / 2 };

/* Badge on the envelope's top-right corner. */
const BADGE = { x: X1 - 2, y: ENV.y + 2, r: 12 };

/* Paper plane, pointing along +x: the wing, its lower half folded under. */
const WING = "M22 0L-20 -13L-8 1L-14 14Z";
const KEEL = "M22 0L-8 1L-14 14Z";

/* Flight: a cubic from the letter, up and off the right edge. */
const P = [
  [196, 76],
  [220, 50],
  [262, 44],
  [334, 66],
];
const bez = (t, k) => (1 - t) ** 3 * P[0][k] + 3 * (1 - t) ** 2 * t * P[1][k] + 3 * (1 - t) * t ** 2 * P[2][k] + t ** 3 * P[3][k];
const dbez = (t, k) => 3 * (1 - t) ** 2 * (P[1][k] - P[0][k]) + 6 * (1 - t) * t * (P[2][k] - P[1][k]) + 3 * t ** 2 * (P[3][k] - P[2][k]);
/* The trail is the same curve cut at the card's edge (de Casteljau). */
const TRAIL = (() => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, 0) < 298) lo = mid;
    else hi = mid;
  }
  const s = lo;
  const lerp = (a, b) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  const a = lerp(P[0], P[1]);
  const b = lerp(P[1], P[2]);
  const c = lerp(P[2], P[3]);
  const ab = lerp(a, b);
  const bc = lerp(b, c);
  const e = lerp(ab, bc);
  const f = (q) => q.map((n) => n.toFixed(1)).join(" ");
  return `M${f(P[0])}C${f(a)} ${f(ab)} ${f(e)}`;
})();
const N = 10;
const FLIGHT = Array.from({ length: N + 1 }, (_, i) => {
  const u = i / N;
  const s = 0.5 * u + 0.5 * u * u; // eases in: the plane picks up speed, but clears the flap quickly
  return { u, x: bez(s, 0) - P[0][0], y: bez(s, 1) - P[0][1], r: (Math.atan2(dbez(s, 1), dbez(s, 0)) * 180) / Math.PI };
});

/* Signature timing (seconds into the sequence). */
const OPEN = PHASE.B; // flap folds up
const RISE = PHASE.B + 0.22; // letter rises
const FOLD = PHASE.B + 0.63; // letter folds away
const POP = FOLD + 0.16; // plane appears as the folded chip fades
const POP_D = 0.22;
const HOLD = 0.04;
const FLY_D = 0.6;
const TOTAL = POP_D + HOLD + FLY_D;
const TIMES = [0, POP_D / TOTAL, ...FLIGHT.map((f) => (POP_D + HOLD + f.u * FLY_D) / TOTAL)];
const SEG_EASE = [BOUNCE, ...TIMES.slice(2).map(() => "linear")];
const NEXT = POP + 0.45; // the next letter slides up once the plane has cleared the flap
const TRAIL_X = P[0][0] - 6;

/* Keyframes at absolute moments: [[time, value], …] → values + transition. */
const track = (pts, ease = "linear") => {
  const t0 = pts[0][0];
  const d = pts[pts.length - 1][0] - t0;
  return { values: pts.map((p) => p[1]), transition: { delay: T0 + t0, duration: d, times: pts.map((p) => (p[0] - t0) / d), ease } };
};

export default function EmailWorld({ reduce }) {
  const m = motionKit(reduce);
  const snap = { delay: 0.26, duration: 0 };

  /* Closed flap: shown with the envelope, folds up on its hinge, then goes. */
  const shut = track([
    [0, 1],
    [OPEN + 0.15, 1],
    [OPEN + 0.17, 0],
  ]);
  const flapFold = m.transient({
    rest: { opacity: 0, scaleY: 1, transition: resetAfterFade() },
    hover: {
      opacity: shut.values,
      scaleY: 0,
      transition: { opacity: shut.transition, scaleY: { delay: T0 + OPEN, duration: 0.16, ease: [0.55, 0, 1, 0.45] } },
    },
  });
  /* Open flap: unfolds upward from the same hinge. */
  const flapUp = m.custom({
    rest: { scaleY: 0, transition: snap },
    hover: { scaleY: 1, transition: { delay: T0 + OPEN + 0.14, duration: 0.26, ease: EASE } },
  });
  /* Letter rises out of the pocket, is folded away, and the next one rises in its place. */
  const y = track(
    [
      [RISE, LET.drop],
      [RISE + 0.42, 0],
      [FOLD + 0.24, 0],
      [FOLD + 0.25, LET.drop],
      [NEXT, LET.drop],
      [NEXT + 0.45, 0],
    ],
    [SPRING, "linear", "linear", "linear", EASE]
  );
  const rise = m.custom({ rest: { y: LET.drop, transition: snap }, hover: { y: y.values, transition: y.transition } });
  /* The fold: down in half, then in from the sides to a small chip, gone; back to a flat sheet unseen. */
  const op = track([
    [FOLD, 1],
    [FOLD + 0.12, 1],
    [FOLD + 0.2, 0],
    [NEXT, 0],
    [NEXT + 0.12, 1],
  ]);
  const sx = track([
    [FOLD, 1],
    [FOLD + 0.1, 1],
    [FOLD + 0.22, 0.35],
    [FOLD + 0.3, 1],
  ]);
  const sy = track([
    [FOLD, 1],
    [FOLD + 0.1, 0.45],
    [FOLD + 0.22, 0.2],
    [FOLD + 0.3, 1],
  ]);
  const fold = m.custom({
    rest: { opacity: 1, scaleX: 1, scaleY: 1, transition: snap },
    hover: { opacity: op.values, scaleX: sx.values, scaleY: sy.values, transition: { opacity: op.transition, scaleX: sx.transition, scaleY: sy.transition } },
  });
  /* The plane: pops out of the fold, then follows the arc off the card.
     The path moves the whole plane; the turn is applied to the plane and to
     its shadow separately, so the shadow always falls straight down. */
  const flight = { delay: T0 + POP, duration: TOTAL, times: TIMES, ease: SEG_EASE };
  const planeMove = m.transient({
    rest: { opacity: 0, x: 0, y: 0, transition: resetAfterFade() },
    hover: {
      opacity: [0, 1, ...FLIGHT.map((_, i) => (i === N ? 0 : 1))],
      x: [0, 0, ...FLIGHT.map((f) => f.x)],
      y: [0, 0, ...FLIGHT.map((f) => f.y)],
      transition: flight,
    },
  });
  const planeTurn = m.transient({
    rest: { rotate: FLIGHT[0].r - 40, scale: 0.3, transition: resetAfterFade() },
    hover: {
      scale: [0.3, 1, ...FLIGHT.map(() => 1)],
      rotate: [FLIGHT[0].r - 40, FLIGHT[0].r, ...FLIGHT.map((f) => f.r)],
      transition: flight,
    },
  });
  /* Fold flourish: a short burst where the letter becomes the plane. */
  const burst = m.transient({
    rest: { opacity: 0, scale: 0.5, transition: resetAfterFade() },
    hover: { opacity: [0, 1, 0], scale: [0.5, 1.1, 1.25], transition: { delay: T0 + POP - 0.04, duration: 0.42, times: [0, 0.35, 1], ease: "easeOut" } },
  });
  /* Dotted trail, revealed behind the plane, then left to settle quietly.
     It stays in the final pose, so the still tableau shows it too. */
  const trail = m.custom(
    {
      rest: { opacity: 0, transition: exitT() },
      hover: { opacity: [0, 1, 1, 0.6], transition: { delay: T0 + POP + POP_D, duration: 1.8, times: [0, 0.05, 0.55, 1] } },
    },
    0.4,
    0.6
  );
  /* The clip opens behind the plane (the still tableau keeps it fully open). */
  const trailClip = m.custom({
    rest: { width: 0, transition: snap },
    hover: { width: [0, 0, ...FLIGHT.map((f) => Math.max(0, P[0][0] + f.x - 14 - TRAIL_X))], transition: flight },
  });

  return (
    <World>
      <defs>
        <clipPath id="email-pocket">
          <rect x="0" y="0" width="300" height={Y1 - 3} />
        </clipPath>
        <clipPath id="email-trail">
          <Motion.rect x={TRAIL_X} y="20" height="80" width={300 - TRAIL_X} variants={trailClip} />
        </clipPath>
      </defs>

      {/* Second envelope, behind the hero */}
      <g transform={`rotate(-10 ${BC.x} ${BC.y})`}>
        <Motion.g variants={m.enter(0.14, { rotate: -8, y: 16 })}>
          <path d={rrect(BACK.x, BACK.y + LIFT.prop, BACK.w, BACK.h, R.md)} style={fill(C.shade)} />
          <rect x={BACK.x} y={BACK.y} width={BACK.w} height={BACK.h} rx={R.md} style={fill(C.a2)} />
          <path d={flapShut(BACK.x, BACK.y + LIFT.prop, BACK.w, 32, 5)} style={fill(C.shade, 0.55)} />
          <path d={flapShut(BACK.x, BACK.y, BACK.w, 32, 5)} style={fill(C.a2)} />
        </Motion.g>
      </g>

      {/* Dotted trail: emerges from behind the open flap */}
      <Motion.path d={TRAIL} clipPath="url(#email-trail)" variants={trail} style={{ ...stroke(C.line, W.line), strokeDasharray: "0 9" }} />

      {/* The envelope */}
      <Motion.g variants={m.enter(0, { rotate: -6, y: 18, scale: 0.92 })}>
        <path d={rrect(ENV.x, ENV.y + LIFT.hero, ENV.w, ENV.h, R.md)} style={fill(C.shade)} />
        {/* open flap (inside face), behind everything else */}
        <Motion.path d={flapOpen()} variants={flapUp} style={{ ...hinge, ...fill(C.surface2) }} />
        <rect x={ENV.x} y={ENV.y} width={ENV.w} height={ENV.h} rx={R.md} style={fill(C.surface2)} />

        {/* the letter, inside the pocket until it rises */}
        <g clipPath="url(#email-pocket)">
          <Motion.g variants={rise}>
            <Motion.g variants={fold} style={foldPivot}>
              <rect x={LET.x} y={LET.y} width={LET.w} height={LET.h} rx={R.sm} style={fill(C.surface)} />
              <rect x={LET.x + 12} y={LET.y + 12} width="38" height={BAR} rx={BAR / 2} style={fill(C.a1)} />
              <circle cx={LET.x + LET.w - 16} cy={LET.y + 15} r="5" style={fill(C.a2)} />
              <rect x={LET.x + 12} y={LET.y + 26} width="64" height={BAR} rx={BAR / 2} style={fill(C.detail, 0.22)} />
              <rect x={LET.x + 12} y={LET.y + 38} width="50" height={BAR} rx={BAR / 2} style={fill(C.detail, 0.22)} />
              <rect x={LET.x + 12} y={LET.y + 52} width="26" height={BAR} rx={BAR / 2} style={fill(C.a3)} />
            </Motion.g>
          </Motion.g>
        </g>

        <path d={POCKET} style={fill(C.surface)} />
        <path d={SIDES} style={fill(C.surface2)} />

        {/* closed flap, folds up on the hinge */}
        <Motion.g variants={flapFold} style={hinge}>
          <path d={flapShut(ENV.x, ENV.y + LIFT.prop, ENV.w, V)} style={fill(C.shade, 0.55)} />
          <path d={flapShut(ENV.x, ENV.y, ENV.w, V)} style={fill(C.surface)} />
        </Motion.g>
      </Motion.g>

      {/* The plane and the fold burst */}
      <g transform={`translate(${P[0][0]} ${P[0][1]})`}>
        <Motion.g variants={burst}>
          <path d="M-14 -14L-20 -20M0 -19V-27M14 -14L20 -20M-19 2H-27" style={stroke(C.a2, W.fine)} />
        </Motion.g>
        <Motion.g variants={planeMove}>
          <g transform={`translate(0 ${LIFT.prop})`}>
            <Motion.g variants={planeTurn}>
              <path d={WING} style={fill(C.shade)} />
            </Motion.g>
          </g>
          <Motion.g variants={planeTurn}>
            <path d={WING} style={fill(C.surface)} />
            <path d={KEEL} style={fill(C.a1)} />
          </Motion.g>
        </Motion.g>
      </g>

      {/* Badge on the corner */}
      <g transform={`translate(${BADGE.x} ${BADGE.y})`}>
        <Motion.g variants={m.pop(0.42, { scale: 0.2 })}>
          <Motion.g variants={m.pulse({ period: 2.4, to: 1.1 })}>
            <path d={circle(0, LIFT.prop, BADGE.r)} style={fill(C.shade)} />
            <circle cx="0" cy="0" r={BADGE.r} style={fill(C.a1)} />
            <path d="M-3 -3.5L1 -6V6" style={stroke(C.surface, W.line)} />
          </Motion.g>
        </Motion.g>
      </g>

      {/* Supporting particles */}
      <Particle m={m} glyph="at" x={40} y={110} size={24} color={C.line} enter={0.5} amp={4} period={3.6} tilt={5} />
      <Particle m={m} glyph="plus" x={128} y={54} size={12} color={C.a1} enter={0.62} amp={3} period={3} sway={2} />
      <Particle m={m} glyph="spark" x={30} y={170} size={14} color={C.a2} enter={0.78} motion="twinkle" period={2.2} />
      <Particle m={m} glyph="dot" x={84} y={94} size={9} color={C.a3} enter={0.84} amp={2} period={2.6} sway={2} />
      <Particle m={m} glyph="ring" x={284} y={170} size={12} color={C.line} enter={0.9} amp={3} period={4.2} />
    </World>
  );
}
