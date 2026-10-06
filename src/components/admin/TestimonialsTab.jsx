import { useState, useRef } from "react";
import { Upload, Check, AlertCircle, X, FileText } from "lucide-react";
import { Field, Input, Textarea, ItemList } from "./adminUtils";
import { parseCSV } from "../../lib/csv";

export default function TestimonialsTab({ data, set }) {
  const testimonials = data.testimonials;
  const [importStatus, setImportStatus] = useState({ status: "idle", msg: "" });
  const [previewRows, setPreviewRows] = useState(null);
  const fileInputRef = useRef(null);

  const update = (i, patch) => {
    set(
      "testimonials",
      testimonials.map((t, idx) => (idx === i ? { ...t, ...patch } : t))
    );
  };
  const add = () => {
    set("testimonials", [
      ...testimonials,
      { quote: "New quote.", name: "Name", role: "Role" },
    ]);
  };

  // -------------------------------------------------------------------------
  // CSV import
  // -------------------------------------------------------------------------
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus({ status: "loading", msg: "Parsing…" });
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        throw new Error("No rows found in CSV");
      }
      // Detect column names (case-insensitive, allow common variants)
      const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, "");
      const findCol = (row, candidates) => {
        const keys = Object.keys(row);
        for (const cand of candidates) {
          const hit = keys.find((k) => norm(k) === norm(cand));
          if (hit) return row[hit];
        }
        return "";
      };
      const mapped = rows.map((r) => ({
        quote: findCol(r, ["quote", "testimonial", "text", "message"]),
        name: findCol(r, ["name", "author", "by"]),
        role: findCol(r, ["role", "title", "company", "position"]),
      })).filter((r) => r.quote || r.name);

      if (mapped.length === 0) {
        throw new Error(
          "No valid rows found. CSV needs columns like quote, name, role."
        );
      }
      setPreviewRows(mapped);
      setImportStatus({
        status: "preview",
        msg: `${mapped.length} row${mapped.length === 1 ? "" : "s"} parsed. Review and confirm below.`,
      });
    } catch (err) {
      setImportStatus({ status: "error", msg: err.message });
      setPreviewRows(null);
    }
  };

  const confirmImport = (mode /* "append" | "replace" */) => {
    if (!previewRows) return;
    if (mode === "append") {
      set("testimonials", [...testimonials, ...previewRows]);
    } else {
      set("testimonials", previewRows);
    }
    setImportStatus({
      status: "success",
      msg: `${mode === "append" ? "Appended" : "Replaced"} with ${previewRows.length} testimonial${previewRows.length === 1 ? "" : "s"}.`,
    });
    setPreviewRows(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelImport = () => {
    setPreviewRows(null);
    setImportStatus({ status: "idle", msg: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <p className="text-sm opacity-70">
        The three quote cards in the Testimonials section.
      </p>

      {/* ===== CSV IMPORT ===== */}
      <div className="rounded-lg border border-current/15 bg-current/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Bulk import from CSV</h3>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
              "quote,name,role\n\"He took 40 hours of raw footage...\",Elena Vidal,Founder, Northward Co.\n\"Fastest turn-around...\",Marcus Lee,Creative Director, Hello Studio"
            )}`}
            download="testimonials-template.csv"
            className="text-xs opacity-60 underline hover:opacity-100"
          >
            Download template
          </a>
        </div>

        <p className="mb-3 text-xs opacity-60">
          CSV needs three columns: <code className="font-mono">quote</code>,{" "}
          <code className="font-mono">name</code>,{" "}
          <code className="font-mono">role</code>. Quoted fields with commas
          are supported.
        </p>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-current/30 bg-current/[0.02] px-4 py-3 text-sm transition-colors hover:border-flame hover:bg-current/[0.05]">
          <FileText size={16} className="opacity-60" />
          <span>Click to choose a .csv file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />
        </label>

        {/* Status / preview */}
        {importStatus.status === "error" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <span>{importStatus.msg}</span>
          </div>
        )}

        {importStatus.status === "loading" && (
          <div className="mt-3 text-xs opacity-70">{importStatus.msg}</div>
        )}

        {previewRows && (
          <div className="mt-4 space-y-3">
            <div className="text-xs opacity-70">
              {importStatus.msg} Preview:
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-current/15 bg-current/[0.02] p-2 text-xs">
              {previewRows.slice(0, 5).map((r, i) => (
                <div key={i} className="rounded bg-current/[0.03] p-2">
                  <div className="truncate opacity-50 font-mono">
                    {i + 1}. {r.name || "(no name)"} · {r.role || "(no role)"}
                  </div>
                  <div className="mt-0.5 line-clamp-2 opacity-80">
                    {r.quote}
                  </div>
                </div>
              ))}
              {previewRows.length > 5 && (
                <div className="px-2 py-1 text-center opacity-50">
                  …and {previewRows.length - 5} more
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => confirmImport("append")}
                className="rounded-full bg-flame px-4 py-1.5 text-xs font-medium text-bone transition-colors hover:scale-105"
              >
                Append to existing ({testimonials.length + previewRows.length})
              </button>
              <button
                type="button"
                onClick={() => confirmImport("replace")}
                className="rounded-full border border-current/30 px-4 py-1.5 text-xs transition-colors hover:border-flame hover:text-flame"
              >
                Replace all ({previewRows.length})
              </button>
              <button
                type="button"
                onClick={cancelImport}
                className="ml-auto inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}

        {importStatus.status === "success" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-flame/40 bg-flame/10 px-3 py-2 text-xs">
            <Check size={14} className="text-flame" />
            {importStatus.msg}
          </div>
        )}
      </div>

      {/* ===== EXISTING LIST ===== */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Current testimonials</h3>
        <ItemList
          items={testimonials}
          onChange={(v) => set("testimonials", v)}
          onAdd={add}
          addLabel="+ Add testimonial"
          renderItem={(t, i) => (
            <>
              <Field label="Quote">
                <Textarea
                  value={t.quote}
                  onChange={(e) => update(i, { quote: e.target.value })}
                  rows={3}
                />
              </Field>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={t.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                  />
                </Field>
                <Field label="Role / company">
                  <Input
                    value={t.role}
                    onChange={(e) => update(i, { role: e.target.value })}
                  />
                </Field>
              </div>
            </>
          )}
        />
      </div>
    </div>
  );
}