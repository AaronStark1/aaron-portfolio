import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * A short burst of paper confetti for the first look at a certificate. Two
 * cannons low on either side fire up and in, so the pieces arc over the
 * edges of the certificate rather than across it, then flutter down and fade.
 * Zero dependencies: one <canvas>, one requestAnimationFrame loop that never
 * touches React state, and the canvas unmounts the moment the last piece has
 * gone (about 2.5 s). With reduced motion there is no physics at all, only a
 * soft 300 ms glow. Decorative: aria-hidden and it ignores the pointer.
 *
 *   delay  ms to wait before firing (lets the certificate land first)
 */
export default function ConfettiBurst({ delay = 260 }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const finish = useCallback(() => setDone(true), []);
  if (done) return null;
  return reduce ? <Glow delay={delay} onEnd={finish} /> : <Burst delay={delay} onEnd={finish} />;
}

/* ---------------------------------------------------------------------- */

/* The site palette, read from the live tokens; the literals are fallbacks. */
const TOKENS = [
  ["--cream", "#fbefdf"],
  ["--ochre", "#e7aa2c"],
  ["--brick", "#bf3d34"],
  ["--ink", "#3f3b37"],
];

const LIFE = 2500; // ms, the longest any piece lives
const PER_CANNON = 48;

/* Pieces: tumbling paper strips, round vellum dots and small gold diamonds.
   `term` is the terminal fall speed (px/s): paper drifts, dots drop faster. */
const KINDS = [
  { kind: "ribbon", share: 0.5, term: [115, 165] },
  { kind: "dot", share: 0.3, term: [175, 235] },
  { kind: "diamond", share: 0.2, term: [145, 195] },
];

const rand = (a, b) => a + Math.random() * (b - a);

function pickKind() {
  let r = Math.random();
  for (const k of KINDS) {
    if ((r -= k.share) <= 0) return k;
  }
  return KINDS[0];
}

function makePiece(origin, angle, { spread, scale }, colors, weights, H) {
  const k = pickKind();
  const a = ((angle + rand(-spread, spread)) * Math.PI) / 180;
  let r = Math.random();
  let color = colors[0];
  for (let i = 0; i < colors.length; i += 1) {
    if ((r -= weights[i]) <= 0) {
      color = colors[i];
      break;
    }
  }
  if (k.kind === "diamond") color = colors[1]; // the gold ones are always ochre
  return {
    kind: k.kind,
    x: origin[0] + rand(-10, 10),
    y: origin[1] + rand(-8, 8),
    dx: Math.cos(a),
    dy: Math.sin(a),
    v: H * rand(1.5, 2.7), // burst speed, px/s
    fall: 0,
    term: rand(k.term[0], k.term[1]),
    wob: rand(0, Math.PI * 2),
    wobSpeed: rand(3.5, 7),
    wobAmp: rand(18, 48),
    flip: rand(0, Math.PI * 2),
    flipSpeed: rand(5, 13) * (Math.random() < 0.5 ? -1 : 1),
    spin: rand(0, Math.PI * 2),
    spinSpeed: rand(-4, 4),
    w: scale * (k.kind === "ribbon" ? rand(5, 7) : k.kind === "dot" ? rand(3.4, 5) : rand(3.4, 4.6)),
    h: scale * (k.kind === "ribbon" ? rand(11, 17) : k.kind === "diamond" ? rand(5, 6.8) : 0),
    color,
    life: rand(1900, LIFE),
  };
}

