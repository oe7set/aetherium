import { V_RES_INFO, V_RESOURCES, type VCost } from '../../data/village';
import type { Village } from '../../engine';
import { short } from './vui';

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
