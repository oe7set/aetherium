import { actionsForSkill, getSkill, getTech, getTool, type ActionDef } from '../../data';
import { levelCap, levelProgress, skillUnlocked } from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';
import { CombatView } from '../combat/CombatView';
import { FarmingView } from '../science/FarmingView';
import { ActionCard } from './ActionCard';

function groupByCategory(actions: ActionDef[]): [string, ActionDef[]][] {
  const groups = new Map<string, ActionDef[]>();
  for (const a of actions) {
    const key = a.category ?? '';
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.entries()];
}

export function SkillView({ skillId, onBack }: { skillId: string; onBack?: () => void }) {
  if (getSkill(skillId).group === 'combat') return <CombatView onBack={onBack} />;
  return <SkillGate skillId={skillId} onBack={onBack} />;
}

function LockedSkill({ skillId, onBack }: { skillId: string; onBack?: () => void }) {
  const skill = getSkill(skillId);
  const tech = skill.unlockTech ? getTech(skill.unlockTech) : null;
  const setUi = useGame((s) => s.setUi);
  return (
    <div className="skill-view">
      {onBack && (
        <button className="btn btn-ghost back" onClick={onBack}>
          {t('skills.back')}
        </button>
      )}
      <div className="skill-head" style={{ ['--accent' as string]: skill.color }}>
        <span className="skill-head-icon">🔒</span>
        <div className="skill-head-info">
          <h2>{skill.name}</h2>
          <small>{skill.desc}</small>
        </div>
      </div>
      <p>
        Schalte diesen Skill mit der Forschung <b>{tech ? `${tech.icon} ${tech.name}` : '???'}</b>{' '}
        frei.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => setUi({ tab: 'menu', menuSection: 'research' })}
      >
        🔬 Zum Tech-Baum
      </button>
    </div>
  );
}

function SkillGate({ skillId, onBack }: { skillId: string; onBack?: () => void }) {
  const unlocked = useGame((s) => skillUnlocked(s.game, skillId));
  if (!unlocked) return <LockedSkill skillId={skillId} onBack={onBack} />;
  return <SkillDetailInner skillId={skillId} onBack={onBack} />;
}

function SkillDetailInner({ skillId, onBack }: { skillId: string; onBack?: () => void }) {
  const skill = getSkill(skillId);
  const xp = useGame((s) => s.game.skills[skillId]?.xp ?? 0);
  const toolId = useGame((s) => s.game.equippedTools[skillId]);
  const { int } = useFmt();
  const cap = useGame((s) => levelCap(s.game));
  const p = levelProgress(xp, cap);
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
      {skillId === 'farming' && <FarmingView />}
      <div className="skill-facts" hidden={skillId === 'farming'}>
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
      {groupByCategory(actions).map(([category, list]) => (
        <section key={category || 'all'}>
          {category && <h4 className="group-title">{category}</h4>}
          <div className="action-list">
            {/* Unlocked actions plus the next two locked ones: a visible goal without clutter. */}
            {list
              .filter(
                (a, i) =>
                  a.levelReq <= p.level || list.findIndex((x) => x.levelReq > p.level) + 2 > i,
              )
              .map((a) => (
                <ActionCard key={a.id} def={a} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
