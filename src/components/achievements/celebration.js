/* Once-per-certificate guard for the confetti. A certificate celebrates the
   first time it is opened in a browser session and never again, so the burst
   stays a small reward rather than a routine. The record lives in
   sessionStorage (it survives route changes and reloads in the tab) with an
   in-memory copy for when storage is unavailable (private modes, blocked
   site data), which still guards the current page. */

const KEY = "portfolio:celebrated-certificates";
const seen = new Set();
let hydrated = false;

function hydrate() {
  hydrated = true;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(KEY) || "[]");
    if (Array.isArray(stored)) stored.forEach((id) => seen.add(String(id)));
  } catch {
    /* unreadable or unavailable: start from the in-memory set */
  }
}

/** True the first time `id` asks this session (and records it); false after. */
export function claimCelebration(id) {
  if (!hydrated) hydrate();
  if (seen.has(id)) return false;
  seen.add(id);
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    /* storage full or blocked: the in-memory set still guards this tab */
  }
  return true;
}
