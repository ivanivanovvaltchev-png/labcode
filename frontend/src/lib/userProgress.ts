const STORAGE_KEY = 'labcode_user_progress';

export interface DiagnosticResult {
    pathId: string;
    score: number;         // 0-100
    xpEarned: number;
    weakAreas: string[];   // skill names that need work
    feedback: string;
    completedAt: number;
}

export interface DailyTask {
    id: string;
    type: 'learn' | 'practice' | 'review';
    title: string;
    description: string;
    skillRef: string;
    completed: boolean;
}

export interface DailyPlan {
    date: string;          // YYYY-MM-DD
    tasks: DailyTask[];
    generatedAt: number;
    masterFeedback?: string;
}

export interface ActivityEntry {
    type: 'diagnostic' | 'mentor_session' | 'skill_mastered' | 'exercise_completed' | 'daily_task';
    xpEarned: number;
    description: string;
    timestamp: number;
}

export interface UserProgress {
    xp: number;
    onboardingCompleted: Record<string, boolean>;
    diagnosticResults: Record<string, DiagnosticResult>;
    dailyPlans: Record<string, DailyPlan>;  // pathId -> today's plan
    activityLog: ActivityEntry[];
}

const DEFAULT: UserProgress = {
    xp: 0,
    onboardingCompleted: {},
    diagnosticResults: {},
    dailyPlans: {},
    activityLog: [],
};

function load(): UserProgress {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch { return DEFAULT; }
}

function save(p: UserProgress): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function getTotalXP(): number { return load().xp; }

export function getLevel(): number { return Math.floor(getTotalXP() / 300) + 1; }

export function getLevelProgress(): number { return getTotalXP() % 300; }  // 0-299 within current level

export function addXP(amount: number, entry: Omit<ActivityEntry, 'xpEarned' | 'timestamp'>): void {
    const p = load();
    p.xp += amount;
    p.activityLog = [{ ...entry, xpEarned: amount, timestamp: Date.now() }, ...p.activityLog].slice(0, 100);
    save(p);
}

export function isOnboardingComplete(pathId: string): boolean {
    const p = load();
    // Explicit flag for this path
    if (p.onboardingCompleted[pathId] === true) return true;
    // Path changed: user already did onboarding on a previous path → skip
    if (Object.values(p.onboardingCompleted).some(v => v === true)) return true;
    // User already has a diagnostic result for this path → onboarding was done
    if (p.diagnosticResults[pathId] != null) return true;
    return false;
}

export function markOnboardingComplete(pathId: string): void {
    const p = load();
    p.onboardingCompleted[pathId] = true;
    save(p);
}

export function saveDiagnosticResult(result: DiagnosticResult): void {
    const p = load();
    p.diagnosticResults[result.pathId] = result;
    p.xp += result.xpEarned;
    p.activityLog = [{
        type: 'diagnostic' as const,
        xpEarned: result.xpEarned,
        description: `Examen diagnóstico completado — ${result.score}% de acierto`,
        timestamp: Date.now(),
    }, ...p.activityLog].slice(0, 100);
    save(p);
}

export function getDiagnosticResult(pathId: string): DiagnosticResult | null {
    return load().diagnosticResults[pathId] ?? null;
}

export function saveDailyPlan(pathId: string, plan: DailyPlan): void {
    const p = load();
    p.dailyPlans[pathId] = plan;
    save(p);
}

export function getDailyPlan(pathId: string): DailyPlan | null {
    return load().dailyPlans[pathId] ?? null;
}

export function completeTask(pathId: string, taskId: string): void {
    const p = load();
    const plan = p.dailyPlans[pathId];
    if (!plan) return;
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    task.completed = true;
    p.xp += 30;
    p.activityLog = [{
        type: 'daily_task' as const,
        xpEarned: 30,
        description: `Tarea diaria completada: ${task.title}`,
        timestamp: Date.now(),
    }, ...p.activityLog].slice(0, 100);
    save(p);
}

export function saveMasterFeedback(pathId: string, feedback: string): void {
    const p = load();
    if (p.dailyPlans[pathId]) {
        p.dailyPlans[pathId].masterFeedback = feedback;
        save(p);
    }
}

export function getActivityLog(): ActivityEntry[] { return load().activityLog; }

export function todayString(): string {
    return new Date().toISOString().split('T')[0];
}
