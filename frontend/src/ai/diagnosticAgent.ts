import { CareerPath, PathSkill } from '../data/careerPaths';
import { TestQuestion } from '../lib/dailyTest';
import type { DailyTask } from '../lib/userProgress';
import {
    HABILIDADES_PERMITIDAS,
} from './studentProfile';
import { getContextForPrompt } from '../lib/theoryContext';
import { getSlotConceptsForPrompt } from '../lib/masteryEngine';
import { loadKnowledgeProfile } from '../lib/knowledgeProfile';

const CONCEPT_SYNTAX_MAP: Record<string, string[]> = {
    dict:     ['dict(', '.keys()', '.values()', '.items()', 'diccionario'],
    tuple:    ['tuple(', 'tupla'],
    set:      ['set(', 'conjunto'],
    function: ['def ', 'return ', 'función', 'funcion', 'funciones', 'parámetros', 'parametros', 'argumentos'],
    class:    ['class ', '__init__', 'self.'],
    file:     ['open(', 'with open'],
    except:   ['try:', 'except:', 'except ', 'raise '],
    lambda:   ['lambda '],
    split:    ['.split('],
};

function profileKnowsConcept(concepts: string[], family: string): boolean {
    const lc = concepts.map(c => c.toLowerCase());
    switch (family) {
        case 'dict':     return lc.some(c => /diccionario|dict|\.keys|\.values|\.items/.test(c));
        case 'tuple':    return lc.some(c => /tupla|tuple/.test(c));
        case 'set':      return lc.some(c => /\bset\b|conjunto/.test(c));
        case 'function': return lc.some(c => /\bdef\b|función|funcion|return|parámetro|argumento/.test(c));
        case 'class':    return lc.some(c => /clase|class|__init__|self\./.test(c));
        case 'file':     return lc.some(c => /archivo|open\(|lectura|escritura/.test(c));
        case 'except':   return lc.some(c => /excepci|try|except|raise/.test(c));
        case 'lambda':   return lc.some(c => /lambda/.test(c));
        case 'split':    return lc.some(c => /split/.test(c));
        default:         return false;
    }
}

function buildDynamicBlocklist(base: string[]): string[] {
    const profile = loadKnowledgeProfile();
    if (!profile || profile.concepts.length === 0) return base;
    return base.filter(term => {
        for (const [family, syntaxes] of Object.entries(CONCEPT_SYNTAX_MAP)) {
            if (syntaxes.includes(term) && profileKnowsConcept(profile.concepts, family)) {
                return false;
            }
        }
        return true;
    });
}

function buildDynamicProhibitionText(): string {
    const profile = loadKnowledgeProfile();
    const allFamilies = ['function', 'dict', 'tuple', 'set', 'class', 'lambda', 'except', 'file'];
    const labelMap: Record<string, string> = {
        function: 'funciones (def/return)',
        dict: 'diccionarios',
        tuple: 'tuplas',
        set: 'sets',
        class: 'clases',
        lambda: 'lambda',
        except: 'excepciones',
        file: 'archivos',
    };
    const forbidden = allFamilies.filter(f =>
        !profile || profile.concepts.length === 0 || !profileKnowsConcept(profile.concepts, f)
    );
    if (forbidden.length === 0) return '';
    const labels = forbidden.map(f => labelMap[f]).join(', ');
    return `PROHIBIDO: ${labels}. Si un concepto no aparece textualmente en el material de arriba, NO PUEDE aparecer en ningún ejercicio.`;
}

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
    descriptionMedio?: string;
    descriptionDificil?: string;
    skillRef: string;
}

async function deepSeekRaw(systemPrompt: string, userPrompt: string, temperature = 0.6): Promise<string> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('No API Key');

    const body = {
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature,
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
Contexto realista, instrucciones claras, nivel adecuado para alguien que está aprendiendo.

INSTRUCCIÓN CRÍTICA: DEBES generar un problema LÓGICA Y ESTRUCTURALMENTE NUEVO cada vez. NO repitas el mismo escenario, historia o mecánica que hayas usado antes para esta misma habilidad. Semilla del sistema para forzar variación: ${Math.random().toString(36).slice(2, 10)}.`;

    return deepSeekRaw(systemPrompt, userPrompt, 0.95);
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

function sanitizeLLMJson(raw: string): string {
    let s = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const extracted = s.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)?.[0] ?? s;
    return extracted
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'(\s*:)/g, '"$1"$2')  // single-quoted keys
        .replace(/,(\s*[}\]])/g, '$1');                            // trailing commas
}

async function deepSeekJSON<T>(systemPrompt: string, userPrompt: string, temperature = 0.3, maxTokens = 2000): Promise<T> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('No API Key');

    const body = {
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
    };

    let lastError = '';
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        const response = await fetchDeepSeek(body, apiKey);
        if (response.ok) {
            const data = await response.json();
            const raw = data.choices?.[0]?.message?.content ?? '{}';
            const sanitized = sanitizeLLMJson(raw);
            try {
                const parsed = JSON.parse(sanitized);
                // Unwrap {"questions":[...]} or {"tasks":[...]} or similar single-key array wrappers
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const keys = Object.keys(parsed);
                    if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
                        return parsed[keys[0]] as T;
                    }
                    // Multi-key object — look for a known array key
                    const arrayKey = keys.find(k => Array.isArray(parsed[k]));
                    if (arrayKey) return parsed[arrayKey] as T;
                }
                return parsed as T;
            } catch (parseErr) {
                console.error('[deepSeekJSON] JSON parse failed. Raw:', raw.slice(0, 300), parseErr);
                lastError = 'Respuesta de IA no parseable como JSON';
                // Retry on parse failure if we have attempts left
                if (attempt < RETRY_DELAYS.length) {
                    await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
                    continue;
                }
                throw new Error(lastError);
            }
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

const BASE_DIAGNOSTIC_SYNTAX_BLOCKLIST = [
    'def ',    // Python function definition
    '(self',   // method signature
    'class ',  // class definition
    'lambda ', // lambda expression
    'try:',    // exception block
    'except',
    'raise ',
    'open(',   // file I/O
    'with open',
    '__init__',
    'self.',
    'dict(',
    '.keys()',
    '.values()',
    '.items()',
    'tuple(',
    '.split(',
    'return ', // explicit return keyword in code context
];

function diagnosticQuestionPassesGuard(q: DiagnosticQuestion): boolean {
    const blocklist = buildDynamicBlocklist(BASE_DIAGNOSTIC_SYNTAX_BLOCKLIST);
    const text = [q.question, q.hint ?? '', q.skillRef].join(' ').toLowerCase();
    return !blocklist.some(term => text.includes(term));
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

${buildDynamicProhibitionText()}

FORMATO DE RESPUESTA: Solo JSON válido con clave "questions", sin texto adicional, sin markdown.
{
  "questions": [
    {
      "id": "q1",
      "question": "enunciado del ejercicio práctico",
      "hint": "pista opcional si el estudiante no sabe por dónde empezar",
      "skillRef": "concepto que evalúa"
    }
  ]
}`;

    const userPrompt = `Camino: ${path.title} (objetivo: ${path.jobTitle})
${knownConcepts}

Genera exactamente 5 ejercicios prácticos basados ÚNICAMENTE en el material del sistema. Usa SOLO los conceptos que aparezcan explícitamente en el material teórico de arriba. Ordénalos de menor a mayor dificultad.`;

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
    const pdfText = getContextForPrompt(8000);

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

    // ── Topic focus detection ─────────────────────────────────────────────────
    //
    // KEY RULE (from FLUJO_LABCODE): the 3 cards always focus on what the student
    // is CURRENTLY LEARNING — Slot 2 (practicing) and Slot 3 (new from PDF).
    // Slot 1 concepts are already mastered (≥70%) and must NEVER drive the cards.
    //
    // Detection priority:
    //   1. Recent practice of a non-Slot-1 concept → use that (confirms active topic)
    //   2. Slot 2 concepts (mastery 35–69%) → default learning zone
    //   3. Slot 3 concepts (mastery <35%, from PDF) → newest, needs introduction
    //   4. Pure fallback (empty registry) → NumPy basics from studentProfile

    const slotData = pathId ? getSlotConceptsForPrompt(pathId) : null;

    // Concepts already mastered — must not become card topic
    const slot1Set = new Set(slotData?.slot1 ?? []);

    // Prefixes from old/corrupted card titles — filter these out too
    const BAD = ['Repaso', 'Práctica', 'Aprender', 'Básico', 'Intermedio', 'Avanzado', 'Tarjeta'];
    const isClean = (s: string) => s.trim().length > 3 && !BAD.some(p => s.startsWith(p));

    // Non-Slot-1 skills the student practiced recently (most reliable signal)
    const recentNonMastered = activeSkills.filter(s => isClean(s) && !slot1Set.has(s));

    // All concepts in the current learning zone (Slot 2 + Slot 3)
    const learningZone = [
        ...(slotData?.slot2 ?? []),
        ...(slotData?.slot3 ?? []),
    ].filter(isClean);

    // The single concept that anchors all 3 cards
    const rawFocus = recentNonMastered[0] ?? learningZone[0] ?? 'NumPy Arrays básico';

    // Map individual concept names to a clean topic label for the card titles
    // (e.g. "np.zeros(n) — array de ceros" → "NumPy Arrays")
    function resolveTopicLabel(name: string): string {
        if (/numpy|np\.|array\[/i.test(name))                    return 'NumPy Arrays';
        if (/lista|list|append|pop|sort|slice|slicing/i.test(name)) return 'Listas';
        if (/bucle|for|while|range|iterar/i.test(name))          return 'Bucles';
        if (/if|elif|else|condici|booleano/i.test(name))         return 'Condicionales';
        if (/variable|str|int|float|bool|aritm|operat/i.test(name)) return 'Variables y Tipos';
        // fallback: use the first clause before ":" or "("
        return name.split(/[:(]/)[0].trim() || name;
    }

    const topicLabel = resolveTopicLabel(rawFocus);

    // Full list of related concepts for the AI (so it can vary exercises within the topic)
    const relatedConcepts = learningZone.length > 0
        ? learningZone.slice(0, 6).join(' · ')
        : rawFocus;

    const card1Block = `TARJETA 1 — BÁSICO
Tema: ${topicLabel}
Conceptos del alumno en este tema: ${relatedConcepts}
Crea un ejercicio MUY BÁSICO. Un solo objetivo. Directo y concreto. El alumno aplica por primera vez o repasa la base. Sin funciones def/return.`;

    const card2Block = `TARJETA 2 — INTERMEDIO
Tema: ${topicLabel}
Conceptos del alumno en este tema: ${relatedConcepts}
Crea un ejercicio INTERMEDIO. Combina varios aspectos de ${topicLabel} o úsalo junto a bucles/listas. Más exigente que el básico. Sin funciones def/return.`;

    const card3Block = `TARJETA 3 — AVANZADO
Tema: ${topicLabel}
Conceptos del alumno en este tema: ${relatedConcepts}
Crea un ejercicio AVANZADO. Escenario real, varias operaciones concatenadas, algo que requiera pensar. Sin funciones def/return.`;

    const systemPrompt = `Eres un generador de ejercicios prácticos de Python. Devuelve ÚNICAMENTE el JSON indicado, sin texto extra ni markdown.

${pathContext}

${knowledgeBlock}

${buildDynamicProhibitionText()}

FORMATO — devuelve exactamente este JSON object con clave "tasks" sin texto extra. Cada tarjeta tiene TRES versiones del enunciado:
{
  "tasks": [
    {
      "type": "review",
      "title": "...",
      "description": "VERSIÓN FÁCIL: enunciado completo con pasos numerados, nombres de funciones a usar y ejemplo de datos. El alumno sabe exactamente qué hacer y con qué herramientas.",
      "descriptionMedio": "VERSIÓN MEDIA: solo el problema y el objetivo. Sin pasos, sin mencionar las funciones concretas. El alumno debe saber qué herramientas usar por sí mismo.",
      "descriptionDificil": "VERSIÓN DIFÍCIL: máximo 2 frases. Solo el objetivo final. Sin contexto, sin pistas.",
      "skillRef": "..."
    }
  ]
}

REGLAS PARA LAS 3 VERSIONES:
- description (Fácil): explica paso a paso, dice las funciones a usar (np.arange, .copy, etc.), pone ejemplos de datos
- descriptionMedio (Medio): describe el escenario y lo que se quiere conseguir, NUNCA menciona qué función usar, no da pasos
- descriptionDificil (Difícil): una o dos frases que solo dicen el objetivo. Sin escenario, sin función, sin pistas

EJEMPLO:
  description: "Crea un array con np.arange(1, 10, 2). Paso 1: usa np.arange(). Paso 2: haz una copia con .copy(). Paso 3: imprime ambos."
  descriptionMedio: "Tienes una secuencia de números impares del 1 al 9. Necesitas duplicarla de forma que ambas versiones sean independientes entre sí. Demuéstralo modificando una."
  descriptionDificil: "Crea un array y una copia independiente. Demuestra que son independientes."

${card1Block}

${card2Block}

${card3Block}`;

    const userPrompt = `Genera las 3 tarjetas con escenarios DISTINTOS. Semilla: ${Math.random().toString(36).slice(2, 8)}. Devuelve el objeto JSON con clave "tasks" y los 3 campos de descripción por tarjeta.`;

    const rawResult = await deepSeekJSON<DailyTaskRaw[] | { tasks?: DailyTaskRaw[] }>(systemPrompt, userPrompt);
    const result: DailyTaskRaw[] = Array.isArray(rawResult)
        ? rawResult
        : (rawResult as { tasks?: DailyTaskRaw[] }).tasks ?? [];

    if (result.length === 0) throw new Error('Respuesta de IA no parseable como JSON');

    // Overwrite title and skillRef with clean values — never inherit noisy AI output
    const labels = [
        { title: `Básico — ${topicLabel}`,      skillRef: topicLabel },
        { title: `Intermedio — ${topicLabel}`,  skillRef: topicLabel },
        { title: `Avanzado — ${topicLabel}`,    skillRef: topicLabel },
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

// Guard for daily test questions.
// Same philosophy as DIAGNOSTIC_SYNTAX_BLOCKLIST: reject on Python syntax tokens
// only, NOT on Spanish narrative words. CONCEPTOS_PROHIBIDOS includes words like
// "función"/"funciones" that appear legitimately in question prose and cause most
// generated questions to be silently discarded, leaving only 1 out of 3+.
// IMPORTANT: only use tokens that are unambiguous Python syntax.
// 'except' (without colon) was matching the Spanish word "excepto" and
// discarding every question that used it naturally in prose. Always use
// the colon form 'except:' or with a trailing space 'except '.
const BASE_DAILY_TEST_SYNTAX_BLOCKLIST = [
    'def ',       // function definition — always has space after keyword
    '(self,',     // method parameter — tighter than '(self' to avoid false positives
    'class ',     // class definition
    'lambda ',    // lambda expression
    'try:',       // try block — colon is mandatory in Python
    'except:',    // bare except — must have colon
    'except ',    // except with type — has space before exception type
    'raise ',     // raise statement
    'open(',      // file I/O
    'with open',
    '__init__',
    'self.',      // self.attribute — period avoids Spanish word collisions
    'dict(',
    '.keys()',
    '.values()',
    '.items()',
    'tuple(',
    '.split(',
];

function questionPassesGuard(q: TestQuestion): boolean {
    const blocklist = buildDynamicBlocklist(BASE_DAILY_TEST_SYNTAX_BLOCKLIST);
    const text = [
        q.question,
        q.options.A,
        q.options.B,
        q.options.C,
        q.explanation ?? '',
    ].join(' ').toLowerCase();
    return !blocklist.some(term => text.includes(term));
}

/** Maps mood (1–5) to target question count for the daily test. */
export const MOOD_QUESTION_COUNT: Record<number, number> = {
    1: 1,
    2: 2,
    3: 5,
    4: 8,
    5: 10,
};

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
    _activeSkills: string[] = [],
    pathId: string = '',
    mood: number = 3
): Promise<TestQuestion[]> {
    const pathContext = buildPathContext(path);
    const knowledgeBlock = buildKnowledgeBlock();
    const targetCount = MOOD_QUESTION_COUNT[mood] ?? 5;

    // ── Slot topics ───────────────────────────────────────────────────────────
    const slots = pathId ? getSlotConceptsForPrompt(pathId) : null;
    const s1 = slots?.slot1.slice(0, 3).join(' / ') || 'Bucles for/while y Listas';
    const s2 = slots?.slot2.slice(0, 2).join(' / ') || 'Condicionales if/elif/else';
    const s3 = slots?.slot3[0] || 'NumPy Arrays';

    // ── Question distribution across slots ────────────────────────────────────
    // Slot 3 (new concept): max 2, ~20% of total
    // Slot 1 (review):      ~40% of remaining
    // Slot 2 (practice):    rest
    const n3 = Math.min(2, Math.max(0, Math.floor(targetCount * 0.2)));
    const n1 = Math.ceil((targetCount - n3) / 2);
    const n2 = targetCount - n1 - n3;

    // Build the per-question instruction list
    const questionLines: string[] = [];
    let qNum = 1;

    for (let i = 0; i < n1; i++, qNum++) {
        questionLines.push(
            `PREGUNTA ${qNum} — REPASO (Slot 1 · mastery ≥ 70%)\n` +
            `Tema: ${s1}\n` +
            `Escenario ${i + 1} de ${n1}: varía el contexto (precios, temperaturas, notas, edades, colores…). Sin def ni return.`
        );
    }
    for (let i = 0; i < n2; i++, qNum++) {
        questionLines.push(
            `PREGUNTA ${qNum} — PRÁCTICA (Slot 2 · mastery 35–69%)\n` +
            `Tema: ${s2}\n` +
            `Escenario ${i + 1} de ${n2}: varía el contexto. Sin def ni return.`
        );
    }
    for (let i = 0; i < n3; i++, qNum++) {
        questionLines.push(
            `PREGUNTA ${qNum} — CONCEPTO NUEVO (Slot 3 · mastery < 35%)\n` +
            `Tema: ${s3}\n` +
            `Nivel básico — el alumno lo está aprendiendo. Sin def ni return.`
        );
    }

    const slotsBlock = questionLines.join('\n\n');

    const systemPrompt = `Eres un evaluador de programación Python. Devuelves ÚNICAMENTE un JSON object con una clave "questions" que contiene un array de preguntas de opción múltiple (A, B, C). Sin texto extra ni markdown.

${pathContext}

${knowledgeBlock}

═══ REGLA ABSOLUTA — LEE ANTES DE GENERAR ═══
CADA pregunta DEBE mostrar un bloque de código Python real y preguntar qué hace ese código.
Tipos válidos:
  • "¿Qué imprime este código?" → muestra 3-6 líneas de Python → opciones son los posibles outputs
  • "¿Qué valor tiene X después de ejecutar esto?" → muestra código → opciones son valores concretos
  • "¿Qué hace esta instrucción?" → muestra UNA línea de Python → opciones explican su efecto

PROHIBIDO ABSOLUTAMENTE:
  • Preguntas de matemáticas sin código (promedios, sumas, productos de listas de números)
  • Enunciados de inventario, temperatura, frutas, notas SIN código Python
  • Problemas de lógica que no muestren sintaxis Python real
  • "¿Cuántas unidades quedan...?" "¿Cuál es el promedio de...?" sin código
  • ${buildDynamicProhibitionText() || 'Conceptos que no aparezcan en el material teórico del estudiante'}

EJEMPLO CORRECTO:
{
  "question": "¿Qué imprime este código?\\nnumeros = [3, 1, 4, 1, 5]\\nnumeros.sort()\\nprint(numeros[0])",
  "options": { "A": "1", "B": "3", "C": "5" },
  "correctAnswer": "A",
  "explanation": "sort() ordena de menor a mayor. numeros[0] es el primer elemento: 1."
}

EJEMPLO INCORRECTO (PROHIBIDO):
{
  "question": "Una lista de temperaturas es [22, 25, 19]. ¿Cuál es la media?",
  "options": { "A": "22.0", "B": "21.0", "C": "25.0" }
}

GENERA EXACTAMENTE ${targetCount} PREGUNTAS en este orden:

${slotsBlock}

FORMATO DE RESPUESTA (objeto JSON con clave "questions"):
{
  "questions": [
    {
      "id": "q1",
      "question": "¿Qué imprime/devuelve/hace este código?\\nlinea1\\nlinea2\\nlinea3",
      "options": { "A": "valor o efecto A", "B": "valor o efecto B", "C": "valor o efecto C" },
      "correctAnswer": "A",
      "explanation": "Explicación breve de por qué (1-2 frases)",
      "skillRef": "concepto evaluado"
    }
  ]
}

Varía los valores y nombres de variables entre preguntas. Usa listas pequeñas (3-5 elementos) con números sencillos para que el alumno pueda trazar el código mentalmente.`;

    const today = new Date().toISOString().split('T')[0];
    const userPrompt = `Fecha: ${today}. Semilla: ${Math.random().toString(36).slice(2, 8)}. Genera las ${targetCount} preguntas. TODAS deben mostrar código Python. Devuelve el objeto JSON con clave "questions".`;

    // Each question needs ~400 tokens of output. Add 400 overhead for JSON structure.
    const neededTokens = Math.max(2000, targetCount * 400 + 400);
    const rawResult2 = await deepSeekJSON<TestQuestion[] | { questions?: TestQuestion[] }>(systemPrompt, userPrompt, 0.85, neededTokens);
    const raw: TestQuestion[] = Array.isArray(rawResult2)
        ? rawResult2
        : (rawResult2 as { questions?: TestQuestion[] }).questions ?? [];

    if (raw.length === 0) throw new Error('Respuesta de IA no parseable como JSON');

    // Tag slot refs for mastery tracking
    const slotRefs = [
        ...Array(n1).fill(slots?.slot1[0] ?? 'Repaso consolidado'),
        ...Array(n2).fill(slots?.slot2[0] ?? 'Práctica activa'),
        ...Array(n3).fill(slots?.slot3[0] ?? 'Concepto nuevo'),
    ];

    const tagged = raw.map((q, idx) => ({
        ...q,
        id: `q${idx + 1}`,
        skillRef: slotRefs[idx] ?? q.skillRef,
    }));

    return tagged.filter(questionPassesGuard).slice(0, targetCount);
}
