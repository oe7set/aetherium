import { actionsForSkill, getSkill, getTool } from '../../data';
import { levelProgress } from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';
import { ActionCard } from './ActionCard';

export function SkillView({ skillId, onBack }: { skillId: string; onBack?: () => void }) {
  const skill = getSkill(skillId);
  const xp = useGame((s) => s.game.skills[skillId]?.xp ?? 0);
  const toolId = useGame((s) => s.game.equippedTools[skillId]);
  const { int } = useFmt();
  const p = levelProgress(xp);
  const actions = actionsForSkill(skillId);
  const next = actions.find((a) => a.levelReq > p.level);
  const tool = skill.usesTools && toolId ? getTool(toolId) : null;

  return (
    <div className="skill-view">
      {onBack && (
        <button className="btn btn-ghost back" onClick={onBack}>
          {t('skills.back')}
        </button>
      )}
      <div className="skill-head" style={{ ['--accent' as string]: skill.color }}>
        <span className="skill-head-icon">{skill.icon}</span>
        <div className="skill-head-info">
          <h2>
            {skill.name} <span className="lvl">{t('skills.level', { level: p.level })}</span>
          </h2>
          <ProgressBar fraction={p.fraction} color={skill.color} height={10} />
          <small>
            {p.needed > 0
              ? `${int(Math.floor(xp))} XP · ${t('skills.xpToNext', { xp: int(Math.ceil(p.remaining)), level: p.level + 1 })}`
              : t('skills.maxed')}
          </small>
        </div>
      </div>
      <p className="skill-desc">{skill.desc}</p>
      <div className="skill-facts">
        {tool && (
          <span className="fact">
            {t('skills.tool', { name: `${tool.icon} ${tool.name}`, speed: tool.speed })}
          </span>
        )}
        <span className="fact">
          {next
            ? t('action.nextUnlock', { name: next.name, level: next.levelReq })
            : t('action.allUnlocked')}
        </span>
      </div>
      <div className="action-list">
        {actions.map((a) => (
          <ActionCard key={a.id} def={a} />
        ))}
      </div>
    </div>
  );
}
