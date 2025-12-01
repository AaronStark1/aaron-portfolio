import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="px-4 md:px-10 lg:px-20 pt-4 pb-3 flex items-center justify-between font-grotesk">
      
      {/* Logo / Name */}
      <Link
        to="/"
        className="text-xs md:text-sm tracking-[0.25em] uppercase font-semibold hover:opacity-70 transition"
      >
        Aaron Correya
      </Link>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm">
        {[
          { text: "Home", path: "/" },
          { text: "About", path: "/about" },
          { text: "Projects", path: "/projects" },
          { text: "Contact", path: "/contact" },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `uppercase tracking-[0.18em] transition hover:opacity-80 ${
                isActive ? "font-semibold" : "opacity-70"
              }`
            }
          >
            {item.text}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
