import { V_RESOURCES } from '../../data/village';
import type { GameState } from '../../engine';

/** 1:05:09 / 4:07 / 12 s */
export function duration(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  if (m > 0) return `${m}:${String(sec).padStart(2, '0')}`;
  return `${sec} s`;
}

export function short(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} Mio.`;
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  return String(Math.floor(n));
}

/**
 * Primitive signature of everything the village UI shows. Resources are floored, timers rounded
 * to seconds, so the panel re-renders about once per second instead of on every tick.
 */
export function villageKey(g: GameState): string {
  const vs = g.village;
  const parts: string[] = [
    String(vs.active),
    String(Math.floor(vs.cp)),
    String(vs.unread),
    String(vs.reports.length),
    vs.researched.join(),
    String(Math.ceil(vs.protection > 0 ? vs.protection : vs.invasionIn)),
    vs.targets.map((t) => `${Math.round(t.defense)}/${t.owner ?? ''}`).join(),
    vs.movements.map((m) => `${m.id}:${Math.ceil(m.remaining)}`).join(),
    g.gold.floor().toString(),
  ];
  for (const v of vs.villages) {
    parts.push(
      `${v.id}${v.name}|${V_RESOURCES.map((r) => Math.floor(v.res[r])).join()}|${v.fields.join('')}|${JSON.stringify(v.buildings)}|${JSON.stringify(v.troops)}`,
      `${v.queue.field.map((q) => `${q.key}:${q.level}:${Math.ceil(q.remaining)}`).join()}|${v.queue.center.map((q) => `${q.key}:${q.level}:${Math.ceil(q.remaining)}`).join()}`,
      `${v.training.map((t) => `${t.troop}${t.count}:${Math.ceil(t.each - t.progress)}`).join()}|${v.research ? Math.ceil(v.research.remaining) : ''}|${v.celebration ? Math.ceil(v.celebration.remaining) : ''}|${v.oases.join()}`,
    );
  }
  return parts.join('§');
}
