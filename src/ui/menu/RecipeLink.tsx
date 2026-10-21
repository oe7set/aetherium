import { getItem } from '../../data';
import { useGame } from '../../store/gameStore';
import { ItemIcon } from '../ItemIcon';
import { itemSource } from '../recipes';

/** An item name that jumps to the action making it (or the shop / combat). */
export function RecipeLink({ item }: { item: string }) {
  const jump = useGame((s) => s.jumpToAction);
  const setUi = useGame((s) => s.setUi);
  const src = itemSource(useGame.getState().game, item);
  return (
    <button
      className="item-pill link"
      onClick={() => {
        if (src?.kind === 'action') jump(src.action.id);
        else if (src?.kind === 'shop') setUi({ tab: 'inventory', inventorySegment: 'shop' });
        else if (src?.kind === 'combat')
          setUi({ tab: 'skills', selectedSkill: 'melee', skillDetail: true });
      }}
    >
      <ItemIcon id={item} /> {getItem(item).name}
    </button>
  );
}
