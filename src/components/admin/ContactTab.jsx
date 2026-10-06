import { Field, Input, ItemList } from "./adminUtils";

export default function ContactTab({ data, set }) {
  const c = data.contact;
  const update = (i, patch) => {
    set(
      "contact",
      { ...c, socials: c.socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }
    );
  };
  const add = () => {
    set("contact", {
      ...c,
      socials: [...c.socials, { label: "Vimeo", href: "#" }],
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        Bottom contact section. The email is shared with{" "}
        <code className="font-mono text-[11px]">site.email</code>.
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Section number">
          <Input
            value={c.sectionNum}
            onChange={(e) => set("contact", { ...c, sectionNum: e.target.value })}
            placeholder="05 / Contact"
          />
        </Field>
        <Field label="Intro (line 1)">
          <Input
            value={c.intro}
            onChange={(e) => set("contact", { ...c, intro: e.target.value })}
            placeholder="Have an idea?"
          />
        </Field>
        <Field label="Headline accent (italic, line 2)">
          <Input
            value={c.headlineAccent}
            onChange={(e) => set("contact", { ...c, headlineAccent: e.target.value })}
            placeholder="Let's make"
          />
        </Field>
        <Field label="Headline tail (line 2)">
          <Input
            value={c.headlineTail}
            onChange={(e) => set("contact", { ...c, headlineTail: e.target.value })}
            placeholder="it real."
          />
        </Field>
        <Field label="Drop-a-line label">
          <Input
            value={c.dropALineLabel}
            onChange={(e) =>
              set("contact", { ...c, dropALineLabel: e.target.value })
            }
          />
        </Field>
        <Field label="Location label">
          <Input
            value={c.locationLabel}
            onChange={(e) => set("contact", { ...c, locationLabel: e.target.value })}
          />
        </Field>
        <Field label="Currently label">
          <Input
            value={c.currentlyLabel}
            onChange={(e) =>
              set("contact", { ...c, currentlyLabel: e.target.value })
            }
          />
        </Field>
        <Field label="Currently status">
          <Input
            value={c.currentlyStatus}
            onChange={(e) =>
              set("contact", { ...c, currentlyStatus: e.target.value })
            }
            placeholder="Open for Q1 2026"
          />
        </Field>
        <Field label="Elsewhere label" className="md:col-span-2">
          <Input
            value={c.elsewhereLabel}
            onChange={(e) =>
              set("contact", { ...c, elsewhereLabel: e.target.value })
            }
          />
        </Field>
      </div>

      <div>
        <span className="mb-2 block text-sm">Socials</span>
        <ItemList
          items={c.socials}
          onChange={(v) => set("contact", { ...c, socials: v })}
          onAdd={add}
          addLabel="+ Add social"
          renderItem={(s, i) => (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Label">
                <Input
                  value={s.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Vimeo"
                />
              </Field>
              <Field label="href">
                <Input
                  value={s.href}
                  onChange={(e) => update(i, { href: e.target.value })}
                  placeholder="https://vimeo.com/..."
                />
              </Field>
            </div>
          )}
        />
      </div>
    </div>
  );
}