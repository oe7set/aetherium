import { getItem } from '../../data';
import { SUPPLY_CAP_HOURS } from '../../data/villageGoods';
import { bestBuilding, collectVillageSupply, supplyRates, V_BUILDING_MAP } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ItemIcon } from '../ItemIcon';

/** What the village does for the island: boni of its workshops and the goods they send over. */
const ISLAND_BONI: { building: string; text: (lvl: number) => string }[] = [
  { building: 'sawmill', text: (l) => `+${l} % Tempo Holzfällen` },
  { building: 'brickyard', text: (l) => `+${l} % Tempo Bergbau` },
  { building: 'foundry', text: (l) => `+${l} % Tempo Schmieden` },
  { building: 'mill', text: (l) => `+${l} % Tempo Landwirtschaft` },
  { building: 'bakery', text: (l) => `+${2 * l} % Koch-XP` },
  { building: 'library', text: (l) => `+${2 * l} % Forschung` },
  { building: 'smithy', text: (l) => `+${(0.5 * l).toFixed(1)} % Kampfschaden` },
  { building: 'wall', text: (l) => `+${(0.5 * l).toFixed(1)} % Verteidigung` },
];

export function VillageSupply() {
  // Re-render when the store fills by a whole unit.
  const key = useGame((s) =>
    Object.entries(s.game.villageSupply)
      .map(([k, n]) => `${k}${Math.floor(n)}`)
      .join(),
  );
  const act = useGame((s) => s.combatAct);
  const { int } = useFmt();
  const game = useGame.getState().game;
  const rates = supplyRates(game);
  const items = Object.keys(rates);
  const boni = ISLAND_BONI.filter((b) => bestBuilding(game, b.building) > 0);
  const ready = items.some((i) => (game.villageSupply[i] ?? 0) >= 1);
  return (
    <div className="v-supply glass" data-key={key}>
      <h4 className="group-title">🚚 Dorf → Insel</h4>
      {items.length === 0 ? (
        <p className="small muted">
          Mühle, Bäckerei, Schmiede, Sägewerk, Ziegelei und Eisengießerei schicken Waren auf die
          Insel (Mehl, Brot, Nägel, Bretter, Steinblöcke, Eisenbarren).
        </p>
      ) : (
        <>
          <ul className="v-supply-list">
            {items.map((i) => (
              <li key={i}>
                <ItemIcon id={i} /> {getItem(i).name}:{' '}
                <strong>{int(Math.floor(game.villageSupply[i] ?? 0))}</strong>{' '}
                <small className="muted">
                  (+{rates[i]!.toFixed(1)}/h, max {int(rates[i]! * SUPPLY_CAP_HOURS)})
                </small>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-primary"
            disabled={!ready}
            onClick={() => act((s, emit) => void collectVillageSupply(s, emit))}
          >
            📦 Lieferung ins Insel-Inventar holen
          </button>
        </>
      )}
      {boni.length > 0 && (
        <p className="small">
          <strong>Insel-Boni aus dem Dorf:</strong>{' '}
          {boni
            .map(
              (b) =>
                `${V_BUILDING_MAP.get(b.building)?.icon} ${b.text(bestBuilding(game, b.building))}`,
            )
            .join(' · ')}
        </p>
      )}
      <small className="muted">
        Hohe Gebäudestufen (ab der Hälfte, drei Viertel und Höchststufe) brauchen zusätzlich Waren
        von der Insel – Bretter, Steinblöcke, Barren, Möbel, Pergament.
      </small>
    </div>
  );
}
