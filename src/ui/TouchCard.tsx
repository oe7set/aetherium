import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Floating info card at the bottom of the screen (above the tab bar): details and actions for a
 * tapped thing without scrolling away from it. Closes with ✕, Escape or a tap outside.
 */
export function TouchCard({
  onClose,
  children,
  className = '',
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      // Taps on another selectable thing switch the card instead of just closing it.
      if (t?.closest('.touch-card, [data-touch-keep]')) return;
      onClose();
    };
    const id = window.setTimeout(() => window.addEventListener('pointerdown', onDown), 0);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className={`touch-card ${className}`} role="dialog">
      <button className="touch-card-close" onClick={onClose} aria-label="Schließen">
        ✕
      </button>
      {children}
    </div>,
    document.body,
  );
}
