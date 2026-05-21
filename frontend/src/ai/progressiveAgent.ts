import { ExerciseDay } from '../types/exercises';

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

async function makeDeepSeekRequest(systemRole: string, userMessage: string, temperature: number = 0.7): Promise<string> {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

    if (!apiKey) {
        return "⚠️ Error: No se ha encontrado la clave de API de DeepSeek. Añade `VITE_DEEPSEEK_API_KEY=tu_clave_aqui` en el archivo `.env` en la raíz del frontend (c:\Users\green\OneDrive\Desktop\CB\conquer_game\frontend) y reinicia el servidor de desarrollo.";
    }

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemRole },
                    { role: 'user', content: userMessage }
                ],
                temperature: temperature,
                presence_penalty: 0.6,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No se pudo generar una respuesta.";
    } catch (error) {
        console.error("DeepSeek API Error:", error);
        return `❌ Hubo un error al comunicar con la IA de DeepSeek: ${error instanceof Error ? error.message : "Error desconocido"}`;
    }
}

export async function evaluateProgressiveCode(
    code: string, 
    exerciseTitle: string,
    day: ExerciseDay, 
    language: string,
    chatContextStr?: string
): Promise<{ isCorrect: boolean; feedback: string }> {
    const systemPrompt = `Eres un tutor experto de programación evaluando código en ${language}.
REGLAS ESTRICTAS DE EVALUACIÓN:
1. Analiza el código del estudiante para el ejercicio "${exerciseTitle}" - Día ${day.dayNumber}.
2. El objetivo específico de hoy es: ${day.objective}. Los conceptos a usar son: ${day.newConcepts.join(', ')}.
3. INSTRUCCIÓN CRÍTICA SOBRE FLEXIBILIDAD: Si en el código o en el contexto del chat (si se proporciona) el estudiante te explica que ha optado por un enfoque funcional diferente (por ejemplo, rellenar el tablero con "**" o letras simples en vez de dibujar barras y guiones, u omitir validaciones redundantes), DEBES SER FLEXIBLE. Si la lógica demostrada funciona y cumple el objetivo base, asígnale "isCorrect": true. Valora la intención fundamental de su código por encima del aspecto visual o estético.
4. ¡ATENCIÓN! DEBES RESPONDER ÚNICA Y EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO. NO incluyas bloques de código invertidos (markdown) ni texto fuera del JSON.
La estructura debe ser EXACTAMENTE esta:
{
  "isCorrect": boolean, // true si se cumple el objetivo de hoy y funciona bien, false si hay errores lógicos o no cumple
  "feedback": "string con tu mensaje motivador detallado y con formato (sin saltos de línea sin escapar, usa \\n)"
}`;

    let userPrompt = `Aquí está el texto del objetivo de hoy:
${day.objective}

Y los conceptos: ${day.newConcepts.join(', ')}

`;

    if (chatContextStr) {
        userPrompt += `Además, aquí tienes el contexto previo de nuestra conversación reciente (pestaña 'Planificar Lógica') donde te explicaba mi enfoque, variaciones o dudas:\n${chatContextStr}\n\n`;
    }

    userPrompt += `Aquí está mi código en ${language}:
\`\`\`
${code}
\`\`\`

Evalúalo y responde SÓLO en formato JSON puro.`;

    const result = await makeDeepSeekRequest(systemPrompt, userPrompt, 0.4);
    
    try {
        // Limpiamos la respuesta en caso de que la IA haya incluido comillas invertidas de código JSON
        const jsonStr = result.replace(/```json/i, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        return {
            isCorrect: Boolean(parsed.isCorrect),
            feedback: parsed.feedback || result
        };
    } catch (e) {
        // Fallback robusto si la IA no devuelve JSON
        console.error("No se pudo parsear el JSON de la evaluación:", result);
        const lowerResult = result.toLowerCase();
        // Asumimos que es correcto si dice cosas muy positivas y no dice 'incorrecto' o 'error'
        const isCorrect = (!lowerResult.includes('incorrecto') && !lowerResult.includes('error')) || lowerResult.includes('¡excelente trabajo!');
        
        return {
            isCorrect: isCorrect,
            feedback: result
        };
    }
}

export async function generateExerciseVariant(
    exerciseTitle: string,
    day: ExerciseDay,
    language: string
): Promise<string> {
    const systemPrompt = `Eres un creador de retos de programación en ${language}.
El estudiante acaba de aprender o necesita practicar los conceptos: ${day.newConcepts.join(', ')}.
El ejercicio original que estaban haciendo era: "${exerciseTitle}" - Objetivo: ${day.objective}.

REGLA ESTRICTA: Crea un ejercicio NUEVO y EQUIVALENTE con diferentes datos/condiciones u otra metáfora para practicar ESTRICTAMENTE el mismo concepto.
NO uses el mismo contexto (ej. si el original era de un tablero de barcos, el nuevo debe ser de un inventario, o una matriz de estudiantes, etc.).
Explica el nuevo reto de forma clara y directa, sin resolverlo.`;

    const userPrompt = `Necesito un ejercicio equivalente para practicar: ${day.newConcepts.join(', ')}. Nivel de dificultad similar al original. ¡Adelante!`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt, 0.9); // Higher temp for creativity
}

export async function getProgressiveHint(
    exerciseTitle: string,
    day: ExerciseDay,
    language: string,
    attemptNumber: number
): Promise<string> {
    const systemPrompt = `Eres un amable tutor de programación respondiendo de forma concisa.
El estudiante está atascado en el ejercicio "${exerciseTitle}", intentando lograr el objetivo del día ${day.dayNumber}: "${day.objective}". Lenguaje: ${language}.
Han fallado ${attemptNumber} vez/veces.

Debes dar PISTAS PROGRESIVAS:
- Intento 1 (Pista 1): Orientación muy general sobre el enfoque.
- Intento 2 (Pista 2): Más concreta, señalando estructuras a utilizar.
- Intento 3+ (Pista 3): Casi la solución, explicando casi con pseudocódigo, pero sin dar el código escrito en ${language}.

REGLA ESTRICTA: NUNCA des la solución completa en código.`;

    const userPrompt = `He fallado ${attemptNumber} veces. Me rindo, ¿me das una pista acorde al intento en el que estoy?`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt, 0.7);
}

export async function getProgressiveSolution(
    exerciseTitle: string,
    day: ExerciseDay,
    language: string
): Promise<string> {
    const systemPrompt = `Eres un tutor de programación experto. El estudiante ha fallado 3 veces en el ejercicio "${exerciseTitle}" - Día ${day.dayNumber}: "${day.objective}" en ${language}.
Proporciona ÚNICA Y EXCLUSIVAMENTE el código necesario para resolver la parte o el objetivo estipulado para ESTE DÍA en concreto. NO proporciones la solución del ejercicio completo si no encaja estrictamente con el objetivo de hoy. El código debe ser claro, limpio y bien comentado. Al final explica brevemente la lógica de esta parte.`;

    const userPrompt = `Ya me he rendido, necesito ver la solución del objetivo del día de hoy para entenderlo. Por favor, dame SÓLO el código correspondiente al objetivo de hoy en ${language}.`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt, 0.4);
}

export async function getProgressiveChatResponse(
    exerciseTitle: string,
    day: ExerciseDay,
    language: string,
    messages: { role: 'user' | 'assistant', content: string }[]
): Promise<string> {
    const systemPrompt = `Eres un tutor experto de programación.
El estudiante está a punto de enfrentarse al ejercicio "${exerciseTitle}" - Día ${day.dayNumber}: "${day.objective}" en ${language}.
Conceptos a aplicar: ${day.newConcepts.join(', ')}.

MISION CRÍTICA:
Tu objetivo NO ES dar el código de la solución. Tu objetivo PRINCIPAL en este chat es guiar al estudiante mediante PREGUNTAS SOCRÁTICAS para que él mismo desarrolle un "esqueleto" lógico o pseudocódigo paso a paso de lo que tiene que hacer ANTES de que se ponga a programar.
- Pregúntale cómo abordaría el problema.
- Ayúdale a estructurar su pensamiento.
- Si da un paso correcto, confírmalo y pregúntale por el siguiente.
- Si se atasca, dale una pequeñísima pista lógica, no código.
- Mantén respuestas amigables y concisas.`;

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) return "⚠️ Error: No API Key.";

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                temperature: 0.8,
                max_tokens: 1500
            })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No se pudo generar respuesta.";
    } catch (e: any) {
        return `❌ Error: ${e.message}`;
    }
}

export async function getCompleteExerciseSolution(
    exerciseTitle: string,
    language: string
): Promise<string> {
    const systemPrompt = `Eres un tutor de programación experto. El estudiante necesita ver la SOLUCIÓN COMPLETA y final del ejercicio "${exerciseTitle}" en ${language}, uniendo todos los pasos o requisitos implícitos.
Proporciona el código completo, limpio y funcional, junto con una explicación de su arquitectura general.`;

    const userPrompt = `Necesito ver la solución completa del ejercicio "${exerciseTitle}" para analizar cómo encaja todo el código junto. Por favor, dame el código completo en ${language}.`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt, 0.4);
}

export async function getDoubtChatResponse(
    exerciseTitle: string,
    language: string,
    messages: { role: 'user' | 'assistant', content: string }[],
    currentDayObjective: string
): Promise<string> {
    const systemPrompt = `Eres un tutor experto de programación de IA. El estudiante está a punto de revelar la SOLUCIÓN COMPLETA del ejercicio "${exerciseTitle}" (Objetivo actual: "${currentDayObjective}") en ${language}, lo que significa que está muy atascado.
Has aparecido antes de desvelarle la solución para ofrecerle ayuda de último minuto.

TU MISIÓN:
- Resuelve sus dudas de forma teórica y conceptual.
- NO le des la solución en código, explícale el porqué, da analogías, o enséñale fragmentos de ejemplo aislados.
- Si el estudiante te pide explícitamente "comenzar entrenamiento" o pide un "ejercicio alternativo", GENERA un mini-ejercicio muy breve y práctico para que afiance el concepto exacto con el que está luchando. Al finalízar, anímalo a que lo resuelva.`;

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) return "⚠️ Error: No API Key.";

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                temperature: 0.8,
                max_tokens: 1500
            })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No se pudo generar respuesta de dudas.";
    } catch (e: any) {
        return `❌ Error: ${e.message}`;
    }
}
