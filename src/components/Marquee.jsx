import { useContent } from "../context/ContentContext";

export default function Marquee() {
  const { content } = useContent();
  const items = [...content.marquee, ...content.marquee];
  return (
    <section
      aria-hidden="true"
      className="relative border-y border-current/15 py-10 overflow-hidden bg-flame text-ink"
    >
      <div className="pause-on-hover flex overflow-hidden">
        <div className="marquee-track flex shrink-0 animate-marquee items-center gap-12 pr-12 will-change-transform">
          {items.map((it, i) => (
            <span key={i} className="flex items-center gap-12 whitespace-nowrap">
              <span className="font-display text-5xl font-medium tracking-tightest md:text-7xl">
                {it}
              </span>
              <span className="font-display text-5xl opacity-50 md:text-7xl">✺</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}