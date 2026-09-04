import { useContext, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import ThemeToggle from "./ThemeToggle";
import RevealLink from "./RevealLink";
import { TitleLines, TitleLine, TitleText } from "./TitleLines";
import { EASE, EASE_INOUT } from "../lib/motion";
import { ThemeContext } from "../context/ThemeContext";

const ITEMS = [
  { text: "Home", path: "/" },
  { text: "About", path: "/about" },
  { text: "Projects", path: "/projects" },
  { text: "Contact", path: "/contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="relative z-40 mx-auto flex h-14 max-w-[1800px] items-center justify-between px-8 md:h-16 md:px-10">
        <RevealLink to="/" className="label" aria-label="Aaron Correya, home">
          Aaron Correya
        </RevealLink>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {ITEMS.map((item) => {
              const active = pathname === item.path;
              return (
                <li key={item.path} className="relative">
                  <NavLink
                    to={item.path}
                    end
                    className="link-reveal label"
                    data-text={item.text}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.text}</span>
                  </NavLink>
                  {active && (
                    <Motion.span
                      layoutId="nav-active"
                      aria-hidden="true"
                      className="absolute -bottom-1.5 left-0 right-0 h-px bg-fg"
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-6">
          <ThemeToggle />
          <button
            type="button"
            className="label link-reveal cursor-pointer md:hidden"
            data-text="Menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <span>Menu</span>
          </button>
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} pathname={pathname} />
    </>
  );
}

function MobileMenu({ open, onClose, pathname }) {
  const reduce = useReducedMotion();
  const closeRef = useRef(null);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => closeRef.current?.focus(), 350);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          key="mobile-menu"
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 p-2 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.15 } }}
        >
          <Motion.div
            data-invert="true"
            data-theme-owner={theme}
            className="sheet flex h-full flex-col justify-between overflow-hidden pb-6 pt-4"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: "0%", transition: { duration: 0.6, ease: EASE } }}
            exit={reduce ? { opacity: 0 } : { y: "100%", transition: { duration: 0.45, ease: EASE_INOUT } }}
          >
            <div className="flex items-center justify-between">
              <span className="label">Aaron Correya</span>
              <button
                ref={closeRef}
                type="button"
                className="label link-reveal cursor-pointer"
                data-text="Close"
                onClick={onClose}
              >
                <span>Close</span>
              </button>
            </div>

            <nav aria-label="Mobile">
              <TitleLines font="sans" className="text-[clamp(2.6rem,12vw,4.5rem)]">
                {ITEMS.map((item, i) => (
                  <TitleLine key={item.path} delay={0.25 + i * 0.08} as="div" className="py-[0.12em]">
                    <NavLink
                      to={item.path}
                      end
                      className="block no-underline"
                      aria-current={pathname === item.path ? "page" : undefined}
                      onClick={onClose}
                    >
                      <TitleText align={i % 2 ? "right" : "left"}>{item.text}</TitleText>
                    </NavLink>
                  </TitleLine>
                ))}
              </TitleLines>
            </nav>

            <div className="flex items-center justify-between">
              <span className="label">Kochi</span>
              <ThemeToggle />
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
