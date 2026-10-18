import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}

/** Mobile panel that slides up over the world. Drag the handle down (or tap it) to close. */
export function BottomSheet({ open, onClose, children, label }: Props) {
  const startY = useRef<number | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  // Each tab starts at the top.
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [label]);
  // Sub-tabs sit in one swipeable row: keep the active one in view whenever it changes.
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const reveal = () => {
      for (const seg of el.querySelectorAll<HTMLElement>('.segments .segment.active')) {
        const row = seg.parentElement;
        if (!row || row.scrollWidth <= row.clientWidth) continue;
        const left = seg.offsetLeft - row.offsetLeft;
        if (left < row.scrollLeft || left + seg.offsetWidth > row.scrollLeft + row.clientWidth)
          row.scrollTo({
            left: left - (row.clientWidth - seg.offsetWidth) / 2,
            behavior: 'smooth',
          });
      }
    };
    reveal();
    const mo = new MutationObserver(reveal);
    mo.observe(el, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
    });
    return () => mo.disconnect();
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null || !sheet.current) return;
    const dy = Math.max(0, e.clientY - startY.current);
    sheet.current.style.transform = `translateY(${dy}px)`;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (sheet.current) sheet.current.style.transform = '';
    if (dy > 80 || Math.abs(dy) < 4) onClose();
  };

  return (
    <div
      ref={sheet}
      className={`sheet ${open ? 'open' : ''}`}
      role="dialog"
      aria-label={label}
      aria-hidden={!open}
    >
      <div
        className="sheet-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="sheet-grip" />
        <strong className="sheet-title">{label}</strong>
        <button
          className="sheet-close"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>
      <div className="sheet-body" ref={body}>
        {open && children}
      </div>
    </div>
  );
}
