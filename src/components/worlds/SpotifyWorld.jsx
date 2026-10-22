import { motion as Motion } from "motion/react";
import World from "./World";
import { Particle, Emitter } from "./kit";
import { rrect, circle } from "./shapes";
import { C, R, W, LIFT, PHASE, T0, fill, stroke, loop, motionKit } from "../../lib/worlds";
import { EASE } from "../../lib/motion";

/* Spotify — the record.
   A   the sleeve lands with a slight turn, the record slides out of it and
       the equalizer under the glyph rises bar by bar;
   B   the record spins up to speed and the equalizer starts keeping time;
   C   notes are released from the rim again and again while headphones and
       a few marks drift around the scene. */

const SLEEVE = { x: 92, y: 80, s: 96 }; // 96 × 96, turned -6° about its centre
const SC = { x: SLEEVE.x + SLEEVE.s / 2, y: SLEEVE.y + SLEEVE.s / 2 };
const DISC = { x: 214, y: 128, r: 64 };
const pivot = { transformBox: "view-box", originX: `${DISC.x}px`, originY: `${DISC.y}px` };

/* Arc of the disc, from angle a1 to a2 (degrees clockwise from 3 o'clock). */
const arc = (r, a1, a2) => {
  const p = (a) => [DISC.x + r * Math.cos((a * Math.PI) / 180), DISC.y + r * Math.sin((a * Math.PI) / 180)].map((n) => n.toFixed(1)).join(" ");
  return `M${p(a1)}A${r} ${r} 0 0 1 ${p(a2)}`;
};

/* Equalizer: five bars on a shared baseline under the glyph. */
const EQ = { x: 20, base: 204, w: 9, gap: 5, h: [30, 48, 36, 56, 26] };
const EQ_TEMPO = [1.15, 0.9, 1.3, 1.0, 1.2];

/* Spin-up: the outer group accelerates through 120° and leaves at the loop's
   speed (the curve ends with slope 1), the inner group then turns forever. */
const SPIN_UP = 0.9;
const SPIN_PERIOD = (360 * SPIN_UP) / 120;

export default function SpotifyWorld({ reduce }) {
  const m = motionKit(reduce);

  const spinUp = m.custom({
    rest: { rotate: 0, transition: { delay: 0.26, duration: 0 } },
    hover: { rotate: 120, transition: t2(PHASE.B, SPIN_UP) },
  });
  const spinOn = reduce ? undefined : m.spin({ at: PHASE.B + SPIN_UP, period: SPIN_PERIOD });

  const eqPulse = (i) =>
    reduce
      ? undefined
      : {
          rest: { scaleY: 1, transition: { delay: 0.26, duration: 0 } },
          hover: {
            scaleY: [1, 0.42, 0.86, 0.55, 1],
            transition: loop(EQ_TEMPO[i], { delay: T0 + PHASE.B + 0.25 + i * 0.07, ease: "easeInOut", times: [0, 0.3, 0.55, 0.8, 1] }),
          },
        };

  return (
    <World>
      {/* Equalizer, under the glyph */}
      {EQ.h.map((h, i) => {
        const x = EQ.x + i * (EQ.w + EQ.gap);
        return (
          <Motion.g key={x} variants={m.grow(0.3 + i * 0.06, { axis: "y", duration: 0.45 })} style={{ originY: 1 }}>
            <Motion.rect x={x} y={EQ.base - h} width={EQ.w} height={h} rx={EQ.w / 2} style={{ ...fill(C.line), originY: 1 }} variants={eqPulse(i)} />
          </Motion.g>
        );
      })}

      {/* Sleeve, behind the record */}
      <g transform={`rotate(-6 ${SC.x} ${SC.y})`}>
        <Motion.g variants={m.enter(0, { rotate: -8, y: 16 })}>
          <path d={rrect(SLEEVE.x, SLEEVE.y + LIFT.prop, SLEEVE.s, SLEEVE.s, R.md)} style={fill(C.shade)} />
          <rect x={SLEEVE.x} y={SLEEVE.y} width={SLEEVE.s} height={SLEEVE.s} rx={R.md} style={fill(C.a2)} />
          <circle cx={SLEEVE.x + 30} cy={SLEEVE.y + 30} r="16" style={fill(C.a3)} />
          <rect x={SLEEVE.x + 12} y={SLEEVE.y + 66} width="44" height="6" rx="3" style={fill(C.surface)} />
          <rect x={SLEEVE.x + 12} y={SLEEVE.y + 78} width="28" height="6" rx="3" style={fill(C.a1)} />
        </Motion.g>
      </g>

      {/* The record: slides out of the sleeve, then spins */}
      <Motion.g variants={m.enter(0.15, { x: -62, y: 0, scale: 0.96, duration: 0.75, ease: EASE })}>
        <circle cx={DISC.x} cy={DISC.y + LIFT.hero} r={DISC.r} style={fill(C.shade)} />
        <circle cx={DISC.x} cy={DISC.y} r={DISC.r} style={fill(C.surface)} />
        <Motion.g variants={spinUp} style={pivot}>
          <Motion.g variants={spinOn} style={pivot}>
            {/* sheen: two short highlights that show the turn */}
            <path d={`${arc(51, 205, 240)} ${arc(41, 212, 236)} ${arc(51, 25, 60)} ${arc(41, 32, 56)}`} style={stroke(C.detail, W.line, 0.22)} />
            {[56, 46, 36].map((r) => (
              <circle key={r} cx={DISC.x} cy={DISC.y} r={r} style={stroke(C.surface2, W.fine)} />
            ))}
            <circle cx={DISC.x} cy={DISC.y} r="22" style={fill(C.a3)} />
            <circle cx={DISC.x} cy={DISC.y} r="14" style={stroke(C.surface, W.fine, 0.18)} />
            <circle cx={DISC.x + 9} cy={DISC.y - 11} r="3" style={fill(C.a1)} />
            <path d={circle(DISC.x, DISC.y, 3.5)} style={fill(C.surface)} />
          </Motion.g>
        </Motion.g>
      </Motion.g>

      {/* Phase C: notes released from the rim, again and again */}
      <Emitter m={m} glyph="note" x={168} y={86} size={20} color={C.a1} at={PHASE.C - 0.4} dx={-42} dy={-30} rotate={-14} period={2.6} wait={1.6} />
      <Emitter m={m} glyph="note" x={186} y={72} size={18} color={C.line} at={PHASE.C + 0.9} dx={-14} dy={-36} rotate={10} period={2.4} wait={1.9} />

      {/* Supporting particles: one family, varied motion */}
      <Particle m={m} glyph="headphones" x={46} y={114} size={30} color={C.a1} enter={0.5} amp={4} period={3.8} tilt={5} />
      <Particle m={m} glyph="notes" x={262} y={56} size={22} color={C.line} enter={0.62} amp={5} period={3.2} tilt={6} />
      <Particle m={m} glyph="spark" x={98} y={206} size={14} color={C.a3} enter={0.8} motion="twinkle" period={2.2} />
      <Particle m={m} glyph="ring" x={282} y={192} size={12} color={C.line} enter={0.86} amp={3} period={3.4} />
      <Particle m={m} glyph="dot" x={140} y={44} size={9} color={C.a2} enter={0.9} amp={3} period={2.6} sway={2} />
    </World>
  );
}

/* Spin-up timing: starts from rest, leaves at constant speed. */
function t2(at, duration) {
  return { delay: T0 + at, duration, ease: [0.6, 0, 0.8, 0.8] };
}
