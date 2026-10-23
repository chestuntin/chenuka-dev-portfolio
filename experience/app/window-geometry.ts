export type Bounds = { x: number; y: number; w: number; h: number };
export type Edge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export const edges: Edge[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export function fitWindow(b: Bounds, width: number, height: number): Bounds {
  const w = Math.min(b.w, width),
    h = Math.min(b.h, height);
  return { w, h, x: clamp(b.x, 0, width - w), y: clamp(b.y, 0, height - h) };
}
export function resizeWindow(
  b: Bounds,
  edge: Edge,
  dx: number,
  dy: number,
  width: number,
  height: number,
): Bounds {
  let left = b.x,
    top = b.y,
    right = b.x + b.w,
    bottom = b.y + b.h;
  const minW = Math.min(340, b.w, width),
    minH = Math.min(260, b.h, height);
  if (edge.includes('w')) left = clamp(left + dx, 0, right - minW);
  if (edge.includes('e')) right = clamp(right + dx, left + minW, width);
  if (edge.includes('n')) top = clamp(top + dy, 0, bottom - minH);
  if (edge.includes('s')) bottom = clamp(bottom + dy, top + minH, height);
  return { x: left, y: top, w: right - left, h: bottom - top };
}
