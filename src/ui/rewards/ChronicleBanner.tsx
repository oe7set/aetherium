import { currentChronicle } from '../../engine';
import { useGame } from '../../store/gameStore';

/** Always-visible next goal (the Chronik doubles as the tutorial). */
export function ChronicleBanner({ compact = false }: { compact?: boolean }) {
  const key = useGame((s) => {
    const c = currentChronicle(s.game);
    return c ? `${c.index}|${Math.min(c.value, c.target)}|${c.done}` : 'end';
  });
  const claim = useGame((s) => s.claimChronicle);
  const setUi = useGame((s) => s.setUi);
  const openSkill = useGame((s) => s.openSkill);
  if (key === 'end') return null;
  const c = currentChronicle(useGame.getState().game)!;
  const fraction = Math.min(1, c.value / c.target);
  const go = () => {
    if (c.step.go.skill) openSkill(c.step.go.skill);
    else
      setUi({
        tab: c.step.go.tab,
        ...(c.step.go.tab === 'menu' && c.step.icon === '🔬'
          ? { menuSection: 'research' as const }
          : {}),
      });
  };
  return (
    <div className={`chronicle ${c.done ? 'done' : ''} ${compact ? 'compact' : ''}`}>
      <span className="chronicle-icon">{c.step.icon}</span>
      <span className="chronicle-body">
        <small>
          Chronik {c.index + 1} · {c.done ? 'geschafft!' : c.step.hint}
        </small>
        <strong>{c.step.title}</strong>
        <span className="chronicle-bar">
          <i style={{ width: `${fraction * 100}%` }} />
        </span>
      </span>
      {c.done ? (
        <button className="btn btn-primary small chronicle-btn" onClick={claim}>
          🎁 Abholen
        </button>
      ) : (
        <button className="btn small chronicle-btn" onClick={go}>
          Los ›
        </button>
      )}
    </div>
  );
}
