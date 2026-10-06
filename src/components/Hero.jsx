import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowDown, Play, Sparkles } from "lucide-react";
import { useContent } from "../context/ContentContext";

const lineVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.8 } },
};
const wordVariants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
};

// Render a headline line from content. Each item is either a string or
// { text, style } where style is "serif" or "serif-flame".
function renderStyledWord(w, i) {
  if (typeof w === "string") {
    return (
      <span key={i} className="reveal-mask mr-[0.18em] last:mr-0">
        <motion.span variants={wordVariants} className="inline-block">{w}</motion.span>
      </span>
    );
  }
  const cls =
    w.style === "serif-flame"
      ? "h-serif text-flame"
      : w.style === "serif"
      ? "h-serif"
      : "";
  return (
    <span key={i} className="reveal-mask mr-[0.18em] last:mr-0">
      <motion.span variants={wordVariants} className="inline-block">
        <span className={cls}>{w.text}</span>
      </motion.span>
    </span>
  );
}

function Words({ words, className = "" }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        variants={lineVariants}
        initial="hidden"
        animate="show"
        className="block"
      >
        {words.map(renderStyledWord)}
      </motion.span>
    </span>
  );
}

function LocalTime({ timezone, locationLabel }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setT(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: timezone,
        })
      );
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [timezone]);
  const tzShort = timezone.split("/")[1] || timezone;
  return (
    <span className="font-mono text-xs">
      {locationLabel} <span className="opacity-50">·</span> {t || "00:00"} {tzShort}
    </span>
  );
}

export default function Hero() {
  const { content } = useContent();
  const h = content.hero;
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden pt-28 md:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-60 dark:opacity-100">
          <div className="absolute -left-20 top-10 h-[40vw] w-[40vw] rounded-full bg-flame/20 blur-[120px]" />
          <div className="absolute right-0 top-1/3 h-[35vw] w-[35vw] rounded-full bg-amber-300/10 blur-[120px] dark:bg-orange-700/20" />
          <div className="absolute bottom-0 left-1/3 h-[30vw] w-[30vw] rounded-full bg-rose-400/10 blur-[120px] dark:bg-rose-900/20" />
        </div>
      </div>

      <div className="container-x relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-center justify-between text-sm"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-flame opacity-75" />
              <span className="absolute inset-0 rounded-full bg-flame" />
            </span>
            <span className="eyebrow">{h.badge}</span>
          </span>
          <LocalTime
            timezone={content.site.timezone}
            locationLabel={content.site.locationLabel}
          />
        </motion.div>

        <h1 className="h-display text-balance text-[12vw] leading-[0.92] md:text-[8.5vw] lg:text-[7.6vw]">
          <Words words={h.headline.line1} />
          <Words words={h.headline.line2} />
          <Words className="opacity-70" words={h.headline.line3} />
        </h1>

        <div className="mt-12 grid grid-cols-12 gap-6 md:mt-20 md:gap-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 max-w-md text-pretty text-base leading-relaxed opacity-70 md:col-span-5 md:text-lg"
          >
            {h.bio}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 flex items-end justify-between gap-6 md:col-span-7"
          >
            <a
              href="#work"
              data-hover
              className="group inline-flex items-center gap-3 rounded-full bg-flame px-5 py-3 text-sm font-medium text-bone transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-bone/15">
                <Play size={12} fill="currentColor" />
              </span>
              {h.showreelLabel}
              <span className="font-mono text-[10px] opacity-70">{h.showreelTime}</span>
            </a>

            <a
              href="#work"
              aria-label="Scroll to work"
              data-hover
              className="hidden items-center gap-3 self-end text-sm md:inline-flex"
            >
              <span className="eyebrow">Scroll</span>
              <motion.span
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowDown size={16} />
              </motion.span>
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-20 grid grid-cols-2 gap-6 border-t border-current/15 pt-6 md:mt-32 md:grid-cols-4"
        >
          {h.tools.map((t, i) => (
            <div key={t} className="flex items-baseline justify-between gap-3">
              <span className="eyebrow opacity-60">{t}</span>
              <span className="font-mono text-[10px] opacity-40">{`0${i + 1}`}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -8 }}
          transition={{ delay: 2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-6 top-32 hidden md:block"
        >
          <div className="grid h-28 w-28 place-items-center rounded-full border border-current/30 lg:h-32 lg:w-32">
            <div className="text-center font-mono text-[10px] leading-tight tracking-widest">
              <Sparkles size={14} className="mx-auto mb-1 text-flame" />
              EST.
              <div className="mt-1 font-display text-base font-medium not-italic tracking-normal">{h.estYear}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}