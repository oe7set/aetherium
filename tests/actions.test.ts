import { describe, expect, it } from 'vitest';
import { getAction } from '../src/data';
import { BALANCE } from '../src/data/balance';
import {
  actionDuration,
  bestAvailableAction,
  advance,
  burnChance,
  clickAction,
  collector,
  createRng,
  simulate,
  startAction,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const never = () => 0.999999; // never hits a drop/burn roll
const always = () => 0; // always hits

describe('Sammel-Aktionen', () => {
  it('Eiche fällen produziert Holz und XP pro Zyklus', () => {
    const s = gameWith();
    startAction(s, 'wc_oak', () => {});
    const events = simulate(s, 3 * 5 + 0.1, never);
    expect(s.inventory.log_oak).toBe(5);
    expect(s.skills.woodcutting?.xp).toBeCloseTo(50);
    expect(events.filter((e) => e.type === 'actionComplete')).toHaveLength(5);
    expect(s.stats.treesFelled).toBe(5);
  });

  it('meldet Level-Ups', () => {
    const s = gameWith();
    startAction(s, 'wc_oak', () => {});
    const events = simulate(s, 3 * 9, never); // 90 XP → Level 2
    expect(events.some((e) => e.type === 'levelUp' && e.level === 2)).toBe(true);
  });

  it('verhindert Aktionen ohne ausreichendes Level', () => {
    const s = gameWith();
    const res = startAction(s, 'wc_birch', () => {});
    expect(res.ok).toBe(false);
    expect(s.active).toBeNull();
  });

  it('bessere Werkzeuge und höheres Level machen Aktionen schneller', () => {
    const s = gameWith();
    const oak = getAction('wc_oak');
    const base = actionDuration(s, oak);
    s.equippedTools.woodcutting = 'axe_iron';
    const withTool = actionDuration(s, oak);
    setLevel(s, 'woodcutting', 50);
    const withLevel = actionDuration(s, oak);
    expect(withTool).toBeLessThan(base);
    expect(withLevel).toBeLessThan(withTool);
    expect(withLevel).toBeGreaterThanOrEqual(BALANCE.MIN_ACTION_TIME);
  });

  it('Klicks beschleunigen die Aktion', () => {
    const s = gameWith();
    startAction(s, 'wc_oak', () => {});
    const { emit, events } = collector();
    for (let i = 0; i < 9; i++) clickAction(s, never, emit);
    expect(events.filter((e) => e.type === 'actionComplete')).toHaveLength(1);
    expect(s.stats.clicks).toBe(9);
  });

  it('Zufallsdrops landen im Inventar und seltene werden gemeldet', () => {
    const s = gameWith();
    startAction(s, 'wc_oak', () => {});
    const events = simulate(s, 3, always);
    expect(s.inventory.newton_apple).toBe(1);
    expect(s.inventory.bird_nest).toBe(1);
    expect(events.some((e) => e.type === 'rareDrop' && e.item === 'newton_apple')).toBe(true);
  });
});

describe('Inventar', () => {
  it('stoppt bei vollem Inventar, wenn ein neuer Item-Typ anfällt', () => {
    const s = gameWith({ inventorySlots: 1, inventory: { ore_tin: 1 } });
    const res = startAction(s, 'wc_oak', () => {});
    expect(res).toEqual({ ok: false, reason: 'inventoryFull', missingItem: undefined });
    expect(s.active).toBeNull();
  });

  it('stoppt mitten im Lauf, wenn der letzte Platz belegt wird', () => {
    // Cooking needs a new slot for its output; it can start, but not after the slot is taken.
    const s = gameWith({ inventorySlots: 2, inventory: { apple: 2 }, fire: 100 });
    startAction(s, 'cook_baked_apple', () => {});
    s.inventory.ore_tin = 1; // the last free slot gets taken mid-run
    const events = simulate(s, 10, never);
    expect(s.active).toBeNull();
    expect(events.some((e) => e.type === 'actionStopped' && e.reason === 'inventoryFull')).toBe(
      true,
    );
  });

  it('stapelt bekannte Items auch bei vollem Inventar', () => {
    const s = gameWith({ inventorySlots: 1, inventory: { log_oak: 1 } });
    startAction(s, 'wc_oak', () => {});
    simulate(s, 6, never);
    expect(s.inventory.log_oak).toBe(3);
  });
});

describe('Feuermachen & Kochen', () => {
  it('Feuermachen verbraucht Holz, gibt Asche und füllt das Lagerfeuer', () => {
    const s = gameWith({ inventory: { log_oak: 3 } });
    startAction(s, 'fm_oak', () => {});
    const events = simulate(s, 2 * 3, never);
    expect(s.inventory.log_oak).toBeUndefined();
    expect(s.inventory.ash).toBe(3);
    expect(s.fire).toBeGreaterThan(170);
    expect(events.some((e) => e.type === 'fireLit')).toBe(true);
    // No more logs → stops with a reason.
    simulate(s, 1, never);
    expect(s.active).toBeNull();
  });

  it('Kochen braucht ein brennendes Feuer', () => {
    const s = gameWith({ inventory: { apple: 5 } });
    const res = startAction(s, 'cook_baked_apple', () => {});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('noFire');
  });

  it('Kochen stoppt, wenn das Feuer ausgeht', () => {
    const s = gameWith({ inventory: { apple: 100 }, fire: 6 });
    startAction(s, 'cook_baked_apple', () => {});
    const events = simulate(s, 60, never);
    expect(s.inventory.baked_apple).toBe(2);
    expect(s.fire).toBe(0);
    expect(events.some((e) => e.type === 'fireOut')).toBe(true);
    expect(events.some((e) => e.type === 'actionStopped' && e.reason === 'noFire')).toBe(true);
  });

  it('Anbrennen erzeugt verkohlte Masse und wenig XP', () => {
    const s = gameWith({ inventory: { apple: 1 }, fire: 100 });
    startAction(s, 'cook_baked_apple', () => {});
    const events = simulate(s, 3, always);
    expect(s.inventory.burnt_food).toBe(1);
    expect(s.inventory.baked_apple).toBeUndefined();
    expect(events.some((e) => e.type === 'burnt')).toBe(true);
    expect(s.skills.cooking?.xp).toBeLessThan(5);
  });

  it('Anbrenn-Chance sinkt mit dem Level bis 0', () => {
    const s = gameWith();
    const def = getAction('cook_baked_apple');
    const atReq = burnChance(s, def);
    setLevel(s, 'cooking', 10);
    const mid = burnChance(s, def);
    setLevel(s, 'cooking', 20);
    expect(atReq).toBeCloseTo(0.4);
    expect(mid).toBeLessThan(atReq);
    expect(burnChance(s, def)).toBe(0);
  });

  it('Lagerfeuer gibt XP-Bonus', () => {
    const cold = gameWith();
    const warm = gameWith({ fire: 1000 });
    startAction(cold, 'wc_oak', () => {});
    startAction(warm, 'wc_oak', () => {});
    simulate(cold, 3, never);
    simulate(warm, 3, never);
    expect(warm.skills.woodcutting!.xp).toBeCloseTo(cold.skills.woodcutting!.xp * 1.05);
  });
});

describe('Simulation', () => {
  it('ein großer Schritt entspricht vielen kleinen Ticks', () => {
    const a = gameWith({ inventory: { log_oak: 50 } });
    const b = gameWith({ inventory: { log_oak: 50 } });
    startAction(a, 'fm_oak', () => {});
    startAction(b, 'fm_oak', () => {});
    const rngA = createRng(42);
    const rngB = createRng(42);
    advance(a, 300, rngA, () => {});
    for (let i = 0; i < 3000; i++) advance(b, 0.1, rngB, () => {});
    expect(a.inventory).toEqual(b.inventory);
    expect(a.skills.firemaking!.xp).toBeCloseTo(b.skills.firemaking!.xp, 6);
    expect(a.fire).toBeCloseTo(b.fire, 6);
  });

  it('Feuer brennt auch ohne aktive Aktion ab', () => {
    const s = gameWith({ fire: 10 });
    simulate(s, 4, never);
    expect(s.fire).toBeCloseTo(6);
  });
});

describe('Welt-Stationen', () => {
  it('wählt die beste machbare Aktion eines Skills', () => {
    const s = gameWith({ inventory: { log_oak: 1, log_birch: 1 } });
    expect(bestAvailableAction(s, 'woodcutting')?.id).toBe('wc_oak');
    expect(bestAvailableAction(s, 'firemaking')?.id).toBe('fm_oak');
    setLevel(s, 'firemaking', 10);
    expect(bestAvailableAction(s, 'firemaking')?.id).toBe('fm_birch');
    expect(bestAvailableAction(s, 'cooking')).toBeUndefined();
  });
});
