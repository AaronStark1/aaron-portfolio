import { motion as Motion } from "motion/react";
import World from "./World";
import { Particle } from "./kit";
import { rrect, circle } from "./shapes";
import { C, R, W, LIFT, PHASE, T0, BOUNCE, fill, stroke, t, resetAfterFade, motionKit } from "../../lib/worlds";

/* Discord — the gamepad.
   A   the pad lands with a small turn and a soft bounce; a die settles in
       behind its left grip while the marks pop in around it;
   B   a quick combo: the d-pad nudges, the four face buttons press in turn,
       the right stick tilts, and a pixel heart pops off the pad;
   C   the heart, the die and the marks drift at their own pace while the
       right stick idles under an invisible thumb. */

/* The pad: a symmetrical silhouette drawn on a 0.94 grid around (cx, top).
   HALF is the right half as cubic segments; the left half mirrors it. */
const PAD = { cx: 186, top: 73, k: 0.94 };
const P = (x, y) => [PAD.cx + PAD.k * x, PAD.top + PAD.k * y];
const HALF = [
  [[68, 0], [82, 10], [86, 28]], // shoulder
  [[90, 46], [96, 80], [94, 100]], // outer edge, flaring into the grip
  [[92, 118], [72, 128], [58, 118]], // grip
  [[47, 110], [40, 92], [28, 86]], // inner edge of the grip
];
const padPath = (dy = 0) => {
  const pt = ([x, y], s = 1) => {
    const [px, py] = P(s * x, y);
    return `${px.toFixed(1)} ${(py + dy).toFixed(1)}`;
  };
  const ends = [[46, 0], ...HALF.map((c) => c[2])];
  const right = HALF.map((c) => `C${c.map((p) => pt(p)).join(" ")}`).join("");
  const left = HALF.map((c, k) => `C${pt(c[1], -1)} ${pt(c[0], -1)} ${pt(ends[k], -1)}`)
    .reverse()
    .join("");
  return `M${pt([-46, 0])}L${pt([46, 0])}${right}C${pt([16, 80])} ${pt([-16, 80])} ${pt([-28, 86])}${left}Z`;
};
const padPivot = { transformBox: "view-box", originX: `${PAD.cx}px`, originY: `${P(0, 58)[1]}px` };

const [DPAD, FACE, STICK_L, STICK_R] = [P(-50, 34), P(50, 34), P(-22, 62), P(22, 62)];
const [GRIP_L, GRIP_R] = [P(-72, 126), P(72, 126)];

/* Face buttons in the order of the combo; the fuchsia one fires the heart. */
const BUTTONS = [
  { dx: -12, dy: 0, color: C.detail, at: 0.82 },
  { dx: 0, dy: -12, color: C.a2, at: 0.92 },
  { dx: 0, dy: 12, color: C.a1, at: 1.02 },
  { dx: 12, dy: 0, color: C.a3, at: 1.14 },
];

/* D-pad: a plus with rounded arm ends. */
const plus = ([cx, cy], h, a, r) =>
  `M${cx - a} ${cy - h + r}A${r} ${r} 0 0 1 ${cx - a + r} ${cy - h}H${cx + a - r}A${r} ${r} 0 0 1 ${cx + a} ${cy - h + r}V${cy - a}H${cx + h - r}` +
  `A${r} ${r} 0 0 1 ${cx + h} ${cy - a + r}V${cy + a - r}A${r} ${r} 0 0 1 ${cx + h - r} ${cy + a}H${cx + a}V${cy + h - r}A${r} ${r} 0 0 1 ${cx + a - r} ${cy + h}` +
  `H${cx - a + r}A${r} ${r} 0 0 1 ${cx - a} ${cy + h - r}V${cy + a}H${cx - h + r}A${r} ${r} 0 0 1 ${cx - h} ${cy + a - r}V${cy - a + r}A${r} ${r} 0 0 1 ${cx - h + r} ${cy - a}H${cx - a}Z`;

const pair = (a, b, r) => `${circle(a[0], a[1], r)}${circle(b[0], b[1], r)}`;

/* Pixel heart, 7 × 6 cells of size u, from its top-left corner. */
const HEART = { x: 246, y: 59, u: 5, at: 1.2 };
const HC = { x: HEART.x + 3.5 * HEART.u, y: HEART.y + 3 * HEART.u };
const pixelHeart = (u, dy = 0) =>
  `M${u} ${dy}H${3 * u}V${u + dy}H${4 * u}V${dy}H${6 * u}V${u + dy}H${7 * u}V${3 * u + dy}H${6 * u}V${4 * u + dy}H${5 * u}V${5 * u + dy}H${4 * u}V${6 * u + dy}` +
  `H${3 * u}V${5 * u + dy}H${2 * u}V${4 * u + dy}H${u}V${3 * u + dy}H0V${u + dy}H${u}Z`;
const heartPivot = { transformBox: "view-box", originX: `${HC.x}px`, originY: `${HC.y}px` };

/* Pop lines around the heart as it lands. */
const ray = (deg, r1, r2) => {
  const [c, s] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  return `M${(HC.x + r1 * c).toFixed(1)} ${(HC.y + r1 * s).toFixed(1)}L${(HC.x + r2 * c).toFixed(1)} ${(HC.y + r2 * s).toFixed(1)}`;
};
const RAYS = [-160, -115, -65, -20].map((a) => ray(a, 23, 29)).join("");

/* Turned against the grip's edge so its corner tucks clearly behind it. */
const DIE = { x: 83, y: 160, s: 30, turn: 18 };
const BUMPERS = (dy = 0) => `${rrect(PAD.cx - 77, PAD.top - 6 + dy, 37, 14, 7)}${rrect(PAD.cx + 40, PAD.top - 6 + dy, 37, 14, 7)}`;

export default function DiscordWorld({ reduce }) {
  const m = motionKit(reduce);
  const snapHome = { delay: 0.26, duration: 0 };

  const press = (at) =>
    m.custom({
      rest: { scale: 1, transition: snapHome },
      hover: { scale: [1, 0.66, 1.16, 1], transition: { delay: T0 + at, duration: 0.4, times: [0, 0.3, 0.7, 1], ease: "easeInOut" } },
    });

  const nudge = m.custom({
    rest: { x: 0, y: 0, transition: snapHome },
    hover: { x: [0, -2.5, 0, 0, 0], y: [0, 0, 0, 2.5, 0], transition: { delay: T0 + PHASE.B, duration: 0.55, times: [0, 0.22, 0.45, 0.7, 1], ease: "easeInOut" } },
  });

  const tilt = m.custom({
    rest: { x: 0, y: 0, transition: snapHome },
    hover: { x: [0, 3, 3, -2, 0], y: [0, -2.5, -2.5, 1.5, 0], transition: { delay: T0 + 0.9, duration: 0.8, times: [0, 0.2, 0.5, 0.75, 1], ease: "easeInOut" } },
  });

  const heartPop = m.custom(
    {
      rest: { opacity: 0, x: -16, y: 32, scale: 0.3, rotate: -20, transition: resetAfterFade() },
      hover: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, transition: { opacity: t(HEART.at, 0.1), default: t(HEART.at, 0.5, BOUNCE) } },
    },
    0.3
  );

  const burst = m.transient({
    rest: { opacity: 0, scale: 0.6, transition: resetAfterFade() },
    hover: { opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.12, 1.22], transition: { delay: T0 + HEART.at + 0.2, duration: 0.6, times: [0, 0.25, 0.7, 1], ease: "easeOut" } },
  });

  const u = HEART.u;

  return (
    <World>
      <defs>
        <clipPath id="discord-pad">
          <path d={padPath()} />
        </clipPath>
      </defs>

      {/* Die, behind the left grip */}
      <g transform={`translate(${DIE.x} ${DIE.y})`}>
        <Motion.g variants={m.pop(0.3, { scale: 0.4, rotate: -30, y: 8 })}>
          <Motion.g variants={m.float({ amp: 3, period: 4.0, tilt: 4 })}>
            {/* shadow drops straight down on screen, not along the die's turn */}
            <path d={rrect(-DIE.s / 2, -DIE.s / 2, DIE.s, DIE.s, R.md)} transform={`translate(0 ${LIFT.prop}) rotate(${DIE.turn})`} style={fill(C.shade)} />
            <g transform={`rotate(${DIE.turn})`}>
              <rect x={-DIE.s / 2} y={-DIE.s / 2} width={DIE.s} height={DIE.s} rx={R.md} style={fill(C.surface)} />
              <path d={`${circle(-6, -6, 2.6)}${circle(0, 0, 2.6)}${circle(6, 6, 2.6)}`} style={fill(C.detail)} />
            </g>
          </Motion.g>
        </Motion.g>
      </g>

      {/* The gamepad: bumpers, shadow, body, grip caps, wells, controls */}
      <Motion.g variants={m.enter(0, { rotate: -8, y: 18, scale: 0.9, duration: 0.65 })} style={padPivot}>
        <path d={`${padPath(LIFT.hero)}${BUMPERS(LIFT.hero)}`} style={fill(C.shade)} />
        <path d={BUMPERS()} style={fill(C.surface2)} />
        <path d={padPath()} style={fill(C.surface)} />
        <path d={pair(GRIP_L, GRIP_R, 28)} clipPath="url(#discord-pad)" style={fill(C.surface2)} />
        <path d={pair(DPAD, FACE, 21)} style={fill(C.surface2)} />
        <path d={pair(STICK_L, STICK_R, 13)} style={fill(C.surface2)} />
        <path d={`${rrect(PAD.cx - 16, PAD.top + 18, 11, 6, 3)}${rrect(PAD.cx + 5, PAD.top + 18, 11, 6, 3)}`} style={fill(C.detail, 0.4)} />

        <Motion.path d={plus(DPAD, 15, 5, R.sm)} variants={nudge} style={fill(C.detail)} />

        {BUTTONS.map((b) => (
          <Motion.circle key={b.at} cx={FACE[0] + b.dx} cy={FACE[1] + b.dy} r="6" variants={press(b.at)} style={fill(b.color)} />
        ))}

        {/* Left stick holds; the right one tilts in the combo, then idles */}
        <circle cx={STICK_L[0]} cy={STICK_L[1]} r="9.5" style={fill(C.detail)} />
        <circle cx={STICK_L[0]} cy={STICK_L[1]} r="5" style={stroke(C.surface, W.fine, 0.22)} />
        <Motion.g variants={tilt}>
          <Motion.g variants={m.float({ amp: 2, sway: 2, period: 3.4 })}>
            <circle cx={STICK_R[0]} cy={STICK_R[1]} r="9.5" style={fill(C.detail)} />
            <circle cx={STICK_R[0]} cy={STICK_R[1]} r="5" style={stroke(C.surface, W.fine, 0.22)} />
          </Motion.g>
        </Motion.g>
      </Motion.g>

      {/* Payoff: a pixel heart pops off the pad and lands on its shoulder */}
      <Motion.path d={RAYS} variants={burst} style={{ ...stroke(C.line, W.line), ...heartPivot }} />
      <g transform={`translate(${HEART.x} ${HEART.y})`}>
        <Motion.g variants={heartPop}>
          <Motion.g variants={m.float({ amp: 4, period: 3.6 })}>
            <path d={pixelHeart(u, LIFT.prop)} style={fill(C.shade)} />
            <path d={pixelHeart(u)} style={fill(C.a3)} />
            <rect x={u} y={u} width={u} height={u} style={fill(C.surface)} />
          </Motion.g>
        </Motion.g>
      </g>

      {/* Supporting marks: one family, varied motion */}
      <Particle m={m} glyph="smiley" x={46} y={110} size={26} color={C.line} enter={0.4} amp={4} period={3.8} tilt={6} />
      <Particle m={m} glyph="triangle" x={34} y={168} size={12} color={C.line} enter={0.55} motion="spin" period={4.2} />
      <Particle m={m} glyph="ring" x={122} y={48} size={12} color={C.a1} enter={0.5} amp={3} period={2.6} sway={2} />
      <Particle m={m} glyph="bolt" x={196} y={46} size={16} color={C.a2} enter={0.62} motion="pulse" period={2.8} />
      <Particle m={m} glyph="plus" x={284} y={194} size={13} color={C.line} enter={0.7} amp={3} period={3.2} sway={-2} />
    </World>
  );
}
