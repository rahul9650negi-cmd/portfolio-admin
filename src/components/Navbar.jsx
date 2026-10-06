import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUI } from "../context/UIContext";
import { useContent } from "../context/ContentContext";

export default function Navbar() {
  const { content } = useContent();
  const links = content.navbar;
  const { theme, toggle } = useTheme();
  const { modalOpen } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        const sections = ["work", "about", "services", "contact"];
        let cur = "";
        for (const id of sections) {
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.4) cur = id;
        }
        setActive(cur);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize past breakpoint
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Hide navbar entirely when a modal is open
  if (modalOpen) return null;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out-expo ${
        scrolled || mobileOpen ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`container-x flex items-center justify-between rounded-full transition-all duration-500 ease-out-expo ${
          scrolled || mobileOpen
            ? "border border-current/15 bg-bone/80 px-3 py-2 backdrop-blur-xl dark:bg-ink/80"
            : "px-1 py-1"
        }`}
      >
        <a
          href="#top"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center gap-2"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-current/30 bg-current/5 transition-transform duration-500 group-hover:rotate-90">
            <span className="font-display text-sm font-semibold">R</span>
          </span>
          <span className="hidden font-display text-[15px] font-medium tracking-tight md:inline">
            {content.site.name}
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="group relative rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              <span
                className={`absolute inset-0 -z-10 rounded-full transition-opacity duration-300 ${
                  active === l.href.slice(1) ? "bg-current/10 opacity-100" : "opacity-0"
                }`}
              />
              <span className="font-mono text-[10px] opacity-50">{l.num}</span>
              <span className="ml-2">{l.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            data-hover
            className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-current/30 bg-current/5 transition-colors hover:border-flame/60 hover:bg-current/10"
          >
            <span className="col-start-1 row-start-1 transition-all duration-500 ease-out-expo dark:translate-y-0 translate-y-9">
              <Moon size={16} />
            </span>
            <span className="col-start-1 row-start-1 transition-all duration-500 ease-out-expo dark:-translate-y-9 translate-y-0">
              <Sun size={16} />
            </span>
          </button>
          <a
            href="#contact"
            data-hover
            className="group hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bone transition-all duration-300 hover:bg-flame dark:bg-bone dark:text-ink dark:hover:bg-flame md:inline-flex"
          >
            <span className="relative h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-flame opacity-75" />
              <span className="absolute inset-0 rounded-full bg-flame" />
            </span>
            Let's Talk
          </a>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            data-hover
            className="relative grid h-9 w-9 place-items-center rounded-full border border-current/30 bg-current/5 md:hidden"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="container-x mt-3 md:hidden"
          >
            <div className="overflow-hidden rounded-2xl border border-current/15 bg-bone/90 backdrop-blur-xl dark:bg-ink/90">
              <ul className="divide-y divide-current/10">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-current/5"
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-[10px] opacity-50">
                          {l.num}
                        </span>
                        <span className="font-display text-lg font-medium">
                          {l.label}
                        </span>
                      </span>
                      <span className="opacity-40">→</span>
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between bg-flame px-5 py-4 text-bone"
                  >
                    <span className="flex items-center gap-2 font-display text-lg font-medium">
                      <span className="relative h-1.5 w-1.5">
                        <span className="absolute inset-0 animate-ping rounded-full bg-bone opacity-75" />
                        <span className="absolute inset-0 rounded-full bg-bone" />
                      </span>
                      Let's Talk
                    </span>
                    <span>→</span>
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}