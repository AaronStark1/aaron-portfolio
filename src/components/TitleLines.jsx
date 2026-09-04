import { Children, createContext, isValidElement, useContext, useLayoutEffect, useRef } from "react";
import { motion as Motion, useInView, useReducedMotion } from "motion/react";
import { EASE, DUR, STAGGER } from "../lib/motion";

/**
 * Title system used for every display headline on the site.
 *
 *   <TitleLines font="serif" start={ready}>
 *     <TitleLine delay={0.2} rule as="h1">
 *       <TitleText col="1 / span 7">A<i>a</i>ron</TitleText>
 *       <TitleText col="9 / -1" align="right">Corr<i>e</i>ya</TitleText>
 *     </TitleLine>
 *   </TitleLines>
 *
 * TitleText splits its text into words and characters, masks them and raises
 * them into view with a stagger. TitleLine draws its hairline rule shortly after
 * the characters start. Under prefers-reduced-motion everything degrades to a
 * plain opacity fade. Split spans are aria-hidden behind a visually hidden copy.
 */

const LinesCtx = createContext({ start: true });
const LineCtx = createContext({ go: true, delay: 0 });

/* ---------- helpers ---------- */

function collect(children, italic = false, out = []) {
  Children.forEach(children, (child) => {
    if (child == null || child === false) return;
    if (typeof child === "string" || typeof child === "number") {
      out.push({ text: String(child), italic });
    } else if (isValidElement(child)) {
      const isItalic = italic || child.type === "i" || child.type === "em";
      collect(child.props.children, isItalic, out);
    }
  });
  return out;
}

/** -> [{ chars: [{ch, italic}] }, ...] split at spaces, italic runs preserved */
function toWords(children) {
  const words = [];
  let current = null;
  collect(children).forEach(({ text, italic }) => {
    for (const ch of text) {
      if (ch === " " || ch === " ") {
        current = null;
        continue;
      }
      if (!current) {
        current = { chars: [] };
        words.push(current);
      }
      current.chars.push({ ch, italic });
    }
  });
  return words;
}

function plainText(children) {
  return collect(children)
    .map((r) => r.text)
    .join("");
}

/* Restores kerning that character splitting removes: measures each pair with
   canvas and applies the difference as a margin. Runs once fonts are ready. */
function applyKerning(root) {
  if (!root || typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  root.querySelectorAll(".word").forEach((word) => {
    const chars = Array.from(word.querySelectorAll(".char"));
    for (let i = 1; i < chars.length; i++) {
      const prev = chars[i - 1];
      const cur = chars[i];
      const a = getComputedStyle(prev);
      const b = getComputedStyle(cur);
      if (a.fontStyle !== b.fontStyle) {
        cur.style.marginLeft = "";
        continue;
      }
      ctx.font = `${b.fontStyle} ${b.fontWeight} ${b.fontSize} ${b.fontFamily}`;
      const pair = ctx.measureText(prev.textContent + cur.textContent).width;
      const solo = ctx.measureText(prev.textContent).width + ctx.measureText(cur.textContent).width;
      const kern = pair - solo;
      cur.style.marginLeft = Math.abs(kern) > 0.05 ? `${kern.toFixed(2)}px` : "";
    }
  });
}

const charVariants = {
  hidden: { y: "118%" },
  visible: { y: "0%", transition: { duration: DUR.char, ease: EASE } },
};

/* ---------- components ---------- */

export function TitleLines({ children, font = "sans", className = "", start = true, size = "display", style }) {
  const fontClass = font === "serif" ? "display-serif" : "display-sans";
  const sizeClass = size === "display" ? "display" : "";
  return (
    <LinesCtx.Provider value={{ start }}>
      <div className={`${sizeClass} ${fontClass} ${className}`} style={style}>
        {children}
      </div>
    </LinesCtx.Provider>
  );
}

export function TitleLine({
  children,
  as = "div",
  rule = true,
  delay = 0,
  start,
  inView = false,
  className = "",
  innerClassName = "",
  ruleDelay,
  ruleClassName = "mt-[0.1em]",
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const { start: parentStart } = useContext(LinesCtx);
  const Tag = Motion[as] || Motion.div;

  // explicit prop > in-view > parent start flag
  const go = start !== undefined ? start : inView ? seen : parentStart;
  const rDelay = ruleDelay ?? delay + 0.4;

  return (
    <LineCtx.Provider value={{ go, delay }}>
      <Tag ref={ref} className={`relative ${className}`}>
        <span className={`relative ${innerClassName || "block"}`}>{children}</span>
        {rule && (
          <Motion.span
            aria-hidden="true"
            className={`rule ${ruleClassName}`}
            initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
            animate={
              go
                ? reduce
                  ? { opacity: 1, transition: { duration: 0.4, delay: rDelay } }
                  : { scaleX: 1, transition: { duration: DUR.rule, ease: EASE, delay: rDelay } }
                : reduce
                ? { opacity: 0 }
                : { scaleX: 0 }
            }
          />
        )}
      </Tag>
    </LineCtx.Provider>
  );
}

export function TitleText({
  children,
  col,
  align = "left",
  className = "",
  delay,
  start,
  as = "span",
  nowrap = true,
  style: styleProp,
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const line = useContext(LineCtx);
  const go = start !== undefined ? start : line.go;
  const d = delay ?? line.delay;
  const words = toWords(children);
  const label = plainText(children);

  useLayoutEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) applyKerning(el);
    };
    if (document.fonts?.status === "loaded") run();
    document.fonts?.ready.then(run);
    return () => {
      cancelled = true;
    };
  }, [label, reduce]);

  const Tag = Motion[as] || Motion.span;
  const style = {
    gridColumn: col,
    textAlign: align,
    whiteSpace: nowrap ? "nowrap" : "normal",
    ...styleProp,
  };

  if (reduce) {
    return (
      <Tag
        ref={ref}
        className={`title-mask ${className}`}
        style={style}
        initial={{ opacity: 0 }}
        animate={go ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: d }}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={`title-mask ${className}`}
      style={style}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: d, staggerChildren: STAGGER.char } },
      }}
      initial="hidden"
      animate={go ? "visible" : "hidden"}
    >
      <span className="sr-only">{label}</span>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true">
          <span className="word">
            {w.chars.map((c, ci) => (
              <Motion.span
                key={ci}
                className="char"
                variants={charVariants}
                style={c.italic ? { fontStyle: "italic" } : undefined}
              >
                {c.ch}
              </Motion.span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

/* Convenience: a whole line that is a single text, e.g. section titles */
export function SimpleTitle({
  children,
  delay = 0,
  align = "left",
  as = "h2",
  col,
  rule = true,
  start,
  inView,
  className = "",
  textClassName = "",
}) {
  return (
    <TitleLine as={as} rule={rule} delay={delay} start={start} inView={inView} className={className}>
      <TitleText col={col} align={align} className={textClassName}>
        {children}
      </TitleText>
    </TitleLine>
  );
}
