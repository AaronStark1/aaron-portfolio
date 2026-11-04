import { useId } from "react";
import { motion as Motion } from "motion/react";
import { AtArt, ChatArt, HeartArt, MailArt, MobileArt, PhoneArt, PlaneArt, SparkleArt } from "./DoodleArt";

/**
 * Contact-themed line doodles floating in the empty parts of the page.
 * They draw themselves on once the headline has landed, then drift on two
 * out-of-phase loops (CSS, so the compositor does the work) while one at a
 * time performs a small action: the phone rings, the bubble types, a heart
 * leaves the envelope. Everything is decorative and ignores the pointer.
 *
 *   region     "header" (beside the headline) | "body" (around the form)
 *   on         start drawing (after fonts and the headline)
 *   celebrate  bump after a successful send: every doodle hops once
 */

const ART = { mail: MailArt, chat: ChatArt, phone: PhoneArt, at: AtArt, mobile: MobileArt, heart: HeartArt, sparkle: SparkleArt, plane: PlaneArt };

/* Placement in % of the region (or `bottom` in px from its foot, for the
   ones that keep the send button company whatever the form's height); `at`
   limits a doodle to a layout: "wide" ≥1024px, "narrow" <1024px,
   "md" ≥768px (two columns), "sm" <768px (one column).
   f = [drift x px, bob y px, tilt deg], t = [drift s, bob s],
   draw = draw-on delay, act = first action delay. */
const PLACES = {
  header: [
    { art: "mail", at: "wide", size: "lg", left: 58, top: 27, f: [9, 7, 5], t: [9.5, 6.4], draw: 0.95, act: 3.2 },
    { art: "sparkle", at: "wide", size: "xs", left: 47, top: 17, f: [4, 5, 0], t: [7, 5], draw: 1.2 },
    { art: "chat", at: "wide", size: "md", left: 76, top: 42, f: [8, 8, 6], t: [8.6, 5.8], draw: 1.1, act: 6.1 },
    { art: "phone", at: "wide", size: "md", left: 34, top: 40, f: [7, 9, 7], t: [10.2, 6.9], draw: 1.25, act: 8.9 },
    { art: "sparkle", at: "wide", size: "xs", left: 89, top: 19, f: [5, 4, 0], t: [8, 5.6], draw: 1.4 },

    { art: "mail", at: "narrow", size: "sm", left: 63, top: 34, f: [5, 5, 5], t: [9, 6.2], draw: 0.9, act: 3.2 },
    { art: "sparkle", at: "narrow", size: "xs", left: 50, top: 22, f: [3, 3, 0], t: [7, 5], draw: 1.1 },
    { art: "chat", at: "narrow", size: "sm", left: 12, top: 74, f: [5, 5, 6], t: [8.6, 5.8], draw: 1.2, act: 6.1 },
  ],
  body: [
    { art: "mobile", at: "md", size: "md", left: 5, top: 50, f: [6, 9, 5], t: [9.4, 6.6], draw: 1.5, act: 5 },
    { art: "heart", at: "md", size: "sm", left: 15, top: 79, f: [7, 6, 8], t: [8.2, 5.4], draw: 1.65, act: 7.4 },
    { art: "at", at: "wide", size: "md", left: 72, bottom: 72, f: [8, 7, 0], t: [9.8, 6.1], draw: 1.8, act: 10.2 },
    { art: "sparkle", at: "wide", size: "xs", left: 86, bottom: 118, f: [4, 4, 0], t: [7.4, 5.2], draw: 1.95 },

    { art: "phone", at: "sm", size: "sm", left: 84, top: 4, f: [5, 5, 6], t: [9.6, 6.4], draw: 1.4, act: 8.9 },
  ],
};

export function DoodleLayer({ region, on, celebrate = 0 }) {
  return (
    <div className="doodles" data-on={on ? "" : undefined} data-celebrate={celebrate ? (celebrate % 2 ? "a" : "b") : undefined} aria-hidden="true">
      {PLACES[region].map((p, i) => {
        const Art = ART[p.art];
        return (
          <span
            key={`${p.art}-${p.at}-${i}`}
            className={`doodle doodle--${p.size} doodle--at-${p.at}`}
            style={{
              left: `${p.left}%`,
              ...(p.bottom != null ? { top: `calc(100% - ${p.bottom}px)` } : { top: `${p.top}%` }),
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
   row every so often, leaving a dotted trail that fades behind it. */

const VIEW = [780, 100];
const FLIGHT_D = "M-30 80C120 90 230 58 330 58A26 26 0 0 0 356 32A26 26 0 0 0 330 6A26 26 0 0 0 304 32A26 26 0 0 0 330 58C440 58 580 46 820 16";

const cubic = ([p0, p1, p2, p3], t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};
const SEGMENTS = [
  (t) => cubic([[-30, 80], [120, 90], [230, 58], [330, 58]], t),
  (t) => {
    const a = ((90 - 360 * t) * Math.PI) / 180;
    return [330 + 26 * Math.cos(a), 32 + 26 * Math.sin(a)];
  },
  (t) => cubic([[330, 58], [440, 58], [580, 46], [820, 16]], t),
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
      <svg className="flight" viewBox={`0 0 ${VIEW[0]} ${VIEW[1]}`} aria-hidden="true" focusable="false">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-60" y="-40" width="920" height="180">
            <path d={FLIGHT_D} fill="none" stroke="#fff" strokeWidth="12" pathLength={1} strokeDasharray={`${STILL_AT} 1`} />
          </mask>
        </defs>
        <path className="flight__trail" d={FLIGHT_D} mask={`url(#${maskId})`} style={{ opacity: 0.7 }} />
        <g transform={`translate(${s.x} ${s.y}) rotate(${s.r}) translate(-12 -12)`} className="flight__plane">
          <PlaneArt />
        </g>
      </svg>
    );
  }

  return (
    <svg className="flight" viewBox={`0 0 ${VIEW[0]} ${VIEW[1]}`} aria-hidden="true" focusable="false" data-on={on ? "" : undefined}>
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
            <g className="flight__plane" transform="translate(-12 -12)">
              <PlaneArt />
            </g>
          </Motion.g>
        </g>
      ) : null}
    </svg>
  );
}
