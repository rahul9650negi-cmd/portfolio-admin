import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function VideoLightbox({ project, onClose }) {
  const videoRef = useRef(null);

  // Lock body scroll + ESC to close + pause any other playing videos
  useEffect(() => {
    if (!project) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    document.querySelectorAll("video").forEach((v) => {
      if (v !== videoRef.current && !v.paused) v.pause();
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", onKey);
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black p-3 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} video`}
        >
          <motion.div
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-current/20 bg-ink"
          >
            {/* Close — top-right (bigger + always visible) */}
            <button
              onClick={onClose}
              aria-label="Close"
              data-hover
              className="absolute right-3 top-3 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-black/70 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-flame hover:bg-flame hover:text-bone md:right-4 md:top-4 md:h-12 md:w-12"
            >
              <X size={20} />
            </button>

            {/* Video */}
            <div className="relative aspect-video shrink-0 bg-black">
              <video
                ref={videoRef}
                src={project.src}
                poster={project.poster}
                controls
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full"
              />
            </div>

            {/* Scrollable meta + close region */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {/* Meta */}
              <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-8">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-flame">
                    {project.category} · {project.year}
                  </span>
                  <h3 className="mt-2 truncate font-display text-2xl font-medium tracking-tight text-bone md:text-4xl">
                    {project.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-pretty text-sm leading-relaxed opacity-70">
                    {project.summary}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-6 text-xs">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                      Role
                    </span>
                    <div className="mt-1 opacity-80">{project.role}</div>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                      Client
                    </span>
                    <div className="mt-1 opacity-80">{project.client}</div>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                      Length
                    </span>
                    <div className="mt-1 font-mono opacity-80">
                      {project.duration}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close controls — sticky bottom inside scroll region */}
              <div className="mt-auto flex flex-col items-stretch gap-3 border-t border-current/15 bg-ink/95 px-5 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-8" style={{ padding: '1rem' }}>
                <span className="eyebrow !text-[10px] opacity-50">
                  ESC · click outside · or press close
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    data-hover
                    className="inline-flex items-center gap-2 rounded-full border border-current/30 px-4 py-2 text-sm font-medium transition-all hover:border-flame hover:bg-flame hover:text-bone"
                  >
                    <X size={14} />
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}