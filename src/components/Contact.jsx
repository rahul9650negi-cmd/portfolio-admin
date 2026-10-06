import { motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { useContent } from "../context/ContentContext";

export default function Contact() {
  const { content } = useContent();
  const c = content.contact;
  const { email, location } = content.site;
  return (
    <section id="contact" className="section relative overflow-hidden">
      <div className="container-x relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl border border-current/15 bg-current/[0.03] p-8 md:p-16 lg:p-24"
        >
          <span className="eyebrow inline-flex items-center gap-2 opacity-70">
            <span className="h-px w-6 bg-current opacity-60" />
            {c.sectionNum}
          </span>

          <h2 className="h-display mt-8 text-balance text-5xl leading-[0.95] md:text-8xl lg:text-[8.5rem]">
            {c.intro}
            <br />
            <span className="h-serif text-flame">{c.headlineAccent}</span> {c.headlineTail}
          </h2>

          <div className="mt-12 grid grid-cols-12 gap-6 md:mt-20 md:gap-10">
            <a
              href={`mailto:${email}`}
              data-hover
              className="group col-span-12 inline-flex items-center justify-between gap-4 rounded-2xl border border-current/20 bg-ink p-6 text-bone transition-all duration-500 ease-out-expo hover:bg-flame hover:text-ink dark:bg-bone dark:text-ink md:col-span-8 md:p-8"
            >
              <div className="min-w-0">
                <span className="eyebrow opacity-60">{c.dropALineLabel}</span>
                <div className="mt-2 truncate font-display text-2xl tracking-tighter md:text-4xl">
                  {email}
                </div>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-current/40 transition-all duration-500 group-hover:rotate-45 group-hover:bg-current group-hover:text-flame">
                <ArrowUpRight size={20} />
              </span>
            </a>

            <div className="col-span-12 grid grid-cols-1 gap-4 md:col-span-4 md:grid-cols-1">
              <div className="rounded-2xl border border-current/20 p-5">
                <span className="eyebrow opacity-60">{c.locationLabel}</span>
                <div className="mt-2 flex items-center gap-2 text-sm md:text-base">
                  <MapPin size={16} className="text-flame" />
                  {location}
                </div>
              </div>
              <div className="rounded-2xl border border-current/20 p-5">
                <span className="eyebrow opacity-60">{c.currentlyLabel}</span>
                <div className="mt-2 flex items-center gap-2 text-sm md:text-base">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-flame opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-flame" />
                  </span>
                  {c.currentlyStatus}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-current/15 pt-6 text-sm">
            <span className="opacity-60">{c.elsewhereLabel}</span>
            <div className="flex flex-wrap gap-2">
              {c.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  data-hover
                  className="group inline-flex items-center gap-2 rounded-full border border-current/20 px-4 py-2 transition-all duration-300 hover:border-flame hover:text-flame"
                >
                  {s.label}
                  <ArrowUpRight
                    size={14}
                    className="transition-transform group-hover:rotate-45"
                  />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}