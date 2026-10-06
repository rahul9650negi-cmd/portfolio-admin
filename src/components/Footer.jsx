import { useEffect, useState } from "react";
import { useContent } from "../context/ContentContext";

export default function Footer() {
  const { content } = useContent();
  const { name, timezone, locationLabel } = content.site;
  const [t1, setT1] = useState("");
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setT1(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: timezone,
        })
      );
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [timezone]);
  const tzShort = timezone.split("/")[1] || timezone;

  const isDev = import.meta.env.DEV;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-current/15">
      <div className="container-x flex flex-col items-start justify-between gap-3 py-8 text-xs opacity-70 md:flex-row md:items-center md:text-sm">
        <span>
          © {year} {content.footer.copyright}
        </span>
        <div className="flex items-center gap-4">
          {isDev && (
            <a
              href="#admin"
              data-hover
              className="font-mono text-[10px] uppercase tracking-widest text-flame transition-colors hover:underline"
            >
              + Add project
            </a>
          )}
          <span className="font-mono">{locationLabel} · {t1 || "00:00"} {tzShort}</span>
          <a href="#top" data-hover className="hover:text-flame">
            {content.footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
}