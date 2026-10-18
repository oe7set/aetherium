import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  deserialize,
  exportSave,
  importSave,
  migrate,
  SAVE_VERSION,
  SaveError,
  serialize,
  type Migration,
} from '../src/engine';
import { gameWith } from './helpers';

describe('Speichern & Laden', () => {
  it('Roundtrip erhält den Spielstand inkl. großer Zahlen', () => {
    const s = gameWith({
      gold: new Decimal('1e500'),
      inventory: { log_oak: 12, coal: 3 },
      active: { actionId: 'wc_oak', progress: 1.5 },
      fire: 42,
      intelligence: 3,
      stats: { treesFelled: 99 },
    });
    s.skills.woodcutting = { xp: 12345 };
    const json = JSON.parse(JSON.stringify(serialize(s, 1000)));
    const loaded = deserialize(json, 2000);
    expect(loaded.gold.eq('1e500')).toBe(true);
    expect(loaded.inventory).toEqual({ log_oak: 12, coal: 3 });
    expect(loaded.active).toEqual({ actionId: 'wc_oak', progress: 1.5 });
    expect(loaded.skills.woodcutting?.xp).toBe(12345);
    expect(loaded.fire).toBe(42);
    expect(loaded.stats.treesFelled).toBe(99);
  });

  it('Export/Import als Base64 mit Umlauten', () => {
    const s = gameWith({ gold: new Decimal(77) });
    s.stats['größter Baum'] = 1;
    const code = exportSave(s);
    expect(code.startsWith('AETH1:')).toBe(true);
    const back = importSave(code);
    expect(back.gold.eq(77)).toBe(true);
    expect(back.stats['größter Baum']).toBe(1);
  });

  it('lehnt Müll beim Import ab', () => {
    expect(() => importSave('hallo welt')).toThrow(SaveError);
    expect(() => deserialize({ foo: 1 })).toThrow(SaveError);
  });

  it('entfernt Referenzen auf nicht mehr existierende Inhalte', () => {
    const env = serialize(gameWith({ inventory: { log_oak: 1, removed_item: 5 } }));
    env.data.active = { actionId: 'gibt_es_nicht', progress: 1 };
    const loaded = deserialize(env);
    expect(loaded.inventory).toEqual({ log_oak: 1 });
    expect(loaded.active).toBeNull();
  });

  it('ergänzt fehlende Felder mit Standardwerten', () => {
    const loaded = deserialize({ v: SAVE_VERSION, savedAt: 0, data: { gold: '5' } });
    expect(loaded.gold.eq(5)).toBe(true);
    expect(loaded.inventorySlots).toBe(20);
    expect(loaded.equippedTools.woodcutting).toBe('axe_stone');
    expect(loaded.settings.numberFormat).toBe('short');
  });
});

describe('Migrationen', () => {
  it('migriert Version-0-Spielstände', () => {
    const loaded = deserialize({
      v: 0,
      savedAt: 0,
      data: { gold: 250, skills: { mining: { xp: 100 } } },
    });
    expect(loaded.gold.eq(250)).toBe(true);
    expect(loaded.inventorySlots).toBe(20);
    expect(loaded.skills.mining?.xp).toBe(100);
  });

  it('wendet eine Migrationskette in Reihenfolge an', () => {
    const chain: Record<number, Migration> = {
      0: (d) => ({ ...d, a: 1 }),
      1: (d) => ({ ...d, b: (d.a as number) + 1 }),
      2: (d) => ({ ...d, c: (d.b as number) * 10 }),
    };
    expect(migrate({}, 0, chain, 3)).toEqual({ a: 1, b: 2, c: 20 });
    expect(migrate({ a: 5 }, 1, chain, 3)).toEqual({ a: 5, b: 6, c: 60 });
  });

  it('wirft bei fehlender Migration oder zu neuem Spielstand', () => {
    expect(() => migrate({}, 0, {}, 1)).toThrow(SaveError);
    expect(() => migrate({}, SAVE_VERSION + 1)).toThrow(SaveError);
  });
});
