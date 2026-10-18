import { COMING_SOON_SKILLS, getAction, SKILLS } from '../../data';
import { levelCap, levelProgress, skillUnlocked } from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { ProgressBar } from '../ProgressBar';

const GROUPS = ['gathering', 'processing', 'science', 'combat'] as const;

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
  const skill = SKILLS.find((s) => s.id === id)!;
  const cap = useGame((s) => levelCap(s.game));
  const p = levelProgress(xp, cap);
  return (
    <button
      className={`skill-row ${selected ? 'selected' : ''} ${isActive ? 'running' : ''} ${unlocked ? '' : 'locked'}`}
      onClick={() => openSkill(id)}
    >
      <span className="skill-icon">{unlocked ? skill.icon : '🔒'}</span>
      <span className="skill-meta">
        <span className="skill-name">
          {skill.name}
          {isActive && <span className="badge-running">●</span>}
        </span>
        <ProgressBar fraction={p.fraction} color={skill.color} height={5} />
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
