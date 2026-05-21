import { ChatMessage } from '../ai/agents';

const STORAGE_KEY = 'mentor_completed_sessions';
const MAX_SESSIONS = 20;

export interface CompletedSession {
    id: string;
    exercise: string;
    messages: ChatMessage[];
    completedAt: number;
    isVariantOf?: string;
}

export function loadCompletedSessions(): CompletedSession[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveCompletedSession(session: Omit<CompletedSession, 'id'>): void {
    const all = loadCompletedSessions();
    const newSession: CompletedSession = { ...session, id: Date.now().toString() };
    const updated = [newSession, ...all].slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearCompletedSessions(): void {
    localStorage.removeItem(STORAGE_KEY);
}
