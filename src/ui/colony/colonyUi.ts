import { PERSONAS, RESOURCE_INFO, type Cost, type Resource } from '../../data/colony';

export const YOU = { name: 'Du', icon: '🧑‍🚀', color: '#5ef2ff' };

export function persona(id: string): { name: string; icon: string; color: string } {
  return id === 'you' ? YOU : (PERSONAS.find((p) => p.id === id) ?? YOU);
}

export function playerColor(id: string): string {
  return persona(id).color;
}

/** "1 🪵 1 🧱" */
export function costText(cost: Cost): string {
  return (Object.entries(cost) as [Resource, number][])
    .filter(([, n]) => n > 0)
    .map(([r, n]) => `${n}${RESOURCE_INFO[r].icon}`)
    .join(' ');
}

export function quipFor(id: string, roll: number): string {
  const quips = PERSONAS.find((p) => p.id === id)?.quips ?? [];
  return quips[roll % Math.max(1, quips.length)] ?? '…';
}
