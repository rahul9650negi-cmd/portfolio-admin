// GitHub Contents API client. Used by the admin form when running in
// production (no Vite middleware available) to commit content changes
// back to the repo. The user configures owner/repo/branch/token via
// the Settings tab; everything is stored in localStorage.

const API = "https://api.github.com";

// ---- Base64 helpers (UTF-8 safe) ----
export function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
export function decodeBase64(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
}

// ---- Read a file from the repo ----
// Returns { content (string), sha, path, ... } on success.
export async function readFile({ owner, repo, path, branch, token }) {
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${
    branch ? `?ref=${encodeURIComponent(branch)}` : ""
  }`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub ${res.status}: ${err.message || res.statusText || "failed to read file"}`
    );
  }
  const data = await res.json();
  return {
    content: decodeBase64(data.content || ""),
    sha: data.sha,
    path: data.path,
  };
}

// ---- Create or update a file ----
// `sha` must be provided for updates (omit for new files).
export async function writeFile({
  owner,
  repo,
  path,
  content,
  sha,
  message,
  branch,
  token,
}) {
  if (!token) throw new Error("GitHub token is required to write files");
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message: message || `Update ${path} via portfolio admin`,
    content: encodeBase64(content),
  };
  if (sha) body.sha = sha;
  if (branch) body.branch = branch;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub ${res.status}: ${err.message || res.statusText || "failed to write file"}`
    );
  }
  return await res.json();
}

// ---- Delete a file from the repo ----
// Requires the file's current SHA (use readFile first to get it).
export async function deleteFile({
  owner,
  repo,
  path,
  sha,
  message,
  branch,
  token,
}) {
  if (!token) throw new Error("GitHub token is required to delete files");
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = { message: message || `Delete ${path} via portfolio admin`, sha };
  if (branch) body.branch = branch;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub ${res.status}: ${err.message || res.statusText || "failed to delete file"}`
    );
  }
  return await res.json();
}

// ---- Test that the token works ----
// Returns the authenticated user's login.
export async function testConnection({ token }) {
  const res = await fetch(`${API}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: invalid token or insufficient scope`);
  }
  const data = await res.json();
  return { login: data.login, name: data.name, avatar: data.avatar_url };
}

// ---- localStorage helpers ----
const KEY = "pf-github-config";

export const DEFAULT_GH_CONFIG = {
  owner: "",
  repo: "",
  branch: "main",
  token: "",
  contentPath: "src/data/content.json",
  projectsPath: "src/data/projects.json",
};

export function loadGhConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_GH_CONFIG };
    return { ...DEFAULT_GH_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_GH_CONFIG };
  }
}

export function saveGhConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export function clearGhConfig() {
  localStorage.removeItem(KEY);
}