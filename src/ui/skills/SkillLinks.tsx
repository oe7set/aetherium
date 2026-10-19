import { getItem, getSkill } from '../../data';
import { useGame } from '../../store/gameStore';
import { skillLinks, type SkillLink } from '../recipes';

function LinkRow({ label, links }: { label: string; links: SkillLink[] }) {
  const open = useGame((s) => s.openSkill);
  if (!links.length) return null;
  return (
    <div className="skill-links-row">
      <small className="muted">{label}</small>
      <div className="skill-links-chips">
        {links.map((l) => {
          const sk = getSkill(l.skill);
          return (
            <button
              key={l.skill}
              className="chip"
              title={l.items.map((i) => getItem(i).name).join(', ')}
              onClick={() => open(l.skill)}
            >
              {sk.icon} {sk.name}{' '}
              <span className="muted">{l.items.map((i) => getItem(i).icon).join('')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** „Braucht von … / Liefert an …": how this skill hangs together with the rest of the island. */
export function SkillLinks({ skillId }: { skillId: string }) {
  const { from, to } = skillLinks(skillId);
  if (!from.length && !to.length) return null;
  return (
    <details className="skill-links glass">
      <summary>🔗 Verbindungen</summary>
      <LinkRow label="Braucht von" links={from} />
      <LinkRow label="Liefert an" links={to} />
    </details>
  );
}
