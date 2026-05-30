import { TEMAS_COMPLETADOS, NUMPY_VALIDADO } from '../ai/studentProfile';
import { loadMetrics, saveMetrics } from './learningMetrics';

const REGISTRY_KEY = 'labcode_concept_registry';

// ─── Thresholds ───────────────────────────────────────────────────────────────
// These define when a concept "graduates" between slots.
// Slot 1 (Review):    mastery ≥ 70% — consolidated, needs spaced repetition
// Slot 2 (Practice):  mastery 35–69% — in active learning, needs deliberate practice
// Slot 3 (Learn):     mastery < 35%  — new or just introduced (from PDF or just started)
const THRESHOLD_REVIEW = 70;
const THRESHOLD_PRACTICE = 35;

// ─── Data model ───────────────────────────────────────────────────────────────

export interface TrackedConcept {
    name: string;
    source: 'manual' | 'pdf' | 'practice';
    addedAt: number;
    initialMastery: number;
}

export interface ConceptRegistry {
    pathId: string;
    concepts: TrackedConcept[];
    updatedAt: number;
}

export interface DynamicSlots {
    slot1Review: string[];    // consolidated — spaced repetition
    slot2Practice: string[];  // in progress — deliberate practice
    slot3Learn: string[];     // new — introduction / guided learning
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export // Concept names that start with these prefixes are card-title artifacts, not real concepts.
// They get written when MentorPage incorrectly used the card title as the skillRef.
const BAD_PREFIXES = ['Repaso —', 'Práctica —', 'Aprender —', 'Básico —', 'Intermedio —', 'Avanzado —', 'Tarjeta'];

function isValidConceptName(name: string): boolean {
    return name.trim().length > 3 && !BAD_PREFIXES.some(p => name.startsWith(p));
}

function loadConceptRegistry(pathId: string): ConceptRegistry {
    try {
        const raw = localStorage.getItem(REGISTRY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as ConceptRegistry;
            if (parsed.pathId === pathId) {
                // Clean out corrupted entries on every load
                const before = parsed.concepts.length;
                parsed.concepts = parsed.concepts.filter(c => isValidConceptName(c.name));
                if (parsed.concepts.length !== before) saveConceptRegistry(parsed);
                return parsed;
            }
        }
    } catch { /* ignore */ }
    return { pathId, concepts: [], updatedAt: Date.now() };
}

export function saveConceptRegistry(registry: ConceptRegistry): void {
    registry.updatedAt = Date.now();
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Seeds the concept registry from the hardcoded student profile on first load.
 * TEMAS_COMPLETADOS → 75% mastery (review slot, spaced repetition)
 * NUMPY_VALIDADO    → 50% mastery (practice slot, actively reinforcing)
 * Safe to call repeatedly — idempotent.
 */
export function seedConceptRegistry(pathId: string): void {
    const registry = loadConceptRegistry(pathId);
    if (registry.concepts.length > 0) return;

    const now = Date.now();
    registry.concepts = [
        ...TEMAS_COMPLETADOS.map(name => ({
            name, source: 'manual' as const, addedAt: now, initialMastery: 75,
        })),
        ...NUMPY_VALIDADO.map(name => ({
            name, source: 'manual' as const, addedAt: now, initialMastery: 50,
        })),
    ];
    saveConceptRegistry(registry);

    // Seed learningMetrics mastery so existing tracking code also picks them up
    const metrics = loadMetrics(pathId);
    let changed = false;
    for (const c of registry.concepts) {
        if (!metrics.skillMastery[c.name]) {
            metrics.skillMastery[c.name] = {
                skillId: c.name,
                skillName: c.name,
                masteryPct: c.initialMastery,
                practiceCount: 0,
                lastPracticed: '',
            };
            changed = true;
        }
    }
    if (changed) saveMetrics(metrics);
}

// ─── Concept management ───────────────────────────────────────────────────────

/**
 * Adds new concepts extracted from a PDF upload.
 * Only concepts not already in the registry are added — at 0% mastery (slot 3).
 * Returns the list of concept names that were actually added.
 */
export function addConceptsFromPDF(pathId: string, newConcepts: string[]): string[] {
    const registry = loadConceptRegistry(pathId);
    const existingNames = new Set(registry.concepts.map(c => c.name));
    const now = Date.now();
    const added: string[] = [];

    for (const name of newConcepts) {
        const trimmed = name.trim();
        if (trimmed && !existingNames.has(trimmed)) {
            registry.concepts.push({ name: trimmed, source: 'pdf', addedAt: now, initialMastery: 0 });
            existingNames.add(trimmed);
            added.push(trimmed);
        }
    }

    if (added.length > 0) saveConceptRegistry(registry);
    return added;
}

/**
 * Ensures a skill name the student practiced exists in the concept registry.
 * Called when Mentor or daily plan records a session — so practice is tracked.
 * Idempotent: does nothing if the concept already exists.
 */
export function ensureConceptTracked(pathId: string, skillName: string): void {
    if (!skillName || !pathId || !isValidConceptName(skillName)) return;
    const registry = loadConceptRegistry(pathId);
    if (registry.concepts.find(c => c.name === skillName)) return;
    registry.concepts.push({
        name: skillName,
        source: 'practice',
        addedAt: Date.now(),
        initialMastery: 0,
    });
    saveConceptRegistry(registry);
}

/**
 * Returns all concepts in the registry for a given path.
 * Auto-seeds from the hardcoded profile if the registry is empty.
 */
export function getRegistryConcepts(pathId: string): TrackedConcept[] {
    const registry = loadConceptRegistry(pathId);
    if (registry.concepts.length === 0) {
        seedConceptRegistry(pathId);
        return loadConceptRegistry(pathId).concepts;
    }
    return registry.concepts;
}

// ─── Code analysis integration ────────────────────────────────────────────────

/**
 * Cross-references concepts detected from uploaded .py/.ipynb files with the
 * ConceptRegistry and boosts mastery for matching entries.
 *
 * Matching logic: a detected concept matches a registry entry if they share at
 * least one meaningful keyword (length > 2, not a Spanish stopword).
 *
 * Boost rules:
 *   - Registry concept matched in code → mastery = max(current, 65%)
 *     (Code evidence = real understanding, but not yet "mastered" at 70%)
 *   - New concept detected in code that isn't in registry → added at 55%
 *     (Likely knows it if they wrote it, but needs practice to confirm)
 *   - lastPracticed is updated so getActiveSkills() recognises the concept
 *
 * Returns the names of concepts whose mastery was updated.
 */
export function boostMasteryFromCodeAnalysis(
    pathId: string,
    detectedConcepts: string[]
): string[] {
    if (!pathId || detectedConcepts.length === 0) return [];

    seedConceptRegistry(pathId);
    const registry = loadConceptRegistry(pathId);
    const metrics = loadMetrics(pathId);
    const now = new Date().toISOString();
    const updated: string[] = [];

    const STOPWORDS = new Set(['con', 'una', 'para', 'que', 'los', 'las', 'del', 'son', 'por', 'sus', 'uso', 'use', 'the', 'and', 'for']);
    const keywords = (s: string) =>
        s.toLowerCase()
         .split(/[\s,;:()\[\]→—\-_]+/)
         .filter(t => t.length > 2 && !STOPWORDS.has(t));

    function matches(detected: string, registered: string): boolean {
        const dk = keywords(detected);
        const rk = keywords(registered);
        return dk.some(d => rk.some(r => r.includes(d) || d.includes(r)));
    }

    // ── Boost existing registry concepts that appear in the uploaded code ─────
    for (const regConcept of registry.concepts) {
        const matched = detectedConcepts.some(dc => matches(dc, regConcept.name));
        if (!matched) continue;

        const existing = metrics.skillMastery[regConcept.name];
        if (existing) {
            const boosted = Math.max(existing.masteryPct, 65);
            if (boosted !== existing.masteryPct || !existing.lastPracticed) {
                existing.masteryPct = boosted;
                existing.lastPracticed = now;
                existing.practiceCount = Math.max(existing.practiceCount + 1, 1);
                updated.push(regConcept.name);
            }
        } else {
            metrics.skillMastery[regConcept.name] = {
                skillId: regConcept.name,
                skillName: regConcept.name,
                masteryPct: 65,
                practiceCount: 1,
                lastPracticed: now,
            };
            updated.push(regConcept.name);
        }
    }

    // ── Add genuinely new concepts from code that aren't in the registry ──────
    const existingNames = new Set(registry.concepts.map(c => c.name));
    for (const dc of detectedConcepts) {
        if (!isValidConceptName(dc)) continue;
        const alreadyInRegistry = registry.concepts.some(rc => matches(dc, rc.name));
        if (!alreadyInRegistry && !existingNames.has(dc)) {
            registry.concepts.push({ name: dc, source: 'practice', addedAt: Date.now(), initialMastery: 55 });
            existingNames.add(dc);
            metrics.skillMastery[dc] = {
                skillId: dc, skillName: dc,
                masteryPct: 55, practiceCount: 1, lastPracticed: now,
            };
            updated.push(dc);
        }
    }

    if (updated.length > 0) {
        saveConceptRegistry(registry);
        saveMetrics(metrics);
    }
    return updated;
}

// ─── Slot computation ─────────────────────────────────────────────────────────

/**
 * Returns the 3 dynamic learning slots for the student's current state.
 *
 * Slot 1 (Review):   concepts with mastery ≥ 70% — sorted by least-recently practiced
 *                    (spaced repetition: the most "forgotten" go first)
 * Slot 2 (Practice): concepts with mastery 35–69% — sorted by most-recently active
 * Slot 3 (Learn):    concepts with mastery < 35% — sorted by most-recently added
 *                    (newest from PDF goes first — what you just saw in class)
 *
 * Each slot always has at least one concept (borrowed from adjacent slots if needed).
 */
export function getDynamicSlots(pathId: string): DynamicSlots {
    const concepts = getRegistryConcepts(pathId);
    const metrics = loadMetrics(pathId);

    type ScoredConcept = { name: string; mastery: number; lastPracticed: string; addedAt: number };

    const scored: ScoredConcept[] = concepts.map(c => ({
        name: c.name,
        mastery: metrics.skillMastery[c.name]?.masteryPct ?? c.initialMastery,
        lastPracticed: metrics.skillMastery[c.name]?.lastPracticed ?? '',
        addedAt: c.addedAt,
    }));

    const slot1 = scored
        .filter(c => c.mastery >= THRESHOLD_REVIEW)
        .sort((a, b) => a.lastPracticed.localeCompare(b.lastPracticed)) // least recently → first
        .map(c => c.name);

    const slot2 = scored
        .filter(c => c.mastery >= THRESHOLD_PRACTICE && c.mastery < THRESHOLD_REVIEW)
        .sort((a, b) => b.lastPracticed.localeCompare(a.lastPracticed)) // most recently active → first
        .map(c => c.name);

    const slot3 = scored
        .filter(c => c.mastery < THRESHOLD_PRACTICE)
        .sort((a, b) => b.addedAt - a.addedAt) // most recently added (newest PDF concept) → first
        .map(c => c.name);

    // ── Ensure no slot is empty ──────────────────────────────────────────────
    // If a slot is genuinely empty, we borrow from an adjacent one.
    // This happens when the student is very new or very advanced.
    const all = scored.sort((a, b) => a.mastery - b.mastery).map(c => c.name);

    if (slot1.length === 0 && all.length > 0) {
        // No consolidated concepts yet → use the highest-mastery one
        slot1.push(all[all.length - 1]);
    }
    if (slot2.length === 0 && all.length > 0) {
        // Nothing in progress → use the middle concept
        slot2.push(all[Math.floor(all.length / 2)]);
    }
    if (slot3.length === 0 && all.length > 0) {
        // Nothing new → use the lowest-mastery concept
        slot3.push(all[0]);
    }

    return { slot1Review: slot1, slot2Practice: slot2, slot3Learn: slot3 };
}

/**
 * Returns up to N representative concepts per slot for use in AI prompts.
 * Slot 1 shows up to 4 (enough variety for review exercises).
 * Slot 2 shows up to 3 (focus on active practice area).
 * Slot 3 shows up to 2 (introduce at most 2 new concepts at once).
 */
export function getSlotConceptsForPrompt(pathId: string): {
    slot1: string[];
    slot2: string[];
    slot3: string[];
} {
    const slots = getDynamicSlots(pathId);
    return {
        slot1: slots.slot1Review.slice(0, 4),
        slot2: slots.slot2Practice.slice(0, 3),
        slot3: slots.slot3Learn.slice(0, 2),
    };
}
