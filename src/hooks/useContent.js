// useContent + useProjects hooks
//
// Fetches content/projects from GitHub at runtime, so the live site
// shows the latest data without needing a Netlify rebuild after every
// form commit. Bundled JSON is used as an instant fallback so the page
// never shows a loading state — it just silently updates when fresh
// data arrives.

import { useState, useEffect, useCallback, useRef } from "react";
import { readFile, loadGhConfig } from "../lib/github";
import initialContent from "../data/content.json";
import initialProjects from "../data/projects.json";

const CACHE_TTL_MS = 30 * 1000; // 30 seconds — short so admin form changes are visible quickly

// ---- Module-level cache so multiple components share one fetch ----
let contentCache = { data: initialContent, ts: 0 };
let projectsCache = { data: initialProjects, ts: 0 };
let contentFetchInFlight = null;
let projectsFetchInFlight = null;

async function fetchContentFromGitHub(force = false) {
  const cfg = loadGhConfig();
  if (!cfg?.token || !cfg?.owner || !cfg?.repo) {
    return { data: contentCache.data, fromCache: true, reason: "no-config" };
  }
  const now = Date.now();
  if (!force && contentCache.ts && now - contentCache.ts < CACHE_TTL_MS) {
    return { data: contentCache.data, fromCache: true };
  }
  if (contentFetchInFlight) return contentFetchInFlight;
  contentFetchInFlight = (async () => {
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
      return { data: parsed, fromCache: false };
    } catch (err) {
      console.warn("[useContent] fetch failed, using cached/bundled:", err.message);
      return { data: contentCache.data, fromCache: true, error: err.message };
    } finally {
      contentFetchInFlight = null;
    }
  })();
  return contentFetchInFlight;
}

async function fetchProjectsFromGitHub(force = false) {
  const cfg = loadGhConfig();
  if (!cfg?.token || !cfg?.owner || !cfg?.repo) {
    return { data: projectsCache.data, fromCache: true, reason: "no-config" };
  }
  const now = Date.now();
  if (!force && projectsCache.ts && now - projectsCache.ts < CACHE_TTL_MS) {
    return { data: projectsCache.data, fromCache: true };
  }
  if (projectsFetchInFlight) return projectsFetchInFlight;
  projectsFetchInFlight = (async () => {
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
      return { data: parsed, fromCache: false };
    } catch (err) {
      console.warn("[useProjects] fetch failed, using cached/bundled:", err.message);
      return { data: projectsCache.data, fromCache: true, error: err.message };
    } finally {
      projectsFetchInFlight = null;
    }
  })();
  return projectsFetchInFlight;
}

// ---- Public hooks ----
export function useContent() {
  const [data, setData] = useState(contentCache.data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchContentFromGitHub(true);
    if (mounted.current) {
      setData(result.data);
      setError(result.error || null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Don't block initial render — fetch in background
    (async () => {
      const result = await fetchContentFromGitHub(false);
      if (mounted.current) {
        setData(result.data);
        setError(result.error || null);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error, refresh };
}

export function useProjects() {
  const [data, setData] = useState(projectsCache.data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchProjectsFromGitHub(true);
    if (mounted.current) {
      setData(result.data);
      setError(result.error || null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const result = await fetchProjectsFromGitHub(false);
      if (mounted.current) {
        setData(result.data);
        setError(result.error || null);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  // Mutation helpers — also invalidate the cache so subsequent fetches
  // re-read the source of truth
  const addProject = useCallback(async (newProject) => {
    const next = [...projectsCache.data, newProject];
    projectsCache = { data: next, ts: Date.now() };
    setData(next);
  }, []);

  const removeProject = useCallback(async (id) => {
    const next = projectsCache.data.filter((p) => p.id !== id);
    projectsCache = { data: next, ts: Date.now() };
    setData(next);
  }, []);

  return { data, loading, error, refresh, addProject, removeProject };
}

// ---- Admin form helpers: invalidate cache after writing ----
export function invalidateContentCache() {
  contentCache = { data: contentCache.data, ts: 0 };
}
export function invalidateProjectsCache() {
  projectsCache = { data: projectsCache.data, ts: 0 };
}