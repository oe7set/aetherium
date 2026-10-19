import { getItem, getSkill, SKILL_MAP } from '../../data';
import { describeMods } from '../modText';

/** Shows gear stats and bonuses in words. */
export function EquipInfo({ itemId }: { itemId: string }) {
  const eq = getItem(itemId).equip;
  if (!eq) return null;
  const parts: string[] = [];
  if (eq.attack) parts.push(`⚔️ Angriff +${eq.attack}`);
  if (eq.strength) parts.push(`💪 Stärke +${eq.strength}`);
  if (eq.defence) parts.push(`🛡️ Verteidigung +${eq.defence}`);
  if (eq.speed) parts.push(`⏱️ ${eq.speed.toLocaleString('de-DE')} s`);
  if (eq.mods && Object.keys(eq.mods).length) parts.push(`✨ ${describeMods(eq.mods)}`);
  const req =
    eq.req && SKILL_MAP.has(eq.req.skill)
      ? `${getSkill(eq.req.skill).name} ${eq.req.level}`
      : eq.req
        ? `Lvl ${eq.req.level}`
        : null;
  return (
    <p className="equip-info">
      {parts.join(' · ')}
      {req && <small className="muted"> · benötigt {req}</small>}
    </p>
  );
}
