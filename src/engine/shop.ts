import Decimal, { type DecimalSource } from 'break_eternity.js';
import { getTool, SHOP_OFFERS } from '../data';
import { applySale, saleRevenue } from './market';
import { BALANCE } from '../data/balance';
import type { Emit } from './events';
import { addItem, itemCount, removeItem } from './inventory';
import { skillLevel } from './skills';
import { addStat, type GameState } from './state';

export type ShopFailure =
  'gold' | 'level' | 'owned' | 'space' | 'maxSlots' | 'notEnough' | 'unknown';
export type ShopResult = { ok: true } | { ok: false; reason: ShopFailure };

const fail = (reason: ShopFailure): ShopResult => ({ ok: false, reason });
const OK: ShopResult = { ok: true };

function spend(s: GameState, price: DecimalSource): boolean {
  if (s.gold.lt(price)) return false;
  s.gold = s.gold.sub(price);
  addStat(s, 'goldSpent', new Decimal(price).toNumber());
  return true;
}

export function earnGold(s: GameState, amount: DecimalSource, emit: Emit): void {
  const d = new Decimal(amount);
  if (d.lte(0)) return;
  s.gold = s.gold.add(d);
  addStat(s, 'goldEarned', d.toNumber());
  emit({ type: 'gold', amount: d.toNumber() });
}

// --- Inventory slots ---------------------------------------------------------

export function slotPrice(s: GameState): Decimal {
  const bought = s.inventorySlots - BALANCE.START_INVENTORY_SLOTS;
  return new Decimal(BALANCE.SLOT_PRICE_GROWTH).pow(bought).mul(BALANCE.SLOT_BASE_PRICE).floor();
}

export function buySlot(s: GameState): ShopResult {
  if (s.inventorySlots >= BALANCE.MAX_INVENTORY_SLOTS) return fail('maxSlots');
  if (!spend(s, slotPrice(s))) return fail('gold');
  s.inventorySlots += 1;
  return OK;
}

// --- Tools ---------------------------------------------------------------------

export function canEquip(s: GameState, toolId: string): boolean {
  const tool = getTool(toolId);
  return s.ownedTools.includes(toolId) && skillLevel(s, tool.skill) >= tool.levelReq;
}

export function equipTool(s: GameState, toolId: string): ShopResult {
  if (!s.ownedTools.includes(toolId)) return fail('unknown');
  if (!canEquip(s, toolId)) return fail('level');
  s.equippedTools[getTool(toolId).skill] = toolId;
  return OK;
}

export function buyTool(s: GameState, toolId: string): ShopResult {
  const tool = getTool(toolId);
  if (s.ownedTools.includes(toolId)) return fail('owned');
  if (skillLevel(s, tool.skill) < tool.levelReq) return fail('level');
  if (!spend(s, tool.price)) return fail('gold');
  s.ownedTools.push(toolId);
  const current = s.equippedTools[tool.skill];
  if (!current || getTool(current).tier < tool.tier) s.equippedTools[tool.skill] = toolId;
  addStat(s, 'toolsBought');
  return OK;
}

// --- Items ---------------------------------------------------------------------

export function shopPrice(item: string): number | undefined {
  return SHOP_OFFERS.find((o) => o.item === item)?.price;
}

export function buyItem(s: GameState, item: string, qty: number): ShopResult {
  const price = shopPrice(item);
  if (price === undefined || qty <= 0) return fail('unknown');
  if (itemCount(s, item) <= 0 && s.inventorySlots - Object.keys(s.inventory).length <= 0) {
    return fail('space');
  }
  if (!spend(s, price * qty)) return fail('gold');
  addItem(s, item, qty);
  addStat(s, 'itemsBought', qty);
  return OK;
}

export function sellItem(s: GameState, item: string, qty: number, emit: Emit): ShopResult {
  const amount = Math.min(qty, itemCount(s, item));
  if (amount <= 0) return fail('notEnough');
  const { revenue, newMult } = saleRevenue(s, item, amount);
  removeItem(s, item, amount);
  applySale(s, item, newMult);
  earnGold(s, revenue, emit);
  addStat(s, 'itemsSold', amount);
  return OK;
}