function Burst({ delay, onEnd }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      const t = window.setTimeout(onEnd, 0);
      return () => window.clearTimeout(t);
    }

    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    const css = getComputedStyle(document.documentElement);
    const colors = TOKENS.map(([name, fallback]) => css.getPropertyValue(name).trim() || fallback);
    const [cream, , , ink] = colors;
    /* On the dark veil ink paper would vanish, so it is used sparingly there */
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const weights = dark ? [0.34, 0.32, 0.28, 0.06] : [0.27, 0.3, 0.27, 0.16];

    /* On a portrait phone the cannons fire steeper, with fewer and smaller
       pieces, so the paper still rises along the sides of the certificate
       instead of meeting over it. */
    const portrait = W < H * 0.8;
    const tilt = portrait ? 82 : 70; // launch angle above the horizontal
    const shape = portrait ? { spread: 11, scale: 0.85 } : { spread: 18, scale: 1 };
    const count = portrait ? 30 : PER_CANNON;
    const low = H * 0.84;
    const pieces = [
      ...Array.from({ length: count }, () => makePiece([W * 0.1, low], -tilt, shape, colors, weights, H)),
      ...Array.from({ length: count }, () => makePiece([W * 0.9, low], tilt - 180, shape, colors, weights, H)),
    ];

    const DECAY = 4.2; // air resistance on the burst, per second
    const SETTLE = 2.4; // how fast the fall approaches its terminal speed

    let raf = 0;
    let last = 0;
    let age = 0;

    const draw = (p, alpha) => {
      const face = Math.cos(p.flip); // 3D turn: the piece is seen edge-on as this nears 0
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.kind === "ribbon") {
        ctx.scale(Math.max(Math.abs(face), 0.08), 1);
        /* a strip with a slight curl along its length */
        const w = p.w / 2;
        const h = p.h / 2;
        const curl = Math.sin(p.flip * 0.5) * 1.6;
        ctx.moveTo(-w, -h);
        ctx.lineTo(w, -h);
        ctx.quadraticCurveTo(w + curl, 0, w, h);
        ctx.lineTo(-w, h);
        ctx.quadraticCurveTo(-w + curl, 0, -w, -h);
      } else if (p.kind === "dot") {
        ctx.globalAlpha = alpha * 0.88; // vellum: a little light comes through
        ctx.ellipse(0, 0, p.w * Math.max(Math.abs(face), 0.12), p.w, 0, 0, Math.PI * 2);
      } else {
        ctx.scale(Math.max(Math.abs(face), 0.1), 1);
        ctx.moveTo(0, -p.h);
        ctx.lineTo(p.w, 0);
        ctx.lineTo(0, p.h);
        ctx.lineTo(-p.w, 0);
        ctx.closePath();
      }
      ctx.fill();
      /* the back of the paper is a shade darker; gold catches the light face-on */
      if (face < 0 && p.kind !== "diamond") {
        ctx.globalAlpha = alpha * (p.color === ink ? 0.16 : 0.24);
        ctx.fillStyle = p.color === ink ? cream : ink;
        ctx.fill();
      } else if (p.kind === "diamond" && face > 0.9) {
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillStyle = cream;
        ctx.fill();
      }
      ctx.restore();
    };

    const frame = (now) => {
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 1 / 30); // a dropped frame never teleports a piece
      last = now;
      age += dt * 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of pieces) {
        if (age >= p.life) continue;
        alive += 1;
        p.v *= Math.exp(-DECAY * dt);
        p.fall += (p.term - p.fall) * (1 - Math.exp(-SETTLE * dt));
        p.wob += p.wobSpeed * dt;
        p.flip += p.flipSpeed * dt;
        p.spin += p.spinSpeed * dt;
        /* paper falls slower flat-on than edge-on */
        const flutter = p.kind === "ribbon" ? 0.55 + 0.45 * Math.abs(Math.sin(p.flip)) : 1;
        p.x += (p.dx * p.v + Math.sin(p.wob) * p.wobAmp) * dt;
        p.y += (p.dy * p.v + p.fall * flutter) * dt;
        /* full strength for the first 55% of its life, then an eased fade */
        const k = Math.min(1, Math.max(0, (p.life - age) / (p.life * 0.45)));
        draw(p, k * k * (3 - 2 * k));
      }
      if (alive) raf = window.requestAnimationFrame(frame);
      else onEnd();
    };

    const timer = window.setTimeout(() => {
      raf = window.requestAnimationFrame(frame);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
    };
  }, [delay, onEnd]);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

/* Reduced motion: a warm glow that comes and goes in 300 ms, nothing moves. */
function Glow({ delay, onEnd }) {
  useEffect(() => {
    const t = window.setTimeout(onEnd, delay + 420);
    return () => window.clearTimeout(t);
  }, [delay, onEnd]);
  return <div className="confetti-glow" style={{ animationDelay: `${delay}ms` }} aria-hidden="true" />;
}
