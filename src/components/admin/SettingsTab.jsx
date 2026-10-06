import { useState } from "react";
import {
  testConnection,
  saveGhConfig,
  loadGhConfig,
  DEFAULT_GH_CONFIG,
  clearGhConfig,
  triggerNetlifyDeploy,
} from "../../lib/github";
import { Field, Input } from "./adminUtils";
import { Check, AlertCircle, Loader2, ExternalLink, Zap } from "lucide-react";

export default function SettingsTab({ mode, onModeChange, onConfigChange }) {
  const [cfg, setCfg] = useState(loadGhConfig);
  const [test, setTest] = useState({ status: "idle", msg: "" });
  const [hook, setHook] = useState({ status: "idle", msg: "" });

  const update = (patch) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    saveGhConfig(next);
    onConfigChange?.(next);
  };

  const runTest = async () => {
    setTest({ status: "loading", msg: "" });
    try {
      const user = await testConnection({ token: cfg.token });
      setTest({ status: "ok", msg: `Connected as ${user.login}${user.name ? ` (${user.name})` : ""}` });
    } catch (err) {
      setTest({ status: "error", msg: err.message });
    }
  };

  const fireHook = async () => {
    setHook({ status: "loading", msg: "" });
    try {
      await triggerNetlifyDeploy(cfg.deployHookUrl);
      setHook({ status: "ok", msg: "Build triggered. Refresh in ~1–2 min to see changes live." });
    } catch (err) {
      setHook({ status: "error", msg: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm opacity-70">
        To edit content on the live site, the form needs a GitHub Personal
        Access Token (classic) with the <code className="font-mono text-[11px]">repo</code> scope.
        Everything below is saved to your browser's localStorage — never sent
        anywhere except <code className="font-mono text-[11px]">api.github.com</code>.
      </p>

      <div className="rounded-lg border border-current/15 bg-current/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Save mode</span>
          <div className="flex items-center gap-1 rounded-full border border-current/20 p-0.5 text-xs">
            {["auto", "dev", "github"].map((m) => (
              <button
                key={m}
                onClick={() => onModeChange?.(m)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  mode === m
                    ? "bg-flame text-bone"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] opacity-60">
          <strong>auto</strong>: dev mode when Vite is reachable, otherwise GitHub.
          <br />
          <strong>dev</strong>: write to <code className="font-mono">content.json</code> via Vite
          middleware (only works on <code className="font-mono">npm run dev</code>).
          <br />
          <strong>github</strong>: commit to your repo via the API (works in
          production).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="GitHub username / org" hint="The owner of the repo">
          <Input
            value={cfg.owner}
            onChange={(e) => update({ owner: e.target.value })}
            placeholder="rahulnegi"
          />
        </Field>

        <Field label="Repository name">
          <Input
            value={cfg.repo}
            onChange={(e) => update({ repo: e.target.value })}
            placeholder="portfolio-spa"
          />
        </Field>

        <Field label="Branch" hint="Default: main">
          <Input
            value={cfg.branch}
            onChange={(e) => update({ branch: e.target.value })}
            placeholder="main"
          />
        </Field>

        <Field label="Personal access token" hint="Classic PAT with 'repo' scope. Never leaves your browser except to api.github.com.">
          <Input
            type="password"
            value={cfg.token}
            onChange={(e) => update({ token: e.target.value })}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
          />
        </Field>

        <Field label="Content file path" hint="Where content.json lives in your repo">
          <Input
            value={cfg.contentPath}
            onChange={(e) => update({ contentPath: e.target.value })}
            placeholder="src/data/content.json"
          />
        </Field>

        <Field label="Projects file path" hint="Where projects.json lives">
          <Input
            value={cfg.projectsPath}
            onChange={(e) => update({ projectsPath: e.target.value })}
            placeholder="src/data/projects.json"
          />
        </Field>
      </div>

      {/* ----- Netlify deploy hook ----- */}
      <div className="rounded-lg border border-current/15 bg-current/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Netlify deploy hook <span className="text-flame">(recommended)</span></h3>
          <span
            className={`font-mono text-[10px] uppercase tracking-widest ${
              cfg.deployHookUrl ? "text-flame" : "opacity-50"
            }`}
          >
            {cfg.deployHookUrl ? "configured" : "not set"}
          </span>
        </div>
        <p className="mb-3 text-xs opacity-70">
          Without this, content changes go to GitHub but the live site keeps showing old data until Netlify rebuilds. With this set, every form commit auto-triggers a Netlify build (~30s–2 min later the live site updates).
        </p>
        <Field
          label="Build hook URL"
          hint='Get it from Netlify → Site settings → Build & deploy → Build hooks → Add build hook. Copy the URL.'
        >
          <Input
            value={cfg.deployHookUrl}
            onChange={(e) => update({ deployHookUrl: e.target.value })}
            placeholder="https://api.netlify.com/build_hooks/xxxxxxxxxxxxxxxx"
            autoComplete="off"
          />
        </Field>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fireHook}
            disabled={!cfg.deployHookUrl || hook.status === "loading"}
            data-hover
            className="inline-flex items-center gap-2 rounded-full border border-flame/60 bg-flame/10 px-4 py-2 text-sm transition-colors hover:bg-flame hover:text-bone disabled:opacity-40"
          >
            {hook.status === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            Trigger Netlify build now
          </button>
          {hook.status !== "idle" && hook.status !== "loading" && (
            <div
              className={`flex items-center gap-1.5 text-xs ${
                hook.status === "ok" ? "text-flame" : "text-red-400"
              }`}
            >
              {hook.status === "error" && <AlertCircle size={12} />}
              {hook.msg}
            </div>
          )}
        </div>
        <details className="mt-3 rounded border border-current/15 p-3 text-xs">
          <summary className="cursor-pointer opacity-70">
            How to get the Netlify build hook URL
          </summary>
          <ol className="mt-3 space-y-1.5 pl-5 opacity-70 [&_li]:list-decimal">
            <li>
              Go to{" "}
              <a
                href="https://app.netlify.com/sites/r-negi.netlify.app/settings/deploys"
                target="_blank"
                rel="noreferrer"
                className="text-flame underline"
              >
                app.netlify.com → site → Build & deploy → Build hooks
              </a>
            </li>
            <li>Click "Add build hook"</li>
            <li>Name: "portfolio admin" (anything)</li>
            <li>Branch: <code className="font-mono">main</code></li>
            <li>Click Save, copy the URL</li>
            <li>Paste above and click "Trigger Netlify build now" to test</li>
          </ol>
        </details>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runTest}
          disabled={!cfg.token || test.status === "loading"}
          data-hover
          className="inline-flex items-center gap-2 rounded-full border border-current/30 px-4 py-2 text-sm transition-colors hover:border-flame hover:text-flame disabled:opacity-40"
        >
          {test.status === "loading" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : test.status === "ok" ? (
            <Check size={14} />
          ) : (
            <ExternalLink size={14} />
          )}
          Test connection
        </button>

        <button
          type="button"
          onClick={() => {
            clearGhConfig();
            setCfg({ ...DEFAULT_GH_CONFIG });
            onConfigChange?.(DEFAULT_GH_CONFIG);
          }}
          className="text-xs opacity-50 underline hover:opacity-100"
        >
          Clear saved config
        </button>

        {test.status !== "idle" && test.status !== "loading" && (
          <div
            className={`flex items-center gap-1.5 text-xs ${
              test.status === "ok" ? "text-flame" : "text-red-400"
            }`}
          >
            {test.status === "error" && <AlertCircle size={12} />}
            {test.msg}
          </div>
        )}
      </div>

      <details className="rounded-lg border border-current/15 p-4 text-xs">
        <summary className="cursor-pointer opacity-70">
          How to create a GitHub PAT
        </summary>
        <ol className="mt-3 space-y-1.5 pl-5 opacity-70 [&_li]:list-decimal">
          <li>
            Go to{" "}
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noreferrer"
              className="text-flame underline"
            >
              github.com/settings/tokens/new
            </a>
          </li>
          <li>Name: "portfolio admin"</li>
          <li>Expiration: your choice (90 days recommended)</li>
          <li>
            Scope: tick <strong>repo</strong> (full control of private
            repositories)
          </li>
          <li>Generate token, paste it above</li>
          <li>Click "Test connection" to verify</li>
        </ol>
      </details>
    </div>
  );
}