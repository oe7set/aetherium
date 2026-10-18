import { useEffect, useMemo, useRef, useState } from 'react';
import { SKILLS } from '../data';
import {
  collectionsClaimable,
  heroAttention,
  passClaimable,
  skillLevel,
  villageAttention,
} from '../engine';
import { useGame, type UiState } from '../store/gameStore';

interface Dest {
  icon: string;
  label: string;
  group: string;
  keywords: string;
  ui?: Partial<UiState>;
  skill?: string;
  badge?: number;
}

/** Searchable launcher: every area of the game is two taps (or a few letters) away. */
export function QuickNav() {
  const open = useGame((s) => s.ui.quickNav);
  const setUi = useGame((s) => s.setUi);
  const openSkill = useGame((s) => s.openSkill);
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') setUi({ quickNav: false });
        return;
      }
      if (e.key === 'k' || e.key === 'K' || e.key === '/') {
        e.preventDefault();
        setUi({ quickNav: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setUi]);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => input.current?.focus(), 50);
    }
  }, [open]);

  const dests = useMemo<Dest[]>(() => {
    if (!open) return [];
    const g = useGame.getState().game;
    const v = (villageSegment: UiState['villageSegment']): Partial<UiState> => ({
      tab: 'village',
      villageSegment,
    });
    const h = (heroSegment: UiState['heroSegment']): Partial<UiState> => ({
      tab: 'rift',
      heroSegment,
    });
    const m = (menuSection: UiState['menuSection']): Partial<UiState> => ({
      tab: 'menu',
      menuSection,
    });
    const inv = (inventorySegment: UiState['inventorySegment']): Partial<UiState> => ({
      tab: 'inventory',
      inventorySegment,
    });
    return [
      {
        icon: '🏝️',
        label: 'Insel',
        group: 'Insel',
        keywords: 'welt 3d start',
        ui: { tab: 'world' },
      },
      {
        icon: '🎒',
        label: 'Taschen',
        group: 'Insel',
        keywords: 'inventar items',
        ui: inv('items'),
      },
      {
        icon: '🛡️',
        label: 'Ausrüstung',
        group: 'Insel',
        keywords: 'gear waffen rüstung',
        ui: inv('gear'),
      },
      {
        icon: '📗',
        label: 'Sammelbuch',
        group: 'Insel',
        keywords: 'sammlung sets album relikte',
        ui: inv('album'),
        badge: collectionsClaimable(g).length,
      },
      {
        icon: '📈',
        label: 'Markt',
        group: 'Insel',
        keywords: 'preise trends verkaufen',
        ui: inv('market'),
      },
      { icon: '🏪', label: 'Krämer', group: 'Insel', keywords: 'shop kaufen', ui: inv('shop') },
      {
        icon: '🧰',
        label: 'Werkzeuge',
        group: 'Insel',
        keywords: 'axt spitzhacke tools',
        ui: inv('tools'),
      },
      ...SKILLS.map((s) => ({
        icon: s.icon,
        label: `${s.name} (Lv ${skillLevel(g, s.id)})`,
        group: 'Skills',
        keywords: `${s.id} skill ${s.desc}`,
        skill: s.id,
      })),
      {
        icon: '🌾',
        label: 'Felder',
        group: 'Dorf',
        keywords: 'rohstoffe holz lehm eisen getreide',
        ui: v('fields'),
      },
      {
        icon: '🏘️',
        label: 'Dorfzentrum',
        group: 'Dorf',
        keywords: 'gebäude bauen hauptgebäude',
        ui: v('center'),
      },
      {
        icon: '🗺️',
        label: 'Weltkarte',
        group: 'Dorf',
        keywords: 'karte map oasen lager täler',
        ui: v('map'),
      },
      {
        icon: '⚔️',
        label: 'Militär',
        group: 'Dorf',
        keywords: 'truppen kaserne raubzug',
        ui: v('military'),
      },
      {
        icon: '⚖️',
        label: 'Dorfmarkt & Hafen',
        group: 'Dorf',
        keywords: 'handel hafen tauschen',
        ui: v('market'),
      },
      {
        icon: '📜',
        label: 'Berichte',
        group: 'Dorf',
        keywords: 'kampfberichte invasion',
        ui: v('reports'),
        badge: villageAttention(g),
      },
      {
        icon: '👑',
        label: 'Reich & Expansion',
        group: 'Dorf',
        keywords: 'kulturpunkte siedler dörfer',
        ui: v('empire'),
      },
      {
        icon: '🦸',
        label: 'Held',
        group: 'Held',
        keywords: 'attribute ausrüstung avatar',
        ui: h('hero'),
        badge: heroAttention(g),
      },
      {
        icon: '❗',
        label: 'Abenteuer',
        group: 'Held',
        keywords: 'dungeon abenteuer',
        ui: h('adventures'),
      },
      {
        icon: '🌀',
        label: 'Ätherriss',
        group: 'Held',
        keywords: 'riss roguelike survivor',
        ui: h('start'),
      },
      {
        icon: '✨',
        label: 'Riss-Talente',
        group: 'Held',
        keywords: 'essenz talente',
        ui: h('talents'),
      },
      { icon: '📖', label: 'Kodex', group: 'Held', keywords: 'waffen evolutionen', ui: h('codex') },
      {
        icon: '📚',
        label: 'Reichsbuch',
        group: 'Mehr',
        keywords: 'übersicht ziele',
        ui: m('empire'),
      },
      {
        icon: '🏅',
        label: 'Ruhmesleiter',
        group: 'Mehr',
        keywords: 'pass belohnung stufen',
        ui: m('pass'),
        badge: passClaimable(g).length,
      },
      {
        icon: '🔬',
        label: 'Forschung',
        group: 'Mehr',
        keywords: 'tech codex helfer beete',
        ui: m('research'),
      },
      {
        icon: '📋',
        label: 'Quests & Aufträge',
        group: 'Mehr',
        keywords: 'quests aufträge haustiere',
        ui: m('quests'),
      },
      {
        icon: '🌅',
        label: 'Prestige',
        group: 'Mehr',
        keywords: 'wiedergeburt weisheit',
        ui: m('prestige'),
      },
      {
        icon: '🏆',
        label: 'Erfolge',
        group: 'Mehr',
        keywords: 'achievements',
        ui: m('achievements'),
      },
      { icon: '📊', label: 'Statistiken', group: 'Mehr', keywords: 'stats', ui: m('stats') },
      {
        icon: '⚙️',
        label: 'Einstellungen',
        group: 'Mehr',
        keywords: 'optionen leistung akku sound',
        ui: m('settings'),
      },
      {
        icon: '💾',
        label: 'Spielstand',
        group: 'Mehr',
        keywords: 'speichern export import',
        ui: m('save'),
      },
    ];
  }, [open]);

  if (!open) return null;
  const q = query.trim().toLowerCase();
  const list = q
    ? dests.filter((d) => `${d.label} ${d.keywords} ${d.group}`.toLowerCase().includes(q))
    : dests;
  const groups = [...new Set(list.map((d) => d.group))];
  const go = (d: Dest) => {
    setUi({ quickNav: false });
    if (d.skill) openSkill(d.skill);
    else if (d.ui) setUi(d.ui);
  };
  return (
    <div
      className="qnav-overlay"
      onClick={() => setUi({ quickNav: false })}
      role="dialog"
      aria-label="Schnellzugriff"
    >
      <div className="qnav" onClick={(e) => e.stopPropagation()}>
        <input
          ref={input}
          className="qnav-search"
          placeholder="Wohin? z. B. „Karte“, „Kaserne“, „Angeln“ …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && list[0]) go(list[0]);
          }}
        />
        <div className="qnav-body">
          {groups.map((group) => (
            <section key={group}>
              <h4>{group}</h4>
              <div className="qnav-grid">
                {list
                  .filter((d) => d.group === group)
                  .map((d) => (
                    <button
                      key={`${d.group}${d.label}`}
                      className="qnav-item"
                      onClick={() => go(d)}
                    >
                      <span className="qnav-icon">{d.icon}</span>
                      <span className="qnav-label">{d.label}</span>
                      {(d.badge ?? 0) > 0 && <span className="qnav-badge">{d.badge}</span>}
                    </button>
                  ))}
              </div>
            </section>
          ))}
          {!list.length && <p className="muted center">Nichts gefunden.</p>}
        </div>
      </div>
    </div>
  );
}
