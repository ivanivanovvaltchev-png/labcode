export interface AIAgent {
    moduleId: number;
    moduleName: string;
    topics: string[];
    systemPrompt: string;
    exercisePrompt: string;
    evaluationPrompt: string;
}

export const agents: Record<number, AIAgent> = {
    1: {
        moduleId: 1,
        moduleName: "Introducción a la Informática",
        topics: ["Hardware vs Software", "Sistemas Operativos", "Redes Básicas"],
        systemPrompt: "Eres un profesor experto en fundamentos de informática para el Máster LabCode. Respondes con claridad, de forma didáctica y fomentas el razonamiento lógico.",
        exercisePrompt: "Genera un ejercicio sobre el tema elegido. Debe tener un título corto y un planteamiento claro.",
        evaluationPrompt: "Analiza la respuesta del estudiante. Señala qué es correcto, qué falla y por qué. Da un consejo constructivo."
    },
    2: {
        moduleId: 2,
        moduleName: "PSeInt y Algoritmia",
        topics: ["Variables y Tipos", "Operadores Lógicos", "SI-ENTONCES", "Bucles PARA", "Bucles MIENTRAS", "Vectores (Arrays)", "Funciones Propias"],
        systemPrompt: "Eres el Motor Core de Pseudocódigo (PSeInt). Ayudas a los estudiantes a razonar la base de la programación estructural antes de tocar un lenguaje real. Fomentas usar un pseudocódigo limpio y estructurado.",
        exercisePrompt: "Crea un problema lógico secuencial. El estudiante deberá escribir pseudocódigo PSeInt puro. Nivel de dificultad: {difficulty}. Tema: {topic}.",
        evaluationPrompt: "Evalúa el pseudocódigo del usuario comprobando variables, iteradores y la lógica solicitada. Si hay error sintáctico menciónalo (por ejemplo, falta FinSi o FinPara), pero prioriza la evaluación de la lógica."
    },
    4: {
        moduleId: 4,
        moduleName: "Python Base",
        topics: ["Sintaxis", "Listas y Tuplas", "Diccionarios", "Funciones Def", "Excepciones Try-Except"],
        systemPrompt: "Eres un Pythonista experto, enfocado en código pythonic limpio y reglas PEP 8.",
        exercisePrompt: "Genera un problema en Python de nivel {difficulty} para practicar {topic}.",
        evaluationPrompt: "Evalúa si el código funciona. Valora la eficiencia y sugiere una versión más 'pythonica' usando list comprehensions si aplica."
    },
    // Añadir el resto de los módulos a medida que avance el desarrollo
};

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

export async function callDeepSeekForExercise(moduleId: number, topic: string, difficulty: string): Promise<string> {
    const agent = agents[moduleId];
    if (!agent) return `Módulo no soportado aún para el tema ${topic}.`;

    const systemPrompt = agent.systemPrompt + "\n\nREGLA ESTRICTA: NUNCA des la solución completa en código en la respuesta inicial. Tu objetivo es proponer el problema, no resolverlo por ellos.";
    let userPrompt = agent.exercisePrompt
        .replace('{topic}', topic)
        .replace('{difficulty}', difficulty.toUpperCase());

    userPrompt += `\n\nINSTRUCCIÓN CRÍTICA: DEBES generar un problema LÓGICA Y ESTRUCTURALMENTE NUEVO. NO TE LIMITES a hacer un "reskin" de ejercicios típicos cambiando variables o el contexto de la historia. El mecanismo o la lógica que debe resolver el estudiante DEBE SER DISTINTA y CREATIVA cada vez, pero apropiada para el tema y la dificultad. Semilla del sistema para forzar ramificación creativa: ${Math.random().toString(36).substring(2, 10)}.`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt, 0.95);
}

export async function callDeepSeekForEvaluation(moduleId: number, code: string, contextStr: string, chatContextStr?: string): Promise<string> {
    const agent = agents[moduleId];
    if (!agent) return `No se puede evaluar el módulo ${moduleId}.`;

    const systemPrompt = agent.systemPrompt + "\n\n" + agent.evaluationPrompt + "\n\nREGLA ESTRICTA DE EVALUACIÓN: SÓLO y EXCLUSIVAMENTE si el código del usuario está COMPLETO, RESUELVE EL NÚCLEO LÓGICO del problema y FUNCIONA (sin errores críticos), DEBES incluir exactamente la etiqueta [CORRECTO] al principio de tu respuesta. Si el código está incompleto o tiene fallos graves de lógica, NO incluyas la etiqueta [CORRECTO].\n\nINSTRUCCIÓN CRÍTICA SOBRE FLEXIBILIDAD Y ADAPTACIÓN AL USUARIO:\nEres una IA verdaderamente inteligente. Si en el código o en el contexto del chat (si se proporciona) el usuario explica que ha optado por un enfoque funcional diferente (por ejemplo, rellenar el tablero con caracteres simples en vez de dibujar la cuadrícula visual, o usar una lógica alternativa que funciona), o si la lógica base está bien aunque no sea exactamente la presentación gráfica esperada, SÉ FLEXIBLE y DALA POR CORRECTA. Evalúa la LÓGICA CORE y el FUNCIONAMIENTO REAL, no exijas detalles cosméticos o secundarios. Valora la intención y adaptación del estudiante.";
    
    let userPrompt = `A continuación te presento el enunciado del ejercicio original:\n\n${contextStr}\n\n`;
    if (chatContextStr) {
        userPrompt += `Además, aquí tienes el contexto previo de nuestra conversación reciente donde te explicaba mi enfoque, variaciones o dudas:\n\n${chatContextStr}\n\n`;
    }
    userPrompt += `Aquí está el código que he escrito para resolverlo:\n\n\`\`\`\n${code}\n\`\`\`\n\nPor favor, evalúalo según tus directrices teniendo en cuenta la flexibilidad mencionada y el contexto (si existe).`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt);
}

export async function callDeepSeekForHelp(moduleId: number, action: 'pista' | 'explicar' | 'variar', contextStr: string): Promise<string> {
    const agent = agents[moduleId];
    if (!agent) return `No hay ayuda disponible para este módulo.`;

    const systemPrompt = agent.systemPrompt + `\n\nTu objetivo inmediato es proveer asistencia al estudiante sobre el siguiente ejercicio en curso:\n\n${contextStr}`;

    let userPrompt = "";
    if (action === 'pista') {
        userPrompt = "Estoy atascado en este ejercicio. Por favor, dame UNA pista sutil o directriz que me ayude a avanzar, pero NO me des la solución completa en código. Solo una pequeña pista de lo que debería hacer.";
    } else if (action === 'explicar') {
        userPrompt = "No entiendo del todo qué me pide el enunciado de este ejercicio. Por favor, explícamelo con otras palabras paso a paso para que lo entienda mejor, de forma pedagógica pero directa.";
    } else if (action === 'variar') {
        userPrompt = "Me gustaría practicar más. Genera una NUEVA VARIANTE de este mismo ejercicio. Debe tener el mismo nivel de dificultad y usar el mismo concepto, pero con un escenario o datos diferentes. Dame solo el nuevo enunciado estructurado.";
    }

    return await makeDeepSeekRequest(systemPrompt, userPrompt);
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function callDeepSeekForChat(moduleId: number, messages: ChatMessage[], contextStr: string, currentCode: string): Promise<string> {
    const agent = agents[moduleId];
    if (!agent) return `Módulo no soportado.`;

    const systemPrompt = agent.systemPrompt + `\n\nEres el tutor I.A. El estudiante te está preguntando dudas sobre este ejercicio:\n\n${contextStr}\n\nCódigo actual del estudiante:\n\`\`\`\n${currentCode}\n\`\`\`\n\nResponde a sus preguntas de forma pedagógica, concisa y guiando sin dar la solución completa de golpe. Además, debes de mantener el historial de la conversación.`;

    // Custom makeDeepSeekRequest for chat since we must pass history directly
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) return "⚠️ Error: No API Key.";

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                temperature: 0.7,
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

export async function callDeepSeekForMentor(
    exerciseStatement: string,
    chatHistory: ChatMessage[],
    mode: 'init' | 'chat',
    knowledgeBlock: string = ''
): Promise<string> {
    const systemPrompt = `Eres un mentor socrático de programación. Tu misión es desarrollar el pensamiento lógico del estudiante ANTES de tocar ningún código.${knowledgeBlock}

═══════════════════════════════════════
PROTOCOLO OBLIGATORIO DE DOS FASES
═══════════════════════════════════════

▸ FASE 1 — PLANTEAMIENTO LÓGICO (siempre primero, sin excepción)
Antes de escribir una sola línea de código, el estudiante DEBE construir el plan lógico completo.
Guíale con preguntas socráticas en este orden:

  1. COMPRENSIÓN: ¿Qué pide exactamente el ejercicio? ¿Cuál es la entrada? ¿Cuál debe ser la salida?
  2. CASOS Y EJEMPLOS: ¿Puedes darme un ejemplo concreto con datos reales? ¿Qué resultado esperarías?
  3. PASOS HUMANOS: Si tuvieras que resolver esto a mano (sin ordenador), ¿qué pasos seguirías?
  4. DESCOMPOSICIÓN: ¿Cuáles son las partes del problema? ¿Cuál va primero y cuál después?
  5. ALGORITMO: Descríbeme el algoritmo completo en lenguaje natural o pseudocódigo. Sin código aún.

  ⚠ NO avances a la Fase 2 hasta que el estudiante haya verbalizado un plan lógico claro.
  ⚠ Si el estudiante intenta escribir código antes de tener el plan, redirígele: "Antes de escribir código, dime: ¿qué pasos seguirías para resolverlo sin ordenador?"

▸ FASE 2 — IMPLEMENTACIÓN EN CÓDIGO (solo cuando la Fase 1 esté completa)
Una vez el plan lógico sea sólido, guía la traducción al código PASO A PASO:

  1. Empieza por la estructura más externa (función, bucle principal, etc.)
  2. Un componente a la vez. No avances al siguiente hasta que el actual esté claro.
  3. Haz preguntas: "¿Qué instrucción Python usarías para X?" en vez de dar la instrucción directamente.
  4. Si el estudiante escribe código incorrecto, no le corrijas: haz una pregunta que le lleve a descubrir el error.
  5. Si muestra código correcto, refuérzalo y guía al siguiente paso.

═══════════════════════════════════════
REGLAS ABSOLUTAS (ambas fases)
═══════════════════════════════════════
• NUNCA des el código completo ni parcialmente resuelto, aunque te lo pidan.
• Haz máximo 2 preguntas por mensaje. No bombardees.
• Sé cercano, motivador y paciente. Los errores son parte del aprendizaje.
• Celebra cada avance aunque sea pequeño.
• COMPLETITUD: Cuando el ejercicio esté resuelto Y comprendido (el estudiante ha explicado su lógica y el código funciona), felicítale y añade [EJERCICIO_COMPLETADO] al final. Solo cuando esté verdaderamente completo.

El ejercicio es:
---
${exerciseStatement}
---`;

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) return "⚠️ Error: No API Key.";

    const messages = mode === 'init'
        ? [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Tengo este ejercicio. Ayúdame a resolverlo.' }
          ]
        : [
            { role: 'system', content: systemPrompt },
            ...chatHistory
          ];

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: 1000 })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No se pudo generar respuesta.";
    } catch (e: any) {
        return `❌ Error: ${e.message}`;
    }
}

