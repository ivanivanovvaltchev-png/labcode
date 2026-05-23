import { CareerPath } from '../data/careerPaths';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export interface DiagnosticQuestion {
    id: string;
    question: string;
    hint: string;
    skillRef: string;
}

export interface QuestionEvaluation {
    questionId: string;
    score: number;       // 0-10
    feedback: string;
    isWeak: boolean;     // score < 5
}

export interface ExamEvaluation {
    totalScore: number;  // 0-100
    xpEarned: number;
    weakAreas: string[];
    strongAreas: string[];
    summary: string;
    evaluations: QuestionEvaluation[];
}

export interface DailyTaskRaw {
    type: 'learn' | 'practice' | 'review';
    title: string;
    description: string;
    skillRef: string;
}

async function deepSeekRaw(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('No API Key');
    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            temperature: 0.6,
            max_tokens: 600,
        }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return (data.choices?.[0]?.message?.content ?? '').trim();
}

export async function generateSkillExercise(
    skillName: string,
    pathTitle: string,
    profileConcepts: string[]
): Promise<string> {
    const known = profileConcepts.length > 0
        ? `El estudiante ya conoce: ${profileConcepts.slice(0, 8).join(', ')}.`
        : '';

    const systemPrompt = `Eres un profesor experto en programación. Genera enunciados de ejercicios prácticos.

REGLAS ESTRICTAS:
- Devuelve ÚNICAMENTE el texto del enunciado. Nada más.
- Sin markdown, sin títulos, sin "Ejercicio:", sin explicaciones adicionales.
- El ejercicio debe ser resoluble en 15-30 minutos
- Incluye ejemplos de entrada/salida cuando aplique
- Redacta en español claro y directo`;

    const userPrompt = `Camino: ${pathTitle}
Habilidad a practicar: ${skillName}
${known}

Genera un ejercicio práctico y concreto para practicar "${skillName}".
Contexto realista, instrucciones claras, nivel adecuado para alguien que está aprendiendo.`;

    return deepSeekRaw(systemPrompt, userPrompt);
}

async function deepSeekJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('No API Key');

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';

    // Strip markdown code blocks if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try { return JSON.parse(cleaned) as T; }
    catch {
        const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (match) return JSON.parse(match[0]) as T;
        throw new Error('Respuesta de IA no parseable');
    }
}

export async function generateDiagnosticExam(
    path: CareerPath,
    profileConcepts: string[]
): Promise<DiagnosticQuestion[]> {
    const knownConcepts = profileConcepts.length > 0
        ? `El estudiante ha subido ejercicios. Conceptos detectados: ${profileConcepts.join(', ')}.`
        : 'El estudiante no ha subido ejercicios previos. Genera preguntas desde nivel básico.';

    const systemPrompt = `Eres un evaluador experto en programación. Tu tarea es generar un examen diagnóstico para determinar el nivel real de un estudiante.

FORMATO DE RESPUESTA: Solo JSON válido, sin texto adicional, sin markdown.
[
  {
    "id": "q1",
    "question": "pregunta completa y clara aquí",
    "hint": "pista opcional para el estudiante si no sabe por dónde empezar",
    "skillRef": "nombre del skill que evalúa"
  }
]`;

    const userPrompt = `Camino: ${path.title} (objetivo: ${path.jobTitle})
${knownConcepts}

Genera exactamente 5 preguntas diagnósticas para evaluar el nivel real del estudiante en este camino.
Las preguntas deben ser prácticas y concretas (no de verdadero/falso ni test).
Mezcla teoría y código. Ordénalas de menor a mayor dificultad.
Habilidades clave a evaluar: ${path.skills.filter(s => s.importance === 'critical').slice(0, 8).map(s => s.name).join(', ')}`;

    return await deepSeekJSON<DiagnosticQuestion[]>(systemPrompt, userPrompt);
}

export async function evaluateDiagnosticExam(
    path: CareerPath,
    questions: DiagnosticQuestion[],
    answers: Record<string, string>
): Promise<ExamEvaluation> {
    const systemPrompt = `Eres un evaluador experto y justo. Evalúa las respuestas del estudiante con criterio pedagógico.

FORMATO DE RESPUESTA: Solo JSON válido, sin texto adicional, sin markdown.
{
  "totalScore": número_0_a_100,
  "xpEarned": número_0_a_1000,
  "weakAreas": ["skill1", "skill2"],
  "strongAreas": ["skill3"],
  "summary": "feedback motivador de 2-3 frases sobre el nivel actual y próximos pasos",
  "evaluations": [
    {
      "questionId": "q1",
      "score": número_0_a_10,
      "feedback": "feedback específico sobre esta respuesta",
      "isWeak": true_o_false
    }
  ]
}

Reglas de puntuación:
- 0-3: No sabe o muy incompleto
- 4-6: Conceptos básicos pero sin dominio
- 7-8: Buen nivel
- 9-10: Dominio completo
xpEarned = totalScore * 10 (máximo 1000 XP)
isWeak = true si score < 5`;

    const questionsAndAnswers = questions.map(q => ({
        id: q.id,
        pregunta: q.question,
        skillRef: q.skillRef,
        respuesta: answers[q.id] || '(sin respuesta)',
    }));

    const userPrompt = `Camino: ${path.title}
Evalúa las siguientes respuestas del estudiante:
${JSON.stringify(questionsAndAnswers, null, 2)}`;

    return await deepSeekJSON<ExamEvaluation>(systemPrompt, userPrompt);
}

export async function generateDailyPlan(
    path: CareerPath,
    weakAreas: string[],
    profileConcepts: string[],
    availableSkills: { name: string; importance: string; order: number }[]
): Promise<DailyTaskRaw[]> {
    // If no available skills, fall back to all skills
    const skills = availableSkills.length > 0 ? availableSkills : path.skills;

    // Separate mastered (review/practice candidates) from next-to-learn
    const masteredSkills = skills.filter(s =>
        profileConcepts.some(c =>
            s.name.toLowerCase().split(' ').some(word => word.length > 3 && c.toLowerCase().includes(word))
        )
    );
    const nextSkills = skills.filter(s => !masteredSkills.find(m => m.name === s.name));

    // Only weak areas that are in available skills
    const relevantWeakAreas = weakAreas.filter(w =>
        skills.some(s => s.name.toLowerCase().includes(w.toLowerCase().split(' ')[0]))
    );

    // Build numbered list — LLMs respect numbered lists much better
    const numberedList = skills
        .map((s, i) => `  ${i + 1}. "${s.name}"`)
        .join('\n');

    const systemPrompt = `Actúa como el Núcleo de Inteligencia del "Proyecto Súper Soldado de Programación". Tu única tarea es generar las 3 tarjetas de "Tu entrenamiento de hoy" (Repasar, Practicar, Aprender) basándote EXCLUSIVAMENTE en el nivel actual del usuario.

CRITICAL SAFETY RULE: El usuario NO SABE programar funciones. Queda TERMINANTEMENTE PROHIBIDO generar cualquier ejercicio que pida usar las palabras "def", "return", "parámetros" o "funciones". Si rompes esta regla, la aplicación fallará.

NIVEL DEL USUARIO — lo único permitido:
- Variables y tipos de datos básicos (int, float, str, bool)
- Condicionales: if / elif / else
- Listas simples: crear, recorrer, .append(), len(), indexar
- Bucles: for y while
PROHIBIDO sin excepción: def, return, diccionarios {}, tuplas (), sets, clases, objetos, archivos, métodos avanzados de string, pseudocódigo (ya lo domina).

FORMATO — devuelve ÚNICAMENTE este JSON, sin texto extra, sin markdown:
[
  {"type": "review", "title": "...", "description": "...", "skillRef": "..."},
  {"type": "practice", "title": "...", "description": "...", "skillRef": "..."},
  {"type": "learn", "title": "...", "description": "...", "skillRef": "..."}
]

REGLAS POR TARJETA:
1. Tarjeta 1 — "review" (Repasar): OBLIGATORIAMENTE combina condicionales (if/elif/else) con listas o bucles. Ejemplo válido: recorrer una lista de números y mostrar solo los mayores que 10. PROHIBIDO mencionar funciones, def o return en esta tarjeta.
2. Tarjeta 2 — "practice" (Practicar): Reto del mundo real (mini-inventario, control de accesos, registro de notas) usando bucles + listas + condicionales. Sin funciones.
3. Tarjeta 3 — "learn" (Aprender): Introducción práctica a importar un módulo estándar (math o random) — Tema 4 que está comenzando ahora. Sin funciones, sin def.

RESTRICCIÓN ABSOLUTA SOBRE skillRef:
Los "skillRef" SOLO pueden ser nombres de esta lista numerada:
${numberedList}

PROHIBIDO usar cualquier skillRef que no aparezca en esa lista.`;

    const masteredNames = masteredSkills.map(s => s.name).join(', ') || 'conceptos básicos';
    const nextNames = nextSkills.slice(0, 2).map(s => s.name).join(', ') || skills[0]?.name;
    const weakFiltered = relevantWeakAreas.length > 0 ? relevantWeakAreas.join(', ') : 'ninguna';

    const userPrompt = `Camino: ${path.title}
Ya estudiado: ${masteredNames}
Próximo a aprender: ${nextNames}
Puntos débiles (de lo ya estudiado): ${weakFiltered}

Genera 3 tareas de 15-20 minutos cada una.
- Si hay puntos débiles, pon una tarea de repaso sobre ellos.
- Pon una tarea de práctica sobre lo ya estudiado.
- Pon una tarea de introducción a la siguiente habilidad pendiente.
Todos los skillRef DEBEN ser exactamente el nombre de una habilidad de la lista numerada.`;

    const result = await deepSeekJSON<DailyTaskRaw[]>(systemPrompt, userPrompt);

    // Hard validation: if any task references a skill outside the available list, fix it
    const validNames = new Set(skills.map(s => s.name.toLowerCase()));
    return result.map((task, i) => {
        const isValid = validNames.has(task.skillRef.toLowerCase()) ||
            skills.some(s => s.name.toLowerCase().includes(task.skillRef.toLowerCase().split(' ')[0]));
        if (!isValid) {
            // Replace with a valid skill from the available list
            const fallback = (i === 0 ? masteredSkills[0] : nextSkills[0] ?? skills[0]);
            return { ...task, skillRef: fallback?.name ?? skills[0]?.name ?? task.skillRef };
        }
        return task;
    });
}
