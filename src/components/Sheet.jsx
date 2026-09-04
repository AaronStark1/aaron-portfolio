import { useEffect } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";
import { EASE, EASE_INOUT, DUR } from "../lib/motion";

/**
 * The rounded page panel every route renders inside.
 * Handles the route transition (enter/exit) and scroll reset.
 * `invert` flips the sheet to the opposite colour block (used by Contact).
 */
export default function Sheet({ children, className = "", invert = false, ...rest }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const variants = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.35 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
      }
    : {
        initial: { opacity: 0, y: 48, scale: 0.985 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: DUR.sheetIn, ease: EASE },
        },
        exit: {
          opacity: 0,
          y: -32,
          transition: { duration: DUR.sheetOut, ease: EASE_INOUT },
        },
      };

  return (
    <Motion.section
      data-invert={invert ? "true" : undefined}
      className={`sheet mx-auto max-w-[1800px] origin-top ${className}`}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...rest}
    >
      {children}
    </Motion.section>
  );
}
