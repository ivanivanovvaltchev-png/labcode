const STORAGE_KEY = 'labcode_theory_context';

// ─── Data model ───────────────────────────────────────────────────────────────

export interface TheoryContext {
    fileName: string;
    rawText: string;        // full extracted text from the PDF
    charCount: number;
    extractedAt: number;    // Unix ms timestamp
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export function saveTheoryContext(ctx: TheoryContext): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

export function loadTheoryContext(): TheoryContext | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as TheoryContext) : null;
    } catch { return null; }
}

export function clearTheoryContext(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────

/**
 * Returns a trimmed slice of the theory text suitable for injecting into a
 * DeepSeek system prompt. Keeps the most informative content within a safe
 * character budget (default 3000 chars ≈ ~750 tokens).
 */
export function getContextForPrompt(maxChars = 3000): string | null {
    const ctx = loadTheoryContext();
    if (!ctx) return null;
    const text = ctx.rawText.slice(0, maxChars);
    // If truncated, end at the last complete sentence
    if (ctx.rawText.length > maxChars) {
        const lastDot = Math.max(text.lastIndexOf('.'), text.lastIndexOf('\n'));
        return lastDot > maxChars * 0.6 ? text.slice(0, lastDot + 1) : text;
    }
    return text;
}

/**
 * Returns true if a valid theory context has been loaded from a PDF.
 * Used by the UI to show/hide the "material loaded" badge.
 */
export function hasTheoryContext(): boolean {
    return loadTheoryContext() !== null;
}
