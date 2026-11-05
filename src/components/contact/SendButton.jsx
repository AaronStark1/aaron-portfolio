import { motion as Motion, useReducedMotion } from "motion/react";
import { EASE, DUR } from "../../lib/motion";
import { PLANE_D, PLANE_FOLD_D } from "./doodlePaths";

/**
 * The contact form's submit tile: a brick NavCard with a small line drawing
 * in its top-right corner that shows what sending does.
 *
 *   idle      an envelope; on hover or keyboard focus it folds into a paper
 *             plane that revs in place, ready to go
 *   sending   the plane launches out of the tile, three dots wait
 *   sent      a check draws itself, then the envelope comes back
 *   error     the envelope returns with a shake
 *
 * The art is driven by CSS (data-status plus :hover / :focus-visible), so it
 * can never get stuck in a hover state while the button is disabled.
 * `nudge` bumps to shake the art when the form is not ready yet.
 */
export default function SendButton({ label, status = "idle", nudge = 0, start = true, delay = 0, disabled, className = "", onFocus, onBlur }) {
  const reduce = useReducedMotion();

  return (
    <div className={`overflow-hidden ${className}`}>
      <Motion.div
        initial={reduce ? { opacity: 0 } : { y: "120%" }}
        animate={
          start
            ? reduce
              ? { opacity: 1, transition: { duration: 0.4, delay } }
              : { y: "0%", transition: { duration: DUR.card, ease: EASE, delay } }
            : reduce
              ? { opacity: 0 }
              : { y: "120%" }
        }
      >
        <button
          type="submit"
          className="nav-card tone-brick send-card"
          style={{ "--card-h": "6.5rem" }}
          data-status={status}
          data-nudge={nudge ? (nudge % 2 ? "a" : "b") : undefined}
          disabled={disabled}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <svg className="send-art" viewBox="0 0 72 48" aria-hidden="true" focusable="false">
            <g className="send-art__envelope">
              <g transform="translate(36 24) scale(1.3) translate(-12 -12)">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
              </g>
            </g>

            <g className="send-art__speed">
              <path d="M13 37.5l5.5-5.5" />
              <path d="M18.5 43l4-4" />
              <path d="M8.5 31l4-4" />
            </g>

            <g className="send-art__plane">
              <g className="send-art__plane-rev">
                <g transform="translate(36 24) scale(1.2) translate(-12 -12)">
                  <path d={PLANE_D} />
                  <path d={PLANE_FOLD_D} />
                </g>
              </g>
            </g>

            <g className="send-art__dots">
              {[27, 36, 45].map((x, n) => (
                <circle key={x} cx={x} cy="24" r="1.8" style={{ "--n": n }} />
              ))}
            </g>

            <g className="send-art__check">
              <circle className="send-art__ring" cx="36" cy="24" r="13" pathLength="1" />
              <path className="send-art__tick" d="M30 24.5l4 4 8-8.5" pathLength="1" />
            </g>
          </svg>
          <span className="nav-card__label">{label}</span>
        </button>
      </Motion.div>
    </div>
  );
}
