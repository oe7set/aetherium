import { useEffect, useRef } from 'react';

interface Props {
  fraction: number;
  color?: string;
  height?: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ fraction, color, height = 8, label, className }: Props) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div
      className={`progress ${className ?? ''}`}
      style={{ height }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/**
 * Progress bar driven by requestAnimationFrame instead of React renders.
 * `read` returns the current fraction (0..1) and is called every frame.
 */
export function LiveProgressBar({
  read,
  color,
  height = 10,
}: {
  read: () => number;
  color?: string;
  height?: number;
}) {
  const fill = useRef<HTMLDivElement>(null);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  }, [read]);

  useEffect(() => {
    let raf = 0;
    let shown = -1;
    let lastAt = 0;
    const eco = document.documentElement.classList.contains('perf-eco');
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // Eco: ~30 updates/s are visually identical for a bar; skip unchanged values entirely.
      if (eco && now - lastAt < 32) return;
      lastAt = now;
      const f = Math.round(Math.max(0, Math.min(1, readRef.current())) * 500) / 500;
      if (f === shown || !fill.current) return;
      shown = f;
      fill.current.style.transform = `scaleX(${f})`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="progress" style={{ height }}>
      <div ref={fill} className="progress-fill live" style={{ background: color }} />
    </div>
  );
}
