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
El estudiante ha aprendido y PUEDE USAR todos los siguientes conceptos:
${profile.concepts.map(c => `  • ${c}`).join('\n')}

Resumen del nivel: ${profile.summary}

REGLA ABSOLUTA: TODOS los conceptos listados arriba están PERMITIDOS y el estudiante puede usarlos libremente (incluidos sets, tuplas, diccionarios, funciones, o cualquier otro que aparezca en la lista). Solo prohíbe conceptos que NO aparezcan en esa lista. Si el ejercicio requiere algo que no está en la lista, indícaselo y explícaselo de forma básica.`;
}

export function buildPathBlock(jobTitle: string, gapSkillNames: string[]): string {
    if (gapSkillNames.length === 0) return '';
    return `\n\nOBJETIVO LABORAL DEL ESTUDIANTE:
El estudiante se está preparando para trabajar como ${jobTitle}.
Habilidades que le faltan para conseguirlo (prioriza enseñarle estas):
${gapSkillNames.slice(0, 8).map(s => `  • ${s}`).join('\n')}

Cuando el estudiante practique algo relacionado con estas habilidades, felicítale indicándole que está avanzando hacia su objetivo de ser ${jobTitle}.`;
}
