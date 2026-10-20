import { motion as Motion } from "motion/react";
import World from "./World";
import { T0, dim, draw, pop, loop, quiet, resetAfterFade, t } from "../../lib/worlds";

/* LinkedIn — the networking world. One composed constellation fills the
   centre-right: you (a large profile disc) appear first, then five contacts
   arrive one by one, each on the end of a freshly ruled spoke. Signature
   moment (~1.2–1.7 s): the outer ring closes the mesh in a single sweep,
   the hub emits a radar ping and a "+1" badge lands on your profile.
   Under the glyph, a conversation bubble sends dots along a dotted line.
   Every mark is its own Motion element so nothing lingers after exit. */

const HUB = { x: 186, y: 128, r: 30 };
const PEOPLE = [
  { x: 112, y: 78, r: 14 },
  { x: 222, y: 52, r: 12 },
  { x: 270, y: 122, r: 15 },
  { x: 236, y: 200, r: 13 },
  { x: 128, y: 184, r: 11 },
];

const f = (n) => Number(n.toFixed(1));

/* A ruled line from the rim of p to the rim of q, with a small gap. */
const link = (p, q, gap = 3) => {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return `M${f(p.x + ux * (p.r + gap))} ${f(p.y + uy * (p.r + gap))} L${f(q.x - ux * (q.r + gap))} ${f(q.y - uy * (q.r + gap))}`;
};

/* Profile figure as one path: disc, hollow head, shoulders meeting the rim.
   All subpaths wind the same way so a nonzero fill stays one flat disc. */
const ring = (x, y, r) => `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
const figure = ({ x, y, r }) => {
  const half = r * 0.68;
  const chord = y + r * 0.74;
  const R = r * 0.9;
  return `${ring(x, y, r)} ${ring(x, y - r * 0.2, r * 0.28)} M${f(x + half)} ${f(chord)}A${f(R)} ${f(R)} 0 0 0 ${f(x - half)} ${f(chord)}`;
};

const SPOKES = PEOPLE.map((p) => link(HUB, p));
const MESH = PEOPLE.map((p, i) => link(p, PEOPLE[(i + 1) % PEOPLE.length])).join(" ");
const FIGURES = PEOPLE.map(figure);
const HUB_FIGURE = figure(HUB);

/* Conversation bubble in the band under the glyph with two lines of "text"
   and a dotted line to the nearest contact. */
const BUBBLE = "M34 102h20a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-7l-6 7v-7h-7a6 6 0 0 1-6-6v-10a6 6 0 0 1 6-6z M36 110h16M36 116h9";
const DOTS = link({ x: 63, y: 111, r: -3 }, PEOPLE[0]);

const disc = { fill: "currentColor", fillOpacity: 0.12 };

export default function LinkedinWorld({ reduce }) {
  if (reduce) {
    return (
      <World>
        <Motion.path d={HUB_FIGURE} strokeWidth="3" {...disc} fillOpacity={0.16} variants={quiet(0)} />
        <Motion.path d={`${SPOKES.join(" ")} ${MESH}`} strokeWidth="1.5" variants={quiet(0.05)} />
        <Motion.path d={FIGURES.join(" ")} {...disc} variants={quiet(0.1)} />
        <Motion.rect x={158} y={76} width={36} height={18} rx={9} {...disc} fillOpacity={0.18} variants={quiet(0.2)} />
        <Motion.text x={176} y={89.5} fontSize="12" fontWeight="600" textAnchor="middle" variants={quiet(0.2)}>
          +1
        </Motion.text>
      </World>
    );
  }

  const ping = {
    rest: { opacity: 0, scale: 1, transition: resetAfterFade() },
    hover: {
      opacity: [0, 0.5, 0, 0],
      scale: [0.9, 1.9, 1.9],
      transition: {
        opacity: loop(2.6, { ease: "easeOut", delay: T0 + 1.15, times: [0, 0.1, 0.6, 1] }),
        scale: loop(2.6, { ease: "easeOut", delay: T0 + 1.15, times: [0, 0.6, 1] }),
      },
    },
  };

  const marching = {
    rest: { opacity: 0, strokeDashoffset: 0, transition: resetAfterFade() },
    hover: {
      opacity: 0.7,
      strokeDashoffset: [0, -12.2],
      transition: { opacity: t(1.55, 0.4), strokeDashoffset: loop(1.4, { delay: T0 + 1.55 }) },
    },
  };

  const badge = pop(1.2, { scale: 0.4, y: 8, duration: 0.4 });

  return (
    <World>
      {/* 1. You */}
      <Motion.path d={HUB_FIGURE} strokeWidth="3" {...disc} fillOpacity={0.16} variants={pop(0, { scale: 0.5, duration: 0.45 })} />

      {/* 2. Contacts arrive one by one, each on the end of a ruled spoke */}
      {SPOKES.map((d, i) => (
        <Motion.path key={`spoke-${i}`} d={d} variants={draw(0.15 + i * 0.12, 0.28)} />
      ))}
      {FIGURES.map((d, i) => (
        <Motion.path key={`person-${i}`} d={d} {...disc} variants={pop(0.28 + i * 0.12, { scale: 0.4, duration: 0.4 })} />
      ))}

      {/* 3. Signature: the outer ring closes in one sweep, the hub pings, "+1" lands */}
      <Motion.path d={MESH} strokeWidth="1.5" variants={dim(draw(0.95, 0.6), 0.55)} />
      <Motion.circle cx={HUB.x} cy={HUB.y} r={HUB.r} strokeWidth="1.5" variants={ping} />
      <Motion.rect x={158} y={76} width={36} height={18} rx={9} {...disc} fillOpacity={0.18} variants={badge} />
      <Motion.text x={176} y={89.5} fontSize="12" fontWeight="600" textAnchor="middle" variants={badge}>
        +1
      </Motion.text>

      {/* 4. Supporting, under the glyph: a conversation bubble reaching out */}
      <Motion.path d={BUBBLE} {...disc} variants={pop(1.45, { scale: 0.7, x: -6, duration: 0.45 })} />
      <Motion.path d={DOTS} strokeWidth={2} strokeDasharray="0.1 6" variants={marching} />
    </World>
  );
}
