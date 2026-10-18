import { useEffect, useState, type ReactNode } from 'react';
import { useLongPress } from './hooks';

/**
 * Wraps content with a tooltip that opens on long-press (touch) or hover (desktop) – nothing
 * important depends on hover alone (Spec 2a).
 */
export function Tip({
  text,
  children,
  className,
}: {
  text: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const handlers = useLongPress(() => setOpen(true));

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const id = window.setTimeout(close, 3500);
    window.addEventListener('pointerdown', close, { once: true });
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('pointerdown', close);
    };
  }, [open]);

  return (
    <span
      className={`tip-anchor ${className ?? ''}`}
      {...handlers}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className="tip" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
