import { useEffect, useRef, useState } from "react";
import logo from "@/assets/amc-logo.png";
import { cn } from "@/lib/utils";

const rnd = (i: number, s: number) => {
  const x = Math.sin(i * 99.13 + s * 7.7) * 10000;
  return x - Math.floor(x);
};

export function Particles({ count = 40 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="arena-grid absolute inset-0" />
      {Array.from({ length: count }).map((_, i) => {
        const size = 1.5 + rnd(i, 1) * 3;
        return (
          <span
            key={i}
            className="particle"
            style={{
              left: `${rnd(i, 2) * 100}%`,
              width: size,
              height: size,
              animationDuration: `${10 + rnd(i, 3) * 16}s`,
              animationDelay: `${-rnd(i, 4) * 20}s`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return <img src={logo} alt="Anime club logo" className={cn("object-contain", className)} />;
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 700);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(a + (value - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{shown}</span>;
}

export function Confetti({ count = 90 }: { count?: number }) {
  const colors = ["var(--primary)", "var(--accent)", "var(--foreground)", "var(--primary-glow)"];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${rnd(i, 5) * 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${3 + rnd(i, 6) * 4}s`,
            animationDelay: `${-rnd(i, 7) * 6}s`,
            transform: `rotate(${rnd(i, 8) * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");
