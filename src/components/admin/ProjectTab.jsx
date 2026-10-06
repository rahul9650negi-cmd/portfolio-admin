import { useState, useRef } from "react";
import {
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Film,
  ImageIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Field, Input, Textarea, Select } from "./adminUtils";
import { readFile, writeFile, deleteFile, upsertFile, triggerNetlifyDeploy } from "../../lib/github";
import { useContent } from "../../context/ContentContext";

// Build a jsDelivr CDN URL for a file in the repo's public/ folder.
// This works because the repo is now public. jsDelivr caches and serves
// from their global CDN — no Netlify rebuild needed.
function cdnUrl(owner, repo, branch, publicPath) {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${publicPath}`;
}

const CATEGORIES = [
  "Brand Film",
  "Documentary",
  "Commercial",
  "Music Video",
  "Short Film",
  "Travel Film",
  "Experimental",
];

const ACCENT_OPTIONS = [
  { label: "Flame",   value: "from-flame/30 to-amber-300/0" },
  { label: "Sky",     value: "from-sky-400/30 to-blue-300/0" },
  { label: "Rose",    value: "from-rose-400/30 to-red-300/0" },
  { label: "Violet",  value: "from-violet-400/30 to-indigo-300/0" },
  { label: "Emerald", value: "from-emerald-400/30 to-teal-300/0" },
  { label: "Amber",   value: "from-amber-400/30 to-yellow-300/0" },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function fileToBase64GitHub(file) {
  // GitHub Contents API requires raw base64 (not data URL) for binary
  return file.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  });
}

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

export default function ProjectTab({ mode, ghConfig, projects, onProjectsChange }) {
  const ctx = useContent();
  const [form, setForm] = useState({
    title: "",
    category: "Brand Film",
    year: String(new Date().getFullYear()),
    role: "",
    client: "",
    duration: "",
    span: "",
    accent: ACCENT_OPTIONS[0].value,
    summary: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [deleting, setDeleting] = useState(null); // id currently being deleted
  const [confirmDelete, setConfirmDelete] = useState(null); // id awaiting confirmation
  const [deleteFiles, setDeleteFiles] = useState(true);
  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ===========================================================================
  // ADD a new project
  // ===========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!form.title.trim()) return setError("Title is required");
    if (!form.category) return setError("Category is required");
    if (!videoFile) return setError("Video file is required");
    if (!posterFile) return setError("Poster image is required");

    setStatus("loading");
    const id = slugify(form.title);
    if (projects.some((p) => p.id === id)) {
      setError(`A project with id "${id}" already exists. Delete it first or change the title.`);
      setStatus("error");
      return;
    }

    try {
      const newEntry = {
        id,
        title: form.title.trim(),
        category: form.category,
        year: form.year,
        role: form.role.trim(),
        client: form.client.trim(),
        duration: form.duration.trim(),
        span: form.span,
        accent: form.accent,
        summary: form.summary.trim(),
        poster: "",
        src: "",
      };

      if (mode === "dev") {
        // Dev: POST to Vite middleware
        const [videoDataUrl, posterDataUrl] = await Promise.all([
          fileToBase64(videoFile),
          fileToBase64(posterFile),
        ]);
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: {
              title: newEntry.title,
              category: newEntry.category,
              year: newEntry.year,
              role: newEntry.role,
              client: newEntry.client,
              duration: newEntry.duration,
              span: newEntry.span,
              accent: newEntry.accent,
              summary: newEntry.summary,
            },
            videoBase64: videoDataUrl,
            videoExt: (videoFile.name.split(".").pop() || "mp4").toLowerCase(),
            posterBase64: posterDataUrl,
            posterExt: (posterFile.name.split(".").pop() || "jpg").toLowerCase(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        onProjectsChange?.([...projects, data.project]);
        setSuccess({ id: data.project.id, mode: "dev" });
      } else {
        // GitHub mode — atomic: upload both files first, then commit
        // projects.json. If anything fails, we surface a clear error and
        // skip the project commit so the repo doesn't get an empty entry.
        if (!ghConfig?.token) throw new Error("Configure GitHub in Settings first");
        const { content: currentJson, sha } = await readFile({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          path: ghConfig.projectsPath,
          branch: ghConfig.branch,
          token: ghConfig.token,
        });
        const arr = JSON.parse(currentJson || "[]");
        if (arr.some((p) => p.id === id)) {
          throw new Error(`A project with id "${id}" already exists in the repo`);
        }

        // Upload video (atomic: if this throws, we abort before committing)
        const videoName = `${id}.${(videoFile.name.split(".").pop() || "mp4").toLowerCase()}`;
        let uploadedVideoSha;
        try {
          const res = await upsertFile({
            owner: ghConfig.owner,
            repo: ghConfig.repo,
            path: `public/videos/${videoName}`,
            content: await fileToBase64GitHub(videoFile),
            message: `Upload video: ${form.title}`,
            branch: ghConfig.branch,
            token: ghConfig.token,
          });
          uploadedVideoSha = res.content?.sha;
          newEntry.src = cdnUrl(
            ghConfig.owner,
            ghConfig.repo,
            ghConfig.branch,
            `public/videos/${videoName}`
          );
        } catch (e) {
          throw new Error(
            `Video upload failed: ${e.message}. Project NOT committed — try again.`
          );
        }

        // Upload poster
        const posterName = `${id}.${(posterFile.name.split(".").pop() || "jpg").toLowerCase()}`;
        try {
          await upsertFile({
            owner: ghConfig.owner,
            repo: ghConfig.repo,
            path: `public/posters/${posterName}`,
            content: await fileToBase64GitHub(posterFile),
            message: `Upload poster: ${form.title}`,
            branch: ghConfig.branch,
            token: ghConfig.token,
          });
          newEntry.poster = cdnUrl(
            ghConfig.owner,
            ghConfig.repo,
            ghConfig.branch,
            `public/posters/${posterName}`
          );
        } catch (e) {
          // Poster failed after video succeeded — roll back the video
          try {
            if (uploadedVideoSha) {
              await deleteFile({
                owner: ghConfig.owner,
                repo: ghConfig.repo,
                path: `public/videos/${videoName}`,
                sha: uploadedVideoSha,
                message: `Rollback video (poster upload failed)`,
                branch: ghConfig.branch,
                token: ghConfig.token,
              });
            }
          } catch {}
          throw new Error(
            `Poster upload failed: ${e.message}. Video rolled back, project NOT committed.`
          );
        }

        // Commit updated projects.json
        arr.push(newEntry);
        await writeFile({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          path: ghConfig.projectsPath,
          content: JSON.stringify(arr, null, 2) + "\n",
          sha,
          message: `Add project: ${form.title}`,
          branch: ghConfig.branch,
          token: ghConfig.token,
        });
        onProjectsChange?.([...projects, newEntry]);
        ctx.optimisticAddProject(newEntry);
        setSuccess({ id, mode: "github" });
        // Fire Netlify deploy hook (if configured) so the live site updates
        if (ghConfig.deployHookUrl) {
          triggerNetlifyDeploy(ghConfig.deployHookUrl).catch((e) =>
            console.warn("Netlify deploy hook failed:", e.message)
          );
        }
      }

      // Reset form
      setForm({
        title: "",
        category: "Brand Film",
        year: String(new Date().getFullYear()),
        role: "",
        client: "",
        duration: "",
        span: "",
        accent: ACCENT_OPTIONS[0].value,
        summary: "",
      });
      setVideoFile(null);
      setPosterFile(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (posterInputRef.current) posterInputRef.current.value = "";
      setStatus("success");
    } catch (err) {
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  };

  // ===========================================================================
  // DELETE a project
  // ===========================================================================
  const handleDelete = async (id) => {
    setDeleting(id);
    setError("");
    const project = projects.find((p) => p.id === id);
    try {
      if (mode === "dev") {
        const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleteFiles }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        onProjectsChange?.(projects.filter((p) => p.id !== id));
        ctx.optimisticRemoveProject(id);
        setSuccess({
          id,
          mode: "dev",
          msg: `Deleted "${project?.title}"${deleteFiles ? " (+files)" : ""}.`,
        });
        setConfirmDelete(null);
      } else {
        if (!ghConfig?.token) throw new Error("Configure GitHub in Settings first");
        // 1. Read current projects.json
        const { content: currentJson, sha } = await readFile({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          path: ghConfig.projectsPath,
          branch: ghConfig.branch,
          token: ghConfig.token,
        });
        const arr = JSON.parse(currentJson || "[]");
        const filtered = arr.filter((p) => p.id !== id);
        if (filtered.length === arr.length) {
          throw new Error(`Project "${id}" not found in repo`);
        }
        // 2. Commit updated projects.json
        await writeFile({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          path: ghConfig.projectsPath,
          content: JSON.stringify(filtered, null, 2) + "\n",
          sha,
          message: `Delete project: ${project?.title || id}`,
          branch: ghConfig.branch,
          token: ghConfig.token,
        });
        // 3. Optionally delete asset files
        if (deleteFiles) {
          if (project?.poster?.startsWith("/posters/")) {
            try {
              const { sha: pSha } = await readFile({
                owner: ghConfig.owner,
                repo: ghConfig.repo,
                path: `public${project.poster}`,
                branch: ghConfig.branch,
                token: ghConfig.token,
              });
              await deleteFile({
                owner: ghConfig.owner,
                repo: ghConfig.repo,
                path: `public${project.poster}`,
                sha: pSha,
                message: `Delete poster: ${project.title}`,
                branch: ghConfig.branch,
                token: ghConfig.token,
              });
            } catch {}
          }
          if (project?.src?.startsWith("/videos/")) {
            try {
              const { sha: vSha } = await readFile({
                owner: ghConfig.owner,
                repo: ghConfig.repo,
                path: `public${project.src}`,
                branch: ghConfig.branch,
                token: ghConfig.token,
              });
              await deleteFile({
                owner: ghConfig.owner,
                repo: ghConfig.repo,
                path: `public${project.src}`,
                sha: vSha,
                message: `Delete video: ${project.title}`,
                branch: ghConfig.branch,
                token: ghConfig.token,
              });
            } catch {}
          }
        }
        onProjectsChange?.(projects.filter((p) => p.id !== id));
        ctx.optimisticRemoveProject(id);
        setSuccess({
          id,
          mode: "github",
          msg: `Deleted "${project?.title}"${deleteFiles ? " (+files)" : ""}. Site will redeploy in 30s–2min.`,
        });
        setConfirmDelete(null);
        // Fire Netlify deploy hook (if configured) so the live site updates
        if (ghConfig.deployHookUrl) {
          triggerNetlifyDeploy(ghConfig.deployHookUrl).catch((e) =>
            console.warn("Netlify deploy hook failed:", e.message)
          );
        }
      }
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ====================================================== */}
      {/* EXISTING PROJECTS LIST                                 */}
      {/* ====================================================== */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">
              Existing projects{" "}
              <span className="font-mono text-[10px] opacity-50">
                ({projects.length})
              </span>
            </h3>
            <p className="mt-1 text-xs opacity-60">
              Click delete to remove. Files in <code className="font-mono">public/videos/</code>{" "}
              and <code className="font-mono">public/posters/</code> are deleted too.
            </p>
          </div>
        </div>

        <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-current/15 bg-current/[0.02] p-2">
          {projects.length === 0 && (
            <div className="px-3 py-6 text-center text-xs opacity-50">
              No projects yet — add one below.
            </div>
          )}
          {projects.map((p) => {
            const isConfirming = confirmDelete === p.id;
            const isDeleting = deleting === p.id;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                  isConfirming
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-transparent hover:border-current/15 hover:bg-current/5"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="flex items-center gap-2 font-mono text-[10px] opacity-50">
                    <span>{p.year}</span>
                    <span>·</span>
                    <span>{p.category}</span>
                    {p.duration && (
                      <>
                        <span>·</span>
                        <span>{p.duration}</span>
                      </>
                    )}
                  </div>
                </div>
                {!isConfirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded border border-current/20 text-xs opacity-50 transition-all hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
                    aria-label={`Delete ${p.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      disabled={isDeleting}
                      className="rounded border border-current/20 px-2 py-1 text-xs opacity-70 hover:opacity-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 rounded border border-red-500 bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {confirmDelete && (
          <label className="mt-3 flex items-center gap-2 text-xs opacity-70">
            <input
              type="checkbox"
              checked={deleteFiles}
              onChange={(e) => setDeleteFiles(e.target.checked)}
              className="accent-flame"
            />
            Also delete the video + poster files from{" "}
            <code className="font-mono">public/</code>
          </label>
        )}
      </div>

      {/* ====================================================== */}
      {/* ADD NEW PROJECT FORM                                   */}
      {/* ====================================================== */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 border-t border-current/15 pt-6"
      >
        <h3 className="text-sm font-medium">Add a new project</h3>

        <Field label="Title *" required>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="My new film"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Category *" required>
            <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-ink text-bone">{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Year">
            <Input
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="2026"
            />
          </Field>
          <Field label="Role">
            <Input
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Director · Editor"
            />
          </Field>
          <Field label="Client">
            <Input
              value={form.client}
              onChange={(e) => set("client", e.target.value)}
              placeholder="Studio name"
            />
          </Field>
          <Field label="Duration (mm:ss)">
            <Input
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="02:30"
            />
          </Field>
          <Field label="Card size">
            <Select value={form.span} onChange={(e) => set("span", e.target.value)}>
              <option value="" className="bg-ink">Default (square)</option>
              <option value="tall" className="bg-ink">Tall (2 rows)</option>
              <option value="wide" className="bg-ink">Wide (2 cols)</option>
            </Select>
          </Field>
          <Field label="Accent gradient">
            <Select value={form.accent} onChange={(e) => set("accent", e.target.value)}>
              {ACCENT_OPTIONS.map((a) => (
                <option key={a.value} value={a.value} className="bg-ink">
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="One-line summary *" required>
          <Textarea
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="A cinematic brand film shot across..."
            rows={3}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FileDrop
            label="Video file *"
            icon={<Film size={20} />}
            file={videoFile}
            accept="video/mp4,video/webm,video/quicktime"
            onChange={setVideoFile}
            inputRef={videoInputRef}
            preview={videoFile ? URL.createObjectURL(videoFile) : null}
            type="video"
          />
          <FileDrop
            label="Poster image *"
            icon={<ImageIcon size={20} />}
            file={posterFile}
            accept="image/jpeg,image/png,image/webp"
            onChange={setPosterFile}
            inputRef={posterInputRef}
            preview={posterFile ? URL.createObjectURL(posterFile) : null}
            type="image"
          />
        </div>

        {form.title && (
          <div className="rounded-lg border border-current/15 bg-current/[0.04] px-4 py-2.5 font-mono text-xs opacity-70">
            Will be saved as: <span className="text-flame">{slugify(form.title)}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-flame/40 bg-flame/10 px-4 py-3 text-sm">
            <Check size={16} className="mt-0.5 shrink-0 text-flame" />
            <div>
              <div className="font-medium">
                {success.msg ||
                  `Project ${success.mode === "github" ? "committed to GitHub" : "saved"}!`}
              </div>
              <div className="mt-0.5 opacity-70">
                <code className="font-mono">{success.id}</code>
                {success.mode === "github"
                  ? " · GitHub will trigger a redeploy in 30s–2min."
                  : " · Scroll up to see it appear in the list above."}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          data-hover
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-flame px-6 py-3.5 text-base font-medium text-bone transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {mode === "github" ? "Committing to GitHub…" : "Saving project…"}
            </>
          ) : (
            <>
              <Upload size={18} />
              {mode === "github" ? "Save to GitHub" : "Save project to JSON"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function FileDrop({ label, icon, file, accept, onChange, inputRef, preview, type }) {
  return (
    <div>
      <span className="mb-1.5 block opacity-60">{label}</span>
      <label className="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-current/30 bg-current/[0.02] p-4 text-center transition-colors hover:border-flame hover:bg-current/[0.05]">
        {preview ? (
          type === "video" ? (
            <video src={preview} muted playsInline className="max-h-32 w-full rounded object-cover" />
          ) : (
            <img src={preview} alt="preview" className="max-h-32 w-full rounded object-cover" />
          )
        ) : (
          <>
            <span className="opacity-50">{icon}</span>
            <span className="text-xs opacity-60">
              Click to upload {type === "video" ? "MP4 / WebM" : "image"}
            </span>
          </>
        )}
        {file && (
          <span className="mt-1 truncate font-mono text-[10px] opacity-70">
            {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}