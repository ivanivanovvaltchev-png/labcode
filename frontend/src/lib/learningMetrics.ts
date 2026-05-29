import { CareerPath, PathSkill, isSkillMastered, getAvailableSkills } from '../data/careerPaths';

const STORAGE_KEY = 'labcode_learning_metrics';

// ─── Data Model ───────────────────────────────────────────────────────────────

export interface DailyMetric {
    date: string;           // YYYY-MM-DD
    challengesSolved: number;
    mentorSessions: number;
    xpEarned: number;
    skillsWorked: string[]; // skill names
}

export interface SkillMastery {
    skillId: string;
    skillName: string;
    masteryPct: number;     // 0–100
    practiceCount: number;
    lastPracticed: string;  // ISO date string, empty if never practiced
}

export interface LearningMetrics {
    pathId: string;
    dailyMetrics: DailyMetric[];  // one entry per day, last 30 days
    skillMastery: Record<string, SkillMastery>;
    updatedAt: number;
}

export interface GapAnalysis {
    mastered: SkillMastery[];                                   // masteryPct >= 80 or detected from code
    inProgress: SkillMastery[];                                 // 10–79%
    criticalGaps: Array<{ skill: PathSkill; mastery: SkillMastery | null }>; // critical skills, low/no mastery
    notStarted: PathSkill[];                                    // no practice, not detected from code
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export function loadMetrics(pathId: string): LearningMetrics {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as LearningMetrics;
            if (parsed.pathId === pathId) return parsed;
        }
    } catch { /* ignore */ }
    return { pathId, dailyMetrics: [], skillMastery: {}, updatedAt: Date.now() };
}

export function saveMetrics(metrics: LearningMetrics): void {
    metrics.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}

// ─── Daily metric helpers ─────────────────────────────────────────────────────

function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

function getOrCreateDay(metrics: LearningMetrics): DailyMetric {
    const today = todayStr();
    let day = metrics.dailyMetrics.find(d => d.date === today);
    if (!day) {
        day = { date: today, challengesSolved: 0, mentorSessions: 0, xpEarned: 0, skillsWorked: [] };
        metrics.dailyMetrics.push(day);
        metrics.dailyMetrics.sort((a, b) => a.date.localeCompare(b.date));
        if (metrics.dailyMetrics.length > 30) metrics.dailyMetrics = metrics.dailyMetrics.slice(-30);
    }
    return day;
}

// ─── Recording events ─────────────────────────────────────────────────────────

/** Call when a user marks a daily-plan task as done (PathDashboard). */
export function recordPractice(pathId: string, skillId: string, skillName: string, xp = 30): void {
    const metrics = loadMetrics(pathId);
    const day = getOrCreateDay(metrics);
    day.challengesSolved += 1;
    day.xpEarned += xp;
    if (!day.skillsWorked.includes(skillName)) day.skillsWorked.push(skillName);

    const m = metrics.skillMastery[skillId];
    if (m) {
        m.practiceCount += 1;
        m.masteryPct = Math.min(100, m.masteryPct + 10);
        m.lastPracticed = new Date().toISOString();
    } else {
        metrics.skillMastery[skillId] = { skillId, skillName, masteryPct: 20, practiceCount: 1, lastPracticed: new Date().toISOString() };
    }
    saveMetrics(metrics);
}

/** Call when the Mentor reports [EJERCICIO_COMPLETADO] (MentorPage). */
export function recordMentorSession(pathId: string, skillId: string, skillName: string): void {
    const metrics = loadMetrics(pathId);
    const day = getOrCreateDay(metrics);
    day.mentorSessions += 1;
    day.xpEarned += 50;
    if (!day.skillsWorked.includes(skillName)) day.skillsWorked.push(skillName);

    const m = metrics.skillMastery[skillId];
    if (m) {
        m.practiceCount += 1;
        m.masteryPct = Math.min(100, m.masteryPct + 15);
        m.lastPracticed = new Date().toISOString();
    } else {
        metrics.skillMastery[skillId] = { skillId, skillName, masteryPct: 30, practiceCount: 1, lastPracticed: new Date().toISOString() };
    }
    saveMetrics(metrics);
}

/**
 * Seeds mastery baselines from the knowledge profile analysis.
 * Skills detected via code keywords start at 60 % mastery.
 * Safe to call repeatedly — only adds entries that don't exist yet.
 */
