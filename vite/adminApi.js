// Vite dev-server plugin that exposes a tiny "API" so the /admin form can
// append a new project to src/data/projects.json and save uploaded assets
// into public/. Works ONLY in dev (npm run dev) — there's no production API.
//
// Routes exposed (all under /api):
//   GET    /api/site                    → reads src/data/content.json
//   PUT    /api/site                    → body = full content object → writes file
//   GET    /api/projects                → reads src/data/projects.json
//   POST   /api/projects                → body = { project, videoBase64, posterBase64 }
//   DELETE /api/projects/<id>           → body = { deleteFiles?: bool }
//                                        → removes project + (optionally) asset files

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PROJECTS_JSON = path.join(ROOT, "src", "data", "projects.json");
const CONTENT_JSON = path.join(ROOT, "src", "data", "content.json");
const VIDEOS_DIR = path.join(ROOT, "public", "videos");
const POSTERS_DIR = path.join(ROOT, "public", "posters");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function safeName(id, ext) {
  const safeExt = String(ext || "bin").replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `${id}.${safeExt}`;
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function parseJsonBody(buf) {
  if (!buf || !buf.length) return {};
  try {
    return JSON.parse(buf.toString());
  } catch {
    return null;
  }
}

export function adminApiPlugin() {
  return {
    name: "admin-api",
    configureServer(server) {
      // ---- /api/site ----
      server.middlewares.use("/api/site", async (req, res) => {
        try {
          if (req.method === "GET") {
            const data = await fs.readFile(CONTENT_JSON, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-store");
            res.end(data);
            return;
          }
          if (req.method === "PUT" || req.method === "POST") {
            const raw = await readBody(req);
            const body = parseJsonBody(raw);
            if (body === null || typeof body !== "object") {
              return send(res, 400, { error: "invalid JSON body" });
            }
            await fs.writeFile(CONTENT_JSON, JSON.stringify(body, null, 2) + "\n");
            return send(res, 200, { ok: true });
          }
          return send(res, 405, { error: "method not allowed" });
        } catch (err) {
          console.error("[admin-api /api/site]", err);
          return send(res, 500, { error: err.message || "internal error" });
        }
      });

      // ---- /api/projects and /api/projects/<id> ----
      // We match the prefix and dispatch based on path + method.
      server.middlewares.use("/api/projects", async (req, res) => {
        const subPath = req.url.split("?")[0].replace(/^\/+/, ""); // e.g. "north-of-silence" or ""
        const hasId = subPath.length > 0;

        try {
          // ----- DELETE /api/projects/<id> -----
          if (req.method === "DELETE") {
            if (!hasId) {
              return send(res, 400, { error: "project id required in path" });
            }
            const id = decodeURIComponent(subPath);
            const raw = await readBody(req);
            const body = parseJsonBody(raw) || {};
            const deleteFiles = body.deleteFiles !== false; // default true

            const rawJson = await fs.readFile(PROJECTS_JSON, "utf-8");
            const arr = JSON.parse(rawJson);
            const idx = arr.findIndex((p) => p.id === id);
            if (idx === -1) {
              return send(res, 404, { error: `project "${id}" not found` });
            }
            const project = arr[idx];
            if (deleteFiles) {
              if (project.poster && project.poster.startsWith("/posters/")) {
                await fs
                  .unlink(path.join(ROOT, "public", project.poster.replace(/^\/+/, "")))
                  .catch(() => {});
              }
              if (project.src && project.src.startsWith("/videos/")) {
                await fs
                  .unlink(path.join(ROOT, "public", project.src.replace(/^\/+/, "")))
                  .catch(() => {});
              }
            }
            arr.splice(idx, 1);
            await fs.writeFile(PROJECTS_JSON, JSON.stringify(arr, null, 2) + "\n");
            return send(res, 200, { ok: true, id, filesDeleted: deleteFiles });
          }

          // ----- GET /api/projects -----
          if (req.method === "GET" && !hasId) {
            const data = await fs.readFile(PROJECTS_JSON, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-store");
            res.end(data);
            return;
          }

          // ----- POST /api/projects -----
          if (req.method === "POST" && !hasId) {
            const raw = await readBody(req);
            const body = parseJsonBody(raw);
            if (body === null) {
              return send(res, 400, { error: "invalid JSON body" });
            }
            const meta = body.project || {};
            if (!meta.title || !meta.category) {
              return send(res, 400, { error: "title and category are required" });
            }
            const id = slugify(meta.id || meta.title);
            if (!id) return send(res, 400, { error: "could not derive id from title" });

            await fs.mkdir(VIDEOS_DIR, { recursive: true });
            await fs.mkdir(POSTERS_DIR, { recursive: true });

            let posterPath = meta.poster || "";
            let videoPath = meta.src || "";

            if (body.posterBase64) {
              const fname = safeName(id, body.posterExt || "jpg");
              const buf = Buffer.from(
                String(body.posterBase64).replace(/^data:[^;]+;base64,/, ""),
                "base64"
              );
              await fs.writeFile(path.join(POSTERS_DIR, fname), buf);
              posterPath = `/posters/${fname}`;
            }
            if (body.videoBase64) {
              const fname = safeName(id, body.videoExt || "mp4");
              const buf = Buffer.from(
                String(body.videoBase64).replace(/^data:[^;]+;base64,/, ""),
                "base64"
              );
              await fs.writeFile(path.join(VIDEOS_DIR, fname), buf);
              videoPath = `/videos/${fname}`;
            }

            const entry = {
              id,
              title: meta.title,
              category: meta.category,
              year: meta.year || String(new Date().getFullYear()),
              role: meta.role || "",
              client: meta.client || "",
              duration: meta.duration || "",
              span: meta.span || "",
              poster: posterPath,
              src: videoPath,
              accent: meta.accent || "from-flame/30 to-amber-300/0",
              summary: meta.summary || "",
            };

            const rawJson = await fs.readFile(PROJECTS_JSON, "utf-8");
            const arr = JSON.parse(rawJson);
            if (arr.some((p) => p.id === id)) {
              return send(res, 409, { error: `project "${id}" already exists` });
            }
            arr.push(entry);
            await fs.writeFile(PROJECTS_JSON, JSON.stringify(arr, null, 2) + "\n");
            return send(res, 201, { ok: true, project: entry });
          }

          return send(res, 405, { error: "method not allowed" });
        } catch (err) {
          console.error("[admin-api]", err);
          return send(res, 500, { error: err.message || "internal error" });
        }
      });
    },
  };
}