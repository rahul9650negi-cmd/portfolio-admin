import { useEffect, useState, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { UIProvider } from "./context/UIContext";
import SmoothScroll from "./components/SmoothScroll";
import Cursor from "./components/Cursor";
import Loader from "./components/Loader";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import About from "./components/About";
import Projects from "./components/Projects";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Admin from "./components/AdminShell";

function App() {
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState(
    typeof window !== "undefined" && window.location.hash === "#admin"
      ? "admin"
      : "home"
  );

  // Reveal page after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.body.classList.add("ready");
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Disable right-click context menu site-wide
  useEffect(() => {
    const onContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  // Hash-based routing: #admin opens the admin form
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash === "#admin" ? "admin" : "home");
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const exitAdmin = useCallback(() => {
    window.location.hash = "";
    setRoute("home");
  }, []);

  if (route === "admin") {
    return (
      <ThemeProvider>
        <UIProvider>
          <div className="min-h-screen bg-ink text-bone">
            <Admin onExit={exitAdmin} />
          </div>
        </UIProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <UIProvider>
        <SmoothScroll>
          <div className="relative isolate">
            <div className="grain" aria-hidden="true" />
            <Cursor />
            <Loader />
            <Navbar />

            <main className="relative z-10">
              <Hero />
              <Marquee />
              <About />
              <Projects />
              <Services />
              <Testimonials />
              <Contact />
            </main>

            <Footer />
          </div>
        </SmoothScroll>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;