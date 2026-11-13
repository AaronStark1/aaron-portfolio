import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from "motion/react";
import { DUR, EASE, EASE_INOUT, STAGGER, fadeChild, riseChild, riseParent, useFontsReady } from "../../lib/motion";

/**
 * "What I work with": one technology at a time, set at display size with a
 * hairline under it, turning over the way the site's headlines arrive. The
 * outgoing name lifts out of its mask a character at a time while the next one
 * rises in behind it, and its line in the statement voice follows.
 *
 * Rotation runs only while the section is on screen and the tab is visible,
 * and holds while the pointer is over the index or keyboard focus is in it.
 * Choosing a name, or Pause, stops it until Play. Each name's stay is timed by
 * the CSS progress hairline under its index entry (its animationend turns the
 * page), so holding just freezes that line, and React renders once per turn.
 * Under reduced motion nothing rotates: chosen names cross-fade in place.
 *
 * Heights never change while it runs: the name is a single masked line, and
 * every description is laid out invisibly in the same cell as the visible one,
 * so the block is always as tall as the longest.
 */

const DWELL = 4.2; // seconds each name stays before the next turns over
const FIRST_DELAY = 1.1; // the first turn waits for the reveal to land
const EASE_IN = [0.55, 0.055, 0.675, 0.19]; // leaving: gathers speed as it goes

const pad = (n) => String(n).padStart(2, "0");

/* "plain *italic* plain" -> text with <em> runs */
function rich(text) {
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part, i) => (part.startsWith("*") ? <em key={i}>{part.slice(1, -1)}</em> : part));
}
const plain = (text) => text.replace(/\*/g, "");

/* Splitting a name into characters drops the font's kerning; this measures it
   once per name (in em, so it holds at every size) with the face the display
   line uses, the same correction TitleText applies to the headlines. */
function measureKerning(items) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return {};
  ctx.font = `400 100px ${getComputedStyle(document.body).fontFamily}`;
  const width = (s) => ctx.measureText(s).width;
  return Object.fromEntries(
    items.map((item) => {
      const chars = Array.from(item.name);
      const kerns = chars.map((ch, i) => {
        if (i === 0) return 0;
        const k = (width(chars[i - 1] + ch) - width(chars[i - 1]) - width(ch)) / 100;
        return Math.abs(k) > 0.0005 ? Number(k.toFixed(4)) : 0;
      });
      return [item.id, kerns];
    })
  );
}

const subscribeVisibility = (onChange) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
const isHidden = () => document.hidden;

/* Keyboard focus only: a click that focuses a button shouldn't count */
function focusVisible(el) {
  try {
    return el.matches(":focus-visible");
  } catch {
    return false;
  }
}

/* The name: characters rise out of the mask in a stagger and lift away above it */
const wordTurn = {
  below: {},
  center: { transition: { delayChildren: 0.12, staggerChildren: STAGGER.char } },
  above: { transition: { staggerChildren: 0.012 } },
};
const charTurn = {
  below: { y: "112%" },
  center: { y: "0%", transition: { duration: DUR.char, ease: EASE } },
  above: { y: "-112%", transition: { duration: 0.5, ease: EASE_IN } },
};
const wordFade = {
  below: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
  above: { opacity: 0, transition: { duration: 0.2 } },
};

/* Its line: follows the name a beat later, rising a little less far */
const lineTurn = {
  below: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.24 } },
  above: { opacity: 0, y: -8, transition: { duration: 0.28, ease: EASE_IN } },
};
const lineFade = {
  below: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.4, delay: 0.1 } },
  above: { opacity: 0, transition: { duration: 0.2 } },
};

export default function TechShowcase({ items }) {
  const reduce = useReducedMotion();
  const ready = useFontsReady();
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const revealed = ready && seen;
  const child = reduce ? fadeChild : riseChild;

  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState(0); // changes of name so far; 0 = still on the reveal
  const [stopped, setStopped] = useState(false); // Pause, or a name chosen by hand
  const [hovered, setHovered] = useState(false); // pointer over the index
  const [focusHold, setFocusHold] = useState(false); // keyboard focus in the index
  const [onScreen, setOnScreen] = useState(false);
  const hidden = useSyncExternalStore(subscribeVisibility, isHidden, () => false);

  const kerning = useMemo(() => (ready ? measureKerning(items) : {}), [ready, items]);

  const auto = !reduce && !stopped;
  const running = auto && revealed && onScreen && !hovered && !focusHold && !hidden;
  const item = items[index];
  const kerns = kerning[item.id];

  const show = (next) => {
    setIndex(next);
    setTurns((t) => t + 1);
  };
  const advance = () => show((index + 1) % items.length);
  const choose = (i) => {
    setStopped(true);
    if (i !== index) show(i);
  };
  const toggle = () => {
    setStopped((s) => !s);
    setFocusHold(false); // Play means play, even with focus still on the button
  };

  const rule = reduce
    ? { initial: { opacity: 0 }, animate: revealed ? { opacity: 1, transition: { duration: 0.4, delay: 0.3 } } : { opacity: 0 } }
    : {
        initial: { scaleX: 0 },
        animate: revealed ? { scaleX: 1, transition: { duration: DUR.rule, ease: EASE, delay: 0.35 } } : { scaleX: 0 },
      };

  return (
    <Motion.section
      ref={ref}
      aria-labelledby="stack-title"
      className="tech mt-[clamp(5rem,14vh,9rem)]"
      style={{ "--dwell": `${DWELL}s` }}
      viewport={{ amount: 0.2 }}
      onViewportEnter={() => setOnScreen(true)}
      onViewportLeave={() => setOnScreen(false)}
      variants={riseParent(0, STAGGER.item)}
      initial="hidden"
      animate={revealed ? "visible" : "hidden"}
    >
      {/* Eyebrow: the section's name left; where we are in the list, and the control, right */}
      <div className="grid-15 items-center gap-y-3">
        <Motion.h2 id="stack-title" className="label col-span-8 m-0" variants={child}>
          What I work with
        </Motion.h2>
        <Motion.div className="label col-span-7 flex items-center justify-end gap-6" variants={child}>
          <span className="tech-count tabular-nums" aria-hidden="true">
            <Roll value={pad(index + 1)} reduce={reduce} />
            <span className="text-fg-muted"> / {pad(items.length)}</span>
          </span>
          {!reduce && (
            <button
              type="button"
              className="link-reveal label cursor-pointer"
              data-text={stopped ? "Play" : "Pause"}
              aria-label={stopped ? "Play the technology rotation" : "Pause the technology rotation"}
              onClick={toggle}
            >
              <span>{stopped ? "Play" : "Pause"}</span>
            </button>
          )}
        </Motion.div>
      </div>

      {/* What assistive tech reads: quiet while rotating, announced once in hand */}
      <p className="sr-only" aria-live={running ? "off" : "polite"} aria-atomic="true">
        {item.name}: {plain(item.description)}
      </p>

      {/* The name, one masked display line */}
      <div className="tech-word display-sans" aria-hidden="true">
        <AnimatePresence>
          <Motion.span
            key={item.id}
            className="tech-word__item"
            variants={reduce ? wordFade : wordTurn}
            initial="below"
            animate={revealed ? "center" : "below"}
            exit="above"
          >
            {Array.from(item.name).map((ch, i) => (
              <Motion.span
                key={i}
                className="tech-word__char"
                variants={reduce ? undefined : charTurn}
                style={kerns?.[i] ? { marginLeft: `${kerns[i]}em` } : undefined}
              >
                {ch === " " ? " " : ch}
              </Motion.span>
            ))}
          </Motion.span>
        </AnimatePresence>
      </div>
      <Motion.span aria-hidden="true" className="rule" {...rule} />

      <div className="grid-15 mt-[clamp(1.25rem,3vh,2rem)] items-start gap-y-8">
        {/* Its line in the statement voice; every line sits invisibly in the same cell */}
        <div
          className="tech-line col-span-full font-serif text-[length:var(--fs-statement)] font-normal leading-[1.2] tracking-[-0.01em] md:col-span-7"
          aria-hidden="true"
        >
          {items.map((it) => (
            <p key={it.id} className="tech-line__sizer m-0">
              {rich(it.description)}
            </p>
          ))}
          <AnimatePresence>
            <Motion.p
              key={item.id}
              className="m-0"
              variants={reduce ? lineFade : lineTurn}
              initial="below"
              animate={revealed ? "center" : "below"}
              exit="above"
            >
              {rich(item.description)}
            </Motion.p>
          </AnimatePresence>
        </div>

        {/* The index: every name, the current one carrying the timer hairline */}
        <Motion.ul
          className="tech-index label col-span-full m-0 list-none p-0 md:col-start-9 md:col-span-7"
          aria-label="Technologies"
          variants={child}
          onPointerMove={(e) => e.pointerType !== "touch" && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={(e) => focusVisible(e.target) && setFocusHold(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocusHold(false)}
        >
          {items.map((it, i) => {
            const current = i === index;
            return (
              <li key={it.id}>
                <button type="button" className="tech-tab" aria-current={current ? "true" : undefined} onClick={() => choose(i)}>
                  {it.name}
                  <span className="tech-tab__bar" aria-hidden="true">
                    {current &&
                      (auto ? (
                        <span
                          key={turns}
                          className="tech-tab__fill"
                          data-timer=""
                          style={{
                            animationPlayState: running ? "running" : "paused",
                            animationDelay: turns === 0 ? `${FIRST_DELAY}s` : undefined,
                          }}
                          onAnimationEnd={(e) => e.animationName === "tech-progress" && advance()}
                        />
                      ) : (
                        <span className="tech-tab__fill" />
                      ))}
                  </span>
                </button>
              </li>
            );
          })}
        </Motion.ul>
      </div>
    </Motion.section>
  );
}

/* The current position, rolling over like a link label */
function Roll({ value, reduce }) {
  if (reduce) return <span>{value}</span>;
  return (
    <span className="tech-roll">
      <AnimatePresence initial={false}>
        <Motion.span
          key={value}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.55, ease: EASE_INOUT }}
        >
          {value}
        </Motion.span>
      </AnimatePresence>
    </span>
  );
}
