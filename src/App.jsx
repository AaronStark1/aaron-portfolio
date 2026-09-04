import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";

import ThemeProvider from "./context/ThemeProvider";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import About from "./pages/About";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-dvh bg-page text-fg font-sans">
          <Navbar />
          <AnimatedRoutes />
        </div>
      </Router>
    </ThemeProvider>
  );
}

/* Routes wrapped in AnimatePresence so the outgoing sheet leaves before the next one enters */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <main className="px-2 pb-2 md:px-4 md:pb-4">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </main>
  );
}
