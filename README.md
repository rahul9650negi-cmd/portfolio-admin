# Portfolio SPA

A premium, motion-first single-page portfolio built with **Vite + React + Tailwind**, designed to feel buttery smooth and look great in both dark and light themes.

## Features

- **SPA** — true single-page app, instant theme + section transitions, no reloads.
- **Smooth scroll** — powered by [Lenis](https://lenis.darkroom.engineering/) with RAF loop, anchor-link handling and `prefers-reduced-motion` support.
- **Lazy video grid** — `<video>` sources are only injected when each card scrolls within ~200px of the viewport; out-of-view videos auto-pause to keep scrolling at 60fps.
- **Dark / light theme** — persisted in `localStorage`, with smooth color transitions and an animated toggle in the navbar.
- **Custom cursor** — dot + lerped ring with `mix-blend-mode: difference`, disabled on touch devices.
- **Premium typography** — Bricolage Grotesque + Instrument Serif + JetBrains Mono.
- **Motion design** — Framer Motion staggered reveals, magnetic-style hover states, infinite marquee, animated gradient blobs.
- **Production-ready build** — code-splitting (`react`, `motion`, `lenis` chunks), CSS purge, ES2020 target.

## Sections

1. **Hero** — word-by-word reveal headline, availability badge, live local time, showreel CTA.
2. **Marquee** — "Featured in" infinite ticker.
3. **About** — bio + animated stat counters.
4. **Projects** — masonry-ish video grid with hover-to-play cards.
5. **Services** — large-type interactive service list.
6. **Testimonials** — three client quotes.
7. **Contact** — email CTA, location, status pill, socials.
8. **Footer** — local time + back-to-top.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Customize

- **Content** — edit `src/data/projects.js` (projects, stats, services, testimonials, marquee).
- **Theme colors** — edit `tailwind.config.js` (`ink`, `bone`, `flame` palettes).
- **Fonts** — Google Fonts loaded in `index.html`.
- **Videos** — replace `src` URLs in `projects.js` with your own MP4s (HLS works too via `hls.js`).

## Performance notes

- Videos use `preload="none"` and only get a `<source>` injected after `IntersectionObserver` triggers.
- An `IntersectionObserver` pauses any video when <5% visible.
- Scroll handlers are rAF-throttled.
- Animations honor `prefers-reduced-motion`.
- Transform/opacity-only animations, GPU composited via `translateZ(0)`.

Built with care. Replace `Rahul Negi` with your own name and ship.