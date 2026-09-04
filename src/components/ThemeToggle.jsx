import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const next = theme === "light" ? "dark" : "light";
  const label = theme === "light" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      className={`label inline-flex items-center gap-2 cursor-pointer ${className}`}
    >
      <span
        aria-hidden="true"
        className="theme-dot"
        style={{ transform: theme === "dark" ? "rotate(180deg)" : "rotate(0deg)" }}
      />
      <span className="link-reveal" data-text={label}>
        <span>{label}</span>
      </span>
    </button>
  );
}
