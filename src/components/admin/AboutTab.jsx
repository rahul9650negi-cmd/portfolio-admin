import { Field, Input, Textarea, ItemList } from "./adminUtils";

export default function AboutTab({ data, set }) {
  const a = data.about;

  const updateStat = (i, patch) => {
    const stats = a.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    set("about", { ...a, stats });
  };
  const removeStat = (i) => {
    set("about", { ...a, stats: a.stats.filter((_, idx) => idx !== i) });
  };
  const addStat = () => {
    set("about", {
      ...a,
      stats: [...a.stats, { num: 0, suffix: "", label: "New stat" }],
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        Bio paragraphs and the four stat counters below them.
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Section number">
          <Input
            value={a.sectionNum}
            onChange={(e) => set("about", { ...a, sectionNum: e.target.value })}
            placeholder="01 / About"
          />
        </Field>
        <Field label="Title (line 1)">
          <Input
            value={a.title}
            onChange={(e) => set("about", { ...a, title: e.target.value })}
            placeholder="A few words"
          />
        </Field>
        <Field label="Title accent (line 2)">
          <Input
            value={a.titleAccent}
            onChange={(e) => set("about", { ...a, titleAccent: e.target.value })}
            placeholder="about me."
          />
        </Field>
      </div>

      <Field label="Bio paragraph 1">
        <Textarea
          value={a.bio1}
          onChange={(e) => set("about", { ...a, bio1: e.target.value })}
          rows={4}
        />
      </Field>

      <Field label="Bio paragraph 2">
        <Textarea
          value={a.bio2}
          onChange={(e) => set("about", { ...a, bio2: e.target.value })}
          rows={3}
        />
      </Field>

      <div>
        <span className="mb-2 block text-sm">Stats</span>
        <ItemList
          items={a.stats}
          onChange={(stats) => set("about", { ...a, stats })}
          onAdd={addStat}
          addLabel="+ Add stat"
          renderItem={(s, i) => (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[80px_60px_1fr]">
              <Field label="Number">
                <Input
                  type="number"
                  value={s.num}
                  onChange={(e) =>
                    updateStat(i, { num: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </Field>
              <Field label="Suffix">
                <Input
                  value={s.suffix}
                  onChange={(e) => updateStat(i, { suffix: e.target.value })}
                  placeholder="+ / y / etc"
                />
              </Field>
              <Field label="Label">
                <Input
                  value={s.label}
                  onChange={(e) => updateStat(i, { label: e.target.value })}
                  placeholder="Projects shipped"
                />
              </Field>
            </div>
          )}
        />
      </div>
    </div>
  );
}