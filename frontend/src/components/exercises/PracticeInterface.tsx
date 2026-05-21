import React from 'react';
import { Exercise } from '../../types/exercises';
import { useProgressiveExercise } from '../../hooks/useProgressiveExercise';

interface PracticeInterfaceProps {
    exercise: Exercise;
    language: string;
    userId: string;
    onBack: () => void;
}

// Utilidad para parsear texto crudo (con <br>, \n y **negritas**) a elementos React de forma estructurada
const parseText = (text: string) => {
    if (!text) return null;
    
    // Normalizar saltos de línea y forzar separación en etiquetas clave si vienen agolpadas
    const normalizedText = text
        .replace(/<br\s*\/?>/gi, '\n')
        // Forzar salto antes de ciertos títulos comunes si no lo tienen
        .replace(/(?<!\n\s*)(?=\*\*(Objetivo|Descripción|Nuevo reto|Solicitar|Crear|Instrucciones|Pasos)[^*]*\*\*)/gi, '\n\n')
        // Forzar salto después de esos mismos títulos si están seguidos por texto directamente
        .replace(/(\*\*(Objetivo|Descripción|Nuevo reto|Solicitar|Crear|Instrucciones|Pasos)[^*]*\*\*)\s+(?!\n)/gi, '$1\n')
        // Forzar salto entre etiquetas bold consecutivas si están separadas sólo por espacio
        .replace(/(\*\*[^*]+\*\*)\s+(?=\*\*)/g, '$1\n\n');

    const paragraphs = normalizedText.split(/\n{2,}/);

    return paragraphs.map((paragraph, pIdx) => {
        if (!paragraph.trim()) return null;

        const lines = paragraph.split('\n').filter(l => l.trim());

        return (
            <div key={pIdx} className="mb-5 last:mb-0">
                {lines.map((line, lIdx) => {
                    const isList = /^[\d]+\.\s+|- \s/m.test(line);
                    const cleanLine = line.replace(/^[\d]+\.\s+|- \s/, '');

                    const content = cleanLine.split(/(\*\*.*?\*\*)/).map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            const innerText = part.slice(2, -2);
                            // Detectar subtítulos para darles un color destacado
                            if (innerText.endsWith(':') || innerText.toLowerCase().includes('reto') || innerText.toLowerCase().includes('objetivo')) {
                                return <strong key={j} className="text-teal-400 font-bold block mt-3 mb-1 text-[1.05em]">{innerText}</strong>;
                            }
                            return <strong key={j} className="text-white font-semibold">{innerText}</strong>;
                        }
                        return part;
                    });

                    if (isList) {
                        return (
                            <div key={lIdx} className="flex items-start gap-3 my-2 ml-1 p-3 bg-zinc-800/40 rounded-lg border border-zinc-700/50 shadow-sm transition-all hover:bg-zinc-800/60">
                                <span className="text-blue-400 mt-1 flex-shrink-0 text-sm">🔹</span>
                                <span className="text-zinc-300 leading-relaxed max-w-[95%]">{content}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={lIdx} className={`text-zinc-300 leading-relaxed tracking-wide ${lIdx > 0 ? 'mt-2' : ''}`}>
                            {content}
                        </div>
                    );
                })}
            </div>
        );
    });
};

export function PracticeInterface({ exercise, language, userId, onBack }: PracticeInterfaceProps) {
    const {
        currentDayObj,
        progress,
        attempt,
        loading,
        evaluating,
        feedback,
        currentCode,
        setCurrentCode,
        submitCode,
        nextDay,
        getHint,
        getSolution,
        getVariant,
        chatMessages,
        isChatting,
        sendChatMessage,
        isSuccess,
        fetchCompleteSolution,
        doubtChatMessages,
        setDoubtChatMessages,
        isDoubtChatting,
        sendDoubtChatMessage,
        startTraining
    } = useProgressiveExercise({ exercise, language, userId });

    const [activeTab, setActiveTab] = React.useState<'chat' | 'code'>('chat');
    const [chatInput, setChatInput] = React.useState('');
    const [feedbackQuestion, setFeedbackQuestion] = React.useState('');
    const [isGeneratingVariant, setIsGeneratingVariant] = React.useState(false);
    const [showCompleteSolutionModal, setShowCompleteSolutionModal] = React.useState(false);
    const [doubtChatInput, setDoubtChatInput] = React.useState('');

    const handleSendDoubtChat = (e: React.FormEvent) => {
        e.preventDefault();
        sendDoubtChatMessage(doubtChatInput);
        setDoubtChatInput('');
    };

    React.useEffect(() => {
        if (showCompleteSolutionModal && doubtChatMessages.length === 0) {
            setDoubtChatMessages([{
                role: 'assistant',
                content: 'Veo que quieres ver la solución completa. ¿Qué parte te está costando más entender? Puedes preguntarme tus dudas o podemos comenzar un entrenamiento con ejercicios más sencillos.'
            }]);
        }
    }, [showCompleteSolutionModal, doubtChatMessages, setDoubtChatMessages]);

    const handleGetVariant = async () => {
        setIsGeneratingVariant(true);
        await getVariant();
        setIsGeneratingVariant(false);
    };

    if (loading) {
        return <div className="p-10 text-center text-white">Cargando progreso...</div>;
    }

    if (!currentDayObj || !attempt) {
        return <div className="p-10 text-center text-white">Error al cargar el ejercicio.</div>;
    }

    const isCompleted = progress?.completed;
    const canSeeSolution = attempt.failed_attempts >= 3;

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        sendChatMessage(chatInput);
        setChatInput('');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 flex flex-col font-sans">
            {/* Cabecera */}
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
                    ← Volver al catálogo
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        {exercise.title}
                    </h1>
                    <span className="text-sm text-zinc-500 uppercase tracking-widest font-mono">
                        DÍA {currentDayObj.dayNumber} • {language.toUpperCase()}
                    </span>
                </div>
                <div className="w-20"></div> {/* Spacer */}
            </div>

            {isCompleted ? (
                <div className="flex flex-col items-center justify-center p-10 bg-zinc-900 rounded-xl border border-green-500/30">
                    <h2 className="text-4xl font-bold text-green-400 mb-4">¡Ejercicio Completado!</h2>
                    <p className="text-zinc-400 mb-8 max-w-md text-center">
                        Has dominado todos los días de "{exercise.title}". Ahora puedes intentar un ejercicio similar
                        como variante, o elegir otro ejercicio del catálogo.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onBack} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors">
                            Volver al catálogo
                        </button>
                        <button onClick={getVariant} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition-opacity">
                            Practicar con Variante
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
                    {/* Panel Izquierdo: Motivación e Instrucciones */}
                    <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
                        
                        {/* Instrucciones */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl flex-grow flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-teal-400"></div>
                            
                            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-5 flex items-center gap-2">
                                <span className="text-2xl">🎯</span> {attempt.variant_text ? 'Variante de Práctica' : 'Objetivo del Día'}
                            </h2>
                            <div className="text-zinc-300 leading-relaxed mb-6 font-medium text-base md:text-lg bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/80 shadow-inner">
                                {parseText(attempt.variant_text || currentDayObj.objective)}
                            </div>

                            <h3 className="text-sm font-bold text-teal-400 mb-2 uppercase tracking-wide">
                                Conceptos a aplicar:
                            </h3>
                            <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-1">
                                {currentDayObj.newConcepts.map((concept, idx) => (
                                    <li key={idx}>{concept}</li>
                                ))}
                            </ul>

                            <div className="mt-auto space-y-3">
                                <button
                                    onClick={getHint}
                                    disabled={evaluating}
                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700 border-b-4 hover:border-b active:border-b-0 active:translate-y-1 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <span>💡</span> Necesito una pista (Código)
                                </button>
                                
                                <button
                                    onClick={getVariant}
                                    disabled={evaluating}
                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-purple-400 border border-zinc-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <span>🎲</span> Generar ejercicio similar
                                </button>

                                {attempt.variant_text && (
                                    <button
                                        onClick={async () => { await nextDay(); onBack(); }}
                                        disabled={evaluating}
                                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 text-sm"
                                    >
                                        <span>⏭️</span> Saltar variante y avanzar al siguiente día
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Panel Derecho: Editor y Chat */}
                    <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
                        
                        {/* Tabs */}
                        <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800 self-start">
                            <button 
                                onClick={() => setActiveTab('chat')}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'chat' ? 'bg-zinc-800 text-purple-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                💬 Planificar Lógica
                            </button>
                            <button 
                                onClick={() => setActiveTab('code')}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'code' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                💻 Escribir Código
                            </button>
                        </div>

                        {activeTab === 'chat' && (
                            <div className="flex-grow bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col max-h-[600px]">
                                <div className="p-4 bg-purple-900/20 border-b border-purple-500/20 text-purple-300 font-medium flex items-center gap-2">
                                    <span>🤖</span> Tutor IA: Vamos a descubrir cómo estructurarlo paso a paso.
                                </div>
                                <div className="flex-grow overflow-y-auto p-6 space-y-4 font-sans max-h-[400px]">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-bl-none'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isChatting && (
                                        <div className="flex justify-start">
                                            <div className="max-w-[80%] p-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-bl-none animate-pulse">
                                                Escribiendo...
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleSendChat} className="p-4 border-t border-zinc-800 flex gap-3">
                                    <input 
                                        type="text" 
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Ej: Primero creo un bucle que..." 
                                        className="flex-grow bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                        disabled={isChatting}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isChatting || !chatInput.trim()}
                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        Enviar
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'code' && (
                            <>
                                {/* Editor de Código Simplificado */}
                                <div className="flex-grow bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
                                    <div className="bg-zinc-800/50 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                                        <span className="font-mono text-sm text-zinc-400 flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                            <span className="ml-2">Editor_Codigo.{language}</span>
                                        </span>
                                    </div>
                                    
                                    <textarea
                                        value={currentCode}
                                        onChange={(e) => setCurrentCode(e.target.value)}
                                        className="flex-grow w-full bg-transparent text-zinc-300 p-6 font-mono text-sm sm:text-base leading-relaxed resize-none focus:outline-none focus:ring-2 ring-inset ring-blue-500/20"
                                        spellCheck={false}
                                        placeholder={`// Escribe aquí tu código en ${language} para resolver el objetivo de hoy...\n// Recuerda aplicar: ${currentDayObj.newConcepts.join(', ')}`}
                                    />
                                </div>

                                {/* Controles de Acción y Feedback */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                                    
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={submitCode}
                                            disabled={evaluating || !currentCode.trim()}
                                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                                        >
                                            {evaluating ? 'Evaluando...' : 'Evaluar mi código'}
                                        </button>
                                        
                                        {canSeeSolution && (
                                            <>
                                                <button
                                                    onClick={getSolution}
                                                    disabled={evaluating}
                                                    className="px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg font-medium transition-colors border border-red-500/20"
                                                >
                                                    Ver solución del día
                                                </button>
                                                <button
                                                    onClick={() => setShowCompleteSolutionModal(true)}
                                                    disabled={evaluating}
                                                    className="px-4 py-3 bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded-lg font-bold transition-colors border border-red-500/30"
                                                >
                                                    Ver solución completa
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Intentos */}
                                    <div className="flex flex-col items-end">
                                        <span className={`text-sm font-medium ${attempt.failed_attempts >= 3 ? 'text-red-400' : 'text-zinc-500'}`}>
                                            Fallos: {attempt.failed_attempts} / 3
                                        </span>
                                        {attempt.failed_attempts < 3 && (
                                            <span className="text-xs text-zinc-600">
                                                Falla {3 - attempt.failed_attempts} veces más para ver la solución
                                            </span>
                                        )}
                                    </div>

                                </div>

                                {/* Cuadro de Feedback del Asistente */}
                                {feedback && !isSuccess && (
                                    <div className="p-6 rounded-xl border shadow-lg font-sans text-sm md:text-base leading-relaxed bg-zinc-900 border-zinc-700 text-zinc-300 flex flex-col">
                                        <div className="font-bold mb-4 flex justify-between items-center border-b border-zinc-800 pb-3">
                                            <span className="flex items-center gap-2 text-blue-400">
                                                🤖 Feedback de Tu Tutor IA
                                            </span>
                                        </div>
                                        <div className="space-y-2 whitespace-pre-wrap">
                                            {parseText(feedback)}
                                        </div>

                                        {/* Input box for asking about feedback */}
                                        <form 
                                            onSubmit={(e) => { 
                                                e.preventDefault(); 
                                                if (!feedbackQuestion.trim()) return;
                                                sendChatMessage(`Tengo una duda sobre tu corrección: ${feedbackQuestion}`);
                                                setFeedbackQuestion('');
                                                setActiveTab('chat');
                                            }} 
                                            className="mt-6 flex gap-3 border-t border-zinc-800 pt-5"
                                        >
                                            <input 
                                                type="text" 
                                                value={feedbackQuestion}
                                                onChange={e => setFeedbackQuestion(e.target.value)}
                                                placeholder="¿Dudas sobre el feedback? Pregunta al tutor aquí..." 
                                                className="flex-grow bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                                                disabled={isChatting}
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={isChatting || !feedbackQuestion.trim()}
                                                className="px-5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                                            >
                                                Preguntar
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Modal ¡Lo conseguiste! (Estilo animado) */}
                                {isSuccess && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                                        <div className="bg-zinc-900 border-2 border-green-500 rounded-3xl p-6 md:p-8 max-w-2xl w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.3)] transform animate-in zoom-in-95 duration-500 min-h-[400px] flex flex-col justify-center items-center">
                                            {isGeneratingVariant ? (
                                                <div className="flex flex-col items-center justify-center space-y-6 animate-in zoom-in slide-in-from-bottom-5 duration-700 w-full">
                                                    <div className="text-6xl md:text-8xl animate-bounce">🚀</div>
                                                    <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                                                        ¡Adelante!
                                                    </h2>
                                                    <p className="text-xl text-zinc-300 font-medium animate-pulse">
                                                        Preparando un nuevo reto similar para ti...
                                                    </p>
                                                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mt-4"></div>
                                                </div>
                                            ) : (
                                                <div className="animate-in fade-in duration-500 w-full">
                                                    <div className="text-5xl md:text-7xl mb-4 animate-bounce">🏆</div>
                                                    <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-2">
                                                        ¡Lo conseguiste!
                                                    </h2>
                                                    <p className="text-base md:text-lg text-zinc-300 mb-4">
                                                        Has superado el objetivo con éxito.
                                                    </p>
                                                    
                                                    {feedback && (
                                                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6 text-left max-h-48 overflow-y-auto text-sm text-green-50 font-medium leading-relaxed">
                                                            {parseText(feedback)}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <button 
                                                            onClick={async () => { await nextDay(); onBack(); }}
                                                            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm md:text-base transition-colors border border-zinc-700"
                                                        >
                                                            Esperar hasta mañana
                                                        </button>
                                                        <button 
                                                            onClick={handleGetVariant}
                                                            className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm md:text-base shadow-lg shadow-green-500/20 transition-all active:scale-95"
                                                        >
                                                            Seguir aprendiendo hoy
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Opción discreta para avanzar si realmente quieren */}
                                                    <button 
                                                        onClick={async () => { await nextDay(); onBack(); }}
                                                        className="mt-4 text-xs text-zinc-500 hover:text-green-400 font-medium underline underline-offset-4 transition-colors"
                                                    >
                                                        O avanzar al paso de mañana ahora ➔
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Modal de Solución Completa */}
                                {showCompleteSolutionModal && (
                                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                                        <div className="bg-zinc-900 border border-red-500/50 rounded-2xl p-6 md:p-8 max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-2xl md:text-3xl font-bold text-red-400 flex items-center gap-3">
                                                    <span>⚠️</span> ¿Seguro que quieres ver la solución completa?
                                                </h2>
                                                <button 
                                                    onClick={() => setShowCompleteSolutionModal(false)}
                                                    className="text-zinc-500 hover:text-white text-xl"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            
                                            <p className="text-zinc-300 mb-6 text-lg">
                                                Pregúntale tus dudas a la IA antes de revelar el ejercicio completo. Es la mejor forma de aprender.
                                            </p>
                                            
                                            {/* Chat de dudas */}
                                            <div className="flex-grow bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col min-h-[300px] max-h-[400px] overflow-hidden mb-6">
                                                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                                    {doubtChatMessages.map((msg, idx) => (
                                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[85%] p-3 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-red-900/40 text-red-100 rounded-br-none border border-red-800' : 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-bl-none'}`}>
                                                                {typeof msg.content === 'string' ? parseText(msg.content) : msg.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {isDoubtChatting && (
                                                        <div className="flex justify-start">
                                                            <div className="max-w-[80%] p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-bl-none animate-pulse">
                                                                Escribiendo...
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex flex-col gap-2">
                                                    <form onSubmit={handleSendDoubtChat} className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={doubtChatInput}
                                                            onChange={e => setDoubtChatInput(e.target.value)}
                                                            placeholder="Ej: No entiendo cómo plantear esto, me quedé bloqueado..." 
                                                            className="flex-grow bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                                                            disabled={isDoubtChatting}
                                                        />
                                                        <button 
                                                            type="submit" 
                                                            disabled={isDoubtChatting || !doubtChatInput.trim()}
                                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                                                        >
                                                            Enviar
                                                        </button>
                                                    </form>
                                                    <button
                                                        onClick={startTraining}
                                                        disabled={isDoubtChatting}
                                                        className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <span>🏋️</span> Comenzar entrenamiento (Ejercicios prácticos)
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-4 border-t border-zinc-800 pt-4 mt-auto">
                                                <button 
                                                    onClick={() => setShowCompleteSolutionModal(false)}
                                                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    Seguir intentando
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setShowCompleteSolutionModal(false);
                                                        fetchCompleteSolution();
                                                    }}
                                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-600/20"
                                                >
                                                    Revelar solución completa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
