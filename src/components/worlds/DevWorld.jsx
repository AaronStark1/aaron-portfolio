import { motion as Motion } from "motion/react";
import World from "./World";
import { Particle, Emitter, Glyph } from "./kit";
import { rrect } from "./shapes";
import { C, R, LIFT, BAR, PHASE, T0, fill, t, resetAfterFade, motionKit } from "../../lib/worlds";
import { EASE } from "../../lib/motion";

/* DEV — writing in public.
   A   the article card lands and its indigo cover unrolls from the top edge,
       the code brackets pop onto it and a tag chip sticks to its corner;
   B   the title types itself out behind a cursor, the body lines run in,
       a code snippet slides out from behind the post and the reactions land;
   C   hearts keep rising beside the post while the snippet, the tag and a
       few marks drift, and the cursor blinks at the end of the title. */

const ART = { x: 124, y: 52, w: 152, h: 146 }; // the article card, hero
const COVER_H = 60;
const PAD = 14;
const CODE = { x: 78, y: 72, w: 66, h: 80, turn: -8 }; // snippet, behind the post
const CODE_C = { x: CODE.x + CODE.w / 2, y: CODE.y + CODE.h / 2 };
const TAG = { x: 227, y: 45, w: 48, h: 22, turn: 6 }; // tag chip, stuck over the top edge
const TAG_C = { x: TAG.x + TAG.w / 2, y: TAG.y + TAG.h / 2 };

/* Advance of the title after each letter (Instrument Sans 700 at 15 units,
   measured with getSubStringLength), so every typing step reveals whole
   letters and the cursor stops just after the last one. */
const ADV = [15.64, 21.48, 25.41, 31.66, 35.7, 44.96, 54.39, 57.23, 61.28, 70.57, 73.42, 82.83, 92.01, 101.42, 105.47, 109.49, 117.92];
const TITLE = { x: ART.x + PAD, y: ART.y + 81, size: 15, text: "Writing in public", w: ADV[ADV.length - 1] };
const TYPE = { at: PHASE.B, dur: 0.6, n: TITLE.text.length };
const CLIP_PAD = 2.5; // the title clip starts 2 units left of the text and ends 0.5 past the last letter

/* Stepped ease landing on letter boundaries: after k steps the moving edge
   sits at (pad + ADV[k - 1]) of a full run of (pad + TITLE.w). */
const letterSteps = (pad) => (p) => {
  const k = Math.min(TYPE.n, Math.floor(p * TYPE.n + 1e-6));
  return k ? (pad + ADV[k - 1]) / (pad + TITLE.w) : 0;
};
const LINES = [ART.w - 2 * PAD, ART.w - 2 * PAD - 18, 74]; // body text pills
const ROW_Y = ART.y + ART.h - 16; // reaction row centre

/* Rounded top corners only: the cover image sits flush with the card edge. */
const topRounded = (x, y, w, h, r) => `M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z`;

/* A stroke drawn as a filled pill between two points (so the art stays fills). */
const bar = (x1, y1, x2, y2, t) => {
  const L = Math.hypot(x2 - x1, y2 - y1);
  const nx = (-(y2 - y1) / L) * (t / 2);
  const ny = ((x2 - x1) / L) * (t / 2);
  const r = t / 2;
  const f = (n) => n.toFixed(2);
  return `M${f(x1 + nx)} ${f(y1 + ny)}L${f(x2 + nx)} ${f(y2 + ny)}A${r} ${r} 0 0 0 ${f(x2 - nx)} ${f(y2 - ny)}L${f(x1 - nx)} ${f(y1 - ny)}A${r} ${r} 0 0 0 ${f(x1 + nx)} ${f(y1 + ny)}Z`;
};

/* </> on the cover, centred on (cx, cy). */
const BRACKETS = (() => {
  const cx = ART.x + ART.w / 2;
  const cy = ART.y + COVER_H / 2;
  const h = 11; // half height of a chevron
  const t = 6.5;
  return [
    bar(cx - 15, cy - h, cx - 27, cy, t),
    bar(cx - 27, cy, cx - 15, cy + h, t),
    bar(cx + 15, cy - h, cx + 27, cy, t),
    bar(cx + 27, cy, cx + 15, cy + h, t),
    bar(cx + 5, cy - h - 2, cx - 5, cy + h + 2, t),
  ].join("");
})();

/* Code snippet: indented lines, a few in syntax colours. */
const CODE_LINES = [
  { x: 0, w: 26, c: C.a1 },
  { x: 8, w: 34, c: C.surface2 },
  { x: 8, w: 20, c: C.a3 },
  { x: 0, w: 30, c: C.surface2 },
];

const view = (x, y) => ({ originX: `${x}px`, originY: `${y}px`, transformBox: "view-box" });

export default function DevWorld({ reduce }) {
  const m = motionKit(reduce);

  /* Cursor: rides the typing edge in the same steps, then blinks. The blink
     runs on fill-opacity so it never fights the entrance over `opacity`. */
  const typed = T0 + TYPE.at + TYPE.dur;
  const cursor = m.custom(
    {
      rest: { x: -TITLE.w, opacity: 0, fillOpacity: 1, transition: resetAfterFade() },
      hover: {
        x: 0,
        opacity: 1,
        fillOpacity: [1, 0.15, 1],
        transition: {
          x: { delay: T0 + TYPE.at, duration: TYPE.dur, ease: letterSteps(0) },
          opacity: { delay: T0 + TYPE.at, duration: 0.05 },
          fillOpacity: { delay: typed + 0.2, duration: 1.6, ease: "easeInOut", repeat: Infinity },
        },
      },
    },
    TYPE.at
  );

  /* Title clip: m.type's run, stepped on the letter boundaries. */
  const typing = m.type(TITLE.w + CLIP_PAD, TYPE.at, TYPE.dur, TYPE.n);
  const titleClip = reduce ? typing : { ...typing, hover: { ...typing.hover, transition: { ...typing.hover.transition, ease: letterSteps(CLIP_PAD) } } };

  /* Cover: a clip opens downwards from the top edge, so the corners stay crisp. */
  const coverOpen = m.custom({
    rest: { height: 0, transition: resetAfterFade() },
    hover: { height: COVER_H, transition: t(0.26, 0.5) },
  });

  return (
    <World>
      <defs>
        <clipPath id="dev-cover">
          <Motion.rect x={ART.x} y={ART.y} width={ART.w} height={COVER_H} variants={coverOpen} />
        </clipPath>
        <clipPath id="dev-title">
          <Motion.rect x={TITLE.x - 2} y={TITLE.y - 16} height="22" variants={titleClip} />
        </clipPath>
      </defs>

      {/* Code snippet, behind the post: slides out from under it */}
      <g transform={`rotate(${CODE.turn} ${CODE_C.x} ${CODE_C.y})`}>
        <Motion.g variants={m.enter(PHASE.B + 0.05, { x: 44, y: 4, scale: 0.96, rotate: 6, duration: 0.8, ease: EASE })}>
          <Motion.g variants={m.float({ amp: 3, period: 4.2, tilt: 1.5 })} style={view(CODE_C.x, CODE_C.y)}>
            <path d={rrect(CODE.x, CODE.y + LIFT.prop, CODE.w, CODE.h, R.md)} style={fill(C.shade)} />
            <rect x={CODE.x} y={CODE.y} width={CODE.w} height={CODE.h} rx={R.md} style={fill(C.surface)} />
            {CODE_LINES.map((l, i) => (
              <rect key={i} x={CODE.x + 11 + l.x} y={CODE.y + 14 + i * 13} width={l.w} height={BAR} rx={BAR / 2} style={fill(l.c)} />
            ))}
          </Motion.g>
        </Motion.g>
      </g>

      {/* The article */}
      <Motion.g variants={m.enter(0, { y: 16, rotate: -3 })} style={view(ART.x + ART.w / 2, ART.y + ART.h / 2)}>
        <path d={rrect(ART.x, ART.y + LIFT.hero, ART.w, ART.h, R.lg)} style={fill(C.shade)} />
        <rect x={ART.x} y={ART.y} width={ART.w} height={ART.h} rx={R.lg} style={fill(C.surface)} />

        {/* cover unrolls from the top edge, then the brackets pop on */}
        <path d={topRounded(ART.x, ART.y, ART.w, COVER_H, R.lg)} clipPath="url(#dev-cover)" style={fill(C.a1)} />
        <Motion.g variants={m.pop(0.6, { scale: 0.5 })} style={view(ART.x + ART.w / 2, ART.y + COVER_H / 2)}>
          <path d={BRACKETS} style={fill(C.surface)} />
        </Motion.g>

        {/* title, typed, with its cursor */}
        <text x={TITLE.x} y={TITLE.y} className="w-sans" fontSize={TITLE.size} fontWeight="700" clipPath="url(#dev-title)" style={fill(C.detail)}>
          {TITLE.text}
        </text>
        <Motion.rect x={TITLE.x + TITLE.w + 2} y={TITLE.y - 13} width="2" height="16" rx="1" variants={cursor} style={fill(C.a1)} />

        {/* body lines */}
        {LINES.map((w, i) => (
          <Motion.rect
            key={i}
            x={TITLE.x}
            y={TITLE.y + 9 + i * 10}
            width={w}
            height={BAR}
            rx={BAR / 2}
            variants={m.grow(PHASE.B + 0.32 + i * 0.09, { duration: 0.34 })}
            style={{ ...fill(C.surface2), originX: 0 }}
          />
        ))}

        {/* reactions */}
        <Motion.g variants={m.pop(PHASE.B + 0.58, { scale: 0.4, y: 4 })} style={view(TITLE.x + 15, ROW_Y)}>
          <Glyph glyph="heart" x={TITLE.x + 6} y={ROW_Y} size={15} color={C.a2} />
          <Glyph glyph="sparkle" x={TITLE.x + 24} y={ROW_Y} size={15} color={C.a3} />
        </Motion.g>
        <Motion.g variants={m.fade(PHASE.B + 0.68, 0.25)}>
          <rect x={TITLE.x + 38} y={ROW_Y - BAR / 2} width="20" height={BAR} rx={BAR / 2} style={fill(C.surface2)} />
          <Glyph glyph="bookmark" x={ART.x + ART.w - PAD - 6} y={ROW_Y} size={15} color={C.detail} />
        </Motion.g>
      </Motion.g>

      {/* Tag chip, stuck over the top edge of the cover */}
      <Motion.g variants={m.pop(0.48, { scale: 0.4, rotate: -14 })} style={view(TAG_C.x, TAG_C.y)}>
        <Motion.g variants={m.float({ at: PHASE.C + 0.4, amp: 2.5, period: 3.4, tilt: 3 })} style={view(TAG_C.x, TAG_C.y)}>
          <g transform={`rotate(${TAG.turn} ${TAG_C.x} ${TAG_C.y})`}>
            <rect x={TAG.x} y={TAG.y} width={TAG.w} height={TAG.h} rx={R.md} style={fill(C.a3)} />
            <Glyph glyph="hash" x={TAG.x + 12} y={TAG_C.y} size={13} color={C.detail} />
            <rect x={TAG.x + 22} y={TAG_C.y - BAR / 2} width="16" height={BAR} rx={BAR / 2} style={fill(C.detail)} />
          </g>
        </Motion.g>
      </Motion.g>

      {/* Phase C: hearts keep coming off the post and rising beside it */}
      <Emitter m={m} glyph="heart" x={120} y={184} size={16} color={C.a2} at={PHASE.C - 0.3} dx={-56} dy={-26} rotate={-14} period={2.6} wait={1.5} />
      <Emitter m={m} glyph="heart" x={44} y={204} size={12} color={C.line} at={PHASE.C + 0.8} dx={6} dy={-46} rotate={10} period={2.4} wait={1.8} />

      {/* Supporting particles */}
      <Particle m={m} glyph="pen" x={40} y={114} size={26} color={C.line} enter={0.55} amp={4} period={3.8} tilt={6} />
      <Particle m={m} glyph="spark" x={102} y={204} size={14} color={C.a3} enter={0.8} motion="twinkle" period={2.2} />
      <Particle m={m} glyph="dot" x={146} y={40} size={9} color={C.a2} enter={0.9} amp={3} period={2.6} sway={2} />
      <Particle m={m} glyph="ring" x={287} y={150} size={11} color={C.line} enter={0.86} amp={3} period={3} />
    </World>
  );
}
