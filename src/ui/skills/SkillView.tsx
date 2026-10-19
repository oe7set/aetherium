import { useEffect } from 'react';
import { actionsForSkill, getSkill, getTech, getTool, type ActionDef } from '../../data';
import {
  dismissFamiliar,
  faithBonus,
  formatDuration,
  hasMasteryPool,
  levelCap,
  levelProgress,
  masteryPool,
  POOL_TIERS,
  skillUnlocked,
} from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';
import { CombatView } from '../combat/CombatView';
import { SlayerView } from '../combat/SlayerView';
import { FAMILIAR_MAP } from '../../data/summoning';
import { FarmingView } from '../science/FarmingView';
import { ActionCard } from './ActionCard';
import { BuildingsPanel } from './BuildingsPanel';

/** Meisterschafts-Pool: average mastery of the skill's actions unlocks skill-wide bonuses. */
function MasteryPool({ skillId }: { skillId: string }) {
  const fill = useGame((s) => Math.floor(masteryPool(s.game, skillId) * 1000) / 1000);
  if (!hasMasteryPool(skillId)) return null;
  const next = POOL_TIERS.find((tier) => fill < tier.at);
  return (
    <details className="mastery-pool">
      <summary>
        <span>
          🏅 Meisterschafts-Pool <b>{(fill * 100).toFixed(1)} %</b>
        </span>
        <small className="muted">
          {next ? `bei ${next.at * 100} %: ${next.label}` : 'alle Boni aktiv'}
        </small>
      </summary>
      <div className="pool-bar">
        <ProgressBar fraction={fill} color="var(--gold)" height={6} />
        {POOL_TIERS.map((tier) => (
          <i
            key={tier.at}
            style={{ left: `${tier.at * 100}%` }}
            className={fill >= tier.at ? 'on' : ''}
          />
        ))}
      </div>
      <ul>
        {POOL_TIERS.map((tier) => (
          <li key={tier.at} className={fill >= tier.at ? 'on' : ''}>
            {fill >= tier.at ? '✔' : '○'} {tier.at * 100} % – {tier.label}
          </li>
        ))}
      </ul>
      <small className="muted">
        Jede Aktion sammelt eigene Meisterschaft (🏅 auf der Karte). Der Pool ist ihr Durchschnitt –
        bleibt auch nach der Wiedergeburt.
      </small>
    </details>
  );
}

/** Glaube: what the current level already gives across the game. */
function FaithFact() {
  const b = useGame((s) => {
    const f = faithBonus(s.game);
    return `${(f.defence * 100).toFixed(1)}|${(f.riftHp * 100).toFixed(1)}|${(f.villageDefense * 100).toFixed(1)}`;
  });
  const [def, hp, village] = b.split('|');
  return (
    <span className="fact">
      🙏 Segen: +{def} % Verteidigung · +{hp} % Riss-LP · +{village} % Dorfabwehr
    </span>
  );
}

/** Beschwörung: who is at your side right now. */
function FamiliarFact() {
  const fam = useGame((s) =>
    s.game.familiar ? `${s.game.familiar.id}:${Math.ceil(s.game.familiar.remaining)}` : '',
  );
  const dismiss = useGame((s) => s.combatAct);
  const [id = '', secs = '0'] = fam.split(':');
  const f = FAMILIAR_MAP.get(id);
  if (!f)
    return (
      <span className="fact">
        🐾 Kein Vertrauter – fertige einen Beutel und öffne ihn im Inventar.
      </span>
    );
  return (
    <span className="fact">
      🐾 {f.icon} {f.name} · noch {formatDuration(Number(secs))}
      {f.strike ? ` · Zusatztreffer bis ${f.strike}` : ''}{' '}
      <button className="btn small btn-ghost" onClick={() => dismiss((s) => dismissFamiliar(s))}>
        Entlassen
      </button>
    </span>
  );
}

function groupByCategory(actions: ActionDef[]): [string, ActionDef[]][] {
  const groups = new Map<string, ActionDef[]>();
  for (const a of actions) {
    const key = a.category ?? '';
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.entries()];
}

export function SkillView({ skillId, onBack }: { skillId: string; onBack?: () => void }) {
  if (skillId === 'slayer') return <SlayerView onBack={onBack} />;
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
  // Recipe jump: scroll to the requested action card and let it flash once.
  const focus = useGame((s) => s.ui.focusAction);
  const setUi = useGame((s) => s.setUi);
  useEffect(() => {
    if (!focus) return;
    const id = window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-action="${focus}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el.classList.add('flash');
        window.setTimeout(() => el.classList.remove('flash'), 1800);
      }
      setUi({ focusAction: null });
    });
    return () => window.cancelAnimationFrame(id);
  }, [focus, skillId, setUi]);

  return (
    <div className="skill-view">
      <div className="skill-sticky">
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
      </div>
      <p className="skill-desc">{skill.desc}</p>
      {skillId === 'farming' && <FarmingView />}
      <div className="skill-facts" hidden={skillId === 'farming'}>
        {tool && (
          <span className="fact">
            {t('skills.tool', { name: `${tool.icon} ${tool.name}`, speed: tool.speed })}
          </span>
        )}
        {skillId === 'faith' && <FaithFact />}
        {skillId === 'summoning' && <FamiliarFact />}
        <span className="fact">
          {next
            ? t('action.nextUnlock', { name: next.name, level: next.levelReq })
            : t('action.allUnlocked')}
        </span>
      </div>
      {skillId === 'construction' && <BuildingsPanel />}
      <MasteryPool skillId={skillId} />
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
