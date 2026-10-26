import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { EASE, EASE_INOUT } from "../lib/motion";
import { stopPreviews } from "../lib/showcase";

const FOCUSABLE = 'a[href], button:not([disabled]), video, [tabindex]:not([tabindex="-1"])';

/**
 * Cinematic player for a project's showcase reel. Always dark, whatever the
 * page theme. Esc and the backdrop close it, Tab cycles inside it, focus lands
 * on the close control and returns to `trigger` afterwards, the page behind
 * stops scrolling, and every card preview is paused while it is up. The reel
 * starts from the top, muted, with the native controls for sound and seeking.
 */
export default function ShowcaseModal({ project, number, trigger, onClose }) {
  const reduce = useReducedMotion();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const videoRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const open = Boolean(project);

  useEffect(() => {
    if (!open) return;
    stopPreviews();
    const video = videoRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        cycleFocus(e, dialogRef.current);
      }
    };
    // Capture phase: the native media controls stop Escape from bubbling.
    window.addEventListener("keydown", onKey, true);
    const t = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      video?.pause();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
      window.clearTimeout(t);
      trigger?.focus?.();
    };
  }, [open, onClose, trigger]);

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.3 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }
    : {
        initial: { opacity: 0, y: 18, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
        exit: { opacity: 0, y: -12, transition: { duration: 0.22, ease: EASE_INOUT } },
      };

  const closeOnBackdrop = (e) => e.target === e.currentTarget && onClose();
  const live = project?.live && project.live !== project.github ? project.live : null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <Motion.div
          key="showcase"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="showcase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.1 } }}
          onClick={closeOnBackdrop}
        >
          <div className="showcase__bar label">
            <span className="tabular-nums">Showcase · {number}</span>
            <button
              ref={closeRef}
              type="button"
              className="label link-reveal cursor-pointer"
              data-text="Close"
              aria-label="Close showcase"
              onClick={onClose}
            >
              <span className="inline-flex items-center gap-1">
                Close
                <X size={12} weight="bold" aria-hidden="true" />
              </span>
            </button>
          </div>

          <div className="showcase__stage" onClick={closeOnBackdrop}>
            <Motion.figure className="showcase__figure" {...slide}>
              <ShowcasePlayer key={project.id} project={project} videoRef={videoRef} />
            </Motion.figure>
          </div>

          <div className="showcase__caption">
            <div className="min-w-0">
              <h2 id={titleId} className="m-0 text-[length:var(--fs-title)] font-normal leading-[1.1] tracking-[-0.02em]">
                {project.title}
              </h2>
              <p id={descId} className="m-0 mt-2 max-w-[64ch] text-[length:var(--fs-body)] leading-[1.35] text-fg-muted">
                {project.description}
              </p>
            </div>
            <ul className="label m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0" aria-label={`${project.title} links`}>
              {live && (
                <li className="inline-flex items-center gap-1">
                  <a href={live} target="_blank" rel="noopener noreferrer" className="link-reveal" data-text="Live site">
                    <span>Live site</span>
                  </a>
                  <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
                </li>
              )}
              {project.github && (
                <li className="inline-flex items-center gap-1">
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="link-reveal" data-text="GitHub">
                    <span>GitHub</span>
                  </a>
                  <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
                </li>
              )}
            </ul>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* Keyed by project so a playback failure never leaks into the next reel. */
function ShowcasePlayer({ project, videoRef }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.currentTime = 0;
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
    return () => v.pause();
  }, [videoRef]);

  if (failed) {
    return (
      <div className="showcase__frame showcase__frame--fallback" role="img" aria-label={`${project.title} showcase poster`}>
        <img src={project.poster} alt="" className="showcase__poster" draggable="false" />
        <p className="label m-0">This reel could not be played here. The links below still work.</p>
      </div>
    );
  }

  return (
    <div className="showcase__frame">
      <video
        ref={videoRef}
        className="showcase__video"
        src={project.video}
        poster={project.poster}
        aria-label={`${project.title} showcase reel`}
        controls
        playsInline
        muted
        preload="metadata"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/* Tab and Shift+Tab wrap inside the dialog instead of leaving it. */
function cycleFocus(e, root) {
  if (!root) return;
  const items = root.querySelectorAll(FOCUSABLE);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const current = document.activeElement;
  const outside = !root.contains(current);
  if (e.shiftKey && (current === first || outside)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (current === last || outside)) {
    e.preventDefault();
    first.focus();
  }
}
