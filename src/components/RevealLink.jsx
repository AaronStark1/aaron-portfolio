import { Link, NavLink } from "react-router-dom";

/**
 * Text link whose label slides up and is replaced by a duplicate from below on hover.
 * Renders a router Link (to), a NavLink (nav), or a plain anchor (href).
 */
export default function RevealLink({
  to,
  href,
  nav = false,
  children,
  className = "",
  external,
  ...rest
}) {
  const text = typeof children === "string" ? children : rest["aria-label"] || "";
  const cls = `link-reveal ${className}`;
  const inner = <span>{children}</span>;

  if (to && nav) {
    return (
      <NavLink to={to} className={cls} data-text={text} {...rest}>
        {inner}
      </NavLink>
    );
  }
  if (to) {
    return (
      <Link to={to} className={cls} data-text={text} {...rest}>
        {inner}
      </Link>
    );
  }
  const ext = external ?? /^https?:/.test(href || "");
  return (
    <a
      href={href}
      className={cls}
      data-text={text}
      {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {inner}
    </a>
  );
}
