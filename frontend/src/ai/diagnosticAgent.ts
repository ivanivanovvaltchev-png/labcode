import { CareerPath, PathSkill } from '../data/careerPaths';
import { TestQuestion } from '../lib/dailyTest';

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
    availableSkills: { name: string; importance: string; order: number }[],
    habilidadesValidadas: string[]
): Promise<DailyTaskRaw[]> {
    const skills = availableSkills.length > 0 ? availableSkills : path.skills;

    // Build the live allowlist for the AI — only concepts the student has unlocked
    const allowList = habilidadesValidadas.length > 0
        ? habilidadesValidadas.join(', ')
        : skills.slice(0, 5).map(s => s.name).join(', ');

    const systemPrompt = `Tu único objetivo es generar un JSON con exactamente 3 tarjetas.

REGLA ABSOLUTA DE CONTENIDO: Los conceptos, ejemplos de código y sintaxis que uses en las descriptions deben pertenecer ÚNICAMENTE a esta lista de habilidades validadas del estudiante:
${allowList}

Todo lo demás (funciones def/return, diccionarios, clases, SQL, tuplas, excepciones, POO, o cualquier concepto no listado arriba) está ESTRICTAMENTE PROHIBIDO. Romperá la aplicación y anulará el ejercicio.

FORMATO DE RESPUESTA — devuelve ÚNICAMENTE este JSON, sin texto extra, sin markdown, sin explicaciones:
[
  {"type": "review",   "title": "Repaso de Bucles y Condicionales", "description": "...", "skillRef": "Bucle for e iteración"},
  {"type": "practice", "title": "Proyecto Práctico de Consola",     "description": "...", "skillRef": "Listas"},
  {"type": "learn",    "title": "Introducción a Módulos Básicos",   "description": "...", "skillRef": "Arrays y módulos"}
]

Los campos "type", "title" y "skillRef" son FIJOS. Solo debes rellenar "description" con el enunciado concreto de cada tarjeta:

TARJETA 1 — type:"review", title:"Repaso de Bucles y Condicionales"
description: Escribe un enunciado donde el usuario recorra una lista de datos (strings o números definidos en el código) con un bucle for o while, y use if/elif/else para filtrar o clasificar cada elemento. Varía el escenario (precios, temperaturas, notas, edades, stocks).

TARJETA 2 — type:"practice", title:"Proyecto Práctico de Consola"
description: Escribe un enunciado de mini-programa interactivo con bucle while, menú numérico (opciones 1, 2, 3 y salir), y una lista que el usuario construye con input(). Escenarios: lista de la compra, control de temperaturas, registro de notas, inventario.

TARJETA 3 — type:"learn", title:"Introducción a Módulos Básicos"
description: Escribe un enunciado guiado paso a paso para usar "import random" o "import math" con una lista y un bucle for. Varía el ejercicio: generar números aleatorios, calcular raíces cuadradas, encontrar máximos, filtrar valores.`;

    const userPrompt = `Genera las 3 tarjetas. Varía el escenario de la description para que no se repita siempre el mismo ejemplo. Devuelve solo el JSON.`;

    const result = await deepSeekJSON<DailyTaskRaw[]>(systemPrompt, userPrompt);

    // Hard validation: if any task references a skill outside the available list, fix it
    const validNames = new Set(skills.map(s => s.name.toLowerCase()));
    const masteredSkills = skills.filter(s =>
        profileConcepts.some(c =>
            s.name.toLowerCase().split(' ').some(word => word.length > 3 && c.toLowerCase().includes(word))
        )
    );
    const nextSkills = skills.filter(s => !masteredSkills.find(m => m.name === s.name));
    return result.map((task, i) => {
        const isValid = validNames.has(task.skillRef.toLowerCase()) ||
            skills.some(s => s.name.toLowerCase().includes(task.skillRef.toLowerCase().split(' ')[0]));
        if (!isValid) {
            const fallback = (i === 0 ? masteredSkills[0] : nextSkills[0] ?? skills[0]);
            return { ...task, skillRef: fallback?.name ?? skills[0]?.name ?? task.skillRef };
        }
        return task;
    });
}

// ─── Daily Mini-Test Generator ────────────────────────────────────────────────

/**
 * Generates 3–5 multiple-choice theory questions for the daily Active Recall test.
 * Questions cover only skills within the student's current curriculum window.
 * Prioritises skills that have been failing recently (recentFailedSkills).
 */
export async function generateDailyTest(
    _path: CareerPath,
    availableSkills: PathSkill[],
    recentFailedSkills: string[],
    habilidadesValidadas: string[]
): Promise<TestQuestion[]> {
    // Pick up to 3 skills to test: failed ones first, then random from available
    const failed = availableSkills.filter(s => recentFailedSkills.includes(s.name) || recentFailedSkills.includes(s.id));
    const others = availableSkills.filter(s => !failed.find(f => f.id === s.id));
    const shuffled = [...failed, ...others.sort(() => Math.random() - 0.5)];
    const testSkills = shuffled.slice(0, 3);

    const skillList = testSkills.map(s => `"${s.name}"`).join(', ');

    // Build live allowlist — AI may only touch validated concepts
    const allowList = habilidadesValidadas.length > 0
        ? habilidadesValidadas.join(', ')
        : availableSkills.slice(0, 5).map(s => s.name).join(', ');

    const systemPrompt = `Eres un evaluador de teoría de programación Python. Generas preguntas de opción múltiple (A, B, C) sobre conceptos teóricos.

REGLA ABSOLUTA: Solo puedes generar preguntas sobre conceptos de esta lista de habilidades validadas del estudiante:
${allowList}

Todo lo demás (funciones def/return, diccionarios, tuplas, sets, clases, excepciones, archivos, SQL, POO, o cualquier concepto no listado arriba) está ESTRICTAMENTE PROHIBIDO — aunque parezca relevante o útil.

FORMATO — devuelve ÚNICAMENTE un JSON array sin texto extra ni markdown:
[
  {
    "id": "q1",
    "question": "Pregunta teórica clara y concisa",
    "options": { "A": "opción A", "B": "opción B", "C": "opción C" },
    "correctAnswer": "A",
    "explanation": "Explicación breve de por qué esa es la respuesta correcta",
    "skillRef": "nombre exacto del skill evaluado"
  }
]

REGLAS DE CALIDAD:
- Las preguntas deben evaluar la TEORÍA (qué hace, por qué, cuándo usar), no pedir escribir código.
- Ejemplo válido: "¿Qué devuelve list.append() en Python?" → A: None B: la lista C: el elemento añadido
- Las opciones incorrectas deben ser plausibles (errores comunes reales, no tonterías).
- Una pregunta por skill de la lista recibida.`;

    const userPrompt = `Genera exactamente ${testSkills.length} preguntas de teoría sobre estos skills: ${skillList}.
${recentFailedSkills.length > 0 ? `El estudiante ha fallado recientemente en: ${recentFailedSkills.join(', ')}. Prioriza esos conceptos.` : ''}
Varía el tipo de pregunta (¿qué hace?, ¿cuándo usar?, ¿cuál es el resultado?, ¿qué error da?).`;

    const result = await deepSeekJSON<TestQuestion[]>(systemPrompt, userPrompt);
    return result.slice(0, 5); // safety cap
}
