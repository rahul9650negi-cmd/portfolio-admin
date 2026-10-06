// ContentContext — provides a single shared useContent/useProjects state
// across the entire app, so the admin form can refresh it once and all
// components re-render with the new data.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { readFile, loadGhConfig } from "../lib/github";
import initialContent from "../data/content.json";
import initialProjects from "../data/projects.json";

const CACHE_TTL_MS = 30 * 1000;
const STORAGE_KEY = "pf-last-fetch";

const ContentContext = createContext({
  content: initialContent,
  projects: initialProjects,
  loading: false,
  error: null,
  refresh: async () => {},
  refreshContent: async () => {},
  refreshProjects: async () => {},
  optimisticAddProject: () => {},
  optimisticRemoveProject: () => {},
});

export function useContent() {
  return useContext(ContentContext);
}

// ---- Internals ----
let contentCache = { data: initialContent, ts: 0 };
let projectsCache = { data: initialProjects, ts: 0 };
let contentInFlight = null;
let projectsInFlight = null;
let listeners = new Set();

function notify() {
  for (const fn of listeners) fn();
}

async function fetchContentFromGitHub(force = false) {
  const cfg = loadGhConfig();
  if (!cfg?.token || !cfg?.owner || !cfg?.repo) {
    return contentCache.data;
  }
  const now = Date.now();
  if (!force && contentCache.ts && now - contentCache.ts < CACHE_TTL_MS) {
    return contentCache.data;
  }
  if (contentInFlight) return contentInFlight;
  contentInFlight = (async () => {
    try {
      const { content } = await readFile({
        owner: cfg.owner,
        repo: cfg.repo,
        path: cfg.contentPath,
        branch: cfg.branch,
        token: cfg.token,
      });
      const parsed = JSON.parse(content);
      contentCache = { data: parsed, ts: Date.now() };
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
      notify();
      return parsed;
    } catch (err) {
      console.warn("[content] fetch failed:", err.message);
      return contentCache.data;
    } finally {
      contentInFlight = null;
    }
  })();
  return contentInFlight;
}

async function fetchProjectsFromGitHub(force = false) {
  const cfg = loadGhConfig();
  if (!cfg?.token || !cfg?.owner || !cfg?.repo) {
    return projectsCache.data;
  }
  const now = Date.now();
  if (!force && projectsCache.ts && now - projectsCache.ts < CACHE_TTL_MS) {
    return projectsCache.data;
  }
  if (projectsInFlight) return projectsInFlight;
  projectsInFlight = (async () => {
    try {
      const { content } = await readFile({
        owner: cfg.owner,
        repo: cfg.repo,
        path: cfg.projectsPath,
        branch: cfg.branch,
        token: cfg.token,
      });
      const parsed = JSON.parse(content);
      projectsCache = { data: parsed, ts: Date.now() };
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
      notify();
      return parsed;
    } catch (err) {
      console.warn("[projects] fetch failed:", err.message);
      return projectsCache.data;
    } finally {
      projectsInFlight = null;
    }
  })();
  return projectsInFlight;
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(contentCache.data);
  const [projects, setProjects] = useState(projectsCache.data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(false);

  // Sync local state from cache on every notification
  useEffect(() => {
    const sync = () => {
      setContent(contentCache.data);
      setProjects(projectsCache.data);
    };
    listeners.add(sync);
    return () => listeners.delete(sync);
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const [c, p] = await Promise.all([
        fetchContentFromGitHub(false),
        fetchProjectsFromGitHub(false),
      ]);
      if (mounted.current) {
        setContent(c);
        setProjects(p);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [c, p] = await Promise.all([
      fetchContentFromGitHub(true),
      fetchProjectsFromGitHub(true),
    ]);
    if (mounted.current) {
      setContent(c);
      setProjects(p);
      setLoading(false);
    }
  }, []);

  const refreshContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    const c = await fetchContentFromGitHub(true);
    if (mounted.current) {
      setContent(c);
      setLoading(false);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const p = await fetchProjectsFromGitHub(true);
    if (mounted.current) {
      setProjects(p);
      setLoading(false);
    }
  }, []);

  const optimisticAddProject = useCallback((newProject) => {
    const next = [...projectsCache.data, newProject];
    projectsCache = { data: next, ts: Date.now() };
    setProjects(next);
  }, []);

  const optimisticRemoveProject = useCallback((id) => {
    const next = projectsCache.data.filter((p) => p.id !== id);
    projectsCache = { data: next, ts: Date.now() };
    setProjects(next);
  }, []);

  return (
    <ContentContext.Provider
      value={{
        content,
        projects,
        loading,
        error,
        refresh,
        refreshContent,
        refreshProjects,
        optimisticAddProject,
        optimisticRemoveProject,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}