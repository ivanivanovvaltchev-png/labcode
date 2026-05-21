import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callDeepSeekForMentor, callDeepSeekForMentorVariant, ChatMessage } from '../../ai/agents';
import { loadKnowledgeProfile, buildKnowledgeBlock, buildPathBlock } from '../../lib/knowledgeProfile';
import { loadCompletedSessions, saveCompletedSession, CompletedSession } from '../../lib/completedSessions';
import { loadSelectedPath, loadSelfAssessments } from '../../lib/selectedPath';
import { getPathById, isSkillMastered } from '../../data/careerPaths';

const STORAGE_KEY = 'mentor_session';

interface MentorSession {
    exercise: string;
    messages: ChatMessage[];
    savedAt: number;
}

function saveActiveSession(exercise: string, messages: ChatMessage[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ exercise, messages, savedAt: Date.now() }));
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
    const [exercise, setExercise] = useState('');
    const [exerciseSubmitted, setExerciseSubmitted] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
    const [savedSession, setSavedSession] = useState<MentorSession | null>(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [variantOrigin, setVariantOrigin] = useState<string | null>(null);
    const [manuallyCompleted, setManuallyCompleted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const session = loadActiveSession();
        if (session?.messages.length) setSavedSession(session);
        setHasProfile(!!loadKnowledgeProfile());
        setCompletedSessions(loadCompletedSessions());
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (exerciseSubmitted && exercise) saveActiveSession(exercise, messages);
    }, [messages, exercise, exerciseSubmitted]);

    const isCompleted = manuallyCompleted || messages.some(m => m.role === 'assistant' && m.content.includes(TAG));

    const getKnowledgeBlock = () => {
        const profile = loadKnowledgeProfile();
        const knowledgeBlock = buildKnowledgeBlock(profile);

        // Append path context if a career path is selected
        const pathId = loadSelectedPath();
        const path = pathId ? getPathById(pathId) : null;
        if (path && profile) {
            const assessments = loadSelfAssessments(pathId!);
            const gapSkills = path.skills
                .filter(s => s.importance === 'critical' && !isSkillMastered(s, profile.concepts, assessments))
                .map(s => s.name);
            return knowledgeBlock + buildPathBlock(path.jobTitle, gapSkills);
        }
        return knowledgeBlock;
    };

    const stripTag = (text: string) => text.replace(TAG, '').trim();

    const resumeSession = () => {
        if (!savedSession) return;
        setExercise(savedSession.exercise);
        setMessages(savedSession.messages);
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
            if (!window.confirm('¿Seguro que quieres empezar un ejercicio nuevo? Perderás el progreso actual.')) return;
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
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/')} className="text-light/50 hover:text-light transition-colors text-sm">
                    ← Volver al mapa
                </button>
            </div>

            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent mb-3">
                    🧠 Modo Mentor
                </h1>
                <p className="text-light/50 text-sm max-w-xl mx-auto">
                    Pega el enunciado de tu ejercicio y te guiaré paso a paso para que aprendas a resolverlo tú mismo. Sin respuestas directas — solo el camino correcto.
                </p>
            </div>

            {!exerciseSubmitted ? (
                <div className="flex flex-col items-center">
                    {savedSession && (
                        <div className="w-full max-w-2xl bg-violet-900/20 border border-violet-500/30 rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-xs text-violet-400 font-semibold mb-1">⏱ Sesión guardada — {formatDate(savedSession.savedAt)}</div>
                                <p className="text-sm text-light/60 truncate font-mono">{savedSession.exercise.slice(0, 120)}{savedSession.exercise.length > 120 ? '…' : ''}</p>
                                <div className="text-xs text-light/30 mt-1">{savedSession.messages.length} mensajes en el historial</div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button onClick={resumeSession} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap">Continuar →</button>
                                <button onClick={() => setSavedSession(null)} className="text-xs text-light/30 hover:text-red-400 transition-colors text-center">Descartar</button>
                            </div>
                        </div>
                    )}

                    {!hasProfile && (
                        <div className="w-full max-w-2xl bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
                            <span className="text-lg flex-shrink-0">⚠️</span>
                            <div>
                                <p className="text-sm text-amber-300 font-semibold">Sin perfil de aprendizaje</p>
                                <p className="text-xs text-light/50 mt-0.5">
                                    El mentor funcionará mejor si primero{' '}
                                    <button onClick={() => navigate('/perfil-aprendizaje')} className="text-amber-400 underline hover:text-amber-300">subes tus ejercicios</button>
                                    {' '}para que sepa qué conceptos ya conoces.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-2xl bg-[#1a1a1a] border border-light/10 rounded-2xl p-6">
                        <label className="block text-sm font-semibold text-light/70 mb-3">📋 Pega aquí el enunciado del ejercicio</label>
                        <textarea
                            value={exercise}
                            onChange={(e) => setExercise(e.target.value)}
                            placeholder="Ejemplo: Escribe un programa que lea una lista de números enteros y calcule la media, el máximo y el mínimo..."
                            className="w-full bg-[#0f0f0f] border border-light/10 rounded-xl p-4 text-light placeholder-light/30 resize-none focus:outline-none focus:border-violet-500/50 transition-colors font-mono text-sm min-h-[200px]"
                        />
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-light/30">Cuanto más detallado sea el enunciado, mejor te podré guiar.</span>
                            <button onClick={handleExerciseSubmit} disabled={!exercise.trim()} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm">
                                Empezar con el Mentor →
                            </button>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl grid grid-cols-3 gap-4 mt-6">
                        {[
                            { icon: '🎯', title: 'Sin soluciones directas', desc: 'El mentor nunca te da el código hecho. Te hace pensar.' },
                            { icon: '🔍', title: 'Preguntas guiadas', desc: 'Te ayuda a descomponer el problema y entender la lógica.' },
                            { icon: '📈', title: 'A tu ritmo', desc: 'Puedes pedir más pistas o explorar ideas en cualquier momento.' },
                        ].map((card) => (
                            <div key={card.title} className="bg-[#1a1a1a] border border-light/10 rounded-xl p-4">
                                <div className="text-2xl mb-2">{card.icon}</div>
                                <div className="text-sm font-semibold text-light/80 mb-1">{card.title}</div>
                                <div className="text-xs text-light/40">{card.desc}</div>
                            </div>
                        ))}
                    </div>

                    {completedSessions.length > 0 && (
                        <div className="w-full max-w-2xl mt-6">
                            <button onClick={() => setHistoryOpen(h => !h)} className="w-full flex items-center justify-between bg-[#1a1a1a] border border-light/10 rounded-2xl px-5 py-3 text-sm text-light/50 hover:text-light/70 transition-colors">
                                <span>📚 Ejercicios completados ({completedSessions.length})</span>
                                <span>{historyOpen ? '▲' : '▼'}</span>
                            </button>
                            {historyOpen && (
                                <div className="mt-2 space-y-2">
                                    {completedSessions.map(s => (
                                        <div key={s.id} className="bg-[#1a1a1a] border border-light/10 rounded-xl px-4 py-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-emerald-400 font-semibold">✅ Completado · {formatDate(s.completedAt)}</span>
                                                {s.isVariantOf && <span className="text-xs text-violet-400">variante</span>}
                                            </div>
                                            <p className="text-xs text-light/50 font-mono line-clamp-2">{s.exercise.slice(0, 150)}{s.exercise.length > 150 ? '…' : ''}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
                    {/* Left panel */}
                    <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
                        <div className="bg-[#1a1a1a] border border-violet-500/20 rounded-2xl p-4 flex-1 overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">📋 Ejercicio</span>
                                    {variantOrigin && <span className="text-xs bg-violet-900/40 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">variante</span>}
                                </div>
                                <button onClick={handleNewExercise} className="text-xs text-light/30 hover:text-red-400 transition-colors">Nuevo</button>
                            </div>
                            <p className="text-sm text-light/70 leading-relaxed whitespace-pre-wrap font-mono">{exercise}</p>
                        </div>

                        {completedSessions.length > 0 && (
                            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl flex-shrink-0 overflow-hidden">
                                <button onClick={() => setHistoryOpen(h => !h)} className="w-full flex items-center justify-between px-4 py-3 text-xs text-light/40 hover:text-light/60 transition-colors">
                                    <span>📚 Historial ({completedSessions.length})</span>
                                    <span>{historyOpen ? '▲' : '▼'}</span>
                                </button>
                                {historyOpen && (
                                    <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
                                        {completedSessions.map(s => (
                                            <div key={s.id} className="bg-[#0f0f0f] rounded-xl p-2.5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-emerald-400">✅ {formatDate(s.completedAt)}</span>
                                                    {s.isVariantOf && <span className="text-xs text-violet-400">variante</span>}
                                                </div>
                                                <p className="text-xs text-light/40 font-mono line-clamp-1">{s.exercise.slice(0, 80)}…</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-4 flex-shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-semibold text-light/40 uppercase tracking-wider">💡 Recuerda</div>
                                <div className="text-xs text-light/25">{messages.length} msg · guardado</div>
                            </div>
                            <div className="space-y-1.5 text-xs text-light/40">
                                <p>• El mentor NO te dará el código completo</p>
                                <p>• Si te atascas, pide una pista más concreta</p>
                                <p>• Explica tu razonamiento: ahí es donde más aprendes</p>
                            </div>
                        </div>
                    </div>

                    {/* Right panel: chat */}
                    <div className="lg:col-span-8 flex flex-col bg-[#1a1a1a] border border-light/10 rounded-2xl overflow-hidden min-h-0">
                        <div className="px-5 py-3 border-b border-light/10 flex items-center gap-3 flex-shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm">🧠</div>
                            <div>
                                <div className="text-sm font-bold text-light">Mentor IA</div>
                                <div className="text-xs text-light/40">Guía socrático — te hace pensar, no te da las respuestas</div>
                            </div>
                            {isCompleted && (
                                <div className="ml-auto flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-500/30 rounded-full px-3 py-1">
                                    <span className="text-xs text-emerald-400 font-semibold">✅ Completado</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {isLoading && messages.length === 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-xs flex-shrink-0">🧠</div>
                                    <div className="bg-[#0f0f0f] border border-light/10 rounded-2xl rounded-tl-none px-4 py-3"><LoadingDots /></div>
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
                                    <div className="bg-[#0f0f0f] border border-light/10 rounded-2xl rounded-tl-none px-4 py-3"><LoadingDots color="violet" /></div>
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
                                            <p className="text-xs text-light/40 mt-0.5">¿Quieres consolidar lo aprendido con una variante diferente?</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={handleCreateVariant}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                                            >
                                                🔄 Crear variante
                                            </button>
                                            <button
                                                onClick={handleNewExercise}
                                                className="bg-[#0f0f0f] hover:bg-light/5 border border-light/10 text-light/60 hover:text-light font-bold px-4 py-2 rounded-xl text-sm transition-all"
                                            >
                                                Nuevo ejercicio
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
                                        placeholder="Escribe tu respuesta o pregunta... (Enter para enviar, Shift+Enter para nueva línea)"
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
                                            className="text-xs text-emerald-500/60 hover:text-emerald-400 transition-colors"
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
