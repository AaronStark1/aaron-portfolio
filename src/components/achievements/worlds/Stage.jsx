import { STAGE } from "./geometry";

/**
 * The stage a featured-tile world is drawn on: under the badge and the tile
 * furniture, ignoring the pointer, decorative only (the tile carries the
 * accessible name). Variant labels ("rest" / "hover") flow down from the
 * tile; nothing is painted by default and every shape names a palette role.
 */
export default function Stage({ children }) {
  return (
    <svg
      className="cred-world"
      viewBox={STAGE}
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
