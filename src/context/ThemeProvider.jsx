import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeContext } from "./ThemeContext";

/**
 * Theme state for the whole site. The value is mirrored to <html data-theme>
 * (which drives every CSS token) and persisted to localStorage. Toggling adds
 * html.theme-switching for ~700ms so colours cross-fade together.
 */
function getInitialTheme() {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage unavailable */
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const timer = useRef(null);

  const setTheme = useCallback((next) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => root.classList.remove("theme-switching"), 720);
    setThemeState(typeof next === "function" ? next : () => next);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