export function seedMasteryFromProfile(
    pathId: string,
    path: CareerPath,
    profileConcepts: string[],
    selfAssessments: Record<string, boolean>
): void {
    const metrics = loadMetrics(pathId);
    let changed = false;
    for (const skill of path.skills) {
        if (!metrics.skillMastery[skill.id] && isSkillMastered(skill, profileConcepts, selfAssessments)) {
            metrics.skillMastery[skill.id] = {
                skillId: skill.id,
                skillName: skill.name,
                masteryPct: 60,
                practiceCount: 0,
                lastPracticed: '',
            };
            changed = true;
        }
    }
    if (changed) saveMetrics(metrics);
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

export function calculateGapAnalysis(
    path: CareerPath,
    metrics: LearningMetrics,
    profileConcepts: string[],
    selfAssessments: Record<string, boolean>
): GapAnalysis {
    const mastered: SkillMastery[] = [];
    const inProgress: SkillMastery[] = [];
    const notStarted: PathSkill[] = [];

    for (const skill of path.skills) {
        const m = metrics.skillMastery[skill.id];
        const detectedMastered = isSkillMastered(skill, profileConcepts, selfAssessments);

        if (m && m.masteryPct >= 80) {
            mastered.push(m);
        } else if (m && m.masteryPct >= 10) {
            inProgress.push(m);
        } else if (detectedMastered) {
            // Code analysis says mastered but no tracked practice yet
            mastered.push({ skillId: skill.id, skillName: skill.name, masteryPct: 60, practiceCount: 0, lastPracticed: '' });
        } else {
            notStarted.push(skill);
        }
    }

    // Critical gaps: important skills with no or low mastery
    const criticalGaps = path.skills
        .filter(s => s.importance === 'critical')
        .map(s => ({ skill: s, mastery: metrics.skillMastery[s.id] ?? null }))
        .filter(({ mastery }) => !mastery || mastery.masteryPct < 50);

    return { mastered, inProgress, criticalGaps, notStarted };
}

// ─── Activity stats helpers ───────────────────────────────────────────────────

/** Returns the last N days of DailyMetric (filled with zeros for missing days). */
export function getRecentActivity(metrics: LearningMetrics, days = 7): DailyMetric[] {
    const result: DailyMetric[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const existing = metrics.dailyMetrics.find(m => m.date === dateStr);
        result.push(existing ?? { date: dateStr, challengesSolved: 0, mentorSessions: 0, xpEarned: 0, skillsWorked: [] });
    }
    return result;
}

export function totalChallengesSolved(metrics: LearningMetrics): number {
    return metrics.dailyMetrics.reduce((s, d) => s + d.challengesSolved + d.mentorSessions, 0);
}

export function totalXpFromMetrics(metrics: LearningMetrics): number {
    return metrics.dailyMetrics.reduce((s, d) => s + d.xpEarned, 0);
}

/**
 * Returns the skill names the student has actively worked on in the last N days,
 * sorted by recency + frequency. Used to bias plan and test generation.
 */
export function getActiveSkills(pathId: string, days = 4): string[] {
    const metrics = loadMetrics(pathId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const skillScore: Record<string, number> = {};

    // Score from daily activity log (most recent days count more)
    const sortedDays = [...metrics.dailyMetrics]
        .filter(d => d.date >= cutoffStr)
        .sort((a, b) => b.date.localeCompare(a.date));

    sortedDays.forEach((day, idx) => {
        const recencyWeight = 1 / (idx + 1); // day 0 = 1x, day 1 = 0.5x, day 2 = 0.33x…
        for (const skill of day.skillsWorked) {
            skillScore[skill] = (skillScore[skill] ?? 0) + recencyWeight;
        }
    });

    // Also boost skills with high mastery-growth (practiceCount and recent practice)
    for (const m of Object.values(metrics.skillMastery)) {
        if (m.lastPracticed >= cutoffStr + 'T' && m.practiceCount > 1) {
            skillScore[m.skillName] = (skillScore[m.skillName] ?? 0) + m.practiceCount * 0.3;
        }
    }

    return Object.entries(skillScore)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 5);
}

// ─── State-Driven Prompting ───────────────────────────────────────────────────

/**
 * Returns the list of skill names the AI is allowed to use in generated content.
 * Derived from getAvailableSkills() (curriculum-gated). Every skill in the current
 * window is "validated" — the AI may only reference concepts from this list.
 * Falls back to the first 3 curriculum skills for brand-new users with no profile.
 */
export function getHabilidadesValidadas(
    path: CareerPath,
    profileConcepts: string[],
    selfAssessments: Record<string, boolean>
): string[] {
    const available = getAvailableSkills(path, profileConcepts, selfAssessments);
    // Exclude selfAssess skills (Git, SQL, Pseudocódigo) — they require human confirmation
    // and cannot be tested or generated by the AI. The allowlist must be Python-only.
    const pythonTestable = available.filter(s => !s.selfAssess);
    if (pythonTestable.length === 0) {
        const sorted = [...path.skills].sort((a, b) => a.order - b.order);
        return sorted.filter(s => !s.selfAssess).slice(0, 3).map(s => s.name);
    }
    return pythonTestable.map(s => s.name);
}
