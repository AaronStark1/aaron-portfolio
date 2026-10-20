import { WORLD_VIEW } from "../../lib/worlds";

/**
 * The stage every social world is drawn on. Sits under the tile's furniture,
 * ignores the pointer, and is purely decorative: the tile already carries the
 * accessible name. Variant labels ("rest"/"hover") flow down from the tile.
 */
export default function World({ children, className = "" }) {
  return (
    <svg
      className={`social-world ${className}`}
      viewBox={WORLD_VIEW}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
