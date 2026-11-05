import { motion as Motion } from "motion/react";
import Stage from "./Stage";
import { Particle } from "../../worlds/kit";
import { rrect } from "../../worlds/shapes";
import { BOUNCE, C, PHASE, T0, fill, stroke, motionKit } from "../../../lib/worlds";
import { SW, along, pivot, travel } from "./geometry";

/* Oracle APEX Cloud Developer: data in, an app out.
   A   three database layers drop onto a stack at the left, a wireframe page
       lands at the right with its 12-column guides, and chevrons slide out
       from behind the badge to bracket it like code;
   B   rows run from the database along a conduit under the badge, and the
       page fills in: chart columns rise, skeleton text grows;
   C   the drive lights blink, the cursor blinks in the form field and the
       brackets breathe. */

/* Database: three disks, 72 × 20 tops, 18 deep, stacked on a 28 pitch. */
const DB = { cx: 84, rx: 36, ry: 10, h: 18, tops: [98, 126, 154] };
const diskBody = (top) =>
  `M${DB.cx - DB.rx} ${top}V${top + DB.h}A${DB.rx} ${DB.ry} 0 0 0 ${DB.cx + DB.rx} ${top + DB.h}V${top}A${DB.rx} ${DB.ry} 0 0 1 ${DB.cx - DB.rx} ${top}Z`;

/* The page: a window with a title bar, a sidebar and three regions. */
const WIN = { x: 354, y: 64, w: 92, h: 124, bar: 16 };
const CONTENT = { x: 384, w: 54 };
const topRounded = (x, y, w, h, r) => `M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z`;
const COLUMNS = [
  { x: 391, h: 10 },
  { x: 401, h: 17 },
  { x: 411, h: 8 },
  { x: 421, h: 14 },
];
const COL_BASE = 113;
const SKELETON = [
  { x: 389, y: 130, w: 14 },
  { x: 389, y: 137, w: 9 },
  { x: 418, y: 130, w: 14 },
  { x: 418, y: 137, w: 10 },
];

/* Conduit from the foot of the stack, under the badge, up into the page. */
const PIPE = [
  [84, 186],
  [84, 226],
  [400, 226],
  [400, 190],
];
const PIPE_D = "M84 186V214Q84 226 96 226H388Q400 226 400 214V190";
const ROW = along(PIPE, 32);

/* Brackets either side of the badge. */
const CHEVRONS = [
  { d: "M156 112L139 135L156 158", from: 22, dir: -1 },
  { d: "M324 112L341 135L324 158", from: -22, dir: 1 },
];

export default function ApexWorld({ reduce }) {
  const m = motionKit(reduce);

  /* The brackets breathe apart and back in phase C */
  const breathe = (dir) =>
    reduce
      ? undefined
      : {
          rest: { x: 0, transition: { delay: 0.26, duration: 0 } },
          hover: { x: [0, 5 * dir], transition: { duration: 1.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: T0 + PHASE.C } },
        };
  const blink = m.custom({
    rest: { opacity: 0, transition: { duration: 0.15 } },
    hover: { opacity: [0, 1, 1, 0, 0], transition: { duration: 1.1, times: [0, 0.05, 0.5, 0.55, 1], repeat: Infinity, ease: "linear", delay: T0 + PHASE.C } },
  });

  return (
    <Stage>
      {/* Conduit, and the rows running along it */}
      <Motion.path d={PIPE_D} style={{ ...stroke(C.line, SW.bold, 0.5), strokeDasharray: "0.5 7" }} variants={m.fade(0.62, 0.4)} />
      {[0, 0.8, 1.6].map((lag) => (
        <Motion.rect
          key={lag}
          x={PIPE[0][0] - 4}
          y={PIPE[0][1] - 3}
          width="8"
          height="6"
          rx="2"
          style={fill(C.a1)}
          variants={travel(m, ROW, { at: PHASE.B + 0.2 + lag, duration: 1.6, wait: 0.8 })}
        />
      ))}

      {/* Database: the lowest layer lands first */}
      <Motion.ellipse cx={DB.cx} cy={DB.tops[2] + DB.h + 14} rx={DB.rx + 4} ry="7" style={fill(C.shade)} variants={m.fade(0.05, 0.3)} />
      {[...DB.tops].reverse().map((top, k) => (
        <Motion.g key={top} variants={m.enter(0.04 + k * 0.11, { y: -30, scale: 1, duration: 0.55, ease: BOUNCE })}>
          <path d={diskBody(top)} style={{ ...stroke(C.line, SW.line), fill: C.surface }} />
          <ellipse cx={DB.cx} cy={top} rx={DB.rx} ry={DB.ry} style={{ ...stroke(C.line, SW.line), fill: C.surface2 }} />
          <rect x={DB.cx - DB.rx + 8} y={top + 10} width="22" height="4.5" rx="2.25" style={fill(C.line, 0.3)} />
          {[0, 1].map((i) => (
            <Motion.g key={i} variants={m.twinkle({ period: 1.6 + i * 0.5 + k * 0.3, low: 0.2 })}>
              <circle cx={DB.cx + 14 + i * 9} cy={top + 13 - i} r="2.4" style={fill(C.a1)} />
            </Motion.g>
          ))}
        </Motion.g>
      ))}

      {/* Brackets */}
      {CHEVRONS.map((c) => (
        <Motion.g key={c.d} variants={m.enter(0.3, { x: c.from, y: 0, scale: 0.8, duration: 0.6 })}>
          <Motion.path d={c.d} style={stroke(C.a1, 4.5)} variants={breathe(c.dir)} />
        </Motion.g>
      ))}

      {/* The page */}
      <Motion.g variants={m.enter(0.12, { y: 14, scale: 0.92 })} style={pivot(WIN.x + WIN.w / 2, WIN.y + WIN.h / 2)}>
        <path d={rrect(WIN.x, WIN.y + 5, WIN.w, WIN.h, 8)} style={fill(C.shade)} />
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="8" style={{ ...stroke(C.line, SW.line), fill: C.surface }} />
        <path d={topRounded(WIN.x, WIN.y, WIN.w, WIN.bar, 8)} style={fill(C.surface2)} />
        <path d={`M${WIN.x} ${WIN.y + WIN.bar}H${WIN.x + WIN.w}`} style={stroke(C.line, SW.hair, 0.7)} />
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="8" style={stroke(C.line, SW.line)} />
        {[0, 7, 14].map((dx) => (
          <circle key={dx} cx={WIN.x + 10 + dx} cy={WIN.y + 8} r="2.1" style={fill(C.line, 0.55)} />
        ))}
        {/* sidebar */}
        <path d={`M${WIN.x + 22} ${WIN.y + WIN.bar}V${WIN.y + WIN.h}`} style={stroke(C.line, SW.hair, 0.4)} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={WIN.x + 6} y={WIN.y + 26 + i * 10} width={i === 1 ? 9 : 11} height="4" rx="2" style={fill(C.line, i ? 0.3 : 0.6)} />
        ))}
      </Motion.g>

      {/* 12-column guides behind the regions */}
      <Motion.g variants={m.fade(0.5, 0.4)}>
        {[392, 406, 420, 434].map((x) => (
          <path key={x} d={`M${x} ${WIN.y + 22}V${WIN.y + WIN.h - 6}`} style={{ ...stroke(C.line, SW.hair, 0.22), strokeDasharray: "2 3" }} />
        ))}
      </Motion.g>

      {/* Regions: a chart, two cards, a field and a button */}
      <Motion.rect x={CONTENT.x} y="88" width={CONTENT.w} height="30" rx="4" style={stroke(C.line, SW.hair, 0.75)} variants={m.draw(0.55, 0.4)} />
      {[CONTENT.x, CONTENT.x + 29].map((x, i) => (
        <Motion.rect key={x} x={x} y="124" width="25" height="22" rx="3" style={stroke(C.line, SW.hair, 0.7)} variants={m.draw(0.62 + i * 0.05, 0.35)} />
      ))}
      <Motion.rect x={CONTENT.x} y="154" width={CONTENT.w} height="12" rx="6" style={stroke(C.line, SW.hair, 0.7)} variants={m.draw(0.7, 0.35)} />
      <Motion.rect x={CONTENT.x} y="172" width="26" height="9" rx="4.5" style={fill(C.a1)} variants={m.pop(0.78, { scale: 0.5 })} />

      {COLUMNS.map((c, i) => (
        <Motion.rect
          key={c.x}
          x={c.x}
          y={COL_BASE - c.h}
          width="6"
          height={c.h}
          rx="1.5"
          style={{ ...fill(i === 1 ? C.a1 : C.line, i === 1 ? 1 : 0.55), originY: 1 }}
          variants={m.grow(PHASE.B + 0.05 + i * 0.07, { axis: "y", duration: 0.45, ease: BOUNCE })}
        />
      ))}
      {SKELETON.map((s, i) => (
        <Motion.rect
          key={`${s.x}-${s.y}`}
          x={s.x}
          y={s.y}
          width={s.w}
          height="4"
          rx="2"
          style={{ ...fill(C.line, 0.4), originX: 0 }}
          variants={m.grow(PHASE.B + 0.3 + i * 0.08, { duration: 0.35 })}
        />
      ))}
      <Motion.rect x={CONTENT.x + 6} y="157" width="1.6" height="6" style={fill(C.line)} variants={blink} />

      {/* Sparks */}
      <Particle m={m} glyph="spark" x={206} y={36} size={15} color={C.a1} enter={0.72} motion="twinkle" period={2.3} />
      <Particle m={m} glyph="plus" x={300} y={244} size={10} color={C.line} enter={0.8} amp={3} period={3.2} tilt={8} />
      <Particle m={m} glyph="dot" x={40} y={64} size={8} color={C.a2} enter={0.84} amp={3} period={2.7} sway={2} />
      <Particle m={m} glyph="diamond" x={444} y={208} size={10} color={C.a1} enter={0.9} motion="spin" period={3.6} />
    </Stage>
  );
}
