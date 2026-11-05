import { useId } from "react";
import { motion as Motion } from "motion/react";
import { AtArt, ChatArt, HandArt, HeartArt, MailArt, MobileArt, PencilArt, PhoneArt, PlaneArt, SparkleArt } from "./DoodleArt";

/**
 * Contact-themed line doodles floating in the empty parts of the page.
 * They draw themselves on once the headline has landed, then drift on two
 * out-of-phase loops (CSS, so the compositor does the work) while one at a
 * time performs a small action: the phone rings, the bubble types, a heart
 * leaves the envelope, the hand waves. Everything is decorative and ignores
 * the pointer.
 *
 *   region     "header" (the two title lines) | "body" (statement and form)
 *   on         start drawing (after fonts and the headline)
 *   celebrate  bump after a successful send: every doodle hops once
 */

const ART = {
  mail: MailArt,
  chat: ChatArt,
  phone: PhoneArt,
  at: AtArt,
  mobile: MobileArt,
  heart: HeartArt,
  sparkle: SparkleArt,
  plane: PlaneArt,
  hand: HandArt,
  pencil: PencilArt,
};

/* The rule under "Let's", in % of the two title lines (all of it in em, so
   the same at every size) */
const RULE = 46;

/* Placement. Header doodles sit right of "Let's": `left` in % of the title
   width, and `gap`, the clear space in px between the doodle at the low
   point of its bob and the rule beneath it, so each keeps the same distance
   from the rule whatever the headline's size and its own (the small ones
   up by the cap line use `top`, in % of the two lines). Body doodles use
   `left`/`top` in % of the statement-and-form block, `top` as a CSS length
   for spots just outside it, or `bottom` in px from its foot (the ones that
   keep the send button company whatever the form's height). They stay out
   of the robot's lane: beside the form on wide screens, on its right edge
   on narrow ones.
   `at` limits a doodle to a layout: "wide" ≥1024px, "narrow" <1024px,
   "md" ≥768px (two columns), "sm" <768px (one column); "md narrow" is both
   (768-1023px, where the robot perches on the form).
   f = [drift x px, bob y px, tilt deg], t = [drift s, bob s],
   draw = draw-on delay, act = first action delay. */
const PLACES = {
  header: [
    { art: "phone", at: "md", size: "md", left: 30, gap: 27, f: [7, 7, 7], t: [10.2, 6.9], draw: 1.05, act: 8.9 },
    { art: "sparkle", at: "md", size: "xs", left: 41.5, top: -1, f: [4, 4, 0], t: [7, 5], draw: 1.2 },
    { art: "mail", at: "md", size: "lg", left: 54, gap: 22, f: [9, 5, 5], t: [9.5, 6.4], draw: 0.95, act: 3.2 },
    { art: "sparkle", at: "md", size: "xs", left: 66, gap: 26, f: [4, 4, 0], t: [8, 5.6], draw: 1.3 },
    { art: "chat", at: "md", size: "md", left: 78.5, gap: 28, f: [8, 7, 6], t: [8.6, 5.8], draw: 1.1, act: 6.1 },
    { art: "sparkle", at: "md", size: "xs", left: 92, top: 4, f: [5, 4, 0], t: [8, 5.6], draw: 1.4 },

    { art: "mail", at: "sm", size: "sm", left: 45, gap: 16, f: [5, 3, 5], t: [9, 6.2], draw: 0.9, act: 3.2 },
    { art: "chat", at: "sm", size: "sm", left: 67, gap: 16, f: [5, 3, 6], t: [8.6, 5.8], draw: 1.1, act: 6.1 },
    { art: "sparkle", at: "sm", size: "xs", left: 87, gap: 36, f: [3, 3, 0], t: [8, 5.6], draw: 1.3 },
  ],
  body: [
    // Down the column under the statement: the hand waves beside "say hi."
    { art: "hand", at: "md", size: "md", left: 12, top: 21, f: [6, 6, 6], t: [9.4, 6.6], draw: 1.5, act: 3.6 },
    { art: "sparkle", at: "md", size: "xs", left: 15.5, top: 37, f: [4, 4, 0], t: [7.4, 5.2], draw: 1.6 },
    { art: "mobile", at: "md", size: "md", left: 4.5, top: 47, f: [6, 8, 5], t: [10, 6.9], draw: 1.65, act: 5 },
    { art: "heart", at: "md", size: "sm", left: 14, top: 66, f: [7, 6, 8], t: [8.2, 5.4], draw: 1.75, act: 7.4 },
    { art: "chat", at: "md", size: "sm", left: 5.5, top: 88, f: [6, 5, 6], t: [8.8, 6], draw: 1.85, act: 9.6 },
    { art: "pencil", at: "md narrow", size: "md", left: 29, top: 54, f: [6, 6, 6], t: [9, 6.2], draw: 1.8, act: 12.4 },
    // Beside the send button
    { art: "at", at: "wide", size: "md", left: 72, bottom: 64, f: [8, 7, 0], t: [9.8, 6.1], draw: 1.8, act: 10.2 },
    { art: "sparkle", at: "wide", size: "xs", left: 80.5, bottom: 128, f: [4, 4, 0], t: [7.4, 5.2], draw: 1.95 },
    { art: "pencil", at: "wide", size: "md", left: 89, bottom: 84, f: [7, 6, 6], t: [9, 6.2], draw: 2.05, act: 12.4 },

    // Phones: above and beside the statement, and under the send button
    { art: "sparkle", at: "sm", size: "xs", left: 82, top: "-34px", f: [3, 3, 0], t: [7.4, 5.2], draw: 1.3 },
    { art: "hand", at: "sm", size: "sm", left: 72, top: "28px", f: [4, 4, 6], t: [9.4, 6.6], draw: 1.4, act: 3.6 },
    { art: "sparkle", at: "sm", size: "xs", left: 56, top: "calc(100% + 30px)", f: [3, 3, 0], t: [7.4, 5.2], draw: 1.6 },
    { art: "at", at: "sm", size: "sm", left: 74, top: "calc(100% + 46px)", f: [5, 4, 0], t: [9.8, 6.1], draw: 1.7, act: 10.2 },
  ],
};

