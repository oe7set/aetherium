/**
 * Station labels are plain DOM elements over the canvas (cheaper and more robust than one
 * <Html> portal per label). The overlay registers its elements here; the scene projects
 * the 3D anchor points every frame and moves them.
 */
export const labelElements = new Map<string, HTMLElement>();

export function registerLabel(key: string, el: HTMLElement | null): void {
  if (el) labelElements.set(key, el);
  else labelElements.delete(key);
}
