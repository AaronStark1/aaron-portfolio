import { useLayoutEffect, useRef } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";
import { EASE } from "../lib/motion";

/**
 * A figure that counts up from zero, eased out, when the variant tree it sits
 * in plays "visible": it inherits the label from the block around it, so it
 * starts with that block's own entrance, stagger included, and plays once.
 *
 * Motion animates a CSS variable on the span and onUpdate writes the rounded
 * figure straight into the text node React rendered, so nothing re-renders
 * while it counts and React's own text node stays the one on screen. The
 * figure is rendered in full; only the visible digits start at zero, and
 * assistive tech is given the final figure throughout. Under reduced motion
 * the final figure simply shows.
 *
 *   value     the final figure (integers; formatting goes through `format`)
 *   duration  seconds the count takes
 *   delay     optional. Left out, the count starts with its block, keeping the
 *             stagger the block was given; set, it replaces that delay (Motion
 *             lets a value's own delay win), counted from the tree's start.
 */
const defaultFormat = (n) => String(Math.round(n));

export default function CountUp({ value, duration = 1.6, delay, format = defaultFormat, className = "" }) {
  const reduce = useReducedMotion();
  const digits = useRef(null);
  const primed = useRef(false);

  const write = (n) => {
    const node = digits.current?.firstChild;
    if (node) node.nodeValue = format(n);
  };

  /* Before the first paint: the visible digits start from zero */
  useLayoutEffect(() => {
    if (primed.current || reduce) return;
    primed.current = true;
    const node = digits.current?.firstChild;
    if (node) node.nodeValue = format(0);
  }, [reduce, format]);

  const variants = reduce
    ? { hidden: { "--count": value }, visible: { "--count": value } }
    : {
        hidden: { "--count": 0 },
        visible: { "--count": value, transition: { duration, ease: EASE, ...(delay === undefined ? {} : { delay }) } },
      };

  return (
    <>
      <span className="sr-only">{format(value)}</span>
      <Motion.span
        ref={digits}
        aria-hidden="true"
        className={className}
        variants={variants}
        onUpdate={(latest) => typeof latest["--count"] === "number" && write(latest["--count"])}
        onAnimationComplete={(definition) => definition === "visible" && write(value)}
      >
        {format(value)}
      </Motion.span>
    </>
  );
}
