import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { adminApiPlugin } from "./vite/adminApi.js";

export default defineConfig({
  plugins: [react(), adminApiPlugin()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("react")) return "react";
            if (id.includes("lenis")) return "lenis";
          }
        },
      },
    },
  },
});