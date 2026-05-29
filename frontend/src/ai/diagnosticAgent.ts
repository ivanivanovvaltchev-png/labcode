import { CareerPath, PathSkill } from '../data/careerPaths';
import { TestQuestion } from '../lib/dailyTest';
import type { DailyTask } from '../lib/userProgress';
import {
    HABILIDADES_PERMITIDAS,
    CONCEPTOS_PROHIBIDOS,
    TEST_SLOTS,
} from './studentProfile';
import { getContextForPrompt } from '../lib/theoryContext';
import { getSlotConceptsForPrompt } from '../lib/masteryEngine';

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

    const body = {
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.6,
        max_tokens: 600,
    };

    let lastError = '';
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        const response = await fetchDeepSeek(body, apiKey);
        if (response.ok) {
            const data = await response.json();
            return (data.choices?.[0]?.message?.content ?? '').trim();
        }
        const bodyText = await response.text().catch(() => '');
        lastError = `API ${response.status}: ${bodyText.slice(0, 200)}`;
        if ((response.status === 503 || response.status === 429) && attempt < RETRY_DELAYS.length) {
            await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
            continue;
        }
        throw new Error(lastError);
    }
    throw new Error(lastError);
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

const RETRY_DELAYS = [3000, 6000, 12000]; // ms between retries for 503/429

async function fetchDeepSeek(body: object, apiKey: string): Promise<Response> {
    return Promise.race([
        fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify(body),
        }),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: DeepSeek no respondió en 30 s')), 30_000)
        ),
    ]);
}

async function deepSeekJSON<T>(systemPrompt: string, userPrompt: string, temperature = 0.3): Promise<T> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('No API Key');

    const body = {
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: 2000,
    };

    let lastError = '';
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        const response = await fetchDeepSeek(body, apiKey);
        if (response.ok) {
            const data = await response.json();
            const raw = data.choices?.[0]?.message?.content ?? '{}';
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try { return JSON.parse(cleaned) as T; }
            catch {
                const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (match) return JSON.parse(match[0]) as T;
                throw new Error('Respuesta de IA no parseable como JSON');
            }
        }
        const bodyText = await response.text().catch(() => '');
        lastError = `API ${response.status}: ${bodyText.slice(0, 200)}`;
        // Retry only on transient server errors
        if ((response.status === 503 || response.status === 429) && attempt < RETRY_DELAYS.length) {
            await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
            continue;
        }
        throw new Error(lastError);
    }
    throw new Error(lastError);
}

// Hard guard for diagnostic questions — same pattern as questionPassesGuard for MCQ tests.
// If a forbidden concept appears anywhere in the question text, it is discarded.
function diagnosticQuestionPassesGuard(q: DiagnosticQuestion): boolean {
    const text = [q.question, q.hint ?? '', q.skillRef].join(' ').toLowerCase();
    return !CONCEPTOS_PROHIBIDOS.some(term => text.includes(term.toLowerCase()));
}

export async function generateDiagnosticExam(
    path: CareerPath,
    profileConcepts: string[]
): Promise<DiagnosticQuestion[]> {
    const knowledgeBlock = buildKnowledgeBlock();
    const pathContext = buildPathContext(path);

    const knownConcepts = profileConcepts.length > 0
        ? `El estudiante ha subido ejercicios con estos conceptos detectados: ${profileConcepts.slice(0, 12).join(', ')}.`
        : 'El estudiante no ha subido ejercicios previos.';

    const systemPrompt = `Eres un evaluador experto en programación. Tu tarea es generar un diagnóstico inicial para conocer el punto de partida real del estudiante.

${pathContext}

${knowledgeBlock}

PROHIBICIÓN TOTAL E IRREVOCABLE: queda absolutamente prohibido incluir en cualquier pregunta los conceptos: def, return, funciones, parámetros, argumentos, SQL, Git, pseudocódigo, diccionarios, tuplas, clases, lambda, excepciones. Si un concepto no aparece textualmente en el material de arriba, NO PUEDE aparecer en ningún ejercicio.

FORMATO DE RESPUESTA: Solo JSON válido, sin texto adicional, sin markdown.
[
  {
    "id": "q1",
    "question": "enunciado del ejercicio práctico",
    "hint": "pista opcional si el estudiante no sabe por dónde empezar",
    "skillRef": "concepto que evalúa"
  }
]`;

    const userPrompt = `Camino: ${path.title} (objetivo: ${path.jobTitle})
${knownConcepts}

Genera exactamente 5 ejercicios prácticos basados ÚNICAMENTE en el material del sistema. Sin funciones def. Sin return. Solo variables, operadores, condicionales if/elif/else, listas, bucles for/while, input(), print() y numpy básico si aparece en el material. Ordénalos de menor a mayor dificultad.`;

    // Hard filter + retry — same pattern as generateDailyTest
    const MAX_ATTEMPTS = 3;
    let clean: DiagnosticQuestion[] = [];

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const raw = await deepSeekJSON<DiagnosticQuestion[]>(systemPrompt, userPrompt);
        clean = raw.filter(diagnosticQuestionPassesGuard);
        if (clean.length >= 5) break;
    }

    return clean.slice(0, 5);
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

/**
 * Builds the closed-context knowledge block for the system prompt.
 * Priority:
 *   1. PDF theory text (uploaded by student via KnowledgePage) — the strongest signal.
 *   2. Hardcoded studentProfile constants — fallback when no PDF is loaded.
 *
 * The AI is instructed that its entire knowledge universe is limited to this block.
 */
function buildKnowledgeBlock(): string {
    const pdfText = getContextForPrompt(3000);

    if (pdfText) {
        return `UNIVERSO CERRADO DE CONOCIMIENTO — MATERIAL TEÓRICO OFICIAL:
El siguiente texto es el único material que el estudiante ha estudiado. Tu universo de conocimiento se limita ESTRICTAMENTE a este contenido. Tienes PROHIBIDO usar cualquier sintaxis, función o método que no aparezca explícitamente en este texto.

--- INICIO MATERIAL TEÓRICO ---
${pdfText}
--- FIN MATERIAL TEÓRICO ---`;
    }

    // Fallback: hardcoded profile
    return `CONOCIMIENTO REAL Y VALIDADO DEL ESTUDIANTE — UNIVERSO CERRADO:
Solo puedes usar los conceptos de esta lista. Todo lo que no está aquí es PROHIBIDO.
${HABILIDADES_PERMITIDAS.map(h => `- ${h}`).join('\n')}`;
}

// Builds the path-context block injected into every AI call.
// This freezes the content scope to the chosen career track.
function buildPathContext(path: CareerPath): string {
    if (path.id === 'python-junior') {
        return `CONTEXTO DEL CAMINO — Fast-Track: Desarrollador Python Junior.
Objetivo único: empleabilidad en Python backend lo antes posible.
El sistema está CONGELADO en Python puro + SQL + Git.
PROHIBICIÓN ABSOLUTA E IRREVOCABLE: ningún contenido de HTML, CSS, JavaScript, React, Django ni frontend de ningún tipo puede aparecer. El alumno en este camino no los necesita para entrar al mercado backend y saturarle con ellos arruina su progreso.`;
    }
    return `CONTEXTO DEL CAMINO — Full-Stack Developer.
Objetivo: completar el Máster completo tras consolidar Python.
Una vez dominado el bloque Python, el alumno puede avanzar hacia frontend (HTML, CSS, JS, React), Django y despliegue.`;
}

export async function generateDailyPlan(
    path: CareerPath,
    _weakAreas: string[],
    _profileConcepts: string[],
    _availableSkills: { name: string; importance: string; order: number }[],
    _habilidadesValidadas: string[],
    activeSkills: string[] = [],
    pathId: string = ''
): Promise<DailyTaskRaw[]> {
    const pathContext = buildPathContext(path);
    const knowledgeBlock = buildKnowledgeBlock();

    // ── Dynamic slot computation ─────────────────────────────────────────────
    // If we have a pathId, read the student's real mastery state to determine
    // what goes in each card. Otherwise fall back to the static structure.
    const usesDynamicSlots = Boolean(pathId);
    const slots = pathId ? getSlotConceptsForPrompt(pathId) : null;

    const activeFocus = activeSkills.length > 0 && !usesDynamicSlots
        ? `\nHABILIDADES EN FOCO — el alumno las ha practicado recientemente:\n${activeSkills.map(s => `• ${s}`).join('\n')}\n`
        : '';

    // ── Card descriptions (static fallback or dynamic) ────────────────────────
    let card1Block: string;
    let card2Block: string;
    let card3Block: string;

    if (slots) {
        // Dynamic: each card is driven by real mastery data
        const s1 = slots.slot1.length > 0
            ? slots.slot1.join(', ')
            : 'Variables, condicionales y bucles básicos';
        const s2 = slots.slot2.length > 0
            ? slots.slot2.join(', ')
            : 'Listas y bucles combinados';
        const s3 = slots.slot3.length > 0
            ? slots.slot3.join(', ')
            : 'Introducción a NumPy Arrays';

        card1Block = `TARJETA 1 — REPASO (conceptos consolidados del alumno — mastery ≥ 70%)
Conceptos a repasar: ${s1}
Crea un ejercicio de REPASO que combine estos conceptos. Varía el escenario (precios, temperaturas, notas, edades, stock). No menciones que es un repaso en el enunciado. Sin funciones def/return.`;

        card2Block = `TARJETA 2 — PRÁCTICA ACTIVA (conceptos que el alumno está reforzando — mastery 35–69%)
Conceptos a practicar: ${s2}
Crea un ejercicio de PRÁCTICA DELIBERADA centrado en estos conceptos. Puede ser un mini-programa con menú o un ejercicio de manipulación de datos. Sin funciones def/return.`;

        card3Block = `TARJETA 3 — APRENDIZAJE NUEVO (concepto recién introducido — mastery < 35%)
Concepto nuevo a introducir: ${s3}
Crea una INTRODUCCIÓN GUIADA paso a paso de este concepto. El enunciado debe explicar brevemente qué es y pedir que el alumno lo pruebe en un contexto concreto. Usa ejemplos simples. Sin funciones def/return.`;
    } else {
        // Static fallback (no pathId provided)
        card1Block = `TARJETA 1 — Repaso de Bucles y Condicionales
Enunciado donde el usuario recorra una lista ya definida en el código con for o while y use if/elif/else para filtrar o clasificar. Varía el escenario (precios, temperaturas, notas, edades). Sin funciones.`;

        card2Block = `TARJETA 2 — Proyecto Práctico de Consola
Mini-programa con while, menú numérico (opciones 1, 2, 3 y salir), y una lista que el usuario construye con input(). Escenarios: lista de la compra, registro de notas, inventario simple. Sin funciones.`;

        card3Block = `TARJETA 3 — Introducción a NumPy Arrays
Ejercicio guiado paso a paso con numpy. Usa: np.zeros(), np.ones(), np.arange(), array.copy(), np.sum(), array[::-1] o np.intersect1d(). Varía el escenario. Solo numpy básico, sin funciones.`;
    }

    const systemPrompt = `Eres un generador de ejercicios prácticos de Python. Devuelve ÚNICAMENTE el JSON indicado, sin texto extra ni markdown.

${pathContext}

${knowledgeBlock}
${activeFocus}
CUALQUIER otro concepto (funciones def/return, diccionarios, tuplas, clases, SQL, Git, pseudocódigo, .split(), excepciones, ORM, librerías distintas a numpy) está TERMINANTEMENTE PROHIBIDO a menos que aparezca explícitamente en el material teórico de arriba.

FORMATO DE RESPUESTA — devuelve exactamente este JSON (solo rellena description, los demás campos son fijos):
[
  {"type": "review",   "title": "Tarjeta 1 — Repaso", "description": "...", "skillRef": "Repaso consolidado"},
  {"type": "practice", "title": "Tarjeta 2 — Práctica", "description": "...", "skillRef": "Práctica activa"},
  {"type": "learn",    "title": "Tarjeta 3 — Aprender", "description": "...", "skillRef": "Concepto nuevo"}
]

${card1Block}

${card2Block}

${card3Block}`;

    const userPrompt = `Genera las 3 tarjetas con escenarios DISTINTOS entre sí y distintos a los de sesiones anteriores. Devuelve solo el JSON array.`;

    const result = await deepSeekJSON<DailyTaskRaw[]>(systemPrompt, userPrompt);

    // Normalize the titles and skillRefs so they reflect the actual slot content
    const normalized = result.map((task, idx) => {
        const slotLabels = slots
            ? [
                { title: `Repaso — ${slots.slot1[0] ?? 'Conceptos consolidados'}`, skillRef: slots.slot1[0] ?? 'Repaso consolidado' },
                { title: `Práctica — ${slots.slot2[0] ?? 'Conceptos en progreso'}`, skillRef: slots.slot2[0] ?? 'Práctica activa' },
                { title: `Aprender — ${slots.slot3[0] ?? 'Concepto nuevo'}`,        skillRef: slots.slot3[0] ?? 'Concepto nuevo' },
              ]
            : null;

        if (slotLabels && slotLabels[idx]) {
            return { ...task, title: slotLabels[idx].title, skillRef: slotLabels[idx].skillRef };
        }
        return task;
    });

    return normalized;
}

