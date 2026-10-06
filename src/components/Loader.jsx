import { useEffect, useState } from "react";

export default function Loader() {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += Math.random() * 8 + 2;
      if (n >= 100) {
        n = 100;
        clearInterval(id);
        setTimeout(() => setDone(true), 350);
      }
      setProgress(n);
    }, 70);
    return () => clearInterval(id);
  }, []);

  if (done) return null;

  const pct = Math.floor(progress);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-between bg-ink p-8 text-bone md:p-14"
      style={{
        clipPath: `inset(0 0 ${100 - pct}% 0)`,
        transition: "clip-path 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <span className="font-display text-[10vw] font-medium leading-none tracking-tighter md:text-[8vw]">
        {pct.toString().padStart(2, "0")}
      </span>
      <span className="eyebrow self-end">Loading · Portfolio</span>
    </div>
  );
}