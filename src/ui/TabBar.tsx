import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';
import {
  affordableTechs,
  villageAttention,
  collectionsClaimable,
  heroAttention,
  QUEST_MAP,
  questProgress,
  taskProgress,
} from '../engine';
import { useGame } from '../store/gameStore';
import { TABS } from './tabs';
import { TAB_HOME, tabShortcuts } from './tabShortcuts';
import type { TabId } from '../store/gameStore';

const LONG_PRESS_MS = 450;

export function TabBar({ tabs = TABS }: { tabs?: typeof TABS }) {
  const tab = useGame((s) => s.ui.tab);
  const setUi = useGame((s) => s.setUi);
  // Badges: claimable tasks/quests and affordable research draw attention to new goals.
  const questBadge = useGame(
    (s) =>
      s.game.tasks.list.filter((tk) => !tk.claimed && taskProgress(s.game, tk) >= tk.target)
        .length +
      Object.keys(s.game.quests.active).filter((id) => {
        const q = QUEST_MAP.get(id);
        return q && questProgress(s.game, q).every((p) => p.done);
      }).length,
  );
  const researchBadge = useGame((s) => affordableTechs(s.game).length);
  const villageBadge = useGame((s) => villageAttention(s.game));
  const heroBadge = useGame((s) => heroAttention(s.game));
  const albumBadge = useGame((s) => collectionsClaimable(s.game).length);
  const [menuFor, setMenuFor] = useState<TabId | null>(null);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const press = useRef<{ timer: number; fired: boolean } | null>(null);

  const startPress = (id: TabId, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const p = { timer: 0, fired: false };
    p.timer = window.setTimeout(() => {
      p.fired = true;
      navigator.vibrate?.(12);
      setAnchor({ x: r.left + r.width / 2, y: r.top });
      setMenuFor(id);
    }, LONG_PRESS_MS);
    press.current = p;
  };
  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
  };
  const tap = (id: TabId) => {
    if (press.current?.fired) return; // the long press already opened the menu
    if (id === tab) {
      // Re-tap: back to the heart of the area, scrolled to the top.
      setUi(TAB_HOME[id]);
      document
        .querySelectorAll('.sheet-body, .center-panel')
        .forEach((el) => el.scrollTo({ top: 0, behavior: 'smooth' }));
    } else setUi({ tab: id });
  };

  const badges: Partial<Record<string, number>> = {
    menu: questBadge + researchBadge,
    village: villageBadge,
    rift: heroBadge,
    inventory: albumBadge,
  };
  return (
    <nav className="tabbar" aria-label="Navigation">
      {tabs.map((tb) => (
        <button
          key={tb.id}
          className={`tab ${tab === tb.id ? 'active' : ''}`}
          aria-current={tab === tb.id ? 'page' : undefined}
          onClick={() => tap(tb.id)}
          onPointerDown={(e) => startPress(tb.id, e.currentTarget)}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
          title={`${t(tb.label)} – nochmal tippen: Start, gedrückt halten: Schnellmenü`}
        >
          <span className="tab-icon" aria-hidden>
            {tb.icon}
          </span>
          <span className="tab-label">{t(tb.label)}</span>
          {(badges[tb.id] ?? 0) > 0 && <span className="tab-badge">{badges[tb.id]}</span>}
        </button>
      ))}
      {menuFor &&
        createPortal(
          <div className="tab-menu-scrim" onPointerDown={() => setMenuFor(null)}>
            <div
              className="tab-menu"
              style={
                {
                  left: Math.max(8, Math.min(window.innerWidth - 188, anchor.x - 90)),
                  bottom: window.innerHeight - anchor.y + 8,
                } as React.CSSProperties
              }
              onPointerDown={(e) => e.stopPropagation()}
            >
              {tabShortcuts(menuFor).map((sc) => (
                <button
                  key={sc.label}
                  onClick={() => {
                    setUi({ tab: menuFor, ...sc.ui });
                    setMenuFor(null);
                  }}
                >
                  <span>{sc.icon}</span> {sc.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </nav>
  );
}
