import { useEffect, useState, useSyncExternalStore } from "react";

/* Shared motion vocabulary. One easing family, one set of durations, used everywhere. */
export const EASE = [0.215, 0.61, 0.355, 1]; // ease-out cubic (reference uses power3.out)
export const EASE_INOUT = [0.645, 0.045, 0.355, 1];

export const DUR = {
  char: 0.8,
  rule: 0.9,
  card: 0.7,
  sheetIn: 0.6,
  sheetOut: 0.32,
  fade: 0.5,
};

export const STAGGER = {
  char: 0.02,
  word: 0.06,
  card: 0.1,
  item: 0.08,
};

/* Module flag: the first Home visit plays the full choreography, later visits play a compressed one. */
let introPlayed = false;
export function getIntroScale() {
  const scale = introPlayed ? 0.45 : 1;
  introPlayed = true;
  return scale;
}

/**
 * Resolves true once web fonts are ready (or after a timeout) so display type
 * never animates in with a fallback face and then swaps.
 */
export function useFontsReady(timeout = 1600) {
  const [ready, setReady] = useState(() =>
    typeof document !== "undefined" && document.fonts && document.fonts.status === "loaded"
  );
  useEffect(() => {
    if (ready) return;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const timer = window.setTimeout(finish, timeout);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(finish);
    } else {
      finish();
    }
    return () => window.clearTimeout(timer);
  }, [ready, timeout]);
  return ready;
}

/** Media query hook backed by useSyncExternalStore: no setState-in-effect, no render thrash. */
export function useMediaQuery(query) {
  const subscribe = (cb) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/* Variants for simple staggered reveals (paragraphs, meta items) */
export const riseParent = (delay = 0, stagger = STAGGER.item) => ({
  hidden: {},
  visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
});

export const riseChild = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export const fadeChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.fade, ease: EASE } },
};
