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
    _weakAreas: string[],
    profileConcepts: string[],
    availableSkills: { name: string; importance: string; order: number }[]
): Promise<DailyTaskRaw[]> {
    // If no available skills, fall back to all skills
    const skills = availableSkills.length > 0 ? availableSkills : path.skills;

    // Keep these for post-generation validation only
    const masteredSkills = skills.filter(s =>
        profileConcepts.some(c =>
            s.name.toLowerCase().split(' ').some(word => word.length > 3 && c.toLowerCase().includes(word))
        )
    );
    const nextSkills = skills.filter(s => !masteredSkills.find(m => m.name === s.name));

    const systemPrompt = `Tu único objetivo es generar un JSON con exactamente 3 tarjetas. Tienes prohibido usar los términos "funciones", "parámetros", "retornos" o "def" en cualquier parte de la respuesta.

FORMATO DE RESPUESTA — devuelve ÚNICAMENTE este JSON, sin texto extra, sin markdown, sin explicaciones:
[
  {"type": "review",   "title": "Repaso de Bucles y Condicionales", "description": "...", "skillRef": "Bucle for e iteración"},
  {"type": "practice", "title": "Proyecto Práctico de Consola",     "description": "...", "skillRef": "Listas"},
  {"type": "learn",    "title": "Introducción a Módulos Básicos",   "description": "...", "skillRef": "Arrays y módulos"}
]

Los campos "type", "title" y "skillRef" son FIJOS. Solo debes rellenar "description" con el enunciado concreto de cada tarjeta siguiendo estas reglas estrictas:

TARJETA 1 — type:"review", title:"Repaso de Bucles y Condicionales"
description: Escribe un enunciado concreto donde el usuario deba recorrer una lista de datos (strings o números ya definidos en el código) con un bucle for o while, y usar if/elif/else para filtrar o clasificar cada elemento. Ejemplo válido: "Dada la lista [12, 5, 8, 20, 3], recórrela con un bucle for y muestra si cada número es mayor, menor o igual a 10." Varía el escenario en cada generación (precios, temperaturas, notas, edades, stocks). PROHIBIDO: mencionar def, return, pseudocódigo o cualquier tema avanzado.

TARJETA 2 — type:"practice", title:"Proyecto Práctico de Consola"
description: Escribe un enunciado de mini-programa interactivo que use un bucle while con un menú numérico (opciones 1, 2, 3... y una opción para salir). El programa debe gestionar una lista que el usuario va construyendo con input(). Escenarios válidos: lista de la compra, registro de temperaturas, control de asistencia, inventario simple. PROHIBIDO: def, return, diccionarios, pseudocódigo.

TARJETA 3 — type:"learn", title:"Introducción a Módulos Básicos"
description: Escribe un enunciado guiado paso a paso para usar "import random" o "import math" (Tema 4 del Máster). El ejercicio debe combinar el módulo con una lista y un bucle for. Ejemplo válido: generar una lista de N números aleatorios con random.randint y luego filtrarlos. PROHIBIDO: pseudocódigo, def, return, ordenación abstracta matemática.`;

    const userPrompt = `Genera las 3 tarjetas siguiendo exactamente el formato y las reglas del system prompt. Varía el escenario concreto de la description para que no se repita siempre el mismo ejemplo. Devuelve solo el JSON.`;

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
