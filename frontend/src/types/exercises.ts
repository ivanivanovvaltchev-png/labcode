export interface ExerciseDay {
    dayNumber: number;
    objective: string;
    newConcepts: string[];
    baseHint: string;
}

export interface Exercise {
    id: string;
    title: string;
    description: string;
    category: string;
    days: ExerciseDay[];
}

export interface UserProgress {
    id: string;
    user_id: string;
    exercise_id: string;
    language: string;
    current_day: number;
    completed: boolean;
    last_updated: string;
}

export interface UserAttempt {
    id: string;
    progress_id: string;
    day_number: number;
    failed_attempts: number;
    last_submitted_code: string | null;
    hints_used: number;
    chat_messages?: any[];
    variant_text?: string | null;
    is_success?: boolean;
    created_at: string;
    updated_at: string;
}

export const SUPPORTED_LANGUAGES = [
    { id: 'pseint', name: 'Pseudocódigo (PSeInt)' },
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'sql', name: 'SQL' },
    { id: 'htmlcss', name: 'HTML/CSS' }
];

export const EXERCISE_CATEGORIES = [
    'Juegos Clásicos',
    'Algoritmia Básica',
    'Matrices y Arrays',
    'Matemáticas y Lógica',
    'Estructuras de Datos'
];
