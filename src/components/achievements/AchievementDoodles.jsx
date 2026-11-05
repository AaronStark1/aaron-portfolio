import { LaurelArt, RibbonArt, SealArt, SparkleArt, TrophyArt } from "./AchievementArt";

/**
 * Celebratory line doodles in the empty parts of the page head: beside
 * "Proof of", under it next to "Progress", and in the gutter between the
 * statement and the numbers. They draw themselves on as the headline lands,
 * then drift on two out-of-phase loops while one at a time performs a small
 * action (the laurel rustles, the seal is pressed, the trophy is lifted).
 * Everything is decorative and ignores the pointer. The doodle system itself
 * lives in styles/doodles.css, shared with the contact page.
 *
 *   region     "header" (around the headline) | "stats" (statement and numbers)
 *   on         start drawing (fonts ready, headline under way)
 *   celebrate  bump to make every doodle hop once, in a ripple
 */

const ART = { laurel: LaurelArt, seal: SealArt, sparkle: SparkleArt, trophy: TrophyArt, ribbon: RibbonArt };

/* Placement in % of the region (the two title lines for "header", the
   statement and numbers for "stats"); `top` may also be a CSS length for
   spots just outside it (the band between the headline and the statement on
   phones). `at`: "md" ≥768px, where the headline scales with the viewport
   and keeps its proportions, or "sm" <768px. `tint` draws the doodle in the
   accent instead of the text colour.
   f = [drift x px, bob y px, tilt deg], t = [drift s, bob s],
   draw = draw-on delay, act = first action delay. */
const PLACES = {
  header: [
    // Right of "Proof of"
    { art: "laurel", at: "md", size: "xl", left: 55, top: 15, f: [8, 6, 4], t: [9.8, 6.6], draw: 0.95, act: 3.4 },
    { art: "sparkle", at: "md", size: "xs", left: 47.5, top: -4, f: [4, 4, 0], t: [7.2, 5.1], draw: 1.15, tint: true },
    { art: "trophy", at: "md", size: "md", left: 74.5, top: 6, f: [7, 8, 6], t: [8.8, 6.0], draw: 1.1, act: 6.3 },
    { art: "sparkle", at: "md", size: "sm", left: 90, top: 25, f: [5, 4, 0], t: [8.2, 5.6], draw: 1.35 },
    // Left of "Progress"
    { art: "seal", at: "md", size: "lg", left: 27, top: 69, f: [8, 7, 6], t: [10.4, 7.0], draw: 1.3, act: 9.1 },
    { art: "sparkle", at: "md", size: "sm", left: 9, top: 76, f: [5, 4, 0], t: [8.6, 5.9], draw: 1.45 },
    { art: "sparkle", at: "md", size: "xs", left: 47, top: 81, f: [4, 3, 0], t: [7.6, 5.4], draw: 1.5, tint: true },

    // Phones: beside "Proof of", then left of "Progress"
    { art: "laurel", at: "sm", size: "md", left: 72, top: 11, f: [5, 4, 4], t: [9.8, 6.6], draw: 0.95, act: 3.4 },
    { art: "sparkle", at: "sm", size: "xs", left: 53, top: -4, f: [3, 3, 0], t: [7.2, 5.1], draw: 1.15, tint: true },
    { art: "sparkle", at: "sm", size: "xs", left: 24, top: 82, f: [3, 3, 0], t: [7.6, 5.4], draw: 1.3 },
  ],
  stats: [
    // The gutter between the statement and the numbers
    { art: "ribbon", at: "md", size: "md", left: 40, top: 40, f: [7, 8, 6], t: [9.4, 6.4], draw: 1.55, act: 7.6 },
    { art: "sparkle", at: "md", size: "xs", left: 36.5, top: 88, f: [4, 4, 0], t: [7.4, 5.2], draw: 1.7 },

    // Phones: the band above the statement, and beside the "7"
    { art: "seal", at: "sm", size: "sm", left: 14, top: "-36px", f: [5, 4, 6], t: [10.4, 7.0], draw: 1.3, act: 9.1 },
    { art: "ribbon", at: "sm", size: "sm", left: 86, top: "-32px", f: [5, 5, 6], t: [9.4, 6.4], draw: 1.45, act: 7.6 },
    { art: "trophy", at: "sm", size: "sm", left: 34, top: 88, f: [5, 5, 6], t: [8.8, 6.0], draw: 1.7, act: 6.3 },
    { art: "sparkle", at: "sm", size: "xs", left: 90, top: 60, f: [3, 3, 0], t: [7.4, 5.2], draw: 1.85, tint: true },
  ],
};

export function DoodleLayer({ region, on, celebrate = 0 }) {
  return (
    <div
      className="doodles cred-doodles"
      data-on={on ? "" : undefined}
      data-celebrate={celebrate ? (celebrate % 2 ? "a" : "b") : undefined}
      aria-hidden="true"
    >
      {PLACES[region].map((p, i) => {
        const Art = ART[p.art];
        return (
          <span
            key={`${p.art}-${p.at}-${i}`}
            className={`doodle doodle--${p.size} doodle--at-${p.at}${p.tint ? " doodle--tint" : ""}`}
            style={{
              left: `${p.left}%`,
              top: typeof p.top === "number" ? `${p.top}%` : p.top,
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

export default DoodleLayer;
