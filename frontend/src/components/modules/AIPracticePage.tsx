import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agents, callDeepSeekForExercise, callDeepSeekForEvaluation, callDeepSeekForHelp, callDeepSeekForChat, callDeepSeekForSolution, ChatMessage } from '../../ai/agents';
import { supabase } from '../../lib/supabaseClient';

const AIPracticePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "1", 10);
    const agent = agents[moduleId];

    // Form States
    const [selectedTopic, setSelectedTopic] = useState(agent?.topics[0] || "Tema General");
    const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('facil');

    // Engine States
    const [exerciseDesc, setExerciseDesc] = useState<string>('');
    const [userCode, setUserCode] = useState<string>('');
    const [aiResponse, setAiResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Solution States
    const [evaluationAttempts, setEvaluationAttempts] = useState(0);
    const [hasShownSolution, setHasShownSolution] = useState(false);

    // Chat States
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Initial message
    useEffect(() => {
        if (!agent) {
            setExerciseDesc("Agente de IA no disponible para este módulo aún. Por favor seleccione otro módulo en el mapa.");
        } else {
            setExerciseDesc(`¡Hola! Soy tu asistente de IA para el módulo de **${agent.moduleName}**.\nSelecciona un tema y dificultad arriba, pulsa "Generar Ejercicio" y empecemos a estudiar.`);
        }
        setAiResponse('');
        setUserCode('');
    }, [moduleId, agent]);

    const saveExerciseResult = async (status: 'completed' | 'failed') => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user.id) return;

        try {
            await supabase.from('user_exercises').insert({
                user_id: session.user.id,
                module_id: moduleId,
                topic: selectedTopic,
                difficulty,
                exercise_text: exerciseDesc,
                status
            });
        } catch (error) {
            console.error("Error saving exercise:", error);
        }
    };

    const handleGenerateExercise = async () => {
        if (!agent) return;
        setIsLoading(true);
        setEvaluationAttempts(0);
        setHasShownSolution(false);
        setExerciseDesc("Generando tu ejercicio personalizado mediante IA...");
        setAiResponse('');
        setUserCode('');
        const response = await callDeepSeekForExercise(moduleId, selectedTopic, difficulty);
        setExerciseDesc(response);
        setIsLoading(false);
    };

    const handleEvaluateCode = async () => {
        if (!userCode.trim() || !agent) return;
        setIsLoading(true);
        setEvaluationAttempts(prev => prev + 1);
        setAiResponse("Analizando el código...");
        const chatContextStr = chatHistory.length > 0
            ? chatHistory.map(msg => `${msg.role === 'user' ? 'Alumno' : 'Tutor IA'}: ${msg.content}`).join('\n\n')
            : undefined;
        const response = await callDeepSeekForEvaluation(moduleId, userCode, exerciseDesc, chatContextStr);

        let finalResponse = response;
        if (response.includes('[CORRECTO]')) {
            finalResponse = response.replace('[CORRECTO]', '').trim();
            finalResponse = "✅ ¡Ejercicio Completado con Éxito!\n\n" + finalResponse;
            saveExerciseResult('completed');
        }

        setAiResponse(finalResponse);
        setIsLoading(false);
    };

    const handleShowSolution = async () => {
        if (!agent) return;
        setIsLoading(true);
        setAiResponse("Generando la solución correcta detallada...");
        const response = await callDeepSeekForSolution(moduleId, exerciseDesc);
        setAiResponse(response);
        setHasShownSolution(true);
        saveExerciseResult('failed');
        setIsLoading(false);
    };

    const handleHelpAction = async (action: 'pista' | 'explicar' | 'variar') => {
        if (!agent) return;
        setIsLoading(true);
        setAiResponse(`Solicitando ${action} a la IA...`);
        const response = await callDeepSeekForHelp(moduleId, action, exerciseDesc);
        setAiResponse(response);
        setIsLoading(false);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !agent) return;

        const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: chatInput }];
        setChatHistory(newHistory);
        setChatInput('');
        setIsLoading(true);

        const response = await callDeepSeekForChat(moduleId, newHistory, exerciseDesc, userCode);

        setChatHistory([...newHistory, { role: 'assistant', content: response }]);
        setIsLoading(false);
    };

    if (!agent) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center mt-20 fade-in">
                <h2 className="text-xl text-light">Módulo de IA no configurado todavía. (ID: {moduleId})</h2>
                <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-primary text-white rounded">Volver al Mapa</button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 fade-in min-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/')} className="text-light/50 hover:text-light flex items-center gap-2 transition-colors font-medium">
                    ← Volver al Mapa
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-primary font-mono font-bold tracking-widest text-sm uppercase">Módulo {moduleId}: {agent.moduleName}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 xl:gap-8 flex-1">
                {/* PANEL IZQUIERDO: AI CONTROLS */}
                <div className="bg-[#121212] border border-light/10 rounded-2xl flex flex-col shadow-xl overflow-hidden h-fit sticky top-20">
                    <div className="bg-primary/10 border-b border-primary/20 px-6 py-4 flex items-center gap-3">
                        <span className="text-2xl">🧠</span>
                        <h2 className="text-lg font-bold text-primary">Tutor Inteligente Base</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs text-light/50 font-mono uppercase tracking-wider">Concepto a Practicar</label>
                            <select
                                value={selectedTopic}
                                onChange={e => setSelectedTopic(e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-light/20 rounded-lg px-4 py-3 text-light focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                            >
                                {agent.topics.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-light/50 font-mono uppercase tracking-wider">Nivel de Dificultad</label>
                            <div className="flex gap-2">
                                {['facil', 'medio', 'dificil'].map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => setDifficulty(lvl as any)}
                                        className={`flex-1 py-2 rounded-lg capitalize font-medium text-sm transition-all border ${difficulty === lvl ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-transparent text-light/50 border-light/10 hover:border-light/30'}`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateExercise}
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl bg-accent text-dark font-extrabold hover:bg-yellow-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                            {isLoading ? 'Conectando...' : '⚡ Generar Ejercicio'}
                        </button>

                        {/* BOTONERA ACCIONES RÁPIDAS */}
                        <div className="grid grid-cols-2 gap-2 pt-6 border-t border-light/10">
                            <button onClick={() => handleHelpAction('explicar')} disabled={isLoading} className="py-2 text-xs bg-dark/50 hover:bg-light/5 border border-light/10 rounded-lg text-light/80 transition-colors">
                                Explicar Enunciado
                            </button>
                            <button onClick={() => handleHelpAction('pista')} disabled={isLoading} className="py-2 text-xs bg-dark/50 hover:bg-light/5 border border-light/10 rounded-lg text-light/80 transition-colors">
                                Dame una Pista
                            </button>
                            <button onClick={() => handleHelpAction('variar')} disabled={isLoading} className="py-2 text-xs bg-dark/50 hover:bg-light/5 border border-light/10 rounded-lg text-light/80 transition-colors col-span-2">
                                Generar Variante Similar
                            </button>

                            {!hasShownSolution && (
                                <div className="col-span-2 mt-2 p-3 border border-light/5 rounded-lg bg-dark/30 flex flex-col sm:flex-row items-center gap-3">
                                    <button
                                        onClick={handleShowSolution}
                                        disabled={isLoading || evaluationAttempts < 3}
                                        className={`py-2 px-4 text-xs font-bold rounded-lg transition-colors whitespace-nowrap
                                            ${evaluationAttempts >= 3
                                                ? 'bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-red-200'
                                                : 'bg-gray-800/50 border border-gray-700/50 text-gray-500 cursor-not-allowed'
                                            }
                                        `}>
                                        Revelar Solución
                                    </button>
                                    {evaluationAttempts < 3 && (
                                        <span className="text-xs text-light/40 italic text-center sm:text-left">
                                            Desbloquéalo al intentarlo 3 veces por ti solo ({evaluationAttempts}/3).
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: WORKSPACE */}
                <div className="flex flex-col gap-6 h-full min-h-[600px]">
                    {/* ENUNCIADO DE IA */}
                    <div className="bg-[#1e1e1e] border border-light/10 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-accent to-primary"></div>
                        <h3 className="text-sm font-mono text-light/30 mb-4 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                            Log de Agente
                        </h3>
                        <div className="prose prose-invert prose-p:text-light/90 max-w-none text-base whitespace-pre-wrap">
                            {exerciseDesc}
                        </div>
                    </div>

                    {/* CONSOLA DE CÓDIGO */}
                    <div className="bg-[#0f0f0f] border border-light/20 rounded-2xl flex flex-col flex-1 shadow-2xl relative overflow-hidden focus-within:border-primary transition-colors">
                        <div className="bg-[#1a1a1a] px-4 py-3 border-b border-light/10 flex justify-between items-center">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-accent/80"></div>
                            </div>
                            <span className="text-xs font-mono text-light/40">workspace.txt (Pega tu código)</span>
                        </div>

                        <textarea
                            value={userCode}
                            onChange={e => setUserCode(e.target.value)}
                            placeholder="// Escribe o pega aquí tu código para que la IA lo revise..."
                            className="bg-transparent text-light font-mono p-6 outline-none resize-none flex-1 hide-scrollbar"
                            spellCheck="false"
                        />

                        <div className="p-4 bg-[#1a1a1a] border-t border-light/10 flex justify-end">
                            <button
                                onClick={handleEvaluateCode}
                                disabled={isLoading || !userCode.trim()}
                                className="px-8 py-3 bg-primary hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                Evaluar con IA ➔
                            </button>
                        </div>
                    </div>

                    {/* RESPUESTA DEL AGENTE AL CÓDIGO */}
                    {aiResponse && (
                        <div className="bg-blue-900/20 border border-primary/30 rounded-2xl p-6 shadow-xl fade-in flex items-start gap-4 lg:p-8">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0 border border-primary/50 text-xl">
                                🤖
                            </div>
                            <div className="prose prose-invert prose-p:text-blue-100 max-w-none text-sm lg:text-base whitespace-pre-wrap">
                                {aiResponse}
                            </div>
                        </div>
                    )}

                    {/* CHAT INTERACTIVO */}
                    <div className="bg-[#1e1e1e] border border-light/10 rounded-2xl flex flex-col shadow-xl overflow-hidden mt-2 h-[400px]">
                        <div className="bg-[#1a1a1a] px-4 py-3 border-b border-light/10 flex items-center justify-between">
                            <span className="text-sm font-bold text-primary flex items-center gap-2">
                                💬 Chat con el Tutor IA
                            </span>
                            {chatHistory.length > 0 && (
                                <button onClick={() => setChatHistory([])} className="text-xs text-light/50 hover:text-light transition-colors">Limpiar Chat</button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatHistory.length === 0 ? (
                                <div className="text-center text-light/40 mt-10 text-sm">Pregunta cualquier duda sobre el ejercicio o tu código actual.</div>
                            ) : (
                                chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-xl p-4 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none shadow-md' : 'bg-[#2a2a2a] border border-light/10 text-light/90 rounded-bl-none shadow-md'}`}>
                                            <div className="font-bold text-xs opacity-50 mb-1">{msg.role === 'user' ? 'Tú' : 'Tutor IA'}</div>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#2a2a2a] border border-light/10 text-light/50 text-xs rounded-xl rounded-bl-none p-4 shadow-md animate-pulse">Escribiendo...</div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleChatSubmit} className="bg-[#1a1a1a] p-3 border-t border-light/10 flex gap-2">
                            <textarea
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleChatSubmit(e as any);
                                    }
                                }}
                                placeholder="Escribe tu duda o pega tu código aquí... (Enter para enviar, Shift+Enter para salto de línea)"
                                className="flex-1 bg-[#121212] border border-light/20 rounded-lg px-4 py-3 text-sm text-light focus:outline-none focus:border-primary transition-colors resize-none min-h-[44px] max-h-[200px] hide-scrollbar font-mono leading-relaxed"
                                rows={chatInput.split('\n').length > 1 ? Math.min(chatInput.split('\n').length, 8) : 1}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !chatInput.trim()}
                                className="px-6 py-3 bg-primary text-white font-bold rounded-lg disabled:opacity-50 hover:bg-blue-500 transition-colors flex items-center gap-2"
                            >
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPracticePage;
