import { CareerPath, isSkillMastered } from '../data/careerPaths';
import { LearningMetrics, loadMetrics, saveMetrics } from './learningMetrics';

const STORAGE_KEY = 'labcode_daily_tests';

// ─── Data Model ───────────────────────────────────────────────────────────────

export interface MCQOption {
    A: string;
    B: string;
    C: string;
}

export interface TestQuestion {
    id: string;
    question: string;
    options: MCQOption;
    correctAnswer: 'A' | 'B' | 'C';
    explanation: string;
    skillRef: string;
}

export interface DailyCheckin {
    mood: 1 | 2 | 3 | 4 | 5;   // 1 = exhausted, 5 = sharp
    blocker: string;              // what's blocking or confusing today
    goal: string;                 // what to achieve today
}

export interface TestSession {
    date: string;                                       // YYYY-MM-DD
    checkin: DailyCheckin | null;
    questions: TestQuestion[];
    answers: Record<string, 'A' | 'B' | 'C'>;          // questionId → chosen answer
    score: number | null;                               // 0–100, null = not submitted yet
    completedAt: number | null;
    failedSkills: string[];                             // skillRef of wrong answers
    matrix: EisenhowerMatrix | null;                   // calculated after test
}

// ─── Eisenhower Matrix ────────────────────────────────────────────────────────

export interface EisenhowerMatrix {
    Q1_urgent_important: MatrixItem[];    // Failed tests / current blocker → ACT NOW
    Q2_important_not_urgent: MatrixItem[]; // Next curriculum steps → SCHEDULE
    Q3_urgent_not_important: MatrixItem[]; // Minor syntax/format issues → FIX QUICK
    Q4_not_urgent_not_important: MatrixItem[]; // Far-ahead topics → DEFER
    calculatedAt: string;
}

export interface MatrixItem {
    skillId: string;
    skillName: string;
    reason: string;
    masteryPct: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export function loadTestHistory(): TestSession[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as TestSession[]) : [];
    } catch { return []; }
}

