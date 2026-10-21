import { ACTIONS, COMING_SOON_SKILLS, getAction, SKILLS, TECH_MAP } from '../../data';
import { TOTAL_LEVELS } from '../../data/achievements';
import {
  claimableMilestones,
  levelCap,
  levelProgress,
  skillLevel,
  skillUnlocked,
  totalLevel,
} from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { ProgressBar } from '../ProgressBar';
import { useState } from 'react';

import { FAV_KEY, FOLD_KEY, readJson, SEEN_KEY, writeJson } from './skillPrefs';

const GROUPS = ['gathering', 'processing', 'science', 'combat'] as const;

/** Actions of every skill, easiest first – for the "next unlock" hint. */
const BY_SKILL = new Map<string, { name: string; levelReq: number }[]>();
for (const a of ACTIONS) {
  const list = BY_SKILL.get(a.skill) ?? [];
  list.push({ name: a.name, levelReq: a.levelReq });
  BY_SKILL.set(a.skill, list);
}
for (const list of BY_SKILL.values()) list.sort((a, b) => a.levelReq - b.levelReq);

/** One short line under the skill name: what runs, why it is locked, or what comes next. */

function skillHint(id: string, level: number, unlocked: boolean, running: string | null): string {
  if (!unlocked) {
    const tech = SKILLS.find((s) => s.id === id)?.unlockTech;
    return `🔒 Freischalten: Forschung „${(tech && TECH_MAP.get(tech)?.name) ?? '?'}“`;
  }
  if (running) return `▶ ${running}`;
  const list = BY_SKILL.get(id);
  if (id === 'slayer') return 'Aufträge am Kopfgeldbrett – Kills am Ziel geben XP';
  if (id === 'ranged') return 'Bogen + Pfeile anlegen, dann kämpfen';
  if (id === 'magic') return 'Stab + Runen dabei, dann kämpfen';
  if (id === 'defence') return 'Im Kampf: XP für Verteidigung wählbar';
  if (!list) return 'Wird im Kampf trainiert';
  const next = list.find((a) => a.levelReq > level);
  return next ? `Nächstes: ${next.name} (Lv ${next.levelReq})` : '✔ Alles freigeschaltet';
}

/** An action unlocked since the skill was last opened. */
function hasNewUnlock(id: string, level: number): boolean {
  const seen = readJson<Record<string, number>>(SEEN_KEY, {})[id] ?? 1;
  return (BY_SKILL.get(id) ?? []).some((a) => a.levelReq > seen && a.levelReq <= level);
}

function SkillRow({ id, fav, onFav }: { id: string; fav: boolean; onFav: (id: string) => void }) {
  const xp = useGame((s) => s.game.skills[id]?.xp ?? 0);
  const isActive = useGame((s) =>
    s.game.active
      ? getAction(s.game.active.actionId).skill === id
      : !!s.game.combat && SKILLS.find((k) => k.id === id)?.group === 'combat',
  );
  const selected = useGame((s) => s.ui.selectedSkill === id);
  const unlocked = useGame((s) => skillUnlocked(s.game, id));
  const openSkill = useGame((s) => s.openSkill);
  const setUi = useGame((s) => s.setUi);
  const skill = SKILLS.find((s) => s.id === id)!;
  const cap = useGame((s) => levelCap(s.game));
  const p = levelProgress(xp, cap);
  const running = useGame((s) =>
    s.game.active && getAction(s.game.active.actionId).skill === id
      ? getAction(s.game.active.actionId).name
      : null,
  );
  const milestone = useGame((s) => claimableMilestones(s.game).some((m) => m.skill === id));
  const hint = skillHint(id, p.level, unlocked, running ?? (isActive ? 'Im Kampf' : null));
  return (
    <button
      className={`skill-row ${selected ? 'selected' : ''} ${isActive ? 'running' : ''} ${unlocked ? '' : 'locked'} ${p.level >= 99 ? 'mastered' : ''}`}
      style={{ '--sc': skill.color } as React.CSSProperties}
      onClick={() => (unlocked ? openSkill(id) : setUi({ tab: 'menu', menuSection: 'research' }))}
    >
      <span className="skill-icon">{unlocked ? skill.icon : '🔒'}</span>
      <span className="skill-meta">
        <span className="skill-name">
          {skill.name}
          {isActive && <span className="badge-running">●</span>}
          {unlocked && hasNewUnlock(id, p.level) && <span className="badge-new">neu</span>}
          {milestone && <span className="badge-new gold">🎖️</span>}
        </span>
        <small className={`skill-hint ${running || isActive ? 'run' : ''}`}>{hint}</small>
        <ProgressBar fraction={p.fraction} color={skill.color} height={4} />
      </span>
      <span className="skill-level">{p.level}</span>
      <span
        role="button"
        tabIndex={0}
        aria-label={fav ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'}
        className={`skill-fav ${fav ? 'on' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onFav(id);
        }}
      >
        {fav ? '★' : '☆'}
      </span>
    </button>
  );
}

/** Always-visible overall progress at the top of the list. */
function SkillSummary() {
  const total = useGame((s) => totalLevel(s.game));
  const cap = useGame((s) => levelCap(s.game));
  const mastered = useGame(
    (s) => SKILLS.filter((k) => skillLevel(s.game, k.id) >= BALANCE_MASTER).length,
  );
  const max = SKILLS.length * cap;
  const goal = TOTAL_LEVELS.find((n) => n > total);
  return (
    <div className="skill-summary">
      <div className="skill-summary-top">
        <span>
          📊 Gesamtlevel <b>{total}</b>
          <small> / {max}</small>
        </span>
        <span title="Skills auf Stufe 99">
          ⭐ <b>{mastered}</b>/{SKILLS.length}
        </span>
      </div>
      <ProgressBar fraction={total / max} color="var(--gold)" height={6} />
      <small className="muted">
        {goal
          ? `Nächstes Ziel: Gesamtlevel ${goal} – noch ${goal - total} Stufen`
          : 'Alle Gesamtlevel-Ziele erreicht!'}
      </small>
    </div>
  );
}

const BALANCE_MASTER = 99;

export function SkillList() {
  const [favs, setFavs] = useState<string[]>(() => readJson<string[]>(FAV_KEY, []));
  const [folded, setFolded] = useState<string[]>(() => readJson<string[]>(FOLD_KEY, []));
  const levels = useGame((s) => SKILLS.map((k) => skillLevel(s.game, k.id)).join(','));
  const lv = levels.split(',').map(Number);
  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    setFavs(next);
    writeJson(FAV_KEY, next);
  };
  const toggleGroup = (g: string) => {
    const next = folded.includes(g) ? folded.filter((x) => x !== g) : [...folded, g];
    setFolded(next);
    writeJson(FOLD_KEY, next);
  };
  const favSkills = SKILLS.filter((s) => favs.includes(s.id));
  return (
    <div className="skill-list">
      <SkillSummary />
      {favSkills.length > 0 && (
        <div>
          <h4 className="group-title">⭐ Favoriten</h4>
          {favSkills.map((s) => (
            <SkillRow key={s.id} id={s.id} fav onFav={toggleFav} />
          ))}
        </div>
      )}
      {GROUPS.map((g) => {
        const skills = SKILLS.filter((s) => s.group === g);
        const sum = skills.reduce((a, s) => a + (lv[SKILLS.indexOf(s)] ?? 1), 0);
        const closed = folded.includes(g);
        return (
          <div key={g}>
            <button className="group-title group-toggle" onClick={() => toggleGroup(g)}>
              <span>{closed ? '▸' : '▾'}</span> {t(`skills.group.${g}` as MessageKey)}{' '}
              <small className="muted">
                {skills.length} Skills · Σ {sum}
              </small>
            </button>
            {!closed &&
              skills.map((s) => (
                <SkillRow key={s.id} id={s.id} fav={favs.includes(s.id)} onFav={toggleFav} />
              ))}
          </div>
        );
      })}
      {COMING_SOON_SKILLS.length > 0 && <h4 className="group-title">{t('skills.comingSoon')}</h4>}
      <div className="coming-soon">
        {COMING_SOON_SKILLS.map((s) => (
          <div key={s.name} className="coming-row" title={s.teaser}>
            <span className="skill-icon">{s.icon}</span>
            <span className="skill-meta">
              <span className="skill-name">{s.name}</span>
              <small>{s.teaser}</small>
            </span>
            <span className="phase-badge">{t('skills.phase', { phase: s.phase })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
