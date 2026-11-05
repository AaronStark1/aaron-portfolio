/* Line-art doodles for the achievements page, on the same 24-unit grid as the
   contact doodles: round caps and joins, and every stroke carries
   pathLength="1" so it can draw itself on. Parts that act on their own (a
   rustling leaf, the seal's press, a glint) sit in a group with an `art-*`
   class the stylesheet animates, so the draw-on rule on the stroke never
   competes with the action.

   Geometry adapted from Lucide (https://lucide.dev): trophy, award, sparkles.
   ISC License, Copyright (c) Lucide Icons and Contributors. Permission to use,
   copy, modify, and/or distribute this software for any purpose with or
   without fee is hereby granted, provided that the above copyright notice and
   this permission notice appear in all copies.
   The laurel and the seal are computed below from circles and arcs. */

const P = { pathLength: 1 };
const n2 = (v) => Number(v.toFixed(2));
const rad = (deg) => (deg * Math.PI) / 180;

/* ---------------------------------------------------------------------- */
/* Laurel: two branches on one circle, crossing at the foot, each with a row
   of outer leaves, smaller inner ones between them and a leaf at the tip.
   Leaves are almonds (two quadratic curves) set at an angle to the stem. */

const LAUREL = (() => {
  const O = [12, 11.7];
  const R = 7.8;
  const at = (deg) => [O[0] + R * Math.cos(rad(deg)), O[1] + R * Math.sin(rad(deg))];
  /* direction of growth along the left branch (angle increasing) and the outward normal */
  const tangent = (deg) => [-Math.sin(rad(deg)), Math.cos(rad(deg))];
  const normal = (deg) => [Math.cos(rad(deg)), Math.sin(rad(deg))];
  const turn = (deg, tilt) => {
    const t = tangent(deg);
    const n = normal(deg);
    const c = Math.cos(rad(Math.abs(tilt)));
    const s = Math.sin(rad(Math.abs(tilt))) * Math.sign(tilt);
    return [t[0] * c + n[0] * s, t[1] * c + n[1] * s];
  };
  const almond = ([bx, by], [dx, dy], len, half) => {
    const tx = bx + dx * len;
    const ty = by + dy * len;
    const mx = (bx + tx) / 2;
    const my = (by + ty) / 2;
    const ox = -dy * half * 2; // a quadratic peaks halfway to its control point
    const oy = dx * half * 2;
    return `M${n2(bx)} ${n2(by)}Q${n2(mx + ox)} ${n2(my + oy)} ${n2(tx)} ${n2(ty)}Q${n2(mx - ox)} ${n2(my - oy)} ${n2(bx)} ${n2(by)}`;
  };

  const START = 80; // past the foot, so the two stems cross
  const END = 236; // the tip, leaving the crown open
  /* [angle on the branch, tilt from the stem (+ outward), length, half-width] */
  const LEAVES = [
    [116, 40, 4.6, 1.3],
    [131, -46, 3.5, 1],
    [146, 40, 4.6, 1.3],
    [161, -46, 3.5, 1],
    [176, 40, 4.6, 1.3],
    [191, -46, 3.4, 0.95],
    [206, 38, 4.3, 1.2],
    [END, 0, 4, 1.15],
  ];

  const left = LEAVES.map(([deg, tilt, len, half], k) => {
    const base = at(deg);
    return { d: almond(base, turn(deg, tilt), len, half), base, k };
  });
  const mirrorPath = (d) => d.replace(/([MQ])?(-?[\d.]+) (-?[\d.]+)/g, (_, cmd = "", x, y) => `${cmd}${n2(24 - Number(x))} ${y}`);
  const right = left.map((l) => ({ d: mirrorPath(l.d), base: [24 - l.base[0], l.base[1]], k: l.k }));

  const [sx, sy] = at(START);
  const [ex, ey] = at(END);
  const stemLeft = `M${n2(sx)} ${n2(sy)}A${R} ${R} 0 0 1 ${n2(ex)} ${n2(ey)}`;
  const stemRight = `M${n2(24 - sx)} ${n2(sy)}A${R} ${R} 0 0 0 ${n2(24 - ex)} ${n2(ey)}`;

  return { stemLeft, stemRight, left, right };
})();

/** Laurel wreath; now and then a rustle runs up both branches. */
export function LaurelArt() {
  const leaf = (l, side) => (
    <g
      key={`${side}-${l.k}`}
      className="art-laurel__leaf"
      style={{ "--n": l.k, "--s": side === "l" ? -1 : 1, transformBox: "view-box", transformOrigin: `${n2(l.base[0])}px ${n2(l.base[1])}px` }}
    >
      <path d={l.d} {...P} />
    </g>
  );
  return (
    <>
      <path d={LAUREL.stemLeft} {...P} />
      <path d={LAUREL.stemRight} {...P} />
      {LAUREL.left.map((l) => leaf(l, "l"))}
      {LAUREL.right.map((l) => leaf(l, "r"))}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Seal: a scalloped stamp with an inner ring and a tick, two notched ribbon
   tails leaving from behind its lower edge. */

const SEAL = (() => {
  const C = [12, 9.3];
  const R0 = 6.35;
  const A = 0.55; // scallop depth
  const LOBES = 12;
  const r = (deg) => R0 + A * (2 * Math.abs(Math.cos((LOBES * rad(deg)) / 2)) - 1);
  const pt = (deg) => [C[0] + r(deg) * Math.cos(rad(deg)), C[1] + r(deg) * Math.sin(rad(deg))];
  const N = 120;
  const edge =
    Array.from({ length: N }, (_, i) => pt(-90 + (360 * i) / N))
      .map(([x, y], i) => `${i ? "L" : "M"}${n2(x)} ${n2(y)}`)
      .join("") + "Z";

  /* A tail hangs from two points on the edge, leaning out, with a V cut */
  const tail = (a, b, lean) => {
    const [ax, ay] = pt(a);
    const [bx, by] = pt(b);
    const len = 6.1;
    const dir = [Math.sin(rad(lean)), Math.cos(rad(lean))];
    const a2 = [ax + dir[0] * len, ay + dir[1] * len];
    const b2 = [bx + dir[0] * len, by + dir[1] * len];
    const v = [(a2[0] + b2[0]) / 2 - dir[0] * 1.5, (a2[1] + b2[1]) / 2 - dir[1] * 1.5];
    return `M${n2(ax)} ${n2(ay)}L${n2(a2[0])} ${n2(a2[1])}L${n2(v[0])} ${n2(v[1])}L${n2(b2[0])} ${n2(b2[1])}L${n2(bx)} ${n2(by)}`;
  };

  return {
    edge,
    ring: { cx: C[0], cy: C[1], r: 4.35 },
    tick: `M${n2(C[0] - 2.05)} ${n2(C[1] + 0.1)}l1.55 1.55 3.05-3.25`,
    tails: [tail(128, 106, -20), tail(52, 74, 20)],
  };
})();

/** Certified stamp seal with ribbons; now and then it is pressed down again. */
export function SealArt() {
  return (
    <g className="art-seal">
      <g className="art-seal__tails">
        {SEAL.tails.map((d) => (
          <path key={d} d={d} {...P} />
        ))}
      </g>
      <path d={SEAL.edge} {...P} />
      <circle {...SEAL.ring} {...P} />
      <g className="art-seal__tick">
        <path d={SEAL.tick} {...P} />
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------------- */

/** Four-point star with a small cross and a dot, twinkling out of step. */
export function SparkleArt() {
  return (
    <>
      <g className="art-twinkle__star">
        <path
          d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
          {...P}
        />
      </g>
      <g className="art-twinkle__glint" style={{ "--n": 0 }}>
        <path d="M20 2v4M22 4h-4" {...P} />
      </g>
      <g className="art-twinkle__glint" style={{ "--n": 1 }}>
        <circle cx="4" cy="20" r="2" {...P} />
      </g>
    </>
  );
}

/** Trophy cup; now and then it is lifted, and a glint catches its rim. */
export function TrophyArt() {
  return (
    <>
      <g className="art-trophy">
        <path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" {...P} />
        <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" {...P} />
        <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" {...P} />
        <path d="M4 22h16" {...P} />
        <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" {...P} />
        <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" {...P} />
        <path d="M9.2 4.6v2.7a3.1 3.1 0 0 0 .85 2.15" {...P} />
      </g>
      <g className="art-trophy__glint">
        <path d="M21.2-1.6v3.6M23 .2h-3.6" {...P} />
      </g>
    </>
  );
}

/* Rosette pleats: short ticks between the inner ring and the rim. */
const PLEATS = Array.from({ length: 10 }, (_, i) => {
  const a = rad(-90 + i * 36);
  const p = (r) => `${n2(12 + r * Math.cos(a))} ${n2(8 + r * Math.sin(a))}`;
  return `M${p(3.95)}L${p(5.05)}`;
}).join("");

/** Medal rosette with twin streamers; now and then it turns and the streamers flutter. */
export function RibbonArt() {
  return (
    <>
      <g className="art-rosette__tails">
        <path
          d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"
          {...P}
        />
      </g>
      <circle cx="12" cy="8" r="6" {...P} />
      <g className="art-rosette__pleats">
        <circle cx="12" cy="8" r="3.1" {...P} />
        <path d={PLEATS} {...P} />
      </g>
    </>
  );
}
