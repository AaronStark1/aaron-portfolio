import { createContext, useContext } from "react";

/** Theme context: value is { theme: "light" | "dark", setTheme }. See ThemeProvider.jsx. */
export const ThemeContext = createContext({ theme: "light", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}
