import { motion as Motion } from "motion/react";
import World from "./World";
import { Particle } from "./kit";
import { circle } from "./shapes";
import { C, W, R, LIFT, PHASE, T0, fill, stroke, resetAfterFade, motionKit } from "../../lib/worlds";

/* LinkedIn — the network.
   A   your profile lands in the middle, then four contacts pop in around it
       one by one;
   B   connections are ruled from you to each of them in turn and a last
       line closes the mesh; a message bubble pops up beside you and a
       check badge lands on the newest contact;
   C   the two contacts on the closing line bob at their own rhythms while a
       dot keeps travelling between them, and a few marks drift or twinkle
       around the scene. */

const YOU = { x: 174, y: 122, r: 38, inner: 32 };
/* Only the two contacts on the closing link bob in phase C (no period = holds
   still), so the scene never moves all at once and the badge stays steady. */
const PEOPLE = [
  { x: 104, y: 84, r: 18, bg: C.a2, fg: C.surface },
  { x: 234, y: 58, r: 16, bg: C.surface2, fg: C.detail, amp: 2.5, period: 2.6 },
  { x: 268, y: 136, r: 15, bg: C.a1, fg: C.surface, amp: 2, period: 3.9 },
  { x: 218, y: 194, r: 17, bg: C.surface, fg: C.detail },
];
const NEWEST = PEOPLE[3];

const f = (n) => Number(n.toFixed(1));

/* Head-and-shoulders photo inside a disc: a head, and shoulders cut off by
   the rim (the arc of a lower circle). The backdrop is drawn around the
   figure (rim over the top, shoulder line back, head cut out) on a disc in
   the figure's colour, so the figure is the disc showing through.
   `over` lets the backdrop's rim run a hair outside the disc: the disc's own
   edge is then hidden under it and only shows as the shoulders, so no two
   anti-aliased edges are stacked anywhere (stacked edges left a pale seam
   under the shoulders on the card, a dark rim on the touch matte). */
const backdrop = (cx, cy, r, over = 0) => {
  const ro = r + over;
  const d = 0.9 * r;
  const rs = f(0.6 * r);
  const yi = (ro * ro - rs * rs + d * d) / (2 * d);
  const xi = Math.sqrt(ro * ro - yi * yi);
  const l = `${f(cx - xi)} ${f(cy + yi)}`;
  const rt = `${f(cx + xi)} ${f(cy + yi)}`;
  return `M${l}A${ro} ${ro} 0 1 1 ${rt}A${rs} ${rs} 0 0 0 ${l}Z ${circle(f(cx), f(cy - 0.16 * r), f(0.3 * r))}`;
};
const EDGE = 0.5;
const YOU_PHOTO = backdrop(YOU.x, YOU.y, YOU.inner);

/* Connections run centre to centre, under the discs, so a bobbing contact
   never shows a gap at either end. */
const line = (p, q) => `M${p.x} ${p.y}L${q.x} ${q.y}`;
const LINKS = [...PEOPLE.map((p) => line(YOU, p)), line(PEOPLE[1], PEOPLE[2])];
const LINK_AT = [0, 0.08, 0.16, 0.24, 0.34].map((d) => PHASE.B + d);

