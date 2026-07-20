/**
 * Remembers which single Mejora block (if any) "Tu entrenamiento de hoy"
 * should focus on when generating the next daily plan — one selection per
 * career path. `null`/absent means "automático" (the default dynamic-slot
 * behavior across the whole registry, unchanged).
 */
const KEY_PREFIX = 'labcode_daily_focus_block_';

export function loadDailyFocusBlock(pathId: string): string | null {
    try {
        return localStorage.getItem(KEY_PREFIX + pathId);
    } catch {
        return null;
    }
}

export function saveDailyFocusBlock(pathId: string, blockId: string | null): void {
    try {
        if (blockId) {
            localStorage.setItem(KEY_PREFIX + pathId, blockId);
        } else {
            localStorage.removeItem(KEY_PREFIX + pathId);
        }
    } catch { /* ignore */ }
}
