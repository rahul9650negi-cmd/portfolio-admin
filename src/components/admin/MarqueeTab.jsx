import { StringList } from "./adminUtils";

export default function MarqueeTab({ data, set }) {
  return (
    <div className="space-y-5">
      <p className="text-sm opacity-70">
        The orange ticker strip below the hero. Each item is duplicated
        for the infinite-scroll effect.
      </p>
      <StringList
        items={data.marquee}
        onChange={(v) => set("marquee", v)}
        placeholder="Vimeo Staff Picks"
      />
    </div>
  );
}