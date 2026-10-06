import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, Loader2, Save, FileEdit, RotateCcw, Trash2, Moon, Sun } from "lucide-react";

import ProjectTab from "./admin/ProjectTab";
import SiteTab from "./admin/SiteTab";
import HeroTab from "./admin/HeroTab";
import AboutTab from "./admin/AboutTab";
import MarqueeTab from "./admin/MarqueeTab";
import ServicesTab from "./admin/ServicesTab";
import TestimonialsTab from "./admin/TestimonialsTab";
import ContactTab from "./admin/ContactTab";
import NavbarTab from "./admin/NavbarTab";
import SettingsTab from "./admin/SettingsTab";

import { loadGhConfig, readFile, writeFile, triggerNetlifyDeploy } from "../lib/github";
import { useTheme } from "../context/ThemeContext";
import { useContent } from "../context/ContentContext";

const TABS = [
  { id: "projects",     label: "Projects",     num: "01" },
  { id: "site",         label: "Site",         num: "02" },
  { id: "hero",         label: "Hero",         num: "03" },
  { id: "about",        label: "About",        num: "04" },
  { id: "marquee",      label: "Marquee",      num: "05" },
  { id: "services",     label: "Services",     num: "06" },
  { id: "testimonials", label: "Testimonials", num: "07" },
  { id: "contact",      label: "Contact",      num: "08" },
  { id: "navbar",       label: "Navbar",       num: "09" },
  { id: "settings",     label: "Settings",     num: "10" },
];

