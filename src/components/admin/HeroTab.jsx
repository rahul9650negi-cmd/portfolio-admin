import { Field, Input, Textarea, StringList } from "./adminUtils";

export default function HeroTab({ data, set }) {
  const h = data.hero;
  const updateLine = (key, value) =>
    set("hero", { ...h, headline: { ...h.headline, [key]: value } });

  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        The opening section. Headline is 3 lines; each line is a list of
        words. Use <code className="font-mono text-[11px]">serif</code> or{" "}
        <code className="font-mono text-[11px]">serif-flame</code> as a
        style to highlight a word.
      </p>

      <div className="space-y-5">
        <Field label="Line 1 words">
          <StringList
            items={h.headline.line1}
            onChange={(v) => updateLine("line1", v)}
            placeholder="Filmmaker"
          />
        </Field>

        <Field label="Line 2 words" hint="Use prefix 'serif:' or 'serif-flame:' to style a word">
          <StringList
            items={h.headline.line2.map((w) =>
              typeof w === "string" ? w : `${w.style || "serif"}:${w.text}`
            )}
            onChange={(v) =>
              updateLine(
                "line2",
                v.map((raw) => {
                  if (raw.includes(":")) {
                    const [style, ...rest] = raw.split(":");
                    return { text: rest.join(":").trim(), style };
                  }
                  return raw;
                })
              )
            }
            placeholder="serif-flame:crafting stories"
          />
        </Field>

        <Field label="Line 3 words">
          <StringList
            items={h.headline.line3.map((w) =>
              typeof w === "string" ? w : `${w.style || "serif"}:${w.text}`
            )}
            onChange={(v) =>
              updateLine(
                "line3",
                v.map((raw) => {
                  if (raw.includes(":")) {
                    const [style, ...rest] = raw.split(":");
                    return { text: rest.join(":").trim(), style };
                  }
                  return raw;
                })
              )
            }
            placeholder="serif:that"
          />
        </Field>

        <Field label="Bio paragraph">
          <Textarea
            value={h.bio}
            onChange={(e) => set("hero", { ...h, bio: e.target.value })}
            placeholder="I'm Rahul — a freelance filmmaker..."
            rows={3}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Badge text">
            <Input
              value={h.badge}
              onChange={(e) => set("hero", { ...h, badge: e.target.value })}
              placeholder="Available · Q1 2026"
            />
          </Field>

          <Field label="EST. year" hint="Shown in the floating circular tag">
            <Input
              type="number"
              value={h.estYear}
              onChange={(e) =>
                set("hero", { ...h, estYear: parseInt(e.target.value, 10) || 0 })
              }
            />
          </Field>

          <Field label="Showreel button label">
            <Input
              value={h.showreelLabel}
              onChange={(e) =>
                set("hero", { ...h, showreelLabel: e.target.value })
              }
            />
          </Field>

          <Field label="Showreel time">
            <Input
              value={h.showreelTime}
              onChange={(e) =>
                set("hero", { ...h, showreelTime: e.target.value })
              }
              placeholder="01:42"
            />
          </Field>
        </div>

        <Field label="Tools list" hint="One per line — shown in the marquee at the bottom of the hero">
          <StringList
            items={h.tools}
            onChange={(v) => set("hero", { ...h, tools: v })}
            placeholder="Premiere Pro"
          />
        </Field>
      </div>
    </div>
  );
}