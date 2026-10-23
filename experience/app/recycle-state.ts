export const shortcutIds = [
  'portfolio',
  'welcome',
  'browser',
  'spotify',
  'pinball',
  'gta',
] as const;
export type ShortcutId = (typeof shortcutIds)[number];
export type RecycleState = { trashed: ShortcutId[]; removed: ShortcutId[] };
export const emptyRecycle: RecycleState = { trashed: [], removed: [] };
const valid = (x: unknown): x is ShortcutId =>
  shortcutIds.includes(x as ShortcutId);
export function parseRecycle(value: string | null): RecycleState {
  try {
    const s = JSON.parse(value || 'null');
    if (!s) return emptyRecycle;
    const removed: ShortcutId[] = [
      ...new Set<ShortcutId>(
        Array.isArray(s.removed) ? s.removed.filter(valid) : [],
      ),
    ];
    return {
      removed,
      trashed: [
        ...new Set<ShortcutId>(
          Array.isArray(s.trashed) ? s.trashed.filter(valid) : [],
        ),
      ].filter((id) => !removed.includes(id)),
    };
  } catch {
    return emptyRecycle;
  }
}
export function recycleAction(
  s: RecycleState,
  action: 'delete' | 'restore' | 'empty',
  id?: ShortcutId,
): RecycleState {
  if (action === 'empty')
    return { trashed: [], removed: [...new Set([...s.removed, ...s.trashed])] };
  if (!id) return s;
  if (action === 'restore')
    return {
      trashed: s.trashed.filter((x) => x !== id),
      removed: s.removed.filter((x) => x !== id),
    };
  if (s.trashed.includes(id) || s.removed.includes(id)) return s;
  return { ...s, trashed: [...s.trashed, id] };
}
