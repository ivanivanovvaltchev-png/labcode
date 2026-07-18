const STORAGE_KEY = 'labcode_theory_context';

// ─── Data model ───────────────────────────────────────────────────────────────

export interface TheoryContext {
    fileName: string;
    rawText: string;
    charCount: number;
    extractedAt: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export function loadTheoryContexts(): TheoryContext[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        // Migrate from old single-object format
        if (Array.isArray(parsed)) return parsed as TheoryContext[];
        if (parsed && typeof parsed === 'object') return [parsed as TheoryContext];
        return [];
    } catch { return []; }
}

export function addTheoryContext(ctx: TheoryContext): void {
    const existing = loadTheoryContexts();
    // Replace if same file name, otherwise append
    const filtered = existing.filter(c => c.fileName !== ctx.fileName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, ctx]));
}

export function removeTheoryContext(fileName: string): void {
    const existing = loadTheoryContexts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter(c => c.fileName !== fileName)));
}

export function clearTheoryContext(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────

/**
 * Returns the combined theory text from all uploaded PDFs, trimmed to maxChars.
 * Each document is prefixed with its file name so the AI can distinguish sources.
 */
export function getContextForPrompt(maxChars = 8000): string | null {
    const contexts = loadTheoryContexts();
    if (contexts.length === 0) return null;
    const combined = contexts
        .map(c => `[${c.fileName}]\n${c.rawText}`)
        .join('\n\n---\n\n');
    if (combined.length <= maxChars) return combined;
    const trimmed = combined.slice(0, maxChars);
    const lastDot = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('\n'));
    return lastDot > maxChars * 0.6 ? trimmed.slice(0, lastDot + 1) : trimmed;
}

export function hasTheoryContext(): boolean {
    return loadTheoryContexts().length > 0;
}
