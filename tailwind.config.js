/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          soft: "#131313",
          line: "#1f1f1f",
        },
        bone: {
          DEFAULT: "#f5f5f0",
          soft: "#ececea",
          line: "#d6d6d2",
        },
        flame: {
          DEFAULT: "#ff5722",
          glow: "#ff7a4a",
        },
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        widest: "0.22em",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0,0)" },
          "20%": { transform: "translate(-2%,1%)" },
          "40%": { transform: "translate(1%,-2%)" },
          "60%": { transform: "translate(-1%,1%)" },
          "80%": { transform: "translate(2%,-1%)" },
          "100%": { transform: "translate(0,0)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "fade-up": "fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        grain: "grain 8s steps(10) infinite",
      },
    },
  },
  plugins: [],
};