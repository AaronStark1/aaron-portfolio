import { useId } from "react";
import { motion as Motion } from "motion/react";
import Stage from "./Stage";
import { Particle } from "../../worlds/kit";
import { BOUNCE, C, PHASE, T0, exitT, fill, stroke, motionKit } from "../../../lib/worlds";
import { SW, n1, pivot, ping, rad } from "./geometry";

/* GitHub Advanced Security: the perimeter.
   A   a shield draws its perimeter around the badge, radar rings open out
       from behind it and a small dependency graph assembles on either side;
   B   the radar starts sweeping, each package pings as the beam crosses it,
       and a verified tick pops onto the shield's edge;
   C   the sweep keeps turning, rings keep pulsing out and the tick breathes. */

const O = { x: 240, y: 136 };

/* Shield round the badge: flat shoulders, straight sides, curving to a point. */
const SHIELD = "M240 24C278 42 318 48 352 46V126C352 192 304 232 240 256C176 232 128 192 128 126V46C162 48 202 42 240 24Z";

/* Radar: the beam's leading edge rests at SWEEP0 (still tableau) and turns
   clockwise once per PERIOD; the lit wedge trails behind it. */
const PERIOD = 4.8;
const SWEEP0 = -28;
const SPAN = 54;
const REACH = 270;
const FADE = 196; // beam radius at which it has faded out
const at = (deg, r) => [n1(O.x + r * Math.cos(rad(deg))), n1(O.y + r * Math.sin(rad(deg)))];
const LEAD = at(SWEEP0, REACH);
const TRAIL = at(SWEEP0 - SPAN, REACH);
const WEDGE = `M${O.x} ${O.y}L${LEAD[0]} ${LEAD[1]}A${REACH} ${REACH} 0 0 0 ${TRAIL[0]} ${TRAIL[1]}Z`;
const RINGS = [100, 128, 156, 184, 212];

/* Dependency graph: three packages each side, wired into the shield. */
const PACKAGES = [
  { x: 62, y: 92, pop: 0.42 },
  { x: 102, y: 150, pop: 0.34 },
  { x: 58, y: 204, pop: 0.48 },
  { x: 418, y: 88, pop: 0.44 },
  { x: 380, y: 146, pop: 0.36 },
  { x: 424, y: 202, pop: 0.5 },
].map((p) => {
  /* the moment the beam crosses this package, in seconds into the loop */
  const angle = (Math.atan2(p.y - O.y, p.x - O.x) * 180) / Math.PI;
  const lead = (((angle - SWEEP0) % 360) + 360) % 360;
  return { ...p, crossed: (PERIOD * lead) / 360 };
});
const WIRES = [
  { d: "M62 92L102 150", draw: 0.3 },
  { d: "M58 204L102 150", draw: 0.36 },
  { d: "M102 150H130", draw: 0.24 },
  { d: "M418 88L380 146", draw: 0.32 },
  { d: "M424 202L380 146", draw: 0.38 },
  { d: "M380 146H350", draw: 0.26 },
];

const TICK = { x: 342, y: 208, r: 18 };

export default function SecurityWorld({ reduce }) {
  const m = motionKit(reduce);
  const glow = `beam-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const pulseOut = m.transient({
    rest: { opacity: 0, scale: 1, transition: { opacity: exitT(), default: { delay: 0.26, duration: 0 } } },
    hover: {
      opacity: [0, 0.6, 0],
      scale: [1, 1.2, 2],
      transition: { duration: 2.4, times: [0, 0.12, 1], ease: "easeOut", repeat: Infinity, delay: T0 + PHASE.B + 0.2 },
    },
  });

  return (
    <Stage>
      <defs>
        <linearGradient id={glow} gradientUnits="userSpaceOnUse" x1={at(SWEEP0 - SPAN, 160)[0]} y1={at(SWEEP0 - SPAN, 160)[1]} x2={at(SWEEP0, 160)[0]} y2={at(SWEEP0, 160)[1]}>
          <stop offset="0" style={{ stopColor: C.a1, stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: C.a1, stopOpacity: 0.34 }} />
        </linearGradient>
        {/* the beam fades out with distance, long before it reaches the tile's corners and their labels */}
        <radialGradient id={`${glow}-fade`} gradientUnits="userSpaceOnUse" cx={O.x} cy={O.y} r={FADE}>
          <stop offset="0.45" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`${glow}-mask`} maskUnits="userSpaceOnUse" x={O.x - FADE} y={O.y - FADE} width={FADE * 2} height={FADE * 2}>
          <circle cx={O.x} cy={O.y} r={FADE} fill={`url(#${glow}-fade)`} />
        </mask>
      </defs>

      {/* Radar rings open out from behind the badge */}
      {RINGS.map((r, i) => (
        <Motion.g key={r} variants={m.enter(0.02 + i * 0.06, { y: 0, scale: 0.6, duration: 0.7, to: 0.9 })} style={pivot(O.x, O.y)}>
          <circle cx={O.x} cy={O.y} r={r} style={stroke(C.line, SW.hair, 0.34 - i * 0.055)} />
        </Motion.g>
      ))}
      <Motion.circle cx={O.x} cy={O.y} r="96" style={{ ...stroke(C.a1, SW.line), ...pivot(O.x, O.y) }} variants={pulseOut} />

      {/* The beam */}
      <Motion.g variants={m.fade(PHASE.B - 0.15, 0.4)}>
        <g mask={`url(#${glow}-mask)`}>
          <Motion.g style={pivot(O.x, O.y)} variants={m.spin({ at: PHASE.B, period: PERIOD })}>
            <path d={WEDGE} fill={`url(#${glow})`} />
            <path d={`M${O.x} ${O.y}L${LEAD[0]} ${LEAD[1]}`} style={stroke(C.a1, SW.line, 0.85)} />
          </Motion.g>
        </g>
      </Motion.g>

      {/* Shield perimeter, outer then inner */}
      <Motion.path d={SHIELD} style={stroke(C.line, SW.bold)} variants={m.draw(0.08, 0.9)} />
      <g transform={`translate(${O.x} ${O.y + 4}) scale(0.9) translate(${-O.x} ${-O.y - 4})`}>
        <Motion.path d={SHIELD} style={{ ...stroke(C.line, SW.hair, 0.55), strokeDasharray: "3 5" }} variants={m.fade(0.5, 0.5)} />
      </g>

      {/* Dependency graph */}
      {WIRES.map((w) => (
        <Motion.path key={w.d} d={w.d} style={stroke(C.line, SW.line, 0.6)} variants={m.draw(w.draw, 0.4)} />
      ))}
      {PACKAGES.map((p) => (
        <g key={`${p.x}-${p.y}`}>
          <Motion.circle cx={p.x} cy={p.y} r="12" style={stroke(C.a1, SW.line)} variants={ping(m, { at: PHASE.B + p.crossed, period: PERIOD, grow: 2.1 })} />
          <Motion.g variants={m.pop(p.pop, { scale: 0.3, rotate: -20 })}>
            <rect x={p.x - 9} y={p.y - 9} width="18" height="18" rx="4" style={{ ...stroke(C.line, SW.line), fill: C.surface }} />
            <path d={`M${p.x - 9} ${p.y - 3}H${p.x + 9}M${p.x - 3.5} ${p.y + 3.5}H${p.x + 3.5}`} style={stroke(C.line, SW.line, 0.85)} />
          </Motion.g>
        </g>
      ))}

      {/* Verified: a tick pops onto the shield's edge and draws itself */}
      <Motion.g variants={m.pop(PHASE.B + 0.15, { scale: 0.2, rotate: -30, duration: 0.55, ease: BOUNCE })}>
        <Motion.g variants={m.pulse({ period: 2.2, to: 1.07 })} style={pivot(TICK.x, TICK.y)}>
          <circle cx={TICK.x} cy={TICK.y + 3} r={TICK.r} style={fill(C.shade)} />
          <circle cx={TICK.x} cy={TICK.y} r={TICK.r} style={{ ...stroke(C.line, SW.line), fill: C.a1 }} />
          <Motion.path
            d={`M${TICK.x - 8} ${TICK.y + 0.5}L${TICK.x - 2} ${TICK.y + 6.5}L${TICK.x + 9} ${TICK.y - 6}`}
            style={stroke(C.a2, 3.5)}
            variants={m.draw(PHASE.B + 0.38, 0.35)}
          />
        </Motion.g>
      </Motion.g>

      {/* Sparks */}
      <Particle m={m} glyph="spark" x={150} y={28} size={15} color={C.a1} enter={0.7} motion="twinkle" period={2.2} />
      <Particle m={m} glyph="plus" x={300} y={250} size={10} color={C.line} enter={0.82} amp={3} period={3.3} tilt={8} />
    </Stage>
  );
}
