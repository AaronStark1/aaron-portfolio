/* One card preview at a time. A tile claims the slot when it starts playing
   and hands over its stop function; the next claimant, or the showcase modal,
   calls that function before taking the slot. `claimPreview` returns the
   matching release for when the tile stops on its own. */
let active = null;

export function claimPreview(stop) {
  if (active && active.stop !== stop) active.stop();
  const token = { stop };
  active = token;
  return () => {
    if (active === token) active = null;
  };
}

export function stopPreviews() {
  const token = active;
  active = null;
  token?.stop();
}