const DRAFT_KEY = "pf-draft-content";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(data) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export default function AdminShell({ onExit }) {
  const { theme, toggle: toggleTheme } = useTheme();
  const ctx = useContent();
  const [active, setActive] = useState("site");
  // The form's working copy of the data — initialized from the
  // shared context, edited in place, then saved back to the context
  // (which writes through to GitHub and updates the live site).
  const [data, setData] = useState(ctx.content);
  const [projects, setProjects] = useState(ctx.projects);
  const [mode, setMode] = useState("auto");
  const [resolvedMode, setResolvedMode] = useState("dev");
  const [ghConfig, setGhConfig] = useState(loadGhConfig());
  const [save, setSave] = useState({ status: "idle", msg: "" });
  const [draft, setDraft] = useState(loadDraft());
  const dirty = useRef(false);

  // Keep working copy in sync if context data changes from outside
  // (e.g. after a refresh, or if another tab updates the cache).
  useEffect(() => setData(ctx.content), [ctx.content]);
  useEffect(() => setProjects(ctx.projects), [ctx.projects]);

  // Keep ghConfig in sync if it changes from another source
  useEffect(() => setGhConfig(loadGhConfig()), []);

  // ---- Detect mode (dev vs github) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let m = mode;
      if (m === "auto") {
        try {
          const r = await fetch("/api/site", { method: "GET" });
          m = r.ok ? "dev" : "github";
        } catch {
          m = "github";
        }
      }
      if (!cancelled) setResolvedMode(m);
    })();
    return () => { cancelled = true; };
  }, [mode]);

  // ---- Patcher for content.json ----
  const set = useCallback((key, value) => {
    setData((d) => ({ ...d, [key]: value }));
    dirty.current = true;
  }, []);

  // ---- Auto-save draft to localStorage on every edit ----
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => {
      saveDraft(data);
      setDraft({ data, savedAt: Date.now() });
    }, 400); // debounce
    return () => clearTimeout(t);
  }, [data]);

  // ---- Restore draft on demand ----
  const restoreDraft = () => {
    if (!draft?.data) return;
    setData(draft.data);
    dirty.current = true;
    setSave({ status: "success", msg: "Draft restored from your last edit." });
    setTimeout(() => setSave({ status: "idle", msg: "" }), 2000);
  };

  const discardDraft = () => {
    if (!window.confirm("Discard saved draft? Your unsaved changes will be lost.")) return;
    clearDraft();
    setDraft(null);
    setData(initialContent);
    dirty.current = false;
  };

  // ---- Persist to dev server or GitHub ----
  const handleSave = async () => {
    setSave({ status: "loading", msg: "" });
    try {
      if (resolvedMode === "dev") {
        const res = await fetch("/api/site", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data, null, 2),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
      } else {
        if (!ghConfig.token) throw new Error("Configure GitHub in Settings first");
        const { content: current, sha } = await readFile({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          path: ghConfig.contentPath,
          branch: ghConfig.branch,
          token: ghConfig.token,
        });
        let parsed;
        try { parsed = JSON.parse(current); } catch {
          throw new Error("content.json in repo is not valid JSON");
        }
        const sameShape = Object.keys(parsed).sort().join(",") === Object.keys(data).sort().join(",");
        if (!sameShape) {
          throw new Error(
            "content.json structure differs from your local form. " +
            "Manual merge required. Backup: " + (current || "").slice(0, 200)
          );
        }
        await writeFile({
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          path: ghConfig.contentPath,
          content: JSON.stringify(data, null, 2) + "\n",
          sha,
          message: "Update content via portfolio admin",
          branch: ghConfig.branch,
          token: ghConfig.token,
        });
      }
      // Save successful — clear the draft
      clearDraft();
      setDraft(null);
      dirty.current = false;
      // Refresh the shared context so every component sees the new data.
      // The next page load will fetch fresh from GitHub automatically.
      await ctx.refresh();
      setData(ctx.content);
      setSave({ status: "success", msg: "Content saved. Live site updated." });
      // Fire Netlify deploy hook (if configured) so the live site updates
      if (ghConfig.deployHookUrl) {
        triggerNetlifyDeploy(ghConfig.deployHookUrl).catch((e) =>
          console.warn("Netlify deploy hook failed:", e.message)
        );
      }
    } catch (err) {
      setSave({ status: "error", msg: err.message || "Save failed" });
    }
  };

  const draftAgeMin = draft?.savedAt
    ? Math.floor((Date.now() - draft.savedAt) / 60000)
    : null;

  return (
    <div className="container-x py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl"
      >
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow mb-2 inline-flex items-center gap-2 opacity-70">
              <span className="h-px w-6 bg-current opacity-60" />
              Admin · Mode:{" "}
              <span className="text-flame">{resolvedMode}</span>
              {draft && (
                <>
                  <span className="opacity-50">·</span>
                  <span className="inline-flex items-center gap-1 text-flame">
                    <FileEdit size={11} /> Draft saved
                    {draftAgeMin !== null && draftAgeMin < 60 && (
                      <span className="opacity-60">
                        ({draftAgeMin === 0 ? "just now" : `${draftAgeMin}m ago`})
                      </span>
                    )}
                  </span>
                </>
              )}
            </span>
            <h1 className="h-display text-balance text-3xl md:text-5xl">
              Edit <span className="h-serif text-flame">content.</span>
            </h1>
            {resolvedMode === "github" && (
              <p className="mt-2 max-w-md text-xs opacity-70">
                Saving will commit a real change to your repo on{" "}
                <code className="font-mono">{ghConfig.branch || "main"}</code>.
                Your host will auto-rebuild.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {draft && (
              <>
                <button
                  type="button"
                  onClick={restoreDraft}
                  title="Restore from saved draft"
                  data-hover
                  className="inline-flex items-center gap-1.5 rounded-full border border-current/30 px-3 py-2 text-xs transition-colors hover:border-flame hover:text-flame"
                >
                  <RotateCcw size={12} />
                  Restore draft
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  title="Discard saved draft"
                  data-hover
                  className="grid h-9 w-9 place-items-center rounded-full border border-current/30 text-xs opacity-60 transition-colors hover:border-red-500 hover:text-red-500"
                  aria-label="Discard draft"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              data-hover
              className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-current/30 bg-current/5 transition-colors hover:border-flame/60 hover:bg-current/10"
            >
              <span className="col-start-1 row-start-1 transition-all duration-500 ease-out-expo dark:translate-y-0 translate-y-9">
                <Moon size={16} />
              </span>
              <span className="col-start-1 row-start-1 transition-all duration-500 ease-out-expo dark:-translate-y-9 translate-y-0">
                <Sun size={16} />
              </span>
            </button>
            <button
              onClick={onExit}
              data-hover
              className="grid h-10 w-10 place-items-center rounded-full border border-current/30 hover:border-flame hover:bg-current/5"
              aria-label="Exit admin"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              disabled={save.status === "loading"}
              data-hover
              className="inline-flex items-center gap-2 rounded-full bg-flame px-5 py-2.5 text-sm font-medium text-bone transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {save.status === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {resolvedMode === "github" ? "Commit to GitHub" : "Save content"}
            </button>
          </div>
        </div>

        {/* Save status */}
        <AnimatePresence>
          {save.status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <div>
                <div className="font-medium">Save failed</div>
                <div className="opacity-70">{save.msg}</div>
              </div>
            </motion.div>
          )}
          {save.status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-2 rounded-lg border border-flame/40 bg-flame/10 px-4 py-3 text-sm"
            >
              <Check size={16} className="text-flame" />
              {save.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-current/15 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`relative rounded-full px-3 py-1.5 text-sm transition-colors ${
                active === t.id
                  ? "text-flame"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">{t.num}</span>
              <span className="ml-2">{t.label}</span>
              {active === t.id && (
                <motion.span
                  layoutId="active-tab"
                  className="absolute inset-0 -z-10 rounded-full bg-current/10"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="rounded-2xl border border-current/15 bg-current/[0.03] p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {active === "projects" && (
                <ProjectTab
                  mode={resolvedMode}
                  ghConfig={ghConfig}
                  projects={projects}
                  onProjectsChange={setProjects}
                />
              )}
              {active === "site" && <SiteTab data={data} set={set} />}
              {active === "hero" && <HeroTab data={data} set={set} />}
              {active === "about" && <AboutTab data={data} set={set} />}
              {active === "marquee" && <MarqueeTab data={data} set={set} />}
              {active === "services" && <ServicesTab data={data} set={set} />}
              {active === "testimonials" && (
                <TestimonialsTab data={data} set={set} />
              )}
              {active === "contact" && <ContactTab data={data} set={set} />}
              {active === "navbar" && <NavbarTab data={data} set={set} />}
              {active === "settings" && (
                <SettingsTab
                  mode={mode}
                  onModeChange={setMode}
                  onConfigChange={setGhConfig}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}