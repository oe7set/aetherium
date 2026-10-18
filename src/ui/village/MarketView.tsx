import { useState } from 'react';
import { getItem } from '../../data';
import {
  HARBOR_GOLD_PER_100,
  HARBOR_IMPORTS,
  V_RES_INFO,
  V_RESOURCES,
  type VRes,
} from '../../data/village';
import {
  busyMerchants,
  buildingLevel,
  harborExport,
  harborImport,
  harborRate,
  harborSource,
  itemCount,
  marketTrade,
  MERCHANT_CARRY,
  merchants,
  sendResources,
  type Village,
} from '../../engine';
import { EmptyState } from '../EmptyState';
import { useGame } from '../../store/gameStore';
import { short } from './vui';

export function MarketView({ village: v }: { village: Village }) {
  // Island stock matters for the harbor: re-render when it changes.
  useGame((s) =>
    HARBOR_IMPORTS.map((h) => h.items.map((i) => itemCount(s.game, i)).join()).join('|'),
  );
  const game = useGame.getState().game;
  const market = buildingLevel(v, 'market');
  const harbor = buildingLevel(v, 'harbor');
  return (
    <div className="v-market">
      {market > 0 ? (
        <NpcTrade village={v} />
      ) : (
        <EmptyState
          icon="⚖️"
          title="Noch kein Marktplatz"
          actions={[
            {
              label: '🏘️ Zum Dorfzentrum',
              primary: true,
              onClick: () => useGame.getState().setUi({ villageSegment: 'center' }),
            },
          ]}
        >
          Voraussetzung: Hauptgebäude 3, Lager 1, Kornspeicher 1. Tausche Rohstoffe und öffne den
          Hafen zur Insel.
        </EmptyState>
      )}
      {market > 0 && game.village.villages.length > 1 && <SendResources village={v} />}
      {harbor > 0 ? (
        <Harbor village={v} />
      ) : (
        <EmptyState icon="⚓" title="Inselhafen (ab Marktplatz 1)">
          Verbindet Dorf und Insel: Holz, Erz und Getreide von der Insel werden zu Dorf-Rohstoffen –
          und Rohstoffe zu Gold.
        </EmptyState>
      )}
    </div>
  );
}

function ResPicker({
  value,
  onChange,
  label,
}: {
  value: VRes;
  onChange: (r: VRes) => void;
  label: string;
}) {
  return (
    <div className="trade-row">
      <span className="muted small">{label}</span>
      {V_RESOURCES.map((r) => (
        <button
          key={r}
          className={`chip ${value === r ? 'active' : ''}`}
          onClick={() => onChange(r)}
        >
          {V_RES_INFO[r].icon}
        </button>
      ))}
    </div>
  );
}

function NpcTrade({ village: v }: { village: Village }) {
  const act = useGame((s) => s.village);
  const [give, setGive] = useState<VRes>('crop');
  const [want, setWant] = useState<VRes>('iron');
  const [amount, setAmount] = useState(500);
  const n = Math.min(amount, Math.floor(v.res[give]));
  return (
    <section className="glass v-box">
      <h4>🧑‍💼 NPC-Händler</h4>
      <p className="small muted">
        Tauscht 1:1 – gegen eine kleine Gebühr in Inselgold (1 Gold pro 10 Rohstoffe).
      </p>
      <ResPicker value={give} onChange={setGive} label="Gib" />
      <ResPicker value={want} onChange={setWant} label="Nimm" />
      <div className="trade-row">
        <input
          type="range"
          min={0}
          max={Math.max(0, Math.floor(v.res[give]))}
          step={10}
          value={n}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <b>{n}</b>
      </div>
      <button
        className="btn btn-primary"
        disabled={give === want || n <= 0}
        onClick={() => act((s) => marketTrade(s, v.id, give, want, n))}
      >
        {n} {V_RES_INFO[give].icon} → {n} {V_RES_INFO[want].icon} ({Math.ceil(n / 10)} 🪙)
      </button>
    </section>
  );
}

function SendResources({ village: v }: { village: Village }) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const others = game.village.villages.filter((x) => x.id !== v.id);
  const [to, setTo] = useState(others[0]?.id ?? 0);
  const [res, setRes] = useState<Record<VRes, number>>({ wood: 0, clay: 0, iron: 0, crop: 0 });
  const free = merchants(v) - busyMerchants(game, v);
  const total = V_RESOURCES.reduce((a, r) => a + res[r], 0);
  return (
    <section className="glass v-box">
      <h4>🐫 Rohstoffe verschicken</h4>
      <p className="small muted">
        {free}/{merchants(v)} Händler frei · je {MERCHANT_CARRY} Rohstoffe
      </p>
      <div className="trade-row">
        {others.map((o) => (
          <button
            key={o.id}
            className={`chip ${to === o.id ? 'active' : ''}`}
            onClick={() => setTo(o.id)}
          >
            🏡 {o.name}
          </button>
        ))}
      </div>
      {V_RESOURCES.map((r) => (
        <label key={r} className="v-raid-row">
          <span>{V_RES_INFO[r].icon}</span>
          <input
            type="range"
            min={0}
            max={Math.floor(v.res[r])}
            step={50}
            value={Math.min(res[r], Math.floor(v.res[r]))}
            onChange={(e) => setRes({ ...res, [r]: Number(e.target.value) })}
          />
          <b>{res[r]}</b>
        </label>
      ))}
      <button
        className="btn btn-primary"
        disabled={total <= 0 || Math.ceil(total / MERCHANT_CARRY) > free}
        onClick={() => act((s) => sendResources(s, v.id, to, res))}
      >
        Händler losschicken ({Math.ceil(total / MERCHANT_CARRY)})
      </button>
    </section>
  );
}

function Harbor({ village: v }: { village: Village }) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const rate = harborRate(v);
  return (
    <section className="glass v-box">
      <h4>⚓ Inselhafen</h4>
      <p className="small muted">
        Waren von der Heimatinsel werden zu Rohstoffen; überschüssige Rohstoffe werden zu Gold. Kurs
        ×{rate.toFixed(1)}
      </p>
      {HARBOR_IMPORTS.map((h) => {
        const source = harborSource(game, h.res);
        const have = source ? itemCount(game, source) : 0;
        return (
          <div key={h.res} className="v-harbor-row">
            <span className="v-harbor-res">{V_RES_INFO[h.res].icon}</span>
            <span className="small">
              {source ? (
                <>
                  {getItem(source).icon} {getItem(source).name} ({short(have)}) →{' '}
                  {Math.round(h.per * rate)} je Stück
                </>
              ) : (
                <span className="muted">
                  {h.items.map((i) => getItem(i).icon).join(' ')} – nichts im Inventar
                </span>
              )}
            </span>
            <span className="row gap">
              <button
                className="btn small"
                disabled={!source}
                onClick={() => act((s) => harborImport(s, v.id, h.res, 10))}
              >
                ⬅ 10
              </button>
              <button
                className="btn small"
                disabled={!source}
                onClick={() => act((s) => harborImport(s, v.id, h.res, have))}
              >
                ⬅ alle
              </button>
              <button
                className="btn small"
                disabled={v.res[h.res] < 100}
                onClick={() => act((s, emit) => harborExport(s, v.id, h.res, 1000, emit))}
              >
                ➡ 1000 = {Math.round(10 * HARBOR_GOLD_PER_100 * rate)} 🪙
              </button>
            </span>
          </div>
        );
      })}
    </section>
  );
}
