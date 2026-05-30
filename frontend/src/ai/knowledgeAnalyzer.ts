const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// ─── File extraction ──────────────────────────────────────────────────────────

/**
 * Accepts .py, .txt, or .ipynb content and returns clean Python code string.
 * For .ipynb: extracts only code cells, discards markdown and outputs.
 */
export function extractCodeFromFile(filename: string, raw: string): string {
    if (filename.endsWith('.ipynb')) {
        try {
            const nb = JSON.parse(raw) as {
                cells: Array<{ cell_type: string; source: string | string[] }>;
            };
            const codeCells = nb.cells
                .filter(c => c.cell_type === 'code')
                .map(c => (Array.isArray(c.source) ? c.source.join('') : c.source))
                .filter(src => src.trim().length > 0);
            return `# Extraído de ${filename} (${codeCells.length} celda${codeCells.length !== 1 ? 's' : ''} de código)\n\n`
                + codeCells.join('\n\n# ───────────────────────\n\n');
        } catch {
            return raw; // fallback: treat as plain text
        }
    }
    // .py or .txt — return as-is
    return raw;
}

export interface KnowledgeAnalysis {
    concepts: string[];
    summary: string;
}

// ─── Hard concept guard ───────────────────────────────────────────────────────
// Maps concept keywords to the Python code tokens that MUST appear in the
// source for the concept to be considered valid. If the token isn't in the
// code, the concept claim is rejected — regardless of what the AI says.

const CONCEPT_GUARDS: Array<{ conceptTerms: string[]; codeTokens: string[] }> = [
    { conceptTerms: ['func', 'def', 'retorno', 'parámetro', 'parametro', 'return'], codeTokens: ['def '] },
    { conceptTerms: ['recursiv'],                 codeTokens: ['def '] },
    { conceptTerms: ['clase', 'class', 'objeto', 'herencia', 'poo', 'orientada'], codeTokens: ['class '] },
    { conceptTerms: ['excepci', 'try', 'except'], codeTokens: ['try:', 'except'] },
    { conceptTerms: ['lambda'],                   codeTokens: ['lambda '] },
    { conceptTerms: ['diccionari', 'dict'],       codeTokens: ['dict(', ': {', '= {'] },
    { conceptTerms: ['comprensión', 'comprehension'], codeTokens: ['[x ', '[ x', 'for x in'] },
    { conceptTerms: ['archivo', 'fichero', 'open('], codeTokens: ['open('] },
    { conceptTerms: ['generador', 'yield'],       codeTokens: ['yield '] },
    { conceptTerms: ['conjunto', ' set(', 'frozenset'], codeTokens: ['set(', 'frozenset'] },
];

function filterDetectedConcepts(concepts: string[], code: string): string[] {
    const codeLower = code.toLowerCase();
    return concepts.filter(concept => {
        const cLower = concept.toLowerCase();
        for (const guard of CONCEPT_GUARDS) {
            const matchesConcept = guard.conceptTerms.some(t => cLower.includes(t));
            if (!matchesConcept) continue;
            // Concept matches a guarded category — verify at least one code token exists
            const tokenFound = guard.codeTokens.some(token => codeLower.includes(token.toLowerCase()));
            if (!tokenFound) return false; // reject: AI hallucinated this concept
        }
        return true;
    });
}

export async function analyzeKnowledgeFromCode(code: string): Promise<KnowledgeAnalysis> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('No API Key');

    const systemPrompt = `Eres un analizador de código Python para un sistema educativo. Tu tarea es leer el código fuente de los ejercicios que ha realizado un estudiante y extraer exactamente qué conceptos de programación ha utilizado o demostrado conocer.

Responde EXCLUSIVAMENTE con un JSON válido con esta estructura exacta (sin texto adicional, sin markdown, sin bloques de código):
{
  "concepts": ["concepto1", "concepto2", ...],
  "summary": "Una frase describiendo el nivel actual del estudiante"
}

Para los conceptos, usa etiquetas cortas y claras en español. Ejemplos de etiquetas VÁLIDAS para este nivel:
- Variables y tipos básicos (int, float, str, bool)
- Entrada de datos (input)
- Salida por pantalla (print)
- Operadores aritméticos
- Operadores de comparación
- Condicionales (if/elif/else)
- Bucle for
- Bucle while
- Listas
- Módulos e imports (import numpy, import math…)
- Manejo de cadenas (str methods)
- NumPy arrays (np.zeros, np.ones, np.arange, np.sum…)

PROHIBICIONES ABSOLUTAS — NUNCA incluyas estos conceptos aunque creas verlos:
- Funciones (def) / return — SOLO si hay literalmente "def " en el código
- Clases / POO / herencia — SOLO si hay literalmente "class " en el código
- Excepciones (try/except) — SOLO si hay literalmente "try:" en el código
- Diccionarios — SOLO si hay literalmente "dict(" o "= {" en el código
- Lambda, generadores, comprensiones de lista — SOLO si están explícitamente en el código
- Tuplas — SOLO si hay "tuple(" explícito (no confundas con paréntesis normales)

REGLA DE ORO: si no ves el token exacto en el código, NO incluyas el concepto. Sé conservador.`;

    const userPrompt = `Analiza el siguiente código Python de los ejercicios del estudiante y extrae los conceptos que conoce:\n\n${code.slice(0, 8000)}`;

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 800,
        }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';

    try {
        const parsed = JSON.parse(raw) as KnowledgeAnalysis;
        parsed.concepts = filterDetectedConcepts(parsed.concepts, code);
        return parsed;
    } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]) as KnowledgeAnalysis;
            parsed.concepts = filterDetectedConcepts(parsed.concepts, code);
            return parsed;
        }
        throw new Error('Respuesta de IA no parseable');
    }
}
