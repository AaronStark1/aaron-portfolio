import { motion as Motion } from "motion/react";
import World from "./World";
import { T0, t, exitT, fade, loop, breathe, resetAfterFade, draw, quiet } from "../../lib/worlds";

/* Discord — the gaming world. One big controller sits centre-right: its
   outline draws on, the shell fills in, the d-pad, sticks and face buttons
   pop into place. Then the signature: the buttons press in a quick rhythm,
   a "gg" bubble pops up off the shell and a pixel die tumbles in and lands
   beside the left grip. A pixel star twinkles and a pixel heart bobs. */

const OVER = [0.34, 1.56, 0.64, 1]; // spring-like overshoot

/** Pops in with overshoot. Same shape as `pop`, bouncier. */
const bounce = (delay = 0, { scale = 0.4, y = 0, duration = 0.55 } = {}) => ({
  rest: { opacity: 0, scale, y, transition: resetAfterFade() },
  hover: { opacity: 1, scale: 1, y: 0, transition: { opacity: t(delay, 0.15), default: t(delay, duration, OVER) } },
});
/** A leaf that simply follows its Motion parent's reveal. */
const shown = { rest: { opacity: 0, transition: exitT() }, hover: { opacity: 1, transition: t(0, 0.05) } };

/* Controller shell: lucide "gamepad-2" (ISC), 24-unit icon scaled ×7.4 so the
   body is 148 wide. World = TX + S·x, TY + S·y. The stroke overlaps its own
   start along the top edge so the dash-drawn outline closes cleanly. */
const S = 7.4;
const TX = 91.2;
const TY = 37;
const SHELL =
  "M17.32 5H6.68a4 4 0 0 0-3.978 3.59l-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258q-.01-.075-.017-.151A4 4 0 0 0 17.32 5";
const W = (x, y) => [TX + S * x, TY + S * y];

