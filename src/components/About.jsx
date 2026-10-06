import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useContent } from "../context/ContentContext";

function Counter({ to, suffix = "", delay = 0, duration = 2200 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [val, setVal] = useState(0);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const safety = setTimeout(() => setForced(true), 2000);
    return () => clearTimeout(safety);
  }, []);

  useEffect(() => {
    if (!inView && !forced) return;
    let raf;
    let startTime;
    const tick = (t) => {
      if (startTime === undefined) startTime = t;
      const elapsed = t - startTime;
      const adjusted = Math.max(0, elapsed - delay);
      const p = Math.min(1, adjusted / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setVal(Math.floor(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, forced, to, delay, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function About() {
  const { content } = useContent();
  const a = content.about;
  return (
    <section id="about" className="section">
      <div className="container-x">
        <div className="grid grid-cols-12 gap-6 md:gap-12">
          <div className="col-span-12 md:col-span-5">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="eyebrow mb-6 inline-flex items-center gap-2 opacity-70"
            >
              <span className="h-px w-6 bg-current opacity-60" />
              {a.sectionNum}
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-display text-balance text-4xl md:text-6xl"
            >
              {a.title}
              <br />
              <span className="h-serif text-flame">{a.titleAccent}</span>
            </motion.h2>
          </div>

          <div className="col-span-12 md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="text-pretty text-lg leading-relaxed opacity-80 md:text-xl"
            >
              {a.bio1}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="mt-5 text-pretty text-lg leading-relaxed opacity-70 md:text-xl"
            >
              {a.bio2}
            </motion.p>

            <div className="mt-12 grid grid-cols-2 gap-6 md:mt-20 md:grid-cols-4 md:gap-10">
              {a.stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.15 * i }}
                  className="border-t border-current/15 pt-4"
                >
                  <div className="font-display text-4xl font-medium tracking-tighter md:text-5xl">
                    <Counter to={s.num} suffix={s.suffix} delay={150 * i} duration={2400} />
                  </div>
                  <div className="mt-2 eyebrow !text-[10px] opacity-50">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}