import { motion as Motion } from "motion/react";
import { GLYPHS } from "./glyphs";
import { C, PHASE, fill } from "../../lib/worlds";

/**
 * A small glyph that pops in during activation and then keeps a gentle
 * ambient motion going (phase C) for as long as the card stays hovered.
 * Two nested groups, so the entrance and the loop never share a property.
 *
 *   glyph   key of GLYPHS
 *   x, y    centre, in world units
 *   size    edge of the glyph box, in world units (12–28 for particles)
 *   color   a palette role from C
 *   enter   when it pops in (seconds into the sequence)
 *   motion  "float" | "spin" | "pulse" | "twinkle" | "still"
 *   amp, period, sway, tilt, at   ambient options (see motionKit().float)
 */
export function Particle({ m, glyph, x, y, size = 16, rotate = 0, color = C.line, to = 1, enter = 0.4, motion = "float", amp = 4, period = 3.2, sway = 0, tilt = 0, at = PHASE.C }) {
  const s = size / 256;
  const ambient =
    motion === "spin"
      ? m.spin({ at, period: period * 2 })
      : motion === "pulse"
        ? m.pulse({ at, period })
        : motion === "twinkle"
          ? m.twinkle({ at, period })
          : motion === "still"
            ? undefined
            : m.float({ at, amp, period, sway, tilt });
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <Motion.g variants={m.pop(enter, { scale: 0.2, rotate: -25, to })}>
        <Motion.g variants={ambient}>
          <path d={GLYPHS[glyph]} transform={`scale(${s}) translate(-128 -128)`} style={fill(color)} />
        </Motion.g>
      </Motion.g>
    </g>
  );
}

/**
 * A glyph that is emitted again and again from (x, y), travelling by
 * (dx, dy). Hidden in the still tableau.
 */
export function Emitter({ m, glyph, x, y, size = 16, color = C.line, to = 1, at = PHASE.C, dx = 0, dy = -40, period = 2.4, wait = 1.2, rotate = 0 }) {
  const s = size / 256;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Motion.g variants={m.emit({ at, dx, dy, period, wait, rotate, to })}>
        <path d={GLYPHS[glyph]} transform={`scale(${s}) translate(-128 -128)`} style={fill(color)} />
      </Motion.g>
    </g>
  );
}

/** A glyph placed as part of an illustration (no motion of its own). */
export function Glyph({ glyph, x, y, size = 16, rotate = 0, color = C.detail, style }) {
  return <path d={GLYPHS[glyph]} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 256}) translate(-128 -128)`} style={{ ...fill(color), ...style }} />;
}