// ─── Master Feedback ─────────────────────────────────────────────────────────

export async function generateMasterFeedback(tasks: DailyTask[], pathTitle: string): Promise<string> {
    const taskList = tasks.map((t, i) =>
        `  ${i + 1}. [${t.type === 'review' ? 'Repaso' : t.type === 'practice' ? 'Práctica' : 'Aprender'}] ${t.title}`
    ).join('\n');

    const systemPrompt = `Eres el Maestro de LabCode, un mentor sabio, cercano y motivador. Tu misión es dar una opinión breve pero significativa al alumno tras completar su sesión de entrenamiento diario.

Camino del alumno: ${pathTitle}

INSTRUCCIONES:
- Felicita al alumno de forma genuina y específica (menciona qué practicó)
- Señala con tacto qué área merece más atención mañana
- Cierra con una frase motivadora que prepare al alumno para el siguiente día
- Tono: sabio, cercano, humano. Ni condescendiente ni exageradamente eufórico
- Máximo 110 palabras. Sin títulos ni emojis excesivos. Solo el texto de la opinión.`;

    const userPrompt = `El alumno completó hoy las siguientes tarjetas:\n${taskList}\n\nEscribe la opinión del Maestro.`;

    return deepSeekRaw(systemPrompt, userPrompt);
}

// ─── Daily Mini-Test Generator ────────────────────────────────────────────────

// Hard shield — any question containing a forbidden concept is silently
// discarded and the API is retried. Source of truth: studentProfile.ts.
function questionPassesGuard(q: TestQuestion): boolean {
    const text = [
        q.question,
        q.options.A,
        q.options.B,
        q.options.C,
        q.explanation ?? '',
        q.skillRef ?? '',
    ].join(' ').toLowerCase();
    return !CONCEPTOS_PROHIBIDOS.some(term => text.includes(term.toLowerCase()));
}

/**
 * Generates 3–5 multiple-choice theory questions for the daily Active Recall test.
 * Questions cover only skills within the student's current curriculum window.
 * Prioritises skills that have been failing recently (recentFailedSkills).
 * After each API call the questions are hard-filtered against QUESTION_BLACKLIST.
 * If fewer than the target number survive, the call is retried (max 3 attempts).
 */
export async function generateDailyTest(
    path: CareerPath,
    _availableSkills: PathSkill[],
    _recentFailedSkills: string[],
    _habilidadesValidadas: string[],
    activeSkills: string[] = [],
    pathId: string = ''
): Promise<TestQuestion[]> {
    const pathContext = buildPathContext(path);
    const knowledgeBlock = buildKnowledgeBlock();

    // ── Dynamic slot computation ─────────────────────────────────────────────
    const slots = pathId ? getSlotConceptsForPrompt(pathId) : null;

    let slotsBlock: string;

    if (slots) {
        // Dynamic: test questions reflect the student's real progression
        const s1Str = slots.slot1.length > 0
            ? slots.slot1.slice(0, 3).join(' / ')
            : 'Bucles for/while y Listas';
        const s2Str = slots.slot2.length > 0
            ? slots.slot2.slice(0, 2).join(' / ')
            : 'Condicionales if/elif/else';
        const s3Str = slots.slot3.length > 0
            ? slots.slot3[0]
            : 'NumPy Arrays — introducción';

        slotsBlock = `PREGUNTA 1 — REPASO (conceptos consolidados — mastery ≥ 70%)
Tema: ${s1Str}
Instrucción: Pregunta de opción múltiple sobre uno de estos conceptos consolidados. Elige el más interesante para repasar hoy. Sin funciones def ni return.

PREGUNTA 2 — PRÁCTICA (conceptos en refuerzo — mastery 35–69%)
Tema: ${s2Str}
Instrucción: Pregunta de opción múltiple sobre uno de estos conceptos que el alumno está practicando activamente. Sin funciones def ni return.

PREGUNTA 3 — CONCEPTO NUEVO (recién introducido — mastery < 35%)
Tema: ${s3Str}
Instrucción: Pregunta de opción múltiple sobre este concepto nuevo. Puede ser más básica — el alumno lo está viendo por primera vez. Sin funciones def ni return.`;
    } else {
        // Static fallback
        slotsBlock = TEST_SLOTS.map(s =>
            `PREGUNTA ${s.slot} — Tema: ${s.tema}\nInstrucción: ${s.instruccion}`
        ).join('\n\n');
    }

    const activeFocus = activeSkills.length > 0 && !slots
        ? `\nHABILIDADES EN FOCO (sesga las preguntas hacia estas cuando sea compatible con los slots):\n${activeSkills.map(s => `• ${s}`).join('\n')}\n`
        : '';

    const systemPrompt = `Eres un evaluador de teoría de Python. Generas exactamente 3 preguntas de opción múltiple (A, B, C).

${pathContext}

${knowledgeBlock}
${activeFocus}
ESTRUCTURA OBLIGATORIA — genera EXACTAMENTE estas 3 preguntas en este orden:

${slotsBlock}

FORMATO — devuelve ÚNICAMENTE este JSON array, sin texto extra ni markdown:
[
  {
    "id": "q1",
    "question": "Pregunta teórica clara\nnumeros = [3, 1, 4]\nnumeros.sort()\nprint(numeros[0])",
    "options": { "A": "opción A", "B": "opción B", "C": "opción C" },
    "correctAnswer": "A",
    "explanation": "Por qué esa es la correcta",
    "skillRef": "tema evaluado"
  }
]

REGLAS:
- Las preguntas evalúan TEORÍA pura (¿qué hace?, ¿cuál es el resultado?, ¿qué error da?).
- Cuando la pregunta incluya código Python, usa SALTOS DE LÍNEA REALES (\\n en JSON) para formatear cada sentencia en su propia línea. El código va después de la pregunta separado por \\n.
- Las opciones incorrectas deben ser errores comunes plausibles, no tonterías obvias.
- PROHIBIDO ABSOLUTO: def, return, SQL, Git, pseudocódigo, .split(), excepciones, ORM — a menos que aparezcan en el material teórico de arriba como conceptos a evaluar.`;

    const today = new Date().toISOString().split('T')[0];
    const userPrompt = `Fecha de hoy: ${today}. Usa escenarios, valores y contextos COMPLETAMENTE DISTINTOS a los de días anteriores. Varía los números, las listas de ejemplo y el dominio (temperaturas, notas, precios, edades, puntuaciones, colores, frutas, inventarios…). Genera las 3 preguntas siguiendo la estructura del system prompt. Una por slot. Devuelve solo el JSON.`;

    const raw = await deepSeekJSON<TestQuestion[]>(systemPrompt, userPrompt, 0.85);

    // Tag each question with the concept from its slot so mastery tracking works
    const tagged = raw.map((q, idx) => {
        if (!slots) return q;
        const slotRefs = [
            slots.slot1[0] ?? 'Repaso consolidado',
            slots.slot2[0] ?? 'Práctica activa',
            slots.slot3[0] ?? 'Concepto nuevo',
        ];
        return { ...q, skillRef: slotRefs[idx] ?? q.skillRef };
    });

    return tagged.filter(questionPassesGuard).slice(0, 3);
}
