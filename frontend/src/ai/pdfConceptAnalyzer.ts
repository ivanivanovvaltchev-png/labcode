const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * Analyzes a PDF text and extracts Python/programming concepts that are NEW
 * (i.e., not already in the student's concept registry).
 *
 * Returns an array of short concept descriptions (max 8 new concepts).
 * Each description matches the format used in studentProfile.ts:
 *   "Concept: brief description" or "Syntax/method: what it does"
 *
 * Returns [] on error or if no new concepts are found.
 */
export async function analyzeConceptsFromPDF(
    pdfText: string,
    alreadyKnown: string[]
): Promise<string[]> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) return [];

    const knownBlock = alreadyKnown.length > 0
        ? `\nConceptos que el alumno YA CONOCE — NO los incluyas:\n${alreadyKnown.slice(0, 30).map(k => `- ${k}`).join('\n')}`
        : '';

    const systemPrompt = `Eres un analizador de material pedagógico de Python y programación.
Tu única misión: extraer los NUEVOS conceptos de Python/programación que introduce este material de clase.

REGLAS ESTRICTAS:
1. Extrae SOLO conceptos que aparezcan EXPLÍCITAMENTE en el texto del PDF
2. Cada concepto: máximo 10 palabras, descripción concreta y específica
3. Formato consistente con estos ejemplos:
   • "Diccionarios: crear con dict() y acceder por clave"
   • "Funciones def: definir, parámetros y return"
   • "List comprehensions: sintaxis [expr for x in lista]"
   • "Manejo de excepciones: try/except/finally"
4. Solo conceptos de Python/programación (ignora ejemplos narrativos o ejercicios)
5. Máximo 8 conceptos nuevos
6. Si el texto no introduce conceptos nuevos respecto a lo ya conocido → devuelve []
${knownBlock}

FORMATO DE RESPUESTA: Devuelve ÚNICAMENTE un JSON array de strings. Sin texto extra ni markdown.
["concepto nuevo 1", "concepto nuevo 2", ...]`;

    const userPrompt = `Material de clase a analizar (extrae conceptos Python NUEVOS, que no estén en la lista de ya conocidos):\n\n${pdfText.slice(0, 16000)}`;

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.2,
                max_tokens: 600,
            }),
        });

        if (!response.ok) return [];

        const data = await response.json();
        const raw: string = data.choices?.[0]?.message?.content ?? '[]';
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 3)
                .map(s => s.trim())
                .slice(0, 8);
        } catch {
            // Try to extract a JSON array from anywhere in the response
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (!match) return [];
            try {
                const parsed = JSON.parse(match[0]);
                return Array.isArray(parsed)
                    ? parsed.filter((s: unknown): s is string => typeof s === 'string').slice(0, 8)
                    : [];
            } catch { return []; }
        }
    } catch {
        return [];
    }
}
