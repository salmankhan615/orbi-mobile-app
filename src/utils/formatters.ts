/** Capped per-item delay for staggering a FadeInView list entrance. */
export function staggerDelay(index: number, step = 40, max = 320): number {
  return Math.min(index * step, max);
}
