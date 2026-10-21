import { describe, expect, it } from 'vitest';
import { actionsForSkill } from '../src/data';
import { heroTurn, islandTurn, noop, villageTurn } from './bot';
import * as e from '../src/engine';
import { gameWith } from './helpers';

/**
 * Long-term bot: plays island, village and hero together for three simulated days, like a
 * player who checks in regularly. Prints a day-by-day table (docs/BALANCING.md) and checks
 * that every loop keeps moving.
 */
describe('Langzeit-Bot: Insel + Dorf + Held, 3 Tage', () => {
  it('alle Schleifen kommen voran, nichts bleibt hängen', () => {
    const s = gameWith();
    s.village.protection = 0;
    const rng = e.createRng(42);
    const rows: Record<string, string | number>[] = [];
    const STEP = 300;
    for (let t = 0; t < 3 * 24 * 3600; t += STEP) {
      const hour = t / 3600;
      if (t % 1800 === 0) {
        islandTurn(s, hour);
        villageTurn(s);
        heroTurn(s, rng);
        e.claimDaily(s, t * 1000 + Date.UTC(2026, 0, 5), rng, noop);
      }
      e.advance(s, STEP, rng, noop);
      if ((t + STEP) % (24 * 3600) === 0) {
        const v = e.activeVillage(s);
        rows.push({
          Tag: (t + STEP) / 86400,
          Gesamtlevel: e.totalLevel(s),
          Gold: Math.round(Number(s.gold.toString())),
          Einwohner: e.population(v),
          Hauptgebäude: e.buildingLevel(v, 'main'),
          'Held Stufe': s.hero.level,
          Abenteuer: s.stats.heroAdventures ?? 0,
          'Invasionen ✔/✘': `${s.village.invasionsWon}/${s.village.invasionsLost}`,
          Essenz: s.rift.essence,
        });
      }
    }
    console.table(rows);
    const last = rows[rows.length - 1]!;
    expect(Number(last.Gesamtlevel)).toBeGreaterThan(100);
    expect(Number(last.Einwohner)).toBeGreaterThan(80);
    expect(Number(last['Held Stufe'])).toBeGreaterThanOrEqual(15);
    expect(Number(last.Abenteuer)).toBeGreaterThan(20);
    // A small garrison plus hero and wall should hold most rift invasions.
    expect(s.village.invasionsWon).toBeGreaterThan(s.village.invasionsLost);
    // Every day brings visible progress in every loop.
    for (let i = 1; i < rows.length; i++) {
      expect(Number(rows[i]!.Gesamtlevel)).toBeGreaterThan(Number(rows[i - 1]!.Gesamtlevel));
      expect(Number(rows[i]!.Einwohner)).toBeGreaterThan(Number(rows[i - 1]!.Einwohner));
    }
  }, 120000);
});

describe('Langzeit-Bot: neue Skills, je 6 Stunden', () => {
  it('Diebeskunst, Juwelierkunst, Kartografie und Kopfgeldjagd kommen voran', () => {
    const rng = e.createRng(77);
    const s = gameWith();
    const rows: Record<string, { level: number; goldPerHour: number }> = {};
    const run = (skill: string, setup: () => void) => {
      const gold = s.gold.toNumber();
      setup();
      for (let hour = 0; hour < 6; hour++) {
        // Re-pick the best action every hour (levels rise), refill parchment if needed.
        // Surveying eats about one sheet every few seconds – buy an hour's worth.
        if (skill === 'cartography' && (s.inventory.parchment ?? 0) < 1200)
          e.buyItem(s, 'parchment', 1200);
        if (skill !== 'slayer') {
          const level = e.skillLevel(s, skill);
          const best = actionsForSkill(skill)
            .filter(
              (a) =>
                a.levelReq <= level && a.inputs.every((i) => (s.inventory[i.item] ?? 0) >= i.qty),
            )
            .pop();
          if (best && s.active?.actionId !== best.id) e.startAction(s, best.id, noop);
        } else {
          if (!s.slayer.task) e.newSlayerTask(s, rng, noop);
          const target = s.slayer.task?.monster;
          if (target && s.combat?.monster !== target) e.startCombat(s, 'monster', target, noop);
        }
        e.advance(s, 3600, rng, noop);
      }
      rows[skill] = {
        level: e.skillLevel(s, skill),
        goldPerHour: Math.round((s.gold.toNumber() - gold) / 6),
      };
    };
    run('thieving', () => {});
    run('jewelcrafting', () => {});
    s.gold = s.gold.add(100000);
    run('cartography', () => {
      s.inventory = {};
    });
    run('slayer', () => {
      s.inventory.cooked_shark = 2000;
      for (const sk of ['melee', 'defence', 'hitpoints']) s.skills[sk] = { xp: e.xpForLevel(30) };
      s.hp = 30;
      s.inventory.bronze_sword = 1;
      e.equipItem(s, 'bronze_sword');
    });
    // Bogenbau: buy hides and logs, the bot strings bows and shafts.
    run('fletching', () => {
      s.combat = null;
      s.inventory = {
        cowhide: 400,
        log_oak: 1500,
        log_willow: 1500,
        bar_bronze: 400,
        bar_iron: 400,
        feather: 4000,
      };
    });
    // Viehzucht: crops from the fields feed the animals.
    run('husbandry', () => {
      s.inventory = { wheat: 3000, potato: 1500, herb_mint: 800, apple: 1500 };
      s.buildings = { ...s.buildings, barn: 1 };
    });
    // Masterplan 5.0: sailing with bread, stargazing, agility laps, junk for invention.
    run('sailing', () => {
      s.inventory = { bread: 2000 };
    });
    run('astronomy', () => {
      s.inventory = {};
    });
    run('agility', () => {
      s.inventory = { cooked_shark: 500 };
      s.hp = 99;
    });
    run('invention', () => {
      s.inventory = { old_boot: 3000, burnt_food: 3000, pottery_shard: 3000, nails: 6000 };
    });
    console.table(rows);
    expect(rows.sailing!.level).toBeGreaterThan(20);
    expect(rows.astronomy!.level).toBeGreaterThan(25);
    expect(rows.agility!.level).toBeGreaterThan(25);
    expect(rows.invention!.level).toBeGreaterThan(15);
    expect(rows.fletching!.level).toBeGreaterThan(25);
    expect(rows.husbandry!.level).toBeGreaterThan(25);
    expect(rows.thieving!.level).toBeGreaterThan(20);
    expect(rows.thieving!.goldPerHour).toBeGreaterThan(0);
    expect(rows.jewelcrafting!.level).toBeGreaterThan(15);
    expect(rows.cartography!.level).toBeGreaterThan(40);
    expect(s.slayer.done).toBeGreaterThan(0);
  });
});
