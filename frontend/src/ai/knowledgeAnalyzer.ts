const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export interface KnowledgeAnalysis {
    concepts: string[];
    summary: string;
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

Para los conceptos, usa etiquetas cortas y claras en español. Ejemplos de etiquetas:
- Variables y tipos básicos (int, float, str, bool)
- Entrada de datos (input)
- Salida por pantalla (print)
- Operadores aritméticos
- Operadores de comparación
- Condicionales (if/elif/else)
- Bucle for
- Bucle while
- Listas
- Tuplas
- Diccionarios
- Conjuntos (set)
- Funciones (def)
- Parámetros y retorno de funciones
- Recursividad
- Manejo de cadenas (str methods)
- Comprensiones de lista
- Manejo de archivos (open/read/write)
- Excepciones (try/except)
- Módulos e imports
- Programación orientada a objetos (clases)
- Herencia
- Lambda y funciones de orden superior
- Generadores

Sé conservador: solo incluye un concepto si aparece claramente usado en el código, no inferido.`;

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
        return JSON.parse(raw) as KnowledgeAnalysis;
    } catch {
        // Try extracting JSON if model added extra text
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]) as KnowledgeAnalysis;
        throw new Error('Respuesta de IA no parseable');
    }
}
