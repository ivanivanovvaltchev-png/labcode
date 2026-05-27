import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { callDeepSeekForMentor, callDeepSeekForMentorVariant, ChatMessage } from '../../ai/agents';
import { loadKnowledgeProfile, buildKnowledgeBlock, buildPathBlock } from '../../lib/knowledgeProfile';
import { loadCompletedSessions, saveCompletedSession, CompletedSession } from '../../lib/completedSessions';
import { completeTask } from '../../lib/userProgress';
import { loadSelectedPath, loadSelfAssessments } from '../../lib/selectedPath';
import { getPathById, isSkillMastered } from '../../data/careerPaths';
import { generateSkillExercise } from '../../ai/diagnosticAgent';
import { recordMentorSession } from '../../lib/learningMetrics';

const STORAGE_KEY = 'mentor_session';

interface MentorSession {
    exercise: string;
    messages: ChatMessage[];
    savedAt: number;
    skillContext?: string;
}

function saveActiveSession(exercise: string, messages: ChatMessage[], skillContext?: string) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ exercise, messages, savedAt: Date.now(), skillContext }));
}

function loadActiveSession(): MentorSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function clearActiveSession() {
    localStorage.removeItem(STORAGE_KEY);
}

function formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
        + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const TAG = '[EJERCICIO_COMPLETADO]';

const MentorPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // URL params from PathDashboard "Empezar ejercicio"
    const paramTaskTitle  = searchParams.get('taskTitle');
    const paramSkillRef   = searchParams.get('skillRef');
    const paramTaskId     = searchParams.get('taskId');
    const paramTaskIndex  = searchParams.get('taskIndex');
    const paramTotalTasks = searchParams.get('totalTasks');
    const hasSkillContext = !!(paramTaskTitle || paramSkillRef);
    const taskIndex   = paramTaskIndex  !== null ? parseInt(paramTaskIndex)  : null;
    const totalTasks  = paramTotalTasks !== null ? parseInt(paramTotalTasks) : null;

    const [exercise, setExercise] = useState('');
    const [exerciseSubmitted, setExerciseSubmitted] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
    const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
    const [savedSession, setSavedSession] = useState<MentorSession | null>(null);
    const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [variantOrigin, setVariantOrigin] = useState<string | null>(null);
    const [manuallyCompleted, setManuallyCompleted] = useState(false);
    const [currentSkillContext, setCurrentSkillContext] = useState<string | null>(null);
    const [showCompletionPopup, setShowCompletionPopup] = useState(false);
    // Saved before URL params are cleared so the popup still has them at completion time
    const [savedTaskId, setSavedTaskId] = useState<string | null>(null);
    const [savedTaskIndex, setSavedTaskIndex] = useState<number | null>(null);
    const [savedTotalTasks, setSavedTotalTasks] = useState<number | null>(null);
    const [isFromTaskCard, setIsFromTaskCard] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getKnowledgeBlock = () => {
        const profile = loadKnowledgeProfile();
        const knowledgeBlock = buildKnowledgeBlock(profile);
        const pathId = loadSelectedPath();
        const path = pathId ? getPathById(pathId) : null;
        if (path && profile) {
            const ass = loadSelfAssessments(pathId!);
            const gapSkills = path.skills
                .filter(s => s.importance === 'critical' && !isSkillMastered(s, profile.concepts, ass))
                .map(s => s.name);
            return knowledgeBlock + buildPathBlock(path.jobTitle, gapSkills);
        }
        return knowledgeBlock;
    };

    // Auto-generate exercise when coming from PathDashboard
    useEffect(() => {
        const session = loadActiveSession();
        setCompletedSessions(loadCompletedSessions());

        if (hasSkillContext) {
            // Coming from a skill/task button — save params to state BEFORE clearing URL
            const skillLabel = paramTaskTitle ?? paramSkillRef ?? '';
            setCurrentSkillContext(skillLabel);
            setIsFromTaskCard(true);
            if (paramTaskId)     setSavedTaskId(paramTaskId);
            if (taskIndex !== null)  setSavedTaskIndex(taskIndex);
            if (totalTasks !== null) setSavedTotalTasks(totalTasks);

            setIsGeneratingExercise(true);
            setExerciseSubmitted(true);

            const pathId = loadSelectedPath();
            const path = pathId ? getPathById(pathId) : null;
            const profile = loadKnowledgeProfile();

            generateSkillExercise(
                paramSkillRef ?? paramTaskTitle ?? '',
                path?.title ?? 'Programación',
                profile?.concepts ?? []
            ).then(async generatedExercise => {
                setExercise(generatedExercise);
                setIsGeneratingExercise(false);
                setIsLoading(true);
                const resp = await callDeepSeekForMentor(generatedExercise, [], 'init', getKnowledgeBlock());
                setMessages([{ role: 'assistant', content: resp }]);
                setIsLoading(false);
                // Clear URL params so refresh doesn't re-generate
                setSearchParams({}, { replace: true });
            }).catch(() => {
                setIsGeneratingExercise(false);
                setExerciseSubmitted(false);
            });
        } else if (session?.messages.length) {
            setSavedSession(session);
            setCurrentSkillContext(session.skillContext ?? null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (exerciseSubmitted && exercise) saveActiveSession(exercise, messages, currentSkillContext ?? undefined);
    }, [messages, exercise, exerciseSubmitted, currentSkillContext]);

    const isCompleted = manuallyCompleted || messages.some(m => m.role === 'assistant' && m.content.includes(TAG));

    // Record session completion once when isCompleted first becomes true
    const completionRecordedRef = useRef(false);
    useEffect(() => {
        if (isCompleted && !completionRecordedRef.current && currentSkillContext) {
            completionRecordedRef.current = true;
            const pathId = loadSelectedPath();
            const path = pathId ? getPathById(pathId) : null;
            if (pathId) {
                const skill = path?.skills.find(s => s.name === currentSkillContext);
                recordMentorSession(pathId, skill?.id ?? currentSkillContext, currentSkillContext);
            }
        }
    }, [isCompleted, currentSkillContext]);
    // Open popup the first time isCompleted turns true (only when coming from a task card)
    const popupShownRef = useRef(false);
    useEffect(() => {
        if (isCompleted && isFromTaskCard && !popupShownRef.current) {
            popupShownRef.current = true;
            setShowCompletionPopup(true);
        }
    }, [isCompleted, isFromTaskCard]);

    const handleNextTask = () => {
        const pathId = loadSelectedPath();
        if (pathId && savedTaskId) completeTask(pathId, savedTaskId);
        saveCompletedSession({ exercise, messages, completedAt: Date.now(), isVariantOf: variantOrigin ?? undefined });
        clearActiveSession();
        navigate('/camino');
    };

    const handleVariantFromPopup = () => {
        setShowCompletionPopup(false);
        handleCreateVariant();
    };

    const stripTag = (text: string) => text.replace(TAG, '').trim();

    const resumeSession = () => {
        if (!savedSession) return;
        setExercise(savedSession.exercise);
        setMessages(savedSession.messages);
        setCurrentSkillContext(savedSession.skillContext ?? null);
        setExerciseSubmitted(true);
        setSavedSession(null);
    };

    const handleExerciseSubmit = async () => {
        if (!exercise.trim()) return;
        setSavedSession(null);
        setVariantOrigin(null);
        setExerciseSubmitted(true);
        setIsLoading(true);
        const resp = await callDeepSeekForMentor(exercise, [], 'init', getKnowledgeBlock());
        setMessages([{ role: 'assistant', content: resp }]);
        setIsLoading(false);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || isCompleted) return;
        const userMsg: ChatMessage = { role: 'user', content: input };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setInput('');
        setIsLoading(true);
        const resp = await callDeepSeekForMentor(exercise, updated, 'chat', getKnowledgeBlock());
        setMessages([...updated, { role: 'assistant', content: resp }]);
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleCreateVariant = async () => {
        saveCompletedSession({ exercise, messages, completedAt: Date.now(), isVariantOf: variantOrigin ?? undefined });
        clearActiveSession();
        setCompletedSessions(loadCompletedSessions());
        setManuallyCompleted(false);

        setIsGeneratingVariant(true);
        const origin = exercise;
        const variantExercise = await callDeepSeekForMentorVariant(origin, getKnowledgeBlock());
        setIsGeneratingVariant(false);

        setVariantOrigin(origin);
        setExercise(variantExercise);
        setMessages([]);
        setIsLoading(true);
        const resp = await callDeepSeekForMentor(variantExercise, [], 'init', getKnowledgeBlock());
        setMessages([{ role: 'assistant', content: resp }]);
        setIsLoading(false);
    };

    const handleNewExercise = () => {
        if (messages.length > 0 && !isCompleted) {
            if (!window.confirm('¿Seguro? Perderás el progreso actual.')) return;
        }
        if (isCompleted) {
            saveCompletedSession({ exercise, messages, completedAt: Date.now(), isVariantOf: variantOrigin ?? undefined });
            setCompletedSessions(loadCompletedSessions());
        }
        clearActiveSession();
        setExercise('');
        setExerciseSubmitted(false);
        setMessages([]);
        setInput('');
        setSavedSession(null);
        setVariantOrigin(null);
        setManuallyCompleted(false);
        setCurrentSkillContext(null);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

            {/* ── Completion popup ── */}
            {showCompletionPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowCompletionPopup(false)} />
                    <div className="relative z-10 bg-[#1a1a1a] border border-emerald-500/40 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-emerald-500/10 text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-light mb-1">¡Completado!</h2>
                        <p className="text-sm text-emerald-400 font-semibold mb-1">{currentSkillContext}</p>
                        {savedTaskIndex !== null && savedTotalTasks !== null && (
                            <p className="text-xs text-light/30 mb-6">Tarjeta {savedTaskIndex + 1} de {savedTotalTasks}</p>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleNextTask}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl text-sm transition-all"
                            >
                                {savedTaskIndex !== null && savedTotalTasks !== null && savedTaskIndex + 1 >= savedTotalTasks
                                    ? '🎉 Terminar entrenamiento de hoy'
                                    : `➡️ Siguiente tarjeta (${savedTaskIndex !== null ? savedTaskIndex + 2 : ''}/${savedTotalTasks})`}
                            </button>
                            <button
                                onClick={handleVariantFromPopup}
                                className="w-full bg-violet-900/30 hover:bg-violet-900/50 border border-violet-500/30 text-violet-300 font-bold py-4 rounded-2xl text-sm transition-all"
                            >
                                🔄 Quiero una variante del ejercicio
                            </button>
                            <button
                                onClick={() => setShowCompletionPopup(false)}
                                className="text-xs text-light/25 hover:text-light/50 transition-colors pt-1"
                            >
                                Seguir en el chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/')} className="text-light/40 hover:text-light transition-colors text-sm">
                    ← Volver
                </button>
                {currentSkillContext && (
                    <span className="text-xs bg-violet-900/30 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-full">
                        🎯 Practicando: {currentSkillContext}
                    </span>
                )}
            </div>

            {/* Loading state: generating exercise from skill */}
            {isGeneratingExercise && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl animate-pulse">
                        🧠
                    </div>
                    <div className="text-center">
                        <p className="text-light font-semibold mb-1">Preparando tu ejercicio…</p>
                        <p className="text-sm text-light/40">
                            La IA está generando un ejercicio personalizado para{' '}
                            <span className="text-violet-400">{paramTaskTitle ?? paramSkillRef}</span>
                        </p>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>
                </div>
            )}

            {/* Manual exercise input (when coming directly to /mentor) */}
            {!exerciseSubmitted && !isGeneratingExercise && (
                <div className="flex flex-col items-center">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent mb-2">
                            🧠 Modo Mentor
                        </h1>
                        <p className="text-light/40 text-sm max-w-lg mx-auto">
                            Pega el enunciado de tu ejercicio y te guiaré paso a paso sin darte las respuestas directas.
                        </p>
                    </div>

                    {savedSession && (
                        <div className="w-full max-w-2xl bg-violet-900/20 border border-violet-500/30 rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-xs text-violet-400 font-semibold mb-1">
                                    ⏱ Sesión guardada · {formatDate(savedSession.savedAt)}
                                    {savedSession.skillContext && <span className="ml-2 text-violet-300">· {savedSession.skillContext}</span>}
                                </div>
                                <p className="text-sm text-light/60 truncate font-mono">{savedSession.exercise.slice(0, 120)}{savedSession.exercise.length > 120 ? '…' : ''}</p>
                                <div className="text-xs text-light/30 mt-1">{savedSession.messages.length} mensajes</div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button onClick={resumeSession} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap">
                                    Continuar →
                                </button>
                                <button onClick={() => setSavedSession(null)} className="text-xs text-light/30 hover:text-red-400 transition-colors text-center">
                                    Descartar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-2xl bg-[#1a1a1a] border border-light/10 rounded-2xl p-6">
                        <label className="block text-sm font-semibold text-light/70 mb-3">📋 Pega el enunciado de tu ejercicio</label>
                        <textarea
                            value={exercise}
                            onChange={(e) => setExercise(e.target.value)}
                            placeholder="Ejemplo: Escribe un programa que lea una lista de números enteros y calcule la media, el máximo y el mínimo..."
                            className="w-full bg-[#0f0f0f] border border-light/10 rounded-xl p-4 text-light placeholder-light/30 resize-none focus:outline-none focus:border-violet-500/50 transition-colors font-mono text-sm min-h-[180px]"
                        />
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-light/30">Cuanto más detallado, mejor te guiaré.</span>
                            <button
                                onClick={handleExerciseSubmit}
                                disabled={!exercise.trim()}
                                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
                            >
                                Empezar →
                            </button>
                        </div>
                    </div>

                    {completedSessions.length > 0 && (
                        <div className="w-full max-w-2xl mt-5">
                            <button
                                onClick={() => setHistoryOpen(h => !h)}
                                className="w-full flex items-center justify-between bg-[#1a1a1a] border border-light/10 rounded-2xl px-5 py-3 text-sm text-light/40 hover:text-light/60 transition-colors"
                            >
                                <span>📚 Ejercicios completados ({completedSessions.length})</span>
                                <span>{historyOpen ? '▲' : '▼'}</span>
                            </button>
                            {historyOpen && (
                                <div className="mt-2 space-y-2">
                                    {completedSessions.map(s => (
                                        <div key={s.id} className="bg-[#1a1a1a] border border-light/10 rounded-xl px-4 py-3">
                                            <span className="text-xs text-emerald-400 font-semibold">✅ {formatDate(s.completedAt)}</span>
                                            {s.isVariantOf && <span className="text-xs text-violet-400 ml-2">variante</span>}
                                            <p className="text-xs text-light/40 font-mono mt-1 line-clamp-2">{s.exercise.slice(0, 150)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Chat interface */}
            {exerciseSubmitted && !isGeneratingExercise && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" style={{ height: 'calc(100vh - 180px)' }}>
                    {/* Left panel */}
                    <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
                        <div className="bg-[#1a1a1a] border border-violet-500/20 rounded-2xl p-4 flex-1 overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                                    📋 Ejercicio{variantOrigin ? ' · variante' : ''}
                                </span>
                                <button onClick={handleNewExercise} className="text-xs text-light/30 hover:text-red-400 transition-colors">
                                    Nuevo
                                </button>
                            </div>
                            {exercise ? (
                                <p className="text-sm text-light/70 leading-relaxed whitespace-pre-wrap font-mono">{exercise}</p>
                            ) : (
                                <div className="flex items-center gap-2 text-light/30 text-sm">
                                    <LoadingDots /> <span>Generando…</span>
                                </div>
                            )}
                        </div>

                        {completedSessions.length > 0 && (
                            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl flex-shrink-0 overflow-hidden">
                                <button
                                    onClick={() => setHistoryOpen(h => !h)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-xs text-light/40 hover:text-light/60 transition-colors"
                                >
                                    <span>📚 Historial ({completedSessions.length})</span>
                                    <span>{historyOpen ? '▲' : '▼'}</span>
                                </button>
                                {historyOpen && (
                                    <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
                                        {completedSessions.map(s => (
                                            <div key={s.id} className="bg-[#0f0f0f] rounded-xl p-2.5">
                                                <span className="text-xs text-emerald-400">✅ {formatDate(s.completedAt)}</span>
                                                {s.isVariantOf && <span className="text-xs text-violet-400 ml-1">variante</span>}
                                                <p className="text-xs text-light/40 font-mono line-clamp-1 mt-1">{s.exercise.slice(0, 80)}…</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-4 flex-shrink-0">
                            <div className="text-xs font-semibold text-light/30 uppercase tracking-wider mb-2">💡 Recuerda</div>
                            <div className="space-y-1.5 text-xs text-light/35">
                                <p>• El mentor NO te dará el código completo</p>
                                <p>• Explica tu razonamiento en cada paso</p>
                                <p>• Si te atascas, pide una pista específica</p>
                            </div>
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="lg:col-span-8 flex flex-col bg-[#1a1a1a] border border-light/10 rounded-2xl overflow-hidden min-h-0">
                        <div className="px-5 py-3 border-b border-light/10 flex items-center gap-3 flex-shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm">🧠</div>
                            <div>
                                <div className="text-sm font-bold text-light">Mentor IA</div>
                                <div className="text-xs text-light/40">Te guía sin darte las respuestas</div>
                            </div>
                            {isCompleted && (
                                <div className="ml-auto flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-500/30 rounded-full px-3 py-1">
                                    <span className="text-xs text-emerald-400 font-semibold">✅ Completado</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {(isLoading || isGeneratingExercise) && messages.length === 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-xs flex-shrink-0">🧠</div>
                                    <div className="bg-[#0f0f0f] border border-light/10 rounded-2xl rounded-tl-none px-4 py-3">
                                        <LoadingDots />
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600/20' : 'bg-violet-600/20'}`}>
                                        {msg.role === 'user' ? '👤' : '🧠'}
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/20 rounded-tr-none text-light' : 'bg-[#0f0f0f] border border-light/10 rounded-tl-none text-light/80'}`}>
                                        {stripTag(msg.content)}
                                    </div>
                                </div>
                            ))}

                            {isLoading && messages.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-xs flex-shrink-0">🧠</div>
                                    <div className="bg-[#0f0f0f] border border-light/10 rounded-2xl rounded-tl-none px-4 py-3">
                                        <LoadingDots color="violet" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Completion banner OR input */}
                        {isCompleted ? (
                            <div className="p-4 border-t border-emerald-500/20 bg-emerald-900/10 flex-shrink-0">
                                {isGeneratingVariant ? (
                                    <div className="flex items-center justify-center gap-3 py-2">
                                        <LoadingDots color="emerald" />
                                        <span className="text-sm text-emerald-400">Generando variante…</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="flex-1 text-center sm:text-left">
                                            <p className="text-sm font-semibold text-emerald-300">🎉 ¡Ejercicio completado!</p>
                                            <p className="text-xs text-light/40 mt-0.5">¿Consolidamos con una variante diferente?</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={handleCreateVariant} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">
                                                🔄 Variante
                                            </button>
                                            <button onClick={handleNewExercise} className="bg-[#0f0f0f] hover:bg-light/5 border border-light/10 text-light/60 hover:text-light font-bold px-4 py-2 rounded-xl text-sm transition-all">
                                                Nuevo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 border-t border-light/10 flex-shrink-0">
                                <div className="flex gap-3">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Escribe tu respuesta o pregunta… (Enter para enviar)"
                                        disabled={isLoading}
                                        rows={2}
                                        className="flex-1 bg-[#0f0f0f] border border-light/10 rounded-xl px-4 py-3 text-sm text-light placeholder-light/30 resize-none focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50 max-h-[120px]"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 rounded-xl transition-all self-end py-3"
                                    >
                                        →
                                    </button>
                                </div>
                                {messages.length >= 2 && (
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            onClick={() => setManuallyCompleted(true)}
                                            className="text-xs text-emerald-500/50 hover:text-emerald-400 transition-colors"
                                        >
                                            ✅ He terminado el ejercicio
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const LoadingDots: React.FC<{ color?: 'violet' | 'emerald' }> = ({ color = 'violet' }) => {
    const cls = color === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400';
    return (
        <div className="flex gap-1 items-center h-5">
            <span className={`w-2 h-2 ${cls} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
            <span className={`w-2 h-2 ${cls} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
            <span className={`w-2 h-2 ${cls} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
        </div>
    );
};

export default MentorPage;
