import { Field, Input, Textarea, ItemList } from "./adminUtils";

export default function ServicesTab({ data, set }) {
  const services = data.services;
  const update = (i, patch) => {
    set(
      "services",
      services.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    );
  };
  const add = () => {
    const next = String(services.length + 1).padStart(2, "0");
    set("services", [...services, { num: next, title: "New service", desc: "" }]);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        The big list in the Services section. Each item is a row with a
        number, title, and one-line description.
      </p>

      <ItemList
        items={services}
        onChange={(v) => set("services", v)}
        onAdd={add}
        addLabel="+ Add service"
        renderItem={(s, i) => (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[60px_1fr]">
            <Field label="#">
              <Input
                value={s.num}
                onChange={(e) => update(i, { num: e.target.value })}
                placeholder="01"
              />
            </Field>
            <Field label="Title">
              <Input
                value={s.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="Video Editing"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea
                  value={s.desc}
                  onChange={(e) => update(i, { desc: e.target.value })}
                  rows={2}
                />
              </Field>
            </div>
          </div>
        )}
      />
    </div>
  );
}