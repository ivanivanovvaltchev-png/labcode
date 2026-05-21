const STORAGE_KEY = 'user_knowledge_profile';

export interface KnowledgeProfile {
    concepts: string[];
    summary: string;
    analyzedFiles: string[];
    updatedAt: number;
}

export function saveKnowledgeProfile(profile: KnowledgeProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadKnowledgeProfile(): KnowledgeProfile | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearKnowledgeProfile(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function buildKnowledgeBlock(profile: KnowledgeProfile | null): string {
    if (!profile || profile.concepts.length === 0) return '';
    return `\n\nPERFIL DE CONOCIMIENTO DEL ESTUDIANTE (CRÍTICO — léelo antes de responder):
El estudiante SOLO ha trabajado con los siguientes conceptos hasta ahora:
${profile.concepts.map(c => `  • ${c}`).join('\n')}

Resumen del nivel: ${profile.summary}

REGLA ABSOLUTA: Nunca uses ni menciones conceptos que NO estén en esa lista. Si el ejercicio o la pregunta requiere algo que el estudiante aún no ha visto, indícaselo claramente y explícale ese concepto de forma muy básica antes de continuar. Adapta SIEMPRE tu lenguaje y ejemplos al nivel real del estudiante.`;
}

export function buildPathBlock(jobTitle: string, gapSkillNames: string[]): string {
    if (gapSkillNames.length === 0) return '';
    return `\n\nOBJETIVO LABORAL DEL ESTUDIANTE:
El estudiante se está preparando para trabajar como ${jobTitle}.
Habilidades que le faltan para conseguirlo (prioriza enseñarle estas):
${gapSkillNames.slice(0, 8).map(s => `  • ${s}`).join('\n')}

Cuando el estudiante practique algo relacionado con estas habilidades, felicítale indicándole que está avanzando hacia su objetivo de ser ${jobTitle}.`;
}