function topOf(p) {
  if (p.gap != null) return `calc(${RULE}% - ${p.gap + p.f[1]}px - var(--d) * 0.42px)`;
  if (p.bottom != null) return `calc(100% - ${p.bottom}px)`;
  return typeof p.top === "number" ? `${p.top}%` : p.top;
}

export function DoodleLayer({ region, on, celebrate = 0 }) {
  return (
    <div
      className="doodles contact-doodles"
      data-on={on ? "" : undefined}
      data-celebrate={celebrate ? (celebrate % 2 ? "a" : "b") : undefined}
      aria-hidden="true"
    >
      {PLACES[region].map((p, i) => {
        const Art = ART[p.art];
        const at = p.at
          .split(" ")
          .map((a) => `doodle--at-${a}`)
          .join(" ");
        return (
          <span
            key={`${p.art}-${p.at}-${i}`}
            className={`doodle doodle--${p.size} ${at}`}
            style={{
              left: `${p.left}%`,
              top: topOf(p),
              "--i": i,
              "--fx": p.f[0],
              "--fy": p.f[1],
              "--fr": p.f[2],
              "--ta": p.t[0],
              "--tb": p.t[1],
              "--td": p.draw,
              "--act": p.act ?? 0,
            }}
          >
            <span className="doodle__drift">
              <span className="doodle__bob">
                <span className="doodle__hop">
                  <svg className={`doodle__svg doodle__svg--${p.art}`} viewBox="0 0 24 24" focusable="false">
                    <Art />
                  </svg>
                </span>
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* The flight: a paper plane loops through the empty half of the "Connect"
   row every so often, leaving a dotted trail that fades behind it. The
   drawing spans the row's width and keeps clear of both rules: the loop's
   top sits low enough for the plane to pass under the upper one, and the
   viewBox's padding stops it growing into them once the headline has
   reached full size while the row keeps getting wider. */

const VIEW = "0 -8 780 116";
const FLIGHT_D = "M-30 84C120 92 230 72 330 72A24 24 0 0 0 354 48A24 24 0 0 0 330 24A24 24 0 0 0 306 48A24 24 0 0 0 330 72C440 72 580 60 820 30";
const PLANE = 1.25; // the plane's scale, in line with the xs doodles

const cubic = ([p0, p1, p2, p3], t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};
const SEGMENTS = [
  (t) => cubic([[-30, 84], [120, 92], [230, 72], [330, 72]], t),
  (t) => {
    const a = ((90 - 360 * t) * Math.PI) / 180;
    return [330 + 24 * Math.cos(a), 48 + 24 * Math.sin(a)];
  },
  (t) => cubic([[330, 72], [440, 72], [580, 60], [820, 30]], t),
];

/* Dense points along the path, then resampled at equal arc length so the
   plane flies at a constant speed and its nose follows the curve. */
const FRAMES = (() => {
  const dense = [];
  SEGMENTS.forEach((seg, s) => {
    for (let i = s ? 1 : 0; i <= 240; i += 1) dense.push(seg(i / 240));
  });
  const acc = [0];
  for (let i = 1; i < dense.length; i += 1) acc.push(acc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = acc[acc.length - 1];
  const N = 96;
  const out = [];
  let j = 0;
  let prev = null;
  for (let i = 0; i < N; i += 1) {
    const target = (total * i) / (N - 1);
    while (j < acc.length - 2 && acc[j + 1] < target) j += 1;
    const k = Math.min(1, Math.max(0, (target - acc[j]) / (acc[j + 1] - acc[j] || 1)));
    const a = dense[j];
    const b = dense[j + 1];
    const raw = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 45; // the icon's nose points up-right
    let rot = raw;
    if (prev !== null) {
      while (rot - prev > 180) rot -= 360;
      while (rot - prev < -180) rot += 360;
    }
    prev = rot;
    out.push({ x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, r: rot });
  }
  return out;
})();

const FLY = 5.6; // seconds in the air
const CYCLE = 13; // one flight, then a rest
const STILL_AT = 0.64; // where the still tableau shows the plane

export function PlaneFlight({ on, reduce, celebrate = 0 }) {
  const maskId = `flight-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const f = FLY / CYCLE;
  const times = [...FRAMES.map((_, i) => (i / (FRAMES.length - 1)) * f), 1];
  const hold = (arr) => [...arr, arr[arr.length - 1]];
  const delay = celebrate ? 0.15 : 1.7;
  const loopT = (extra = {}) => ({ duration: CYCLE, repeat: Infinity, ease: "linear", delay, ...extra });

  if (reduce) {
    const s = FRAMES[Math.round(STILL_AT * (FRAMES.length - 1))];
    return (
      <svg className="flight" viewBox={VIEW} preserveAspectRatio="xMinYMid meet" aria-hidden="true" focusable="false">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-60" y="-40" width="920" height="180">
            <path d={FLIGHT_D} fill="none" stroke="#fff" strokeWidth="12" pathLength={1} strokeDasharray={`${STILL_AT} 1`} />
          </mask>
        </defs>
        <path className="flight__trail" d={FLIGHT_D} mask={`url(#${maskId})`} style={{ opacity: 0.7 }} />
        <g transform={`translate(${s.x} ${s.y}) rotate(${s.r}) scale(${PLANE}) translate(-12 -12)`} className="flight__plane">
          <PlaneArt />
        </g>
      </svg>
    );
  }

  return (
    <svg className="flight" viewBox={VIEW} preserveAspectRatio="xMinYMid meet" aria-hidden="true" focusable="false" data-on={on ? "" : undefined}>
      {on ? (
        <g key={celebrate}>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-60" y="-40" width="920" height="180">
              <Motion.path
                d={FLIGHT_D}
                fill="none"
                stroke="#fff"
                strokeWidth="12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 1, 0] }}
                transition={loopT({ times: [0, f, 0.995, 1] })}
              />
            </mask>
          </defs>
          <Motion.path
            className="flight__trail"
            d={FLIGHT_D}
            mask={`url(#${maskId})`}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 0.7, 0, 0] }}
            transition={loopT({ times: [0, (FLY + 0.3) / CYCLE, (FLY + 1.6) / CYCLE, 1] })}
          />
          <Motion.g
            initial={{ opacity: 0, x: FRAMES[0].x, y: FRAMES[0].y, rotate: FRAMES[0].r }}
            animate={{
              x: hold(FRAMES.map((p) => p.x)),
              y: hold(FRAMES.map((p) => p.y)),
              rotate: hold(FRAMES.map((p) => p.r)),
              opacity: [0, 1, 1, 0, 0],
            }}
            transition={{
              x: loopT({ times }),
              y: loopT({ times }),
              rotate: loopT({ times }),
              opacity: loopT({ times: [0, 0.35 / CYCLE, (FLY - 0.5) / CYCLE, f, 1] }),
            }}
          >
            <g className="flight__plane" transform={`scale(${PLANE}) translate(-12 -12)`}>
              <PlaneArt />
            </g>
          </Motion.g>
        </g>
      ) : null}
    </svg>
  );
}
