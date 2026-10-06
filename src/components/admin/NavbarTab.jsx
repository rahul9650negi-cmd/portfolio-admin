import { Field, Input, ItemList } from "./adminUtils";

export default function NavbarTab({ data, set }) {
  const links = data.navbar;
  const update = (i, patch) => {
    set("navbar", links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const add = () => {
    const next = String(links.length + 1).padStart(2, "0");
    set("navbar", [...links, { href: "#", label: "New", num: next }]);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        The nav links in the top bar. <code className="font-mono text-[11px]">href</code>{" "}
        should match the section id (e.g. <code className="font-mono text-[11px]">#work</code>).
      </p>

      <ItemList
        items={links}
        onChange={(v) => set("navbar", v)}
        onAdd={add}
        addLabel="+ Add link"
        renderItem={(l, i) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[60px_1fr_1fr]">
            <Field label="#">
              <Input
                value={l.num}
                onChange={(e) => update(i, { num: e.target.value })}
              />
            </Field>
            <Field label="Label">
              <Input
                value={l.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Work"
              />
            </Field>
            <Field label="href">
              <Input
                value={l.href}
                onChange={(e) => update(i, { href: e.target.value })}
                placeholder="#work"
              />
            </Field>
          </div>
        )}
      />
    </div>
  );
}