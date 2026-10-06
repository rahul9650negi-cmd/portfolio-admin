import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useInView } from "framer-motion";
import { Play, Pause, ArrowUpRight } from "lucide-react";
import VideoLightbox from "./VideoLightbox";
import { useUI } from "../context/UIContext";
import { useContent } from "../context/ContentContext";

function useLazyVideo(src, poster, rootMargin = "200px") {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);

  // Lazy load source when card nears viewport
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            const v = videoRef.current;
            if (v && !loaded) {
              const s = document.createElement("source");
              s.src = src;
              s.type = "video/mp4";
              v.appendChild(s);
              v.load();
              setLoaded(true);
            }
            io.disconnect();
          }
        });
      },
      { rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [src, rootMargin, loaded]);

  // Buffering + error tracking on the video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onCanPlay = () => setBuffering(false);
    const onError = () => {
      setFailed(true);
      setBuffering(false);
      setPlaying(false);
    };
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
    };
  }, []);

  // Hard pause if card leaves viewport (perf + battery)
  useEffect(() => {
    const node = ref.current;
    const v = videoRef.current;
    if (!node || !v) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting && !v.paused) {
            v.pause();
            setPlaying(false);
          }
        });
      },
      { threshold: 0.05 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v || failed) return;
    if (v.paused || v.ended) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [failed]);

  return { ref, videoRef, loaded, visible, playing, buffering, failed, toggle };
}

function ProjectCard({ project, index, onOpen }) {
  const { ref, videoRef, visible, playing, buffering, failed, toggle } =
    useLazyVideo(project.src, project.poster);

  const inView = useInView(ref, { once: true, margin: "-100px" });

  const spanClass =
    project.span === "tall"
      ? "md:row-span-2"
      : project.span === "wide"
      ? "md:col-span-2"
      : "";

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
        delay: (index % 3) * 0.08,
      }}
      className={`group relative overflow-hidden rounded-2xl border border-current/10 bg-ink/5 ${spanClass}`}
    >
      {/* Media stack */}
      <div className="absolute inset-0 gpu">
        {/* Poster (always behind) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out-expo group-hover:scale-105"
          style={{ backgroundImage: `url(${project.poster})` }}
        />
        {/* Video (fades in only after user clicks play) */}
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={project.poster}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradient overlays */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${project.accent} mix-blend-multiply opacity-60`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Top meta */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 md:p-6">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 backdrop-blur-md">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/90">
            {project.category}
          </span>
        </div>
        <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-white/80 backdrop-blur-md">
          {project.duration}
        </span>
      </div>

      {/* Center play/pause button */}
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        data-hover
        className={`absolute right-5 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-bone/95 text-ink shadow-xl transition-all duration-500 ease-out-expo md:right-8 md:h-16 md:w-16 ${
          playing
            ? "opacity-0 group-hover:opacity-100 hover:bg-flame group-hover:bg-flame group-hover:text-bone"
            : "opacity-100 scale-100 group-hover:scale-110"
        }`}
      >
        {buffering ? (
          <span className="block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent md:h-6 md:w-6" />
        ) : playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* Always-visible "Tap to play" hint when not playing */}
      {!playing && !buffering && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-12 rounded-full border border-white/30 bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/80 opacity-0 transition-all duration-500 ease-out-expo group-hover:opacity-100 md:translate-y-16">
          Click to play
        </div>
      )}

      {/* Bottom meta */}
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <div className="flex items-end justify-between gap-4">
          <div className="pointer-events-none min-w-0 flex-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
              {project.year} · {project.client}
            </span>
            <h3 className="mt-1 truncate font-display text-2xl font-medium leading-tight tracking-tight text-white md:text-3xl">
              {project.title}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project);
            }}
            aria-label={`Open ${project.title} in fullscreen`}
            data-hover
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 text-white transition-all duration-300 hover:rotate-45 hover:border-flame hover:bg-flame"
          >
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Loading shimmer before source loads */}
      {!visible && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
            0{index + 1}
          </span>
        </div>
      )}
    </motion.article>
  );
}

export default function Projects() {
  const [active, setActive] = useState(null);
  const { setModalOpen } = useUI();
  const { projects: projectsData } = useContent();

  // Open + close are atomic with navbar hide/show — no flash
  const openProject = useCallback(
    (project) => {
      setActive(project);
      setModalOpen(true);
    },
    [setModalOpen]
  );

  const closeProject = useCallback(() => {
    setActive(null);
    setModalOpen(false);
  }, [setModalOpen]);

  return (
    <section id="work" className="section">
      <div className="container-x">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="eyebrow mb-4 inline-flex items-center gap-2 opacity-70"
            >
              <span className="h-px w-6 bg-current opacity-60" />
              02 / Selected Work
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-display text-balance text-5xl md:text-7xl lg:text-[5.5rem]"
            >
              Featured{" "}
              <span className="h-serif text-flame">projects.</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-sm text-pretty text-sm leading-relaxed opacity-70 md:text-base"
            >
              A selection of recent films, commercials and music videos.{" "}
              <span className="text-flame">Click</span> any card to play. All work{" "}
              <a
                href="#contact"
                className="underline decoration-flame underline-offset-2"
              >
                available on request
              </a>
              .
            </motion.p>
        </div>

        {/* Grid */}
        <div className="grid auto-rows-[260px] grid-cols-1 gap-4 md:auto-rows-[320px] md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {projectsData.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              onOpen={openProject}
            />
          ))}
        </div>

        {/* Footer link */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 flex items-center justify-between border-t border-current/15 pt-6 text-sm"
        >
          <span className="eyebrow opacity-60">
            {projectsData.length} projects · 2023 — 2025
          </span>
          <a
            href="#contact"
            data-hover
            className="group inline-flex items-center gap-2 font-medium transition-colors hover:text-flame"
          >
            See full archive
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:rotate-45"
            />
          </a>
        </motion.div>
      </div>

      {/* Render lightbox via portal at body level — escapes ALL stacking contexts */}
      {createPortal(
        <VideoLightbox project={active} onClose={closeProject} />,
        document.body
      )}
    </section>
  );
}