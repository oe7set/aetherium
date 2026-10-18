import { getSkill, SKILLS, toolsForSkill } from '../../data';
import { skillLevel } from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';

function ToolSkill({ skillId }: { skillId: string }) {
  const skill = getSkill(skillId);
  const level = useGame((s) => skillLevel(s.game, skillId));
  const owned = useGame((s) => s.game.ownedTools);
  const equipped = useGame((s) => s.game.equippedTools[skillId]);
  const gold = useGame((s) => s.game.gold);
  const buyTool = useGame((s) => s.buyTool);
  const equipTool = useGame((s) => s.equipTool);
  const { num } = useFmt();
  const tools = toolsForSkill(skillId);
  // Show everything owned plus the next two purchasable tiers – a visible next goal.
  const firstUnowned = tools.findIndex((tl) => !owned.includes(tl.id));
  const visible = tools.filter(
    (tl, i) => owned.includes(tl.id) || (firstUnowned >= 0 && i < firstUnowned + 2),
  );

  return (
    <div className="tool-skill">
      <h4 className="group-title">
        {skill.icon} {skill.name} <small>Lvl {level}</small>
      </h4>
      {visible.map((tool) => {
        const has = owned.includes(tool.id);
        const isEq = equipped === tool.id;
        const levelOk = level >= tool.levelReq;
        return (
          <div key={tool.id} className={`shop-row ${isEq ? 'equipped' : ''}`}>
            <span className="item-icon">{tool.icon}</span>
            <span className="shop-meta">
              <strong>
                {tool.name}{' '}
                <small className="muted">{t('tools.speed', { speed: tool.speed })}</small>
              </strong>
              <small className="muted">{tool.desc}</small>
              {!levelOk && (
                <small className="warn">
                  {t('tools.requires', { skill: skill.name, level: tool.levelReq })}
                </small>
              )}
            </span>
            <span className="shop-buttons">
              {isEq ? (
                <span className="tag">{t('tools.equipped')}</span>
              ) : has ? (
                <button className="btn" disabled={!levelOk} onClick={() => equipTool(tool.id)}>
                  {t('tools.equip')}
                </button>
              ) : (
                <button
                  className="btn btn-gold"
                  disabled={!levelOk || gold.lt(tool.price)}
                  onClick={() => buyTool(tool.id)}
                >
                  {num(tool.price)}🪙
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ToolsPanel() {
  return (
    <div className="tools">
      <h3 className="panel-title">{t('tools.title')}</h3>
      {SKILLS.filter((s) => s.usesTools).map((s) => (
        <ToolSkill key={s.id} skillId={s.id} />
      ))}
    </div>
  );
}
