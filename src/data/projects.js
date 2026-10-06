// Static content (not mutated by admin form) — projects now live in projects.json
// so the admin form can append to them.

const VIDEOS = {
  sintel1:      "https://media.w3.org/2010/05/sintel/trailer.mp4",
  sintel720:    "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
  sintel1080:   "https://download.blender.org/durian/trailer/sintel_trailer-1080p.mp4",
  sintelShort:  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4",
  bbb720:       "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
  bbb360:       "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
  jellyfish:    "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
  flower:       "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  friday:       "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
  movie300:     "https://media.w3.org/2010/05/video/movie_300.mp4",
};

export { VIDEOS };
export const v = (key) => VIDEOS[key];

export const img = (id, q = 70) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=${q}`;

export const projects = [
  // Projects now live in projects.json (mutable, edited by /admin form).
  // This stub is kept so old references still work; the live data is loaded
  // from /src/data/projects.json via the import below in components that need it.
];

export const stats = [
  { num: 120, suffix: "+", label: "Projects shipped" },
  { num: 38, suffix: "", label: "Awards & mentions" },
  { num: 10, suffix: "y", label: "Years editing" },
  { num: 27, suffix: "", label: "Countries filmed" },
];

export const services = [
  {
    num: "01",
    title: "Video Editing",
    desc: "Story-first cuts for long-form documentaries, brand films and YouTube.",
  },
  {
    num: "02",
    title: "Color Grading",
    desc: "Cinematic, naturalistic grades in DaVinci Resolve with custom LUTs.",
  },
  {
    num: "03",
    title: "Motion Design",
    desc: "Type, transitions and 2D animation in After Effects & Cinema 4D.",
  },
  {
    num: "04",
    title: "Direction",
    desc: "Concept-to-screen creative direction for commercials and short films.",
  },
  {
    num: "05",
    title: "Sound & Mix",
    desc: "Sound design, dialogue cleanup and final mix in Pro Tools.",
  },
];

export const testimonials = [
  {
    quote:
      "He took 40 hours of raw footage and turned it into a film that made us cry. We hired him twice more.",
    name: "Elena Vidal",
    role: "Founder, Northward Co.",
  },
  {
    quote:
      "The fastest turn-around in the industry and a final cut that felt like a poem. Genuinely rare.",
    name: "Marcus Lee",
    role: "Creative Director, Hello Studio",
  },
  {
    quote:
      "A rare combination of taste, speed and emotional intelligence on every single project.",
    name: "Priya Anand",
    role: "Head of Content, Lumen",
  },
];

export const marqueeItems = [
  "Vimeo Staff Picks",
  "Awwwards SOTD",
  "FWA",
  "Indie Shorts",
  "Cannes Lions",
  "Wired",
  "The Verge",
  "It's Nice That",
  "Motion Awards",
];