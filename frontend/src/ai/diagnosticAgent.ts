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
    profileConcepts: string[]
): Promise<DailyTaskRaw[]> {
    const systemPrompt = `Eres un entrenador de programación de élite. Tu trabajo es generar planes de entrenamiento diarios personalizados.

FORMATO DE RESPUESTA: Solo JSON válido, sin texto adicional, sin markdown.
[
  {
    "type": "learn" | "practice" | "review",
    "title": "título corto de la tarea",
    "description": "descripción clara de qué hacer exactamente (2-3 frases)",
    "skillRef": "habilidad que trabaja"
  }
]

Tipos:
- learn: Estudiar/entender un concepto nuevo
- practice: Resolver un ejercicio práctico concreto
- review: Repasar y reforzar algo ya visto pero débil`;

    const pending = path.skills
        .filter(s => s.importance === 'critical' && !profileConcepts.some(c => s.profileKeywords.some(k => c.toLowerCase().includes(k.toLowerCase()))))
        .slice(0, 5)
        .map(s => s.name);

    const userPrompt = `Camino: ${path.title} (${path.jobTitle})
Áreas débiles detectadas en el diagnóstico: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'ninguna detectada aún'}
Habilidades pendientes críticas: ${pending.join(', ')}
Conocimientos actuales: ${profileConcepts.slice(0, 5).join(', ') || 'básico'}

Genera exactamente 3 tareas para el entrenamiento de hoy. Una sesión realista de 45-60 minutos.
Prioriza las áreas débiles y habilidades críticas pendientes.`;

    return await deepSeekJSON<DailyTaskRaw[]>(systemPrompt, userPrompt);
}
