import { motion as Motion } from "motion/react";
import Stage from "./Stage";
import { Particle } from "../../worlds/kit";
import { C, PHASE, T0, fill, stroke, motionKit } from "../../../lib/worlds";
import { SW, along, n1, pivot, poly, rad, travel } from "./geometry";

/* Microsoft Azure Fundamentals: a cloud constellation.
   A   circuit traces draw out from behind the badge, nodes light up at their
       bends and four clouds spring out to the far ends; a dotted orbit opens
       around the badge;
   B   a data pulse starts circling on the orbit (smaller and fainter as it
       passes behind the badge) and packets run out along the traces;
   C   the clouds float, the two hub nodes breathe and a few sparks twinkle. */

/* A cloud from primitives: a rounded base and three domes, about 56 × 36
   around (0, 0). The outline is the union's: every part is stroked first at
   twice the weight, then every part is filled on top, which hides the
   strokes inside the shape and leaves half of them as its edge. */
const CLOUD = [
  { x: -27, y: 1, w: 54, h: 15, r: 7.5 },
  { cx: -14, cy: 3, r: 11 },
  { cx: 2, cy: -5, r: 15 },
  { cx: 16, cy: 4, r: 10 },
];
const cloudParts = (k, style) =>
  CLOUD.map((c, i) =>
    c.w ? (
      <rect key={i} x={n1(c.x * k)} y={n1(c.y * k)} width={n1(c.w * k)} height={n1(c.h * k)} rx={n1(c.r * k)} style={style} />
    ) : (
      <circle key={i} cx={n1(c.cx * k)} cy={n1(c.cy * k)} r={n1(c.r * k)} style={style} />
    )
  );

/* Clouds spring out from the badge: `from` is the offset back towards it. */
const CLOUDS = [
  { x: 94, y: 72, size: 60, from: [40, 20], enter: 0.42, period: 3.6 },
  { x: 400, y: 66, size: 40, from: [-34, 24], enter: 0.5, period: 3.1 },
  { x: 398, y: 196, size: 48, from: [-40, -16], enter: 0.56, period: 3.9 },
  { x: 74, y: 208, size: 34, from: [30, -20], enter: 0.62, period: 3.3 },
];

/* Circuit traces: right angles and 45° bends, starting under the badge. */
const TRACES = [
  { pts: [[210, 100], [156, 100], [140, 84], [118, 84]], draw: 0.1 },
  { pts: [[200, 160], [130, 160], [112, 142], [52, 142]], draw: 0.16 },
  { pts: [[130, 160], [130, 186], [108, 208], [86, 208]], draw: 0.34 },
  { pts: [[270, 108], [336, 108], [352, 92], [386, 92], [386, 76]], draw: 0.12 },
  { pts: [[336, 108], [336, 128], [354, 146], [444, 146]], draw: 0.36 },
  { pts: [[280, 172], [330, 172], [348, 190], [380, 190]], draw: 0.2 },
  { pts: [[228, 204], [228, 222], [214, 236], [196, 236]], draw: 0.28 },
];

const NODES = [
  { x: 156, y: 100, r: 4.5, hub: true, pop: 0.32 },
  { x: 130, y: 160, r: 4, pop: 0.36 },
  { x: 52, y: 142, r: 3.5, pop: 0.5 },
  { x: 336, y: 108, r: 4.5, hub: true, pop: 0.3 },
  { x: 444, y: 146, r: 3.5, pop: 0.58 },
  { x: 330, y: 172, r: 4, pop: 0.4 },
  { x: 196, y: 236, r: 3.5, pop: 0.46 },
];

/* Packets: which trace, and when the first one leaves. */
const PACKETS = [
  { trace: 0, at: PHASE.B + 0.1 },
  { trace: 3, at: PHASE.B + 0.55 },
  { trace: 5, at: PHASE.B + 0.95 },
  { trace: 1, at: PHASE.B + 1.35 },
].map((p) => ({ ...p, from: TRACES[p.trace].pts[0], path: along(TRACES[p.trace].pts, 24) }));

/* The orbit: a tilted ellipse round the badge. The pulse rests at HOME in the
   still tableau; in motion it goes round once per period, a little larger on
   the near side of the ellipse and smaller on the far side. */
const ORBIT = { cx: 240, cy: 140, rx: 182, ry: 50, tilt: -7 };
const HOME = 16;
const PERIOD = 5.6;
const orbitAt = (deg) => {
  const p = rad(deg);
  const t = rad(ORBIT.tilt);
  const ex = ORBIT.rx * Math.cos(p);
  const ey = ORBIT.ry * Math.sin(p);
  return [ORBIT.cx + ex * Math.cos(t) - ey * Math.sin(t), ORBIT.cy + ex * Math.sin(t) + ey * Math.cos(t)];
};
const LOOP = (() => {
  const home = orbitAt(HOME);
  const x = [];
  const y = [];
  const scale = [];
  const N = 72;
  for (let i = 0; i <= N; i += 1) {
    const deg = HOME + (360 * i) / N;
    const [px, py] = orbitAt(deg);
    x.push(n1(px - home[0]));
    y.push(n1(py - home[1]));
    scale.push(Number((0.78 + (0.34 * (Math.sin(rad(deg)) + 1)) / 2).toFixed(3)));
  }
  return { home, x, y, scale };
})();

