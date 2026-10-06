// Shared helpers for the admin form.

import { useState, useCallback } from "react";

// Returns a [value, set] pair with a `dirty` flag. `dirty` is true
// whenever the current value differs from the initial value.
export function useDirtyState(initial) {
  const [value, setValue] = useState(initial);
  const [initialValue] = useState(initial);
  const dirty = JSON.stringify(value) !== JSON.stringify(initialValue);
  const reset = useCallback(() => setValue(initialValue), [initialValue]);
  return [value, setValue, { dirty, reset }];
}

// Returns a "shallow array dirty" — true if any item changed (by JSON).
export function arrayDirty(current, initial) {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

// Field wrapper with label + optional required marker.
export function Field({ label, required, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm">
          {label}
          {required && <span className="ml-0.5 text-flame">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-[11px] opacity-50">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-current/20 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-flame";

export function Input({ className = "", ...props }) {
  return <input className={`${inputBase} ${className}`} {...props} />;
}

export function Textarea({ className = "", rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${inputBase} resize-y leading-relaxed ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${inputBase} ${className}`} {...props}>
      {children}
    </select>
  );
}

// Add/remove card list editor. Renders a vertical stack of items with
// reorder (up/down) + delete buttons + an Add button at the bottom.
export function ItemList({
  items,
  onChange,
  renderItem,
  addLabel = "+ Add item",
  onAdd,
}) {
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-current/15 bg-current/[0.02] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
              #{String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="grid h-7 w-7 place-items-center rounded border border-current/20 text-xs opacity-60 transition-all hover:border-flame hover:text-flame disabled:opacity-20"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="Move down"
                className="grid h-7 w-7 place-items-center rounded border border-current/20 text-xs opacity-60 transition-all hover:border-flame hover:text-flame disabled:opacity-20"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove"
                className="grid h-7 w-7 place-items-center rounded border border-current/20 text-xs opacity-60 transition-all hover:border-red-500 hover:text-red-500"
              >
                ×
              </button>
            </div>
          </div>
          {renderItem(item, i)}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full rounded-lg border border-dashed border-current/30 px-4 py-3 text-sm opacity-60 transition-colors hover:border-flame hover:text-flame"
      >
        {addLabel}
      </button>
    </div>
  );
}

// A simple list-of-strings editor. Each input is a single text field;
// click × to remove, click "+ Add" to append an empty row.
export function StringList({ items, onChange, placeholder = "" }) {
  const set = (i, v) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);
  return (
    <div className="space-y-2">
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={s}
            onChange={(e) => set(i, e.target.value)}
            placeholder={placeholder}
            className={inputBase}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-current/20 opacity-60 transition-colors hover:border-red-500 hover:text-red-500"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-current/30 px-4 py-2.5 text-sm opacity-60 transition-colors hover:border-flame hover:text-flame"
      >
        + Add
      </button>
    </div>
  );
}