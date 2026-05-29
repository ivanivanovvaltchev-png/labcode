import { supabase } from './supabaseClient';

// All localStorage keys used across the app
const KEYS = {
    progress: 'labcode_user_progress',
    selectedPath: 'labcode_selected_path',
    selfAssessmentsPrefix: 'labcode_self_assessments_',
    knowledgeProfile: 'user_knowledge_profile',
    completedSessions: 'mentor_completed_sessions',
    mentorSession: 'mentor_session',
    learningMetrics: 'labcode_learning_metrics',
    dailyTests: 'labcode_daily_tests',
};

function safeJson<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function getAllSelfAssessments(): Record<string, Record<string, boolean>> {
    const result: Record<string, Record<string, boolean>> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(KEYS.selfAssessmentsPrefix)) {
            const pathId = key.slice(KEYS.selfAssessmentsPrefix.length);
            result[pathId] = safeJson<Record<string, boolean>>(localStorage.getItem(key), {});
        }
    }
    return result;
}

export async function pullFromCloud(userId: string): Promise<void> {
    const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error || !data) return;

    if (data.progress != null) {
        // Merge strategy: never let a stale cloud overwrite a more-complete local state.
        const localRaw = localStorage.getItem(KEYS.progress);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cloud = data.progress as any;
        if (localRaw) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const local = JSON.parse(localRaw) as any;

            // Merge dailyPlans: keep whichever plan has more completed tasks
            const allPathIds = new Set([
                ...Object.keys(local.dailyPlans ?? {}),
                ...Object.keys(cloud.dailyPlans ?? {}),
            ]);
            const mergedPlans: Record<string, unknown> = { ...(cloud.dailyPlans ?? {}) };
            for (const pid of allPathIds) {
                const lp = (local.dailyPlans ?? {})[pid];
                const cp = (cloud.dailyPlans ?? {})[pid];
                if (lp && !cp) {
                    mergedPlans[pid] = lp; // cloud doesn't have it → keep local
                } else if (lp && cp) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const localDone = (lp.tasks ?? []).filter((t: any) => t.completed).length;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const cloudDone = (cp.tasks ?? []).filter((t: any) => t.completed).length;
                    mergedPlans[pid] = localDone >= cloudDone ? lp : cp;
                }
            }
            cloud.dailyPlans = mergedPlans;

            // XP can only grow — never reduce it
            cloud.xp = Math.max(local.xp ?? 0, cloud.xp ?? 0);

            // Merge activity log (union by timestamp)
            const localLog: unknown[] = local.activityLog ?? [];
            const cloudLog: unknown[] = cloud.activityLog ?? [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const logByTs = new Map<number, unknown>([...cloudLog, ...localLog].map((e: any) => [e.timestamp, e]));
            cloud.activityLog = Array.from(logByTs.values())
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((a: any, b: any) => b.timestamp - a.timestamp)
                .slice(0, 100);
        }
        localStorage.setItem(KEYS.progress, JSON.stringify(cloud));
    }

    if (data.selected_path) localStorage.setItem(KEYS.selectedPath, data.selected_path as string);
    if (data.knowledge_profile != null) localStorage.setItem(KEYS.knowledgeProfile, JSON.stringify(data.knowledge_profile));
    if (data.completed_sessions != null) localStorage.setItem(KEYS.completedSessions, JSON.stringify(data.completed_sessions));
    if (data.learning_metrics != null) localStorage.setItem(KEYS.learningMetrics, JSON.stringify(data.learning_metrics));
    if (data.daily_tests != null) localStorage.setItem(KEYS.dailyTests, JSON.stringify(data.daily_tests));
    if (data.self_assessments != null) {
        const sa = data.self_assessments as Record<string, Record<string, boolean>>;
        Object.entries(sa).forEach(([pathId, vals]) => {
            localStorage.setItem(`${KEYS.selfAssessmentsPrefix}${pathId}`, JSON.stringify(vals));
        });
    }

    // Notify UI components that cloud data has landed in localStorage
    window.dispatchEvent(new Event('labcode:cloud_synced'));
}

export async function pushToCloud(userId: string): Promise<void> {
    const progress = safeJson(localStorage.getItem(KEYS.progress), null);
    const knowledgeProfile = safeJson(localStorage.getItem(KEYS.knowledgeProfile), null);
    const completedSessions = safeJson(localStorage.getItem(KEYS.completedSessions), []);
    const selectedPath = localStorage.getItem(KEYS.selectedPath);
    const selfAssessments = getAllSelfAssessments();
    const learningMetrics = safeJson(localStorage.getItem(KEYS.learningMetrics), null);
    const dailyTests = safeJson(localStorage.getItem(KEYS.dailyTests), null);

    await supabase.from('user_data').upsert({
        user_id: userId,
        progress,
        selected_path: selectedPath,
        knowledge_profile: knowledgeProfile,
        completed_sessions: completedSessions,
        self_assessments: selfAssessments,
        learning_metrics: learningMetrics,
        daily_tests: dailyTests,
        updated_at: new Date().toISOString(),
    });
}

export function clearLocalData(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && Object.values(KEYS).some(k => key.startsWith(k))) {
            toRemove.push(key);
        }
    }
    toRemove.forEach(key => localStorage.removeItem(key));
}
