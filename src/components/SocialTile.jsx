import { motion as Motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import BrandIcon from "./BrandIcons";
import { worlds } from "./worlds";
import { EASE, DUR, useMediaQuery } from "../lib/motion";

/**
 * A platform tile in the NavCard family: glyph top-left, label bottom-left,
 * handle revealed on hover while a wipe in the platform's own colour rises
 * from the bottom. Behind the furniture, a small animated "world" for the
 * platform plays while the tile is hovered or keyboard-focused: the tile is
 * the variant root ("rest"/"hover") and the scene's elements follow it. On
 * touch devices there is no hover, so the scene's still tableau is shown
 * instead, drawn in the card's own ink.
 * Rises out of a mask on entry, like the Home cards.
 */
export default function SocialTile({ social, start = true, delay = 0, className = "" }) {
  const reduce = useReducedMotion();
  const touch = useMediaQuery("(hover: none)");
  const external = /^https?:/.test(social.href || "");
  const style = { "--brand": social.brand, "--brand-fg": social.brandFg };
  const Scene = worlds[social.id];

  const content = (
    <>
      {Scene && <Scene reduce={reduce || touch} />}
      <BrandIcon name={social.id} className="social-tile__glyph" />
      <span className="social-tile__handle">{social.handle}</span>
      <span className="social-tile__label">{social.label}</span>
      {social.href && (
        <span className="social-tile__arrow" aria-hidden="true">
          <ArrowUpRight size={16} weight="regular" />
        </span>
      )}
    </>
  );

  const cls = `social-tile tone-${social.tone}`;
  const gesture = { initial: "rest", animate: touch ? "hover" : "rest", whileHover: "hover", whileFocus: "hover" };
  const inner = social.href ? (
    <Motion.a
      href={social.href}
      className={cls}
      style={style}
      aria-label={`${social.label}, ${social.handle}`}
      {...gesture}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {content}
    </Motion.a>
  ) : (
    <Motion.div className={`${cls} social-tile--pending`} style={style} tabIndex={0} aria-label={`${social.label}, link coming soon`} {...gesture}>
      {content}
    </Motion.div>
  );

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