/* Geometry helpers: everything is one path per fill style. */
const circle = (cx, cy, r) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 z`;
const pill = (cx, cy, w, h) => {
  const r = h / 2;
  return `M ${cx - w / 2 + r} ${cy - r} h ${w - h} a ${r} ${r} 0 0 1 0 ${h} h ${-(w - h)} a ${r} ${r} 0 0 1 0 ${-h} z`;
};
const plus = (cx, cy, L, w) => {
  const h = w / 2;
  const a = L - h;
  return `M ${cx - h} ${cy - L} h ${w} v ${a} h ${a} v ${w} h ${-a} v ${a} h ${-w} v ${-a} h ${-a} v ${-w} h ${a} z`;
};

const [DX, DY] = W(8, 11); // d-pad centre
const [LSX, LSY] = W(10.4, 14.6); // sticks
const [RSX, RSY] = W(13.6, 14.6);
const [P1X, PY] = W(11.3, 8.6); // start / select
const [P2X] = W(12.7, 8.6);
const [BX, BY] = W(17.2, 11); // face-button diamond
const BR = 4.8;
const BGAP = 11;
const FACE = [
  [BX - BGAP, BY, 0.45, [0.85]], // left
  [BX, BY + BGAP, 0.49, [0.97, 1.21]], // down, tapped twice
  [BX + BGAP, BY, 0.53, [1.09]], // right
  [BX, BY - BGAP, 0.57, [1.33]], // up
];
const CONTROLS = `${plus(DX, DY, 13, 8)} ${circle(LSX, LSY, 7.4)} ${circle(RSX, RSY, 7.4)} ${pill(P1X, PY, 7.5, 4)} ${pill(P2X, PY, 7.5, 4)}`;
const STICK_CAPS = `${circle(LSX, LSY, 2.6)} ${circle(RSX, RSY, 2.6)}`;

/** Face button: pops in, then presses (scale dip + overshoot) at each time. */
const PRESS = 0.2;
const button = (popAt, presses) => {
  const total = presses[presses.length - 1] + PRESS - popAt;
  const f = (s) => (s - popAt) / total;
  const scale = [0.4, 1];
  const times = [0, f(popAt + 0.35)];
  const ease = [OVER];
  for (const p of presses) {
    scale.push(1, 0.5, 1);
    times.push(f(p), f(p + 0.07), f(p + PRESS));
    ease.push("linear", "easeIn", OVER);
  }
  return {
    rest: { opacity: 0, scale: 0.4, transition: resetAfterFade() },
    hover: { opacity: 1, scale, transition: { opacity: t(popAt, 0.15), scale: { ...t(popAt, total), times, ease } } },
  };
};

/* Pixel art: cells are [col, row, width]; one path, nonzero union. */
const pixels = (cells, p, ox, oy) => cells.map(([c, r, w]) => `M ${ox + c * p} ${oy + r * p} h ${w * p} v ${p} h ${-w * p} z`).join(" ");
const STAR = [[2, 0, 1], [1, 1, 3], [0, 2, 5], [1, 3, 3], [2, 4, 1]];
const HEART = [[1, 0, 2], [4, 0, 2], [0, 1, 7], [0, 2, 7], [1, 3, 5], [2, 4, 3], [3, 5, 1]];
const star = (cx, cy, p) => pixels(STAR, p, cx - 2.5 * p, cy - 2.5 * p);

/* Pixel die: stepped corners, face "5". */
const DIE_X = 82;
const DIE_Y = 176;
const dieBody = (cx, cy, s, n) => {
  const h = s / 2;
  const e = s - 2 * n;
  return `M ${cx - h + n} ${cy - h} h ${e} v ${n} h ${n} v ${e} h ${-n} v ${n} h ${-e} v ${-n} h ${-n} v ${-e} h ${n} z`;
};
const PIP = 3.6;
const DIE_PIPS = [[0, 0], [-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]]
  .map(([dx, dy]) => `M ${DIE_X + dx - PIP / 2} ${DIE_Y + dy - PIP / 2} h ${PIP} v ${PIP} h ${-PIP} z`)
  .join(" ");

const DIE_AT = 1.1;
const DIE_DUR = 0.8;
const tumble = {
  rest: { opacity: 0, x: 12, y: -80, rotate: -270, transition: resetAfterFade() },
  hover: {
    opacity: 1,
    x: 0,
    rotate: 0,
    y: [-80, 0, -16, 0, -4, 0],
    transition: {
      opacity: t(DIE_AT, 0.1),
      x: { ...t(DIE_AT, DIE_DUR * 0.48), ease: "linear" },
      rotate: { ...t(DIE_AT, DIE_DUR * 0.55), ease: "easeOut" },
      y: { ...t(DIE_AT, DIE_DUR), times: [0, 0.48, 0.68, 0.84, 0.93, 1], ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] },
    },
  },
};

/** Pixel star: pops in, then blinks on a loop. */
const twinkle = (delay, period) => ({
  rest: { opacity: 0, scale: 0.3, transition: resetAfterFade() },
  hover: {
    opacity: [0, 1, 0.4, 1, 0.45, 1, 0],
    scale: 1,
    transition: {
      opacity: loop(period, { delay: T0 + delay, times: [0, 0.06, 0.3, 0.5, 0.72, 0.92, 1], ease: "easeInOut" }),
      scale: t(delay, 0.45, OVER),
    },
  },
});

const heart = {
  rest: { opacity: 0, scale: 0.4, y: 0, transition: resetAfterFade() },
  hover: {
    opacity: 1,
    scale: 1,
    y: [0, -4],
    transition: { opacity: t(0.8, 0.15), scale: t(0.8, 0.5, OVER), y: breathe(1.4, { delay: T0 + 1.3 }) },
  },
};

export default function DiscordWorld({ reduce }) {
  const v = (full, delay) => (reduce ? quiet(delay) : full);
  const leaf = v(shown, 0);

  return (
    <World>
      {/* controller shell: the outline draws on, then the body fills */}
      <g transform={`translate(${TX} ${TY}) scale(${S})`} strokeWidth={3 / S}>
        <Motion.path d={`${SHELL}z`} fill="currentColor" fillOpacity={0.14} stroke="none" variants={v(fade(0.4, 0.4), 0)} />
        <Motion.path d={`${SHELL}H14`} variants={v(draw(0, 0.6), 0)} />
      </g>

      {/* controls: d-pad, sticks, start/select (and the face buttons when reduced) */}
      <Motion.g variants={v(bounce(0.5, { scale: 0.6, duration: 0.5 }), 0.1)}>
        <Motion.path d={reduce ? `${CONTROLS} ${FACE.map(([cx, cy]) => circle(cx, cy, BR)).join(" ")}` : CONTROLS} fill="currentColor" fillOpacity={0.14} variants={leaf} />
        <Motion.path d={STICK_CAPS} fill="currentColor" stroke="none" variants={leaf} />
      </Motion.g>
      {!reduce &&
        FACE.map(([cx, cy, popAt, presses]) => (
          <Motion.circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={BR} fill="currentColor" fillOpacity={0.14} variants={button(popAt, presses)} />
        ))}

      {/* "gg" pops up off the shell once the rhythm lands */}
      {!reduce && (
        <Motion.g variants={bounce(1.35, { scale: 0.5, y: 6 })}>
          <Motion.path
            d="M 198 45 h 42 q 4 0 4 4 v 16 q 0 4 -4 4 h -24 l -6 7 l -1 -7 h -11 q -4 0 -4 -4 v -16 q 0 -4 4 -4 z"
            fill="currentColor"
            fillOpacity={0.14}
            variants={shown}
          />
          <Motion.text x="213" y="62.5" fontSize="13" fontWeight="700" variants={shown}>
            gg
          </Motion.text>
        </Motion.g>
      )}

      {/* pixel heart off the right shoulder */}
      {!reduce && <Motion.path d={pixels(HEART, 2.4, 257.6, 84.8)} fill="currentColor" stroke="none" variants={heart} />}

      {/* pixel star in the band under the glyph */}
      <Motion.path d={star(40, 118, 3.5)} fill="currentColor" stroke="none" variants={v(twinkle(0.65, 2.5), 0.2)} />

      {/* the die tumbles in and lands beside the left grip */}
      <Motion.g variants={v(tumble, 0.3)}>
        <Motion.path d={dieBody(DIE_X, DIE_Y, 22, 2.5)} fill="currentColor" fillOpacity={0.14} variants={leaf} />
        <Motion.path d={DIE_PIPS} fill="currentColor" stroke="none" variants={leaf} />
      </Motion.g>
    </World>
  );
}
