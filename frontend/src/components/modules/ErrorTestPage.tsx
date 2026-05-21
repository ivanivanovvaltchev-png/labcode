import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { agents, callDeepSeekForErrorTest, callDeepSeekForEvaluation, callDeepSeekForHelp } from '../../ai/agents';

interface FailedExercise {
    id: string;
    module_id: number;
    topic: string;
    difficulty: string;
    exercise_text: string;
    created_at: string;
}

const ErrorTestPage: React.FC = () => {
    const navigate = useNavigate();
    const [failedExercises, setFailedExercises] = useState<FailedExercise[]>([]);
    const [activeExercise, setActiveExercise] = useState<FailedExercise | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [newExerciseDesc, setNewExerciseDesc] = useState('');
    const [userCode, setUserCode] = useState('');
    const [aiResponse, setAiResponse] = useState('');

    useEffect(() => {
        loadFailedExercises();
    }, []);

    const loadFailedExercises = async () => {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user.id) {
            const { data, error } = await supabase
                .from('user_exercises')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'failed')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setFailedExercises(data);
            }
        }
        setIsLoading(false);
    };

    const handleStartTest = async (exercise: FailedExercise) => {
        setActiveExercise(exercise);
        setIsLoading(true);
        setNewExerciseDesc('Generando un nuevo reto basado en tu error anterior...');
        setAiResponse('');
        setUserCode('');

        const response = await callDeepSeekForErrorTest(exercise.module_id, exercise.exercise_text);
        setNewExerciseDesc(response);
        setIsLoading(false);
    };

    const handleEvaluateCode = async () => {
        if (!userCode.trim() || !activeExercise) return;
        setIsLoading(true);
        setAiResponse("Analizando el código...");
        const response = await callDeepSeekForEvaluation(activeExercise.module_id, userCode, newExerciseDesc);

        let finalResponse = response;
        if (response.includes('[CORRECTO]')) {
            finalResponse = response.replace('[CORRECTO]', '').trim();
            finalResponse = "✅ ¡Error Superado! Has corregido tus fallos en este concepto.\n\n" + finalResponse;

            // Mark as completed in DB
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await supabase.from('user_exercises').update({ status: 'completed' }).eq('id', activeExercise.id);
                // Remove from local list
                setFailedExercises(prev => prev.filter(e => e.id !== activeExercise.id));
            }
        }

        setAiResponse(finalResponse);
        setIsLoading(false);
    };

    const handleHelpAction = async (action: 'pista' | 'explicar') => {
        if (!activeExercise) return;
        setIsLoading(true);
        setAiResponse(`Solicitando ${action} a la IA...`);
        const response = await callDeepSeekForHelp(activeExercise.module_id, action, newExerciseDesc);
        setAiResponse(response);
        setIsLoading(false);
    };

    if (activeExercise) {
        const agent = agents[activeExercise.module_id];
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 fade-in min-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setActiveExercise(null)} className="text-light/50 hover:text-light flex items-center gap-2 transition-colors font-medium">
                        ← Volver a Lista de Errores
                    </button>
                    <span className="text-red-500 font-mono font-bold tracking-widest text-sm uppercase">Modo Test de Errores</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                    {/* PANEL IZQUIERDO */}
                    <div className="bg-[#121212] border border-red-500/30 rounded-2xl flex flex-col shadow-[0_0_30px_rgba(239,68,68,0.1)] overflow-hidden h-fit">
                        <div className="bg-red-900/20 border-b border-red-500/20 px-6 py-4">
                            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">⚠️ Repaso: {agent?.moduleName} - {activeExercise.topic}</h2>
                        </div>
                        <div className="p-6">
                            <div className="prose prose-invert max-w-none text-sm lg:text-base text-light/90 whitespace-pre-wrap">
                                {newExerciseDesc}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-6 mt-6 border-t border-light/10">
                                <button onClick={() => handleHelpAction('explicar')} disabled={isLoading} className="py-2 text-xs bg-dark/50 hover:bg-light/5 border border-light/10 rounded-lg text-light/80 transition-colors">Explicar Enunciado</button>
                                <button onClick={() => handleHelpAction('pista')} disabled={isLoading} className="py-2 text-xs bg-dark/50 hover:bg-light/5 border border-light/10 rounded-lg text-light/80 transition-colors">Dame una Pista</button>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl flex flex-col shadow-xl overflow-hidden flex-1 shrink-0 h-[400px]">
                            <div className="bg-[#2a2a2a] px-4 py-2 text-xs font-mono text-light/60 border-b border-light/5 flex justify-between items-center">
                                <span>workspace.txt</span>
                                {isLoading && <span className="text-primary animate-pulse">Pensando...</span>}
                            </div>
                            <textarea
                                value={userCode}
                                onChange={e => setUserCode(e.target.value)}
                                placeholder="Escribe tu código aquí..."
                                className="w-full h-full bg-transparent text-light font-mono p-4 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
                                spellCheck={false}
                            />
                            <div className="p-3 bg-[#2a2a2a] border-t border-light/5 flex justify-end">
                                <button
                                    onClick={handleEvaluateCode}
                                    disabled={isLoading || !userCode.trim()}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
                                >
                                    Evaluar Corrección
                                </button>
                            </div>
                        </div>

                        {aiResponse && (
                            <div className="bg-red-900/10 border border-red-500/30 rounded-2xl p-6 shadow-xl fade-in flex items-start gap-4">
                                <div className="text-2xl">🤖</div>
                                <div className="prose prose-invert prose-p:text-red-100 max-w-none text-sm lg:text-base whitespace-pre-wrap">
                                    {aiResponse}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 fade-in min-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => navigate('/')} className="text-light/50 hover:text-light flex items-center gap-2 transition-colors font-medium">
                    ← Volver al Mapa
                </button>
                <h1 className="text-2xl font-bold text-red-500 flex items-center gap-3">
                    ⚠️ Test de Errores
                </h1>
            </div>

            {isLoading && !failedExercises.length ? (
                <div className="text-center text-light/50 py-20 animate-pulse">Cargando tus errores...</div>
            ) : failedExercises.length === 0 ? (
                <div className="bg-green-900/20 border border-green-500/30 rounded-3xl p-12 text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                    <div className="text-6xl mb-6">🏆</div>
                    <h2 className="text-2xl font-bold text-green-400 mb-2">¡Todo limpio!</h2>
                    <p className="text-light/70 max-w-md mx-auto">No tienes ningún error pendiente. Has superado todos los ejercicios o aún no has fallado ninguno. ¡Sigue así!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {failedExercises.map(exercise => (
                        <div key={exercise.id} className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl p-6 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all flex flex-col cursor-pointer" onClick={() => handleStartTest(exercise)}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-red-900/30 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">Módulo {exercise.module_id}</span>
                                <span className="text-xs text-light/40 uppercase font-mono">{exercise.difficulty}</span>
                            </div>
                            <h3 className="text-lg font-bold text-light mb-2">{exercise.topic}</h3>
                            <p className="text-sm text-light/50 line-clamp-3 mb-6 flex-1">
                                {exercise.exercise_text}
                            </p>
                            <button className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold rounded-xl border border-red-500/30 transition-colors">
                                Practicar de nuevo
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ErrorTestPage;
