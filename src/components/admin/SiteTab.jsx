import { Field, Input, Textarea } from "./adminUtils";

export default function SiteTab({ data, set }) {
  const s = data.site;
  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        Your identity — name, role, email, location. Used across the site
        (navbar, hero, contact, footer).
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Name *" required>
          <Input
            value={s.name}
            onChange={(e) => set("site", { ...s, name: e.target.value })}
            placeholder="Rahul Negi"
          />
        </Field>

        <Field label="Role">
          <Input
            value={s.role}
            onChange={(e) => set("site", { ...s, role: e.target.value })}
            placeholder="Filmmaker & Video Editor"
          />
        </Field>

        <Field label="Email *" required>
          <Input
            type="email"
            value={s.email}
            onChange={(e) => set("site", { ...s, email: e.target.value })}
            placeholder="hello@yourdomain.com"
          />
        </Field>

        <Field label="Location">
          <Input
            value={s.location}
            onChange={(e) => set("site", { ...s, location: e.target.value })}
            placeholder="Delhi, IN"
          />
        </Field>

        <Field label="Short location label" hint="Used in the hero live-time + footer">
          <Input
            value={s.locationLabel}
            onChange={(e) => set("site", { ...s, locationLabel: e.target.value })}
            placeholder="Delhi"
          />
        </Field>

        <Field label="Timezone" hint="IANA timezone for the live clock">
          <Input
            value={s.timezone}
            onChange={(e) => set("site", { ...s, timezone: e.target.value })}
            placeholder="Asia/Kolkata"
          />
        </Field>
      </div>
    </div>
  );
}