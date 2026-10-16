import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "@phosphor-icons/react";
import { EASE, EASE_INOUT } from "../lib/motion";

/**
 * Full-screen gallery for credential artwork. `items` is one gallery (badges
 * or certificates), `index` the open slide; arrows and swipes move within it.
 * Esc closes, focus moves to the close control on open and returns on close,
 * and the page behind stops scrolling while it is up.
 *
 *   item: { id, src, alt, title, meta, verify, pdf? }
 */
export default function Lightbox({ open, items, index, kind, onClose, onNavigate }) {
  const reduce = useReducedMotion();
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const swipe = useRef(null);
  const count = items.length;
  const item = items[index];

  const prev = useCallback(() => onNavigate((index - 1 + count) % count), [index, count, onNavigate]);
  const next = useCallback(() => onNavigate((index + 1) % count), [index, count, onNavigate]);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) prev();
      else if (e.key === "ArrowRight" && count > 1) next();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      openerRef.current?.focus?.();
    };
  }, [open, count, prev, next, onClose]);

  // Warm the neighbours so stepping through feels instant
  useEffect(() => {
    if (!open || count < 2) return;
    [items[(index + 1) % count], items[(index - 1 + count) % count]].forEach((it) => {
      const img = new Image();
      img.src = it.src;
    });
  }, [open, index, count, items]);

  const onPointerDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    if (!swipe.current || count < 2) return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    swipe.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  };

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.3 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }
    : {
        initial: { opacity: 0, y: 18, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
        exit: { opacity: 0, y: -12, transition: { duration: 0.22, ease: EASE_INOUT } },
      };

  return (
    <AnimatePresence>
      {open && item && (
        <Motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${kind === "certificate" ? "Certificate" : "Badge"}: ${item.title}`}
          className="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.1 } }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="lightbox__bar label">
            <span className="tabular-nums" aria-live="polite">
              {kind === "certificate" ? "Certificate" : "Badge"} · {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <button ref={closeRef} type="button" className="label link-reveal cursor-pointer" data-text="Close" onClick={onClose}>
              <span className="inline-flex items-center gap-1">
                Close
                <X size={12} weight="bold" aria-hidden="true" />
              </span>
            </button>
          </div>

          <div className="lightbox__stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
            {count > 1 && (
              <button type="button" className="lightbox__arrow lightbox__arrow--prev" onClick={prev} aria-label="Previous">
                <ArrowLeft size={20} weight="regular" aria-hidden="true" />
              </button>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <Motion.figure key={item.id} className={`lightbox__figure lightbox__figure--${kind}`} {...slide}>
                <img src={item.src} alt={item.alt} className="lightbox__img" draggable="false" />
              </Motion.figure>
            </AnimatePresence>
            {count > 1 && (
              <button type="button" className="lightbox__arrow lightbox__arrow--next" onClick={next} aria-label="Next">
                <ArrowRight size={20} weight="regular" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="lightbox__caption">
            <div className="min-w-0">
              <p className="m-0 text-[length:var(--fs-title)] font-normal leading-[1.1] tracking-[-0.02em]">{item.title}</p>
              <p className="label mt-2 text-fg-muted">{item.meta}</p>
            </div>
            <ul className="label m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0">
              {item.pdf && (
                <li className="inline-flex items-center gap-1">
                  <a href={item.pdf} download className="link-reveal" data-text="Download PDF">
                    <span>Download PDF</span>
                  </a>
                </li>
              )}
              {item.verify && (
                <li className="inline-flex items-center gap-1">
                  <a href={item.verify} target="_blank" rel="noopener noreferrer" className="link-reveal" data-text="Verify">
                    <span>Verify</span>
                  </a>
                  <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
                </li>
              )}
            </ul>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
