import { Link } from "react-router-dom";
import { motion as Motion, useReducedMotion } from "motion/react";
import { EASE, DUR } from "../lib/motion";

/**
 * The coloured navigation tile: label bottom-left, number bottom-right,
 * description revealed on hover while an ink wipe rises from the bottom.
 * Enters by rising out of a mask (used in the Home choreography).
 */
export default function NavCard({
  to,
  href,
  label,
  number,
  tone = "cream",
  description,
  className = "",
  start = true,
  delay = 0,
  height,
  onClick,
  type,
  disabled,
}) {
  const reduce = useReducedMotion();
  const style = height ? { "--card-h": height } : undefined;

  const content = (
    <>
      {description ? <span className="nav-card__desc">{description}</span> : null}
      <span className="nav-card__label">{label}</span>
      {number ? (
        <span className="nav-card__num" aria-hidden="true">
          {number}
        </span>
      ) : null}
    </>
  );

  const cls = `nav-card tone-${tone}`;
  let inner;
  if (type === "submit" || type === "button") {
    inner = (
      <button type={type} className={cls} style={style} onClick={onClick} disabled={disabled}>
        {content}
      </button>
    );
  } else if (to) {
    inner = (
      <Link to={to} className={cls} style={style} onClick={onClick}>
        {content}
      </Link>
    );
  } else {
    inner = (
      <a href={href} className={cls} style={style} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }

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
        {inner}
      </Motion.div>
    </div>
  );
}
