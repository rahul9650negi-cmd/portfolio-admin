import { motion } from "framer-motion";
import { useContent } from "../context/ContentContext";

export default function Testimonials() {
  const { content } = useContent();
  const testimonials = content.testimonials;
  return (
    <section className="section">
      <div className="container-x">
        <div className="mb-12 text-center md:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="eyebrow inline-flex items-center gap-2 opacity-70"
          >
            <span className="h-px w-6 bg-current opacity-60" />
            04 / Words
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-display mx-auto mt-4 max-w-3xl text-balance text-4xl md:text-6xl"
          >
            Kind words <span className="h-serif text-flame">from clients.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {testimonials.map((t, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-current/15 bg-current/[0.03] p-7 transition-all duration-500 ease-out-expo hover:bg-current/[0.06] md:p-10"
            >
              <span className="absolute right-5 top-5 font-serif text-7xl leading-none opacity-20 md:text-8xl">
                "
              </span>
              <blockquote className="relative text-pretty text-lg leading-snug md:text-xl">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3 border-t border-current/15 pt-5 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-flame text-bone">
                  {t.name[0]}
                </span>
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="eyebrow !text-[10px] opacity-50">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}