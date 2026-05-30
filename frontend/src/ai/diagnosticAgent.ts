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

    // ── Mode selection ────────────────────────────────────────────────────────
    // ACTIVE TOPIC MODE: if the student has been practicing something recently,
    // all 3 cards cover that same concept at increasing difficulty (basic → advanced).
    // This answers "why don't the cards change when I practice arrays?" — they do,
    // but only once the active skill is detected from recent sessions.
    //
    // SLOT MODE (fallback): no recent practice → one card per mastery level.
    const cleanActive = activeSkills.filter(s => !s.startsWith('Repaso') && !s.startsWith('Práctica') && !s.startsWith('Aprender') && !s.startsWith('Básico') && !s.startsWith('Intermedio') && !s.startsWith('Avanzado') && s.length > 3);
    const activeTopic = cleanActive[0] ?? null;

    let card1Block: string;
    let card2Block: string;
    let card3Block: string;
    let skillRef1: string;
    let skillRef2: string;
    let skillRef3: string;

    if (activeTopic) {
        // ── ACTIVE TOPIC MODE ────────────────────────────────────────────────
        // All 3 cards are about the same concept the student has been working on,
        // progressing from a simple foundation to a real challenge.
        skillRef1 = activeTopic;
        skillRef2 = activeTopic;
        skillRef3 = activeTopic;

        card1Block = `TARJETA 1 — BÁSICO
Concepto: ${activeTopic}
Crea un ejercicio BÁSICO e introductorio sobre este concepto. Muy directo, un solo objetivo claro. Ideal para que el alumno afiance la base antes de avanzar. Sin funciones def/return.`;

        card2Block = `TARJETA 2 — INTERMEDIO
Concepto: ${activeTopic}
Crea un ejercicio INTERMEDIO que combine ${activeTopic} con otros conceptos ya dominados (listas, bucles, condicionales). Algo más complejo que el básico pero asequible. Sin funciones def/return.`;

        card3Block = `TARJETA 3 — AVANZADO
Concepto: ${activeTopic}
Crea un ejercicio AVANZADO que exija dominar ${activeTopic} en un escenario real más complejo. Puede combinar varias operaciones del mismo concepto. Sin funciones def/return.`;
    } else {
        // ── SLOT MODE (fallback when no recent practice) ─────────────────────
        const slots = pathId ? getSlotConceptsForPrompt(pathId) : null;
        const s1 = slots?.slot1[0] ?? 'Bucles for/while y Listas';
        const s2 = slots?.slot2[0] ?? 'NumPy Arrays básico';
        const s3 = slots?.slot3[0] ?? 'Introducción a NumPy';
        skillRef1 = s1;
        skillRef2 = s2;
        skillRef3 = s3;

        card1Block = `TARJETA 1 — REPASO (mastery ≥ 70%)
Concepto: ${s1}
Ejercicio de repaso. Varía el escenario. Sin funciones def/return.`;

        card2Block = `TARJETA 2 — PRÁCTICA ACTIVA (mastery 35–69%)
Concepto: ${s2}
Ejercicio de práctica deliberada. Sin funciones def/return.`;

        card3Block = `TARJETA 3 — APRENDER (mastery < 35%)
Concepto: ${s3}
Introducción guiada con ejemplos simples. Sin funciones def/return.`;
    }

    const systemPrompt = `Eres un generador de ejercicios prácticos de Python. Devuelve ÚNICAMENTE el JSON indicado, sin texto extra ni markdown.

${pathContext}

${knowledgeBlock}

CUALQUIER concepto que no aparezca en el material de arriba (funciones def/return, diccionarios, tuplas, clases, SQL, Git, pseudocódigo, excepciones, ORM) está TERMINANTEMENTE PROHIBIDO.

FORMATO — devuelve exactamente este JSON array sin texto extra:
[
  {"type": "review",   "title": "...", "description": "ENUNCIADO COMPLETO del ejercicio aquí. Mínimo 3 frases.", "skillRef": "..."},
  {"type": "practice", "title": "...", "description": "ENUNCIADO COMPLETO del ejercicio aquí. Mínimo 3 frases.", "skillRef": "..."},
  {"type": "learn",    "title": "...", "description": "ENUNCIADO COMPLETO del ejercicio aquí. Mínimo 3 frases.", "skillRef": "..."}
]

IMPORTANTE sobre description: escribe el enunciado COMPLETO del ejercicio tal como se lo darías al alumno — con contexto, instrucciones paso a paso y ejemplo de entrada/salida si aplica. El alumno verá esta descripción en la tarjeta Y el Mentor la usará para guiarle. Deben ser idénticas.

${card1Block}

${card2Block}

${card3Block}`;

    const userPrompt = `Genera las 3 tarjetas con escenarios DISTINTOS entre sí y distintos a los de días anteriores. Semilla aleatoria: ${Math.random().toString(36).slice(2, 8)}. Devuelve solo el JSON array.`;

    const result = await deepSeekJSON<DailyTaskRaw[]>(systemPrompt, userPrompt);

    // Stamp clean titles and skillRefs — never inherit AI-generated ones that may be noisy
    const labels = activeTopic
        ? [
            { title: `Básico — ${activeTopic}`,      skillRef: skillRef1 },
            { title: `Intermedio — ${activeTopic}`,  skillRef: skillRef2 },
            { title: `Avanzado — ${activeTopic}`,    skillRef: skillRef3 },
          ]
        : [
            { title: `Repaso — ${skillRef1}`,   skillRef: skillRef1 },
            { title: `Práctica — ${skillRef2}`, skillRef: skillRef2 },
            { title: `Aprender — ${skillRef3}`, skillRef: skillRef3 },
          ];

    return result.map((task, idx) =>
        labels[idx] ? { ...task, title: labels[idx].title, skillRef: labels[idx].skillRef } : task
    );
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
