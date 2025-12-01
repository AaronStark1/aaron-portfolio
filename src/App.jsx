import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, createContext } from "react";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import About from "./pages/About";

export const ThemeContext = createContext();

export default function App() {
  const [theme, setTheme] = useState("light");

  const themeClasses =
    theme === "light"
      ? "bg-[#d4d2c4] text-[#3e3b37]"
      : "bg-[#3e3b37] text-[#c1c0b6]";

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        className={`${themeClasses} min-h-screen transition-colors duration-300`}
      >
        <Router>
          <Navbar />
          <main className="px-4 md:px-10 lg:px-20 pb-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About/>}/>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </Router>
      </div>
    </ThemeContext.Provider>
  );
}
