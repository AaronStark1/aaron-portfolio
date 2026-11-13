import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { EASE, EASE_INOUT, useMediaQuery } from "../../lib/motion";

/**
 * An employer's name, set as a link to its own site, with a small identity
 * card above it: the company's official logo, its tagline and what it does.
 *
 * Where hovering exists the card opens after a short hover (so a pointer
 * passing through doesn't flash it) or on keyboard focus, and stays while the
 * pointer travels onto it. On touch screens the name stays a plain link, one
 * tap away, and a small "+" beside it opens the card instead; a tap anywhere
 * else or Escape closes it. The card rises out of the line it belongs to: an
 * upward clip on the ink panel, then the logo and the copy settle in turn.
 *
 * The card describes the company in its own words and links to it. It is not
 * a badge: nothing in it speaks for the company or about this site.
 *
 * The card is positioned against the nearest positioned ancestor, so give the
 * line or row the name sits in `position: relative`.
 */

const OPEN_DELAY = 70; // ms of hover before the card opens
const CLOSE_DELAY = 140; // ms of grace to travel from the name onto the card
const ROOM = 210; // px the card needs above the name (its height and the gap); less, and it opens below

/* `side` is where the card sits: it unfolds away from the name either way */
const reveal = {
  closed: (side) => ({
    opacity: 0,
    y: side === "below" ? -8 : 8,
    clipPath: side === "below" ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)",
  }),
  open: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { duration: 0.5, ease: EASE, delayChildren: 0.1, staggerChildren: 0.06 },
  },
  exit: (side) => ({ opacity: 0, y: side === "below" ? -4 : 4, transition: { duration: 0.18, ease: EASE_INOUT } }),
};
const revealItem = {
  closed: { opacity: 0, y: 8 },
  open: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};
const revealLogo = {
  closed: { opacity: 0, scale: 0.94 },
  open: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE } },
};
const fade = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function focusVisible(el) {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

export default function CompanyMark({ name, href, logo, tagline, descriptor, domain }) {
  const reduce = useReducedMotion();
  const touch = useMediaQuery("(hover: none)");
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState("above");
  const rootRef = useRef(null);
  const timer = useRef(0);
  const id = useId();
  const cardId = `${id}-card`;
  const descId = `${id}-desc`;

  /* The card hangs off the nearest positioned ancestor (the line the name sits
     in, so a wrapped name never hides the words before it): above it, unless
     that would run off the top of the window */
  const show = () => {
    const anchor = rootRef.current?.offsetParent ?? rootRef.current;
    const top = anchor?.getBoundingClientRect().top ?? ROOM;
    setSide(top >= ROOM ? "above" : "below");
    setOpen(true);
  };
  const schedule = (next, ms) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => (next ? show() : setOpen(false)), ms);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* While it's open: Escape, or a tap/click anywhere else, closes it */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  /* Fetch the logo while the visitor reads, so the first reveal never waits on it */
  useEffect(() => {
    const warm = () => {
      const img = new Image();
      img.decoding = "async";
      img.src = logo;
    };
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(warm, { timeout: 2500 });
      return () => window.cancelIdleCallback(handle);
    }
    const t = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(t);
  }, [logo]);

  const hover = touch
    ? {}
    : {
        onPointerEnter: (e) => e.pointerType !== "touch" && schedule(true, OPEN_DELAY),
        onPointerLeave: (e) => e.pointerType !== "touch" && schedule(false, CLOSE_DELAY),
      };
  const focus = touch
    ? {}
    : {
        onFocus: (e) => focusVisible(e.currentTarget) && schedule(true, 0),
        onBlur: () => schedule(false, 0),
      };

  return (
    <span ref={rootRef} className="company" data-open={open ? "" : undefined} {...hover}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="company__link link-reveal"
        data-text={name}
        aria-describedby={descId}
        {...focus}
      >
        <span>{name}</span>
      </a>
      <ArrowUpRight className="company__arrow" size={13} weight="regular" aria-hidden="true" />
      {touch && (
        <button
          type="button"
          className="company__toggle"
          aria-expanded={open}
          aria-controls={cardId}
          aria-label={`${open ? "Hide" : "Show"} ${name} details`}
          onClick={() => (open ? setOpen(false) : show())}
        >
          <span className="company__plus" aria-hidden="true" />
        </button>
      )}
      <span id={descId} hidden>
        {`${name}: “${tagline}”. ${descriptor}. Opens ${domain} in a new tab.`}
      </span>

      <AnimatePresence custom={side}>
        {open && (
          <Motion.a
            key="card"
            id={cardId}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            aria-hidden={touch ? undefined : "true"}
            className="company__card"
            data-side={side}
            custom={side}
            variants={reduce ? fade : reveal}
            initial="closed"
            animate="open"
            exit="exit"
          >
            <Motion.img
              src={logo}
              alt={`${name} logo`}
              width={1100}
              height={201}
              decoding="async"
              className="company__logo"
              variants={reduce ? undefined : revealLogo}
            />
            <Motion.p className="company__tagline" variants={reduce ? undefined : revealItem}>
              “{tagline}”
            </Motion.p>
            <Motion.span className="company__meta label" variants={reduce ? undefined : revealItem}>
              <span>{descriptor}</span>
              <span className="company__domain">
                {domain}
                <ArrowUpRight size={12} weight="regular" aria-hidden="true" />
              </span>
            </Motion.span>
          </Motion.a>
        )}
      </AnimatePresence>
    </span>
  );
}
