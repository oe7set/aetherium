import { V_RES_INFO, V_RESOURCES, type VCost } from '../../data/village';
import { affordIn, type Village } from '../../engine';
import { useGame } from '../../store/gameStore';
import { duration, short } from './vui';

/** Cost line; missing resources are highlighted. */
export function CostView({
  cost,
  village,
  times = 1,
}: {
  cost: VCost;
  village?: Village;
  times?: number;
}) {
  return (
    <span className="v-cost">
      {V_RESOURCES.map((r) => {
        const need = cost[r] * times;
        if (need <= 0) return null;
        const lacking = village ? village.res[r] < need : false;
        return (
          <span key={r} className={lacking ? 'lacking' : ''}>
            {V_RES_INFO[r].icon} {short(need)}
          </span>
        );
      })}
    </span>
  );
}

/** "Affordable in …" from the village's own production – so waiting has a clear end. */
export function AffordHint({ cost, village }: { cost: VCost; village: Village }) {
  const secs = affordIn(useGame.getState().game, village, cost);
  if (secs <= 0) return null;
  return (
    <span className={`afford-hint ${secs === Infinity ? 'never' : ''}`}>
      {secs === Infinity
        ? '⚠️ Lager zu klein oder keine Produktion – Lager/Kornspeicher ausbauen'
        : `⏳ Genug Rohstoffe in ${duration(secs)}`}
    </span>
  );
}
