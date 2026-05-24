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

    if (data.progress != null) localStorage.setItem(KEYS.progress, JSON.stringify(data.progress));
    if (data.selected_path) localStorage.setItem(KEYS.selectedPath, data.selected_path as string);
    if (data.knowledge_profile != null) localStorage.setItem(KEYS.knowledgeProfile, JSON.stringify(data.knowledge_profile));
    if (data.completed_sessions != null) localStorage.setItem(KEYS.completedSessions, JSON.stringify(data.completed_sessions));
    if (data.learning_metrics != null) localStorage.setItem(KEYS.learningMetrics, JSON.stringify(data.learning_metrics));
    if (data.self_assessments != null) {
        const sa = data.self_assessments as Record<string, Record<string, boolean>>;
        Object.entries(sa).forEach(([pathId, vals]) => {
            localStorage.setItem(`${KEYS.selfAssessmentsPrefix}${pathId}`, JSON.stringify(vals));
        });
    }
}

export async function pushToCloud(userId: string): Promise<void> {
    const progress = safeJson(localStorage.getItem(KEYS.progress), null);
    const knowledgeProfile = safeJson(localStorage.getItem(KEYS.knowledgeProfile), null);
    const completedSessions = safeJson(localStorage.getItem(KEYS.completedSessions), []);
    const selectedPath = localStorage.getItem(KEYS.selectedPath);
    const selfAssessments = getAllSelfAssessments();
    const learningMetrics = safeJson(localStorage.getItem(KEYS.learningMetrics), null);

    await supabase.from('user_data').upsert({
        user_id: userId,
        progress,
        selected_path: selectedPath,
        knowledge_profile: knowledgeProfile,
        completed_sessions: completedSessions,
        self_assessments: selfAssessments,
        learning_metrics: learningMetrics,
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
