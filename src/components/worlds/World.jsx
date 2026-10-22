import { WORLD_VIEW } from "../../lib/worlds";

/**
 * The stage every social world is drawn on. Sits under the card's furniture,
 * ignores the pointer, and is purely decorative: the card already carries
 * the accessible name. Variant labels ("rest"/"hover") flow down from the
 * card. Nothing is painted by default; every shape names its palette role.
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
      stroke="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