export default function AzureWorld({ reduce }) {
  const m = motionKit(reduce);

  const circling = (lag) =>
    m.custom({
      rest: { x: 0, y: 0, scale: 1, transition: { delay: 0.26, duration: 0 } },
      hover: {
        x: LOOP.x,
        y: LOOP.y,
        scale: LOOP.scale,
        transition: { duration: PERIOD, ease: "linear", repeat: Infinity, delay: T0 + PHASE.B + lag },
      },
    });

  return (
    <Stage>
      {/* The orbit opens out from the badge */}
      <Motion.g variants={m.enter(0.04, { y: 0, scale: 0.55, duration: 0.8, to: 0.9 })} style={pivot(ORBIT.cx, ORBIT.cy)}>
        <ellipse
          cx={ORBIT.cx}
          cy={ORBIT.cy}
          rx={ORBIT.rx}
          ry={ORBIT.ry}
          transform={`rotate(${ORBIT.tilt} ${ORBIT.cx} ${ORBIT.cy})`}
          style={{ ...stroke(C.line, SW.bold, 0.5), strokeDasharray: "0.5 8" }}
        />
      </Motion.g>

      {/* Circuit traces */}
      {TRACES.map((tr) => (
        <Motion.path key={poly(tr.pts)} d={poly(tr.pts)} style={stroke(C.line, SW.line, 0.6)} variants={m.draw(tr.draw, 0.55)} />
      ))}

      {/* Packets running out to the clouds */}
      {PACKETS.map((p) => (
        <Motion.circle
          key={`${p.trace}-${p.at}`}
          cx={p.from[0]}
          cy={p.from[1]}
          r="3.6"
          style={fill(C.a1)}
          variants={travel(m, p.path, { at: p.at, duration: 1.05, wait: 1.7 })}
        />
      ))}

      {/* Nodes at the bends; the two hubs carry a breathing ring */}
      {NODES.map((n) => (
        <g key={`${n.x}-${n.y}`}>
          {n.hub && (
            <Motion.g variants={m.pop(n.pop + 0.08, { scale: 0.4 })}>
              <Motion.circle cx={n.x} cy={n.y} r="10" style={stroke(C.line, SW.hair, 0.7)} variants={m.pulse({ period: 2.4, to: 1.22 })} />
            </Motion.g>
          )}
          <Motion.circle cx={n.x} cy={n.y} r={n.r} style={fill(n.hub ? C.a1 : C.line)} variants={m.pop(n.pop, { scale: 0.2 })} />
        </g>
      ))}

      {/* Clouds */}
      {CLOUDS.map((c) => {
        const k = c.size / 56;
        return (
          <g key={`${c.x}-${c.y}`} transform={`translate(${c.x} ${c.y})`}>
            <Motion.g variants={m.enter(c.enter, { x: c.from[0], y: c.from[1], scale: 0.5, duration: 0.7 })}>
              <Motion.g variants={m.float({ amp: 3, period: c.period, tilt: 2 })}>
                <g transform="translate(0 4)">{cloudParts(k, fill(C.shade))}</g>
                {cloudParts(k, { ...fill(C.line), stroke: C.line, strokeWidth: SW.line * 2 })}
                {cloudParts(k, fill(C.surface))}
              </Motion.g>
            </Motion.g>
          </g>
        );
      })}

      {/* The orbiting pulse, with a short fading trail */}
      {[
        { r: 2.4, to: 0.35, lag: 0.18 },
        { r: 3.6, to: 0.6, lag: 0.09 },
      ].map((d) => (
        <Motion.g key={d.r} variants={m.transient(m.fade(PHASE.B, 0.3, d.to))}>
          <Motion.circle cx={n1(LOOP.home[0])} cy={n1(LOOP.home[1])} r={d.r} style={fill(C.a1)} variants={circling(d.lag)} />
        </Motion.g>
      ))}
      <Motion.g variants={m.pop(PHASE.B - 0.1, { scale: 0.2 })}>
        <Motion.circle cx={n1(LOOP.home[0])} cy={n1(LOOP.home[1])} r="6" style={{ ...fill(C.a1), stroke: C.surface, strokeWidth: 2 }} variants={circling(0)} />
      </Motion.g>

      {/* Sparks */}
      <Particle m={m} glyph="spark" x={190} y={38} size={15} color={C.a1} enter={0.7} motion="twinkle" period={2.2} />
      <Particle m={m} glyph="spark" x={302} y={242} size={11} color={C.a2} enter={0.78} motion="twinkle" period={2.8} />
      <Particle m={m} glyph="dot" x={444} y={104} size={8} color={C.a2} enter={0.84} amp={3} period={2.8} sway={2} />
      <Particle m={m} glyph="plus" x={40} y={100} size={11} color={C.line} enter={0.88} amp={3} period={3.4} tilt={8} />
    </Stage>
  );
}
