import { useEffect, useImperativeHandle, useRef } from "react";
import { AnimatePresence, animate, motion as Motion, useMotionValue, useTransform, useVelocity } from "motion/react";
import { SPRITES } from "./robotSprite";

/**
 * The contact page's pixel robot. Purely decorative (aria-hidden): it keeps
 * the visitor company while they fill in the form.
 *
 *   layout      "track": desktop, beside the form, pointing at the active field
 *               "perch": narrow screens, standing on the active field's label row
 *   ref         exposes place(y, instant): the page measures the fields and
 *               tells the robot where to go, in px from the top of the form
 *   start       play the drop-in entrance
 *   expression  "open" | "happy" | "sad" | "oops" | "love"
 *   look        "pointer" (eyes follow the cursor) or a direction:
 *               "center" | "right" | "left" | "down" | "down-left" | "up-right"
 *   pose        "idle" | "point" | "wave" | "cheer"
 *   tick        bumps on every keystroke: a small hop
 *   shake, jump bump to play a head shake / a celebratory jump
 *   say         { id, text } speech bubble, or null
 *   sayAt       where the bubble opens: "above" | "above-end" | "side"
 *   busy        antenna blinks fast (while sending)
 *   onReady     called once mounted, so the page can place it (it loads lazily)
 *
 * Everything moves through motion values and CSS, so a keystroke never
 * re-renders more than this small SVG.
 */

const FILL = {
  o: "var(--robot-line)",
  B: "var(--robot-body)",
  S: "var(--robot-shade)",
  V: "var(--robot-visor)",
  H: "var(--robot-glint)",
  R: "var(--robot-accent)",
  E: "var(--robot-eye)",
  Y: "var(--robot-flame)",
};

const LOOK = {
  center: [0, 0],
  right: [1, 0],
  left: [-1, 0],
  down: [0, 1],
  "down-left": [-1, 1],
  "down-right": [1, 1],
  up: [0, -1],
  "up-right": [1, -1],
};

/* Snap to whole cells halfway through a segment: pixel-art steps, not glides */
const snap = (p) => (p < 0.5 ? 0 : 1);

function Cells({ cells, className }) {
  return (
    <g className={className}>
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} style={{ fill: FILL[c.k] }} />
      ))}
    </g>
  );
}

export default function Robot({
  ref,
  layout = "track",
  start = true,
  delay = 0,
  expression = "open",
  look = "pointer",
  pose = "idle",
  tick = 0,
  shake = 0,
  jump = 0,
  say = null,
  sayAt = "above",
  busy = false,
  reduce = false,
  onReady,
}) {
  const svgRef = useRef(null);
  const lastHop = useRef(0);
  const y = useMotionValue(0);

  useImperativeHandle(
    ref,
    () => ({
      place(target, instant = false) {
        if (instant) y.jump(target);
        else animate(y, target, { type: "spring", stiffness: 140, damping: 20, mass: 0.9 });
      },
    }),
    [y]
  );

  const bob = useMotionValue(0);
  const hop = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const eyeX = useMotionValue(0);
  const eyeY = useMotionValue(0);
  const blink = useMotionValue(0);
  const openOpacity = useTransform(blink, (b) => 1 - b);

  /* Thrusters fire while the robot travels between fields */
  const speed = useVelocity(y);
  const thrust = useTransform(speed, (v) => Math.min(1, Math.abs(v) / 90));

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  /* Idle hover: one cell up and down, in steps */
  useEffect(() => {
    if (reduce) return undefined;
    const c = animate(bob, [0, 0, -1, -1, 0], { duration: 1.8, times: [0, 0.47, 0.5, 0.97, 1], ease: "linear", repeat: Infinity });
    return () => c.stop();
  }, [bob, reduce]);

  /* Blinks at uneven intervals, only while the eyes are plain */
  useEffect(() => {
    if (expression !== "open") return undefined;
    let t1;
    let t2;
    const next = () => {
      t1 = window.setTimeout(() => {
        blink.set(1);
        t2 = window.setTimeout(() => {
          blink.set(0);
          next();
        }, 120);
      }, 2200 + Math.random() * 2800);
    };
    next();
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      blink.set(0);
    };
  }, [blink, expression]);

  /* Keystroke hop, throttled so fast typing reads as a happy jitter */
  useEffect(() => {
    if (!tick || reduce) return;
    const now = performance.now();
    if (now - lastHop.current < 130) return;
    lastHop.current = now;
    animate(hop, [0, -1, 0], { duration: 0.2, ease: snap });
  }, [tick, hop, reduce]);

  useEffect(() => {
    if (!shake || reduce) return;
    animate(shakeX, [0, -1, 1, -1, 1, 0], { duration: 0.42, ease: snap });
  }, [shake, shakeX, reduce]);

  useEffect(() => {
    if (!jump || reduce) return;
    animate(hop, [0, -4, 0, -2, 0], { duration: 0.9, times: [0, 0.28, 0.55, 0.78, 1], ease: ["easeOut", "easeIn", "easeOut", "easeIn"] });
  }, [jump, hop, reduce]);

  /* Eyes: a fixed direction, or follow the pointer around the page */
  useEffect(() => {
    if (look !== "pointer" || reduce) {
      const [dx, dy] = LOOK[look] || LOOK.center;
      eyeX.set(dx);
      eyeY.set(dy);
      return undefined;
    }
    if (!window.matchMedia("(hover: hover)").matches) {
      eyeX.set(0);
      eyeY.set(0);
      return undefined;
    }
    let frame = 0;
    let px = 0;
    let py = 0;
    const update = () => {
      frame = 0;
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width * 0.36;
      const cy = r.top + r.height * 0.45;
      const vx = px - cx;
      const vy = py - cy;
      const len = Math.hypot(vx, vy);
      if (len < 36) {
        eyeX.set(0);
        eyeY.set(0);
        return;
      }
      eyeX.set(Math.abs(vx) > len * 0.38 ? Math.sign(vx) : 0);
      eyeY.set(Math.abs(vy) > len * 0.38 ? Math.sign(vy) : 0);
    };
    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [look, reduce, eyeX, eyeY]);

  const plainEyes = expression === "open";
  const armsUp = pose === "wave" || pose === "cheer";
  const cols = layout === "track" ? 29 : 23;

  return (
    <div className={`robot robot--${layout}`} aria-hidden="true">
      <Motion.div className="robot__place" style={{ y }}>
        <Motion.div
          className="robot__drop"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.85 }}
          animate={
            start
              ? reduce
                ? { opacity: 1, transition: { duration: 0.4, delay } }
                : { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 17, delay } }
              : undefined
          }
        >
          <AnimatePresence>
            {say ? (
              <Motion.p
                key={say.id}
                className={`robot__say robot__say--${sayAt}`}
                style={{ x: sayAt === "above" ? "-50%" : 0, originY: 1 }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: reduce ? { duration: 0.2 } : { type: "spring", stiffness: 420, damping: 24 } }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
              >
                <span className="robot__say-body label">{say.text}</span>
                <span className="robot__say-tail" />
              </Motion.p>
            ) : null}
          </AnimatePresence>

          <svg
            ref={svgRef}
            className="robot__svg"
            viewBox={`-2 0 ${cols} 19`}
            style={{ "--cols": cols }}
            shapeRendering="crispEdges"
            focusable="false"
          >
            <Motion.g style={{ y: bob }}>
              <Motion.g style={{ y: hop, x: shakeX }}>
                {/* thrusters, only visible while travelling */}
                <Motion.g style={{ opacity: thrust }}>
                  <Cells cells={SPRITES.flameA} className="robot__flame robot__flame--a" />
                  <Cells cells={SPRITES.flameB} className="robot__flame robot__flame--b" />
                </Motion.g>

                <Cells cells={SPRITES.body} />
                <rect className={`robot__bulb${busy ? " robot__bulb--busy" : ""}`} x={9} y={1} width={1} height={1} style={{ fill: FILL.E }} />
                <Cells cells={SPRITES.glint} />

                {/* eyes */}
                {plainEyes ? (
                  <Motion.g style={{ x: eyeX, y: eyeY }}>
                    <Motion.g style={{ opacity: openOpacity }}>
                      <Cells cells={SPRITES.eyes.open} />
                    </Motion.g>
                    <Motion.g style={{ opacity: blink }}>
                      <Cells cells={SPRITES.eyes.blink} />
                    </Motion.g>
                  </Motion.g>
                ) : (
                  <Cells cells={SPRITES.eyes[expression] || SPRITES.eyes.open} />
                )}

                {/* arms */}
                {armsUp ? (
                  <g className="robot__wave">
                    <Cells cells={SPRITES.armLeftUpA} className="robot__frame robot__frame--a" />
                    <Cells cells={SPRITES.armLeftUpB} className="robot__frame robot__frame--b" />
                  </g>
                ) : (
                  <Cells cells={SPRITES.armLeftRest} />
                )}
                {pose === "cheer" ? (
                  <g className="robot__wave">
                    <Cells cells={SPRITES.armRightUpA} className="robot__frame robot__frame--b" />
                    <Cells cells={SPRITES.armRightUpB} className="robot__frame robot__frame--a" />
                  </g>
                ) : pose === "point" && layout === "track" ? (
                  <Motion.g
                    key="point"
                    className="robot__point"
                    style={{ originX: 0 }}
                    initial={reduce ? false : { scaleX: 0.25 }}
                    animate={{ scaleX: 1, transition: { duration: 0.24, ease: (p) => Math.round(p * 3) / 3 } }}
                  >
                    <Cells cells={SPRITES.armPoint} />
                  </Motion.g>
                ) : (
                  <Cells cells={SPRITES.armRightRest} />
                )}
              </Motion.g>
            </Motion.g>
          </svg>
        </Motion.div>
      </Motion.div>
    </div>
  );
}
