import { ACTIONS, COMING_SOON_SKILLS, getAction, SKILLS, TECH_MAP } from '../../data';
import { levelCap, levelProgress, skillUnlocked } from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { ProgressBar } from '../ProgressBar';

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
  if (!list) return 'Wird im Kampf trainiert';
  const next = list.find((a) => a.levelReq > level);
  return next ? `Nächstes: ${next.name} (Lv ${next.levelReq})` : '✔ Alles freigeschaltet';
}

function SkillRow({ id }: { id: string }) {
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
        </span>
        <small className={`skill-hint ${running || isActive ? 'run' : ''}`}>{hint}</small>
        <ProgressBar fraction={p.fraction} color={skill.color} height={4} />
      </span>
      <span className="skill-level">{p.level}</span>
    </button>
  );
}

export function SkillList() {
  return (
    <div className="skill-list">
      {GROUPS.map((g) => (
        <div key={g}>
          <h4 className="group-title">{t(`skills.group.${g}` as MessageKey)}</h4>
          {SKILLS.filter((s) => s.group === g).map((s) => (
            <SkillRow key={s.id} id={s.id} />
          ))}
        </div>
      ))}
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
