import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import content from "../data/content.json";

export default function Services() {
  const services = content.services;
  return (
    <section id="services" className="section border-t border-current/15">
      <div className="container-x">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="eyebrow mb-4 inline-flex items-center gap-2 opacity-70"
            >
              <span className="h-px w-6 bg-current opacity-60" />
              03 / Services
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-display text-balance text-4xl md:text-7xl"
            >
              What I{" "}
              <span className="h-serif text-flame">do best.</span>
            </motion.h2>
          </div>
          <p className="max-w-sm text-sm opacity-70 md:text-base">
            End-to-end post-production services — and happy to embed with your
            in-house team as a remote collaborator.
          </p>
        </div>

        <ul className="border-t border-current/15">
          {services.map((s, i) => (
            <motion.li
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.06 }}
              className="group relative border-b border-current/15"
            >
              <a
                href="#contact"
                data-hover
                className="grid grid-cols-12 items-center gap-4 py-6 transition-all duration-500 ease-out-expo hover:pl-4 md:gap-8 md:py-10"
              >
                <span className="col-span-2 font-mono text-xs opacity-50 md:col-span-1 md:text-sm">
                  {s.num}
                </span>
                <h3 className="col-span-7 font-display text-3xl tracking-tighter transition-colors duration-300 group-hover:text-flame md:col-span-7 md:text-6xl lg:text-7xl">
                  {s.title}
                </h3>
                <p className="col-span-12 text-sm leading-relaxed opacity-70 md:col-span-3 md:text-base">
                  {s.desc}
                </p>
                <span className="col-span-3 hidden justify-self-end text-flame transition-transform duration-500 ease-out-expo group-hover:rotate-45 md:col-span-1 md:flex">
                  <ArrowUpRight size={28} />
                </span>
              </a>
              <span className="absolute bottom-0 left-0 h-px w-0 bg-flame transition-all duration-700 ease-out-expo group-hover:w-full" />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}