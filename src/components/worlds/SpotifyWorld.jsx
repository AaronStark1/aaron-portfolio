import { motion as Motion } from "motion/react";
import World from "./World";
import { T0, t, dim, draw, loop, breathe, pop, quiet, resetAfterFade } from "../../lib/worlds";

/* Spotify: the turntable.
   Storyboard — a big vinyl record pops in centre-right and starts turning
   (its sheen and label print show the spin); the equalizer under the glyph
   wakes and keeps time. The tonearm appears parked beside the platter, swings
   in over the grooves and drops with a soft settle (the signature, ~1.3 s).
   As the stylus lands, three notes are released from the record's left edge
   and drift up into the open air between glyph and disc, settling faint, while
   two sound-wave arcs draw themselves off the lower-right rim. The record keeps
   turning and the bars keep time for as long as the pointer stays. */

const C = { x: 186, y: 132 }; // platter centre
const R = 72; // platter radius
const PIVOT = { x: 271, y: 60 }; // tonearm bearing (parked counterweight stays inside SAFE)
const BASE = 186; // equalizer baseline
/* Plain marks inside a Motion group take the group's opacity, so they read as
   hidden at rest (the group's fade is squared, which is imperceptible). */
const kid = { opacity: "inherit" };

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (r, deg) => [(C.x + r * Math.cos(rad(deg))).toFixed(1), (C.y + r * Math.sin(rad(deg))).toFixed(1)];
/* Arc of the platter's circle, from angle a1 to a2 (degrees, clockwise from 3 o'clock). */
const arc = (r, a1, a2) => {
  const [x1, y1] = pt(r, a1);
  const [x2, y2] = pt(r, a2);
  return `M${x1} ${y1} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};

/* Equalizer: six pill bars in two interleaved sets so the rhythm is syncopated. */
const barsPath = (set) => set.map(([x, h]) => `M${x} ${BASE} v${-h}`).join(" ");
const BARS_A = [
  [24, 26],
  [48, 48],
  [72, 32],
];
const BARS_B = [
  [36, 40],
  [60, 22],
  [84, 44],
];

/* Notes: where each sits on the record's left edge, how far it drifts, and when. */
const NOTES = [
  { at: [120, 100], to: [-26, -32], delay: 1.15, tilt: -12 },
  { at: [138, 84], to: [-18, -42], delay: 1.3, tilt: 10 },
  { at: [122, 134], to: [-22, -24], delay: 1.45, tilt: -8 },
];

/* Platter group: pops in with the rim, then turns forever (linear, so the loop has no seam). */
const platter = {
  rest: { opacity: 0, scale: 0.8, rotate: 0, transition: resetAfterFade() },
  hover: {
    opacity: 1,
    scale: 1,
    rotate: 360,
    transition: { opacity: t(0.08, 0.2), scale: t(0.08, 0.5), rotate: loop(7, { delay: T0 + 0.08 }) },
  },
};

/* Tonearm: appears parked beside the record, swings in, overshoots a touch and settles on the groove. */
const arm = {
  rest: { opacity: 0, rotate: 45, transition: resetAfterFade() },
  hover: {
    opacity: 1,
    rotate: [45, -2.5, 0],
    transition: { opacity: t(0.35, 0.2), rotate: { ...t(0.6, 0.72), times: [0, 0.76, 1], ease: ["easeInOut", "easeOut"] } },
  },
};

/* Equalizer set: rises from the baseline and keeps pulsing at its own tempo. */
const bars = (delay, period, to) => ({
  rest: { opacity: 0, scaleY: 0.4, transition: resetAfterFade() },
  hover: { opacity: to, scaleY: [0.45, 1], transition: { opacity: t(delay, 0.25), scaleY: breathe(period, { delay: T0 + delay }) } },
});

/* A note released from the record: pops, drifts up and away, then rests faint. */
const note = ({ to: [dx, dy], delay, tilt }) => ({
  rest: { opacity: 0, x: 0, y: 0, rotate: tilt, scale: 0.5, transition: resetAfterFade() },
  hover: {
    opacity: [0, 1, 1, 0.7], // children inherit the group opacity, so this renders ~0.5
    x: [0, dx],
    y: [0, dy],
    rotate: [tilt, -tilt * 0.6],
    scale: 1,
    transition: { default: t(delay, 1.0), scale: t(delay, 0.3) },
  },
});

export default function SpotifyWorld({ reduce }) {
  const v = (full, delay) => (reduce ? quiet(delay) : full);
  const sets = reduce ? [[BARS_A.concat(BARS_B), 0.15, 0.6, 0.5]] : [[BARS_A, 0.15, 0.6, 0.55], [BARS_B, 0.25, 0.78, 0.45]];

  return (
    <World>
      {/* Equalizer, in the band under the glyph */}
      {sets.map(([set, delay, period, to]) => (
        <Motion.path key={set[0][0]} d={barsPath(set)} strokeWidth="7" variants={reduce ? dim(quiet(delay), to) : bars(delay, period, to)} style={{ originY: 1 }} />
      ))}

      {/* Platter rim and translucent disc */}
      <Motion.circle cx={C.x} cy={C.y} r={R} strokeWidth="3" fill="currentColor" fillOpacity="0.12" variants={v(pop(0, { scale: 0.8, duration: 0.55 }), 0)} />

      {/* Everything that turns: sheen, grooves, label, spindle */}
      <Motion.g variants={v(platter, 0.1)} style={{ transformBox: "view-box", originX: `${C.x}px`, originY: `${C.y}px` }}>
        <path d={`${arc(52, 196, 254)} ${arc(52, 16, 74)}`} strokeWidth="22" strokeOpacity="0.1" strokeLinecap="butt" style={kid} />
        <circle cx={C.x} cy={C.y} r="62" strokeWidth="1.5" strokeOpacity="0.35" style={kid} />
        <circle cx={C.x} cy={C.y} r="54" strokeWidth="1.5" strokeOpacity="0.35" style={kid} />
        <circle cx={C.x} cy={C.y} r="46" strokeWidth="1.5" strokeOpacity="0.35" style={kid} />
        <circle cx={C.x} cy={C.y} r="24" strokeWidth="2" fill="currentColor" fillOpacity="0.2" style={kid} />
        <path d={arc(15.5, 200, 300)} strokeWidth="2" style={kid} />
        <circle cx={pt(15.5, 60)[0]} cy={pt(15.5, 60)[1]} r="2.2" fill="currentColor" stroke="none" style={kid} />
        <circle cx={C.x} cy={C.y} r="3.5" fill="currentColor" stroke="none" style={kid} />
      </Motion.g>

      {/* Tonearm, swinging about its bearing */}
      <Motion.g variants={v(arm, 0.2)} style={{ transformBox: "view-box", originX: `${PIVOT.x}px`, originY: `${PIVOT.y}px` }}>
        <path d={`M${PIVOT.x} ${PIVOT.y} L244 92`} strokeWidth="3" style={kid} />
        <path d="M244 92 L237.5 99" strokeWidth="7" style={kid} />
        <path d="M236.5 100.5 l-2.5 2.5" strokeWidth="1.5" style={kid} />
        <path d={`M${PIVOT.x} ${PIVOT.y} l7 -7.5`} strokeWidth="3" style={kid} />
        <circle cx={PIVOT.x + 8.5} cy={PIVOT.y - 9} r="4" fill="currentColor" stroke="none" style={kid} />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="6" strokeWidth="2" fill="currentColor" fillOpacity="0.18" style={kid} />
      </Motion.g>

      {/* Sound-wave arcs off the lower-right rim */}
      {!reduce && <Motion.path d={arc(82, 18, 58)} strokeWidth="2" variants={dim(draw(1.2, 0.5), 0.5)} />}
      {!reduce && <Motion.path d={arc(92, 22, 56)} strokeWidth="1.5" variants={dim(draw(1.35, 0.5), 0.35)} />}

      {/* Notes released from the record */}
      {!reduce &&
        NOTES.map((n) => {
          const [x, y] = n.at;
          return (
            <Motion.g key={n.at.join()} variants={note(n)}>
              <ellipse cx={x} cy={y} rx="4.6" ry="3.3" transform={`rotate(-25 ${x} ${y})`} fill="currentColor" stroke="none" style={kid} />
              <path d={`M${x + 3.4} ${y - 1} V${y - 19} c4.8 1.3 7.6 4.6 6.3 9.8`} strokeWidth="2" style={kid} />
            </Motion.g>
          );
        })}
    </World>
  );
}