export function saveTestHistory(sessions: TestSession[]): void {
    // Keep last 30 days
    const sorted = sessions.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

export function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

export function getTodayTest(): TestSession | null {
    const history = loadTestHistory();
    return history.find(s => s.date === todayStr()) ?? null;
}

export function saveTodayTest(session: TestSession): void {
    const history = loadTestHistory().filter(s => s.date !== todayStr());
    saveTestHistory([...history, session]);
}

/** Removes today's test session so the user can regenerate a fresh one. */
export function clearTodayTest(): void {
    saveTestHistory(loadTestHistory().filter(s => s.date !== todayStr()));
}

export function getRecentFailedSkills(days = 7): string[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return loadTestHistory()
        .filter(s => s.date >= cutoffStr && s.failedSkills.length > 0)
        .flatMap(s => s.failedSkills);
}

export function getTestStreakDays(): number {
    const history = loadTestHistory().filter(s => s.score !== null);
    if (history.length === 0) return 0;
    let streak = 0;
    const d = new Date();
    while (true) {
        const ds = d.toISOString().split('T')[0];
        if (!history.find(s => s.date === ds)) break;
        streak++;
        d.setDate(d.getDate() - 1);
    }
    return streak;
}

// ─── Test Result Recording ────────────────────────────────────────────────────

/**
 * Updates skillMastery in LearningMetrics after a test is submitted.
 * Correct answer → +15 % mastery (may unlock the next curriculum topic).
 * Wrong answer   → +3 % (small signal: the user engaged with the concept).
 * This is the auto-update trigger: once masteryPct reaches ≥80 the skill is
 * considered consolidated and the Eisenhower Matrix reclassifies it to Q3/Q4.
 */
export function recordTestResult(
    pathId: string,
    questions: TestQuestion[],
    answers: Record<string, 'A' | 'B' | 'C'>
): void {
    const metrics = loadMetrics(pathId);
    const now = new Date().toISOString();

    for (const q of questions) {
        const isCorrect = answers[q.id] === q.correctAnswer;
        const boost = isCorrect ? 15 : 3;
        const existing = metrics.skillMastery[q.skillRef];
        if (existing) {
            existing.masteryPct = Math.min(100, existing.masteryPct + boost);
            existing.practiceCount += 1;
            existing.lastPracticed = now;
        } else {
            metrics.skillMastery[q.skillRef] = {
                skillId: q.skillRef,
                skillName: q.skillRef,
                masteryPct: isCorrect ? 25 : 10,
                practiceCount: 1,
                lastPracticed: now,
            };
        }
    }

    saveMetrics(metrics);
}

// ─── Eisenhower Matrix Algorithm ──────────────────────────────────────────────

/**
 * Classifies skills into the 4 Eisenhower quadrants.
 *
 * Q1 (Urgent + Important):
 *   - Skills failed in recent tests (last 7 days)
 *   - Skills with mastery < 40% that are in the current curriculum window
 *
 * Q2 (Important + Not Urgent):
 *   - Next 1–3 skills in curriculum order (deliberate practice)
 *   - Skills in progress (mastery 40–79%) that are not urgent
 *
 * Q3 (Urgent + Not Important):
 *   - Skills mastered ≥80% but not practiced in >3 days (maintain)
 *   - Minor formatting/syntax issues detected from checkin blocker text
 *
 * Q4 (Not Urgent + Not Important):
 *   - Skills far ahead in curriculum (order > maxAvailable + 3)
 *   - Advanced topics the user is curious about but shouldn't touch yet
 */
export function calculateMatrix(
    path: CareerPath,
    metrics: LearningMetrics,
    recentFailedSkills: string[],
    checkin: DailyCheckin | null,
    profileConcepts: string[],
    selfAssessments: Record<string, boolean>
): EisenhowerMatrix {
    const sorted = [...path.skills].sort((a, b) => a.order - b.order);

    const masteredOrders = sorted
        .filter(s => isSkillMastered(s, profileConcepts, selfAssessments))
        .map(s => s.order);
    const maxMasteredOrder = masteredOrders.length > 0 ? Math.max(...masteredOrders) : 0;

    const now = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const Q1: MatrixItem[] = [];
    const Q2: MatrixItem[] = [];
    const Q3: MatrixItem[] = [];
    const Q4: MatrixItem[] = [];

    const used = new Set<string>();

    // Q1: recent test failures → highest priority
    for (const skillRef of recentFailedSkills) {
        const skill = sorted.find(s => s.name === skillRef || s.id === skillRef);
        if (!skill || used.has(skill.id)) continue;
        used.add(skill.id);
        const m = metrics.skillMastery[skill.id];
        Q1.push({ skillId: skill.id, skillName: skill.name, reason: 'Fallado en test reciente', masteryPct: m?.masteryPct ?? 0 });
    }

    for (const skill of sorted) {
        if (used.has(skill.id)) continue;
        // selfAssess skills (Git, SQL, Pseudocódigo) need human confirmation — the AI
        // cannot test or remediate them, so they must not appear in Q1/Q2/Q3/Q4.
        if (skill.selfAssess) continue;
        const m = metrics.skillMastery[skill.id];
        const mastery = m?.masteryPct ?? 0;
        const isInWindow = skill.order <= maxMasteredOrder + 2;
        const isDetectedMastered = isSkillMastered(skill, profileConcepts, selfAssessments);

        if (isInWindow && mastery < 40 && !isDetectedMastered && skill.importance === 'critical') {
            // Q1: critical skill in window, low mastery
            used.add(skill.id);
            Q1.push({ skillId: skill.id, skillName: skill.name, reason: 'Habilidad clave sin dominar en tu nivel actual', masteryPct: mastery });
        } else if (isInWindow && mastery >= 40 && mastery < 80) {
            // Q2: in progress — deliberate practice
            used.add(skill.id);
            Q2.push({ skillId: skill.id, skillName: skill.name, reason: 'En progreso — práctica deliberada', masteryPct: mastery });
        } else if (!isInWindow && skill.order <= maxMasteredOrder + 4) {
            // Q2: next curriculum step
            used.add(skill.id);
            Q2.push({ skillId: skill.id, skillName: skill.name, reason: 'Próximo paso en el temario del Máster', masteryPct: mastery });
        } else if (mastery >= 80 && m && m.lastPracticed && m.lastPracticed < threeDaysAgo) {
            // Q3: mastered but stale — quick review
            used.add(skill.id);
            Q3.push({ skillId: skill.id, skillName: skill.name, reason: 'Dominada pero sin repasar en 3+ días', masteryPct: mastery });
        } else if (skill.order > maxMasteredOrder + 4) {
            // Q4: too far ahead
            used.add(skill.id);
            Q4.push({ skillId: skill.id, skillName: skill.name, reason: 'Tema avanzado — llega en su momento', masteryPct: mastery });
        }
    }

    // Mood adjustment: if mood ≤ 2, move some Q2 items to Q3 (lighter day)
    if (checkin && checkin.mood <= 2 && Q2.length > 1) {
        const moved = Q2.splice(Math.ceil(Q2.length / 2));
        moved.forEach(item => Q3.push({ ...item, reason: 'Reubicado: energía baja hoy, mejor mañana' }));
    }

    // Blocker keyword detection: if user mentions "sintaxis" or "formato" → Q3 reminder
    if (checkin?.blocker) {
        const b = checkin.blocker.toLowerCase();
        if ((b.includes('sintaxis') || b.includes('formato') || b.includes('error') || b.includes('indentac')) && Q3.length === 0) {
            Q3.push({ skillId: '__syntax', skillName: 'Revisión de sintaxis y formato', reason: `Mencionado en check-in: "${checkin.blocker.slice(0, 60)}"`, masteryPct: 0 });
        }
    }

    return {
        Q1_urgent_important: Q1.slice(0, 4),
        Q2_important_not_urgent: Q2.slice(0, 4),
        Q3_urgent_not_important: Q3.slice(0, 3),
        Q4_not_urgent_not_important: Q4.slice(0, 4),
        calculatedAt: now,
    };
}
