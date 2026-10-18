import { useGame } from '../store/gameStore';

/** Floating "+10 XP" / "+1 Eichenholz" numbers. CSS animates and fades them out. */
export function Popups() {
  const popups = useGame((s) => s.popups);
  return (
    <div className="popups" aria-hidden>
      {popups.map((p, i) => (
        <span
          key={p.id}
          className={`popup popup-${p.kind}`}
          style={{ ['--i' as string]: popups.length - 1 - i }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
}
