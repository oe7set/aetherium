import { getItem, getSkill, SKILL_MAP } from '../../data';

/** Shows gear stats. Equipping arrives with combat (Phase 4). */
export function EquipInfo({ itemId }: { itemId: string }) {
  const eq = getItem(itemId).equip;
  if (!eq) return null;
  const parts: string[] = [];
  if (eq.attack) parts.push(`⚔️ Angriff +${eq.attack}`);
  if (eq.strength) parts.push(`💪 Stärke +${eq.strength}`);
  if (eq.defence) parts.push(`🛡️ Verteidigung +${eq.defence}`);
  if (eq.speed) parts.push(`⏱️ ${eq.speed.toLocaleString('de-DE')} s`);
  for (const [k, v] of Object.entries(eq.mods ?? {}))
    parts.push(`${k} +${Math.round((v ?? 0) * 100)} %`);
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
