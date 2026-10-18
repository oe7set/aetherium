import { useState } from 'react';
import {
  CP_FOR_VILLAGE,
  MAX_VILLAGES,
  SETTLERS_PER_VILLAGE,
  VALLEYS,
  V_RES_INFO,
} from '../../data/village';
import {
  canFound,
  cpPerHour,
  distance,
  expansionSlots,
  foundVillage,
  population,
  renameVillage,
  totalPopulation,
  type Village,
} from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { duration, short } from './vui';

export function EmpireView({ village: v }: { village: Village }) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const vs = game.village;
  const owned = vs.villages.length + vs.movements.filter((m) => m.kind === 'settle').length;
  const needCp = CP_FOR_VILLAGE[owned];
  const pop = Math.max(0, totalPopulation(game) - 20);
  const [name, setName] = useState(v.name);
  return (
    <div className="v-empire">
      <section className="glass v-box">
        <h4>👑 Dein Reich</h4>
        <div className="v-villages">
          {vs.villages.map((x) => (
            <button
              key={x.id}
              className={`v-village-card ${x.id === v.id ? 'active' : ''}`}
              onClick={() =>
                act((s) => {
                  s.village.active = x.id;
                })
              }
            >
              <span className="v-village-icon">{x.capital ? '🏰' : '🏡'}</span>
              <strong>{x.name}</strong>
              <small>
                👥 {population(x)} · ({x.x}|{x.y}) · {VALLEYS[x.layout]?.name}
              </small>
            </button>
          ))}
        </div>
        <div className="trade-row">
          <input
            className="v-name-input"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            aria-label="Dorfname"
          />
          <button
            className="btn small"
            onClick={() => act((s) => void renameVillage(s, v.id, name))}
          >
            ✏️ Umbenennen
          </button>
        </div>
        <p className="small">
          Einwohner geben der Insel <b>+{(Math.min(0.25, pop * 0.0004) * 100).toFixed(1)} % XP</b>{' '}
          und <b>+{(Math.min(0.15, pop * 0.00025) * 100).toFixed(1)} % Gold</b>. Schmiede und Mauer
          stärken deinen Riss-Helden, Bonusgebäude die passenden Inselskills.
        </p>
      </section>

      <section className="glass v-box">
        <h4>🎭 Kulturpunkte & Expansion</h4>
        <p className="small">
          {short(vs.cp)} KP (+{short(cpPerHour(game))}/h) ·{' '}
          {owned >= MAX_VILLAGES
            ? 'Maximale Anzahl Dörfer erreicht.'
            : `nächstes Dorf ab ${short(needCp ?? 0)} KP`}
        </p>
        {needCp !== undefined && owned < MAX_VILLAGES && (
          <div className="v-queue-bar wide">
            <i style={{ width: `${Math.min(100, (vs.cp / needCp) * 100)}%` }} />
          </div>
        )}
        <p className="small muted">
          Expansionsplätze: {expansionSlots(game)} (Residenz Stufe 10/20) · Siedler im Dorf:{' '}
          {v.troops.settler ?? 0}/{SETTLERS_PER_VILLAGE} · Feste im Rathaus bringen viele KP.
        </p>
        <div className="v-sites">
          {vs.sites
            .slice()
            .sort((a, b) => distance(v.x, v.y, a.x, a.y) - distance(v.x, v.y, b.x, b.y))
            .map((site) => {
              const check = canFound(game, v, site.id);
              const layout = VALLEYS[site.layout]!;
              const counts = { wood: 0, clay: 0, iron: 0, crop: 0 };
              for (const r of layout.layout) counts[r]++;
              return (
                <div key={site.id} className="v-list-row">
                  <span>
                    🏞️ Tal {layout.name}{' '}
                    <small className="muted">
                      ({site.x}|{site.y}) · {distance(v.x, v.y, site.x, site.y).toFixed(1)} Felder
                    </small>
                  </span>
                  <small>
                    {(['wood', 'clay', 'iron', 'crop'] as const)
                      .map((r) => `${V_RES_INFO[r].icon}${counts[r]}`)
                      .join(' ')}
                  </small>
                  <button
                    className="btn small"
                    disabled={!check.ok}
                    onClick={() => act((s) => foundVillage(s, v.id, site.id))}
                  >
                    {check.ok ? '🧳 Siedeln' : t(`villageFail.${check.reason}` as MessageKey)}
                  </button>
                </div>
              );
            })}
        </div>
      </section>

      <section className="glass v-box">
        <h4>🌀 Riss-Invasionen</h4>
        <p className="small">
          {vs.protection > 0
            ? `Anfängerschutz noch ${duration(vs.protection)}.`
            : `Nächste Horde in ca. ${duration(vs.invasionIn)}. Sie greift dein größtes Dorf an.`}{' '}
          Mauer, Speerträger und Kampfmagier verteidigen, das Versteck schützt Rohstoffe. Abgewehrte
          Horden bringen Riss-Essenz und Äther.
        </p>
      </section>
    </div>
  );
}