/* Message bubble beside you, lower left; its corner tail points up at your rim. */
const BUB = { x: 106, y: 154, w: 44, h: 26 };
const bubble = (o = 0) => {
  const { x, w, h } = BUB;
  const y = BUB.y + o;
  const r = R.md;
  return `M${x + r} ${y}H${x + w - 15}L${x + w} ${y - 8}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
};
const DOTS = [-9, 0, 9].map((dx) => circle(BUB.x + BUB.w / 2 + dx, BUB.y + BUB.h / 2, 2.6)).join("");

/* Check badge on the newest contact's shoulder. */
const BADGE = { x: f(NEWEST.x + NEWEST.r * 0.74), y: f(NEWEST.y - NEWEST.r * 0.74), r: 8 };
const CHECK = `M${BADGE.x - 3.5} ${BADGE.y + 0.2}L${BADGE.x - 1} ${BADGE.y + 2.7}L${BADGE.x + 3.6} ${BADGE.y - 2.4}`;

/* Travelling dot: along the closing line, from one contact to the next. */
const RUN = { from: PEOPLE[1], to: PEOPLE[2] };

export default function LinkedinWorld({ reduce }) {
  const m = motionKit(reduce);

  const travel = m.transient({
    rest: { opacity: 0, x: 0, y: 0, transition: resetAfterFade() },
    hover: {
      opacity: 1,
      x: [0, RUN.to.x - RUN.from.x],
      y: [0, RUN.to.y - RUN.from.y],
      transition: {
        opacity: { delay: T0 + PHASE.C + 0.3, duration: 0.01 },
        default: { delay: T0 + PHASE.C + 0.3, duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.0 },
      },
    },
  });

  return (
    <World>
      {/* Connections, under everything */}
      {LINKS.map((d, i) => (
        <Motion.path key={d} d={d} style={stroke(C.line, W.line)} variants={m.draw(LINK_AT[i], 0.28, 0.5)} />
      ))}
      <Motion.circle cx={RUN.from.x} cy={RUN.from.y} r="3.5" style={fill(C.a2)} variants={travel} />

      {/* You: the larger profile in the middle */}
      <Motion.g variants={m.enter(0, { y: 14, scale: 0.86 })}>
        <circle cx={YOU.x} cy={YOU.y + LIFT.hero} r={YOU.r} style={fill(C.shade)} />
        <circle cx={YOU.x} cy={YOU.y} r={YOU.r} style={fill(C.surface)} />
        <path d={YOU_PHOTO} fillRule="evenodd" style={fill(C.a1)} />
      </Motion.g>

      {/* Contacts, one by one */}
      {PEOPLE.map((p, i) => {
        const node = (
          <>
            <circle cx={p.x} cy={p.y + LIFT.prop} r={p.r} style={fill(C.shade)} />
            <circle cx={p.x} cy={p.y} r={p.r} style={fill(p.fg)} />
            <path d={backdrop(p.x, p.y, p.r, EDGE)} fillRule="evenodd" style={fill(p.bg)} />
            {p === NEWEST && (
              <Motion.g variants={m.pop(PHASE.B + 0.5, { scale: 0.2, y: -12 })}>
                <circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} style={{ ...stroke(C.surface, W.fine), ...fill(C.a3) }} />
                <path d={CHECK} style={stroke(C.surface, W.fine)} />
              </Motion.g>
            )}
          </>
        );
        return (
          <Motion.g key={p.x} variants={m.pop(0.22 + i * 0.1, { scale: 0.3, y: 6 })}>
            {p.period ? <Motion.g variants={m.float({ amp: p.amp, period: p.period })}>{node}</Motion.g> : node}
          </Motion.g>
        );
      })}

      {/* Message bubble, popping out of your rim */}
      <Motion.g variants={m.pop(PHASE.B + 0.25, { scale: 0.3, x: 8, y: -8 })} style={{ originX: 1, originY: 0 }}>
        <Motion.g variants={m.float({ amp: 2, period: 4.2, sway: 1.5 })}>
          <path d={bubble(LIFT.prop)} style={fill(C.shade)} />
          <path d={bubble()} style={fill(C.surface2)} />
          <path d={DOTS} style={fill(C.detail)} />
        </Motion.g>
      </Motion.g>

      {/* Supporting particles */}
      <Particle m={m} glyph="handshake" x={44} y={124} size={28} color={C.line} enter={0.5} amp={4} period={3.6} tilt={5} />
      <Particle m={m} glyph="ring" x={70} y={182} size={11} color={C.a1} enter={0.62} amp={3} period={2.4} sway={-2} />
      <Particle m={m} glyph="plus" x={158} y={46} size={12} color={C.a2} enter={0.72} amp={2.5} period={3.0} tilt={8} />
      <Particle m={m} glyph="spark" x={278} y={184} size={14} color={C.line} enter={0.82} motion="twinkle" period={2.8} />
    </World>
  );
}
