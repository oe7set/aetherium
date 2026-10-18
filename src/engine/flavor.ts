import { pick, type Rng } from './rng';

export type FlavorParams = Record<string, string | number>;

export function fillFlavor(template: string, params: FlavorParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

export function flavor(rng: Rng, pool: readonly string[], params: FlavorParams = {}): string {
  return fillFlavor(pick(rng, pool), params);
}