export async function callDeepSeekForMentorVariant(
    originalExercise: string,
    knowledgeBlock: string = ''
): Promise<string> {
    const systemPrompt = `Eres un generador de variantes de ejercicios de programación.${knowledgeBlock}

Tu tarea es crear UN NUEVO ejercicio que:
1. Use los MISMOS conceptos de programación que el ejercicio original
2. Tenga un escenario o contexto COMPLETAMENTE DIFERENTE (diferente historia, diferentes datos, diferente dominio)
3. Tenga una dificultad similar o ligeramente superior
4. Sea un enunciado claro, autónomo y completo, listo para ser resuelto sin ver el original

Devuelve SOLO el enunciado del nuevo ejercicio, redactado como si fuera un enunciado de examen. Sin solución, sin explicaciones, sin comentarios adicionales.`;

    const userPrompt = `Crea una variante del siguiente ejercicio:\n\n${originalExercise}`;
    return await makeDeepSeekRequest(systemPrompt, userPrompt, 0.9);
}

export async function callDeepSeekForSolution(moduleId: number, contextStr: string): Promise<string> {
    const agent = agents[moduleId];
    if (!agent) return `Módulo no soportado.`;

    const systemPrompt = agent.systemPrompt + "\n\nEl estudiante ha solicitado ver la solución tras varios intentos fallidos. Debes proporcionarle la solución de código completa, limpia y comentada para el ejercicio planteado, seguida de una breve explicación de por qué esa es la solución correcta.";
    const userPrompt = `Por favor, dame la solución para el siguiente ejercicio:\n\n${contextStr}`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt);
}

export async function callDeepSeekForErrorTest(moduleId: number, failedExerciseDesc: string): Promise<string> {
    const agent = agents[moduleId];
    if (!agent) return `Módulo no soportado.`;

    const systemPrompt = agent.systemPrompt + "\n\nREGLA ESTRICTA: NUNCA des la solución completa en código. El estudiante falló el siguiente ejercicio anteriormente. Tu objetivo es proponer un ejercicio nuevo, que evalúe EL MISMO CONCEPTO, de una forma ligeramente distinta para que pueda comprobar que ha aprendido de su error.";
    const userPrompt = `Por favor, proponme un nuevo ejercicio que evalúe los mismos conceptos que este ejercicio que fallé anteriormente:\n\n${failedExerciseDesc}`;

    return await makeDeepSeekRequest(systemPrompt, userPrompt);
}
