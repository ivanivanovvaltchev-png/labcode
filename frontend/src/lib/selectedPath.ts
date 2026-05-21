const PATH_KEY = 'selected_career_path';
const ASSESSMENTS_PREFIX = 'path_self_assessments_';

export function saveSelectedPath(pathId: string): void {
    localStorage.setItem(PATH_KEY, pathId);
}

export function loadSelectedPath(): string | null {
    return localStorage.getItem(PATH_KEY);
}

export function clearSelectedPath(): void {
    localStorage.removeItem(PATH_KEY);
}

export function saveSelfAssessments(pathId: string, assessments: Record<string, boolean>): void {
    localStorage.setItem(`${ASSESSMENTS_PREFIX}${pathId}`, JSON.stringify(assessments));
}

export function loadSelfAssessments(pathId: string): Record<string, boolean> {
    try {
        const raw = localStorage.getItem(`${ASSESSMENTS_PREFIX}${pathId}`);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
