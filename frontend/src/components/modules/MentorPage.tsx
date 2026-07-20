import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { callDeepSeekForMentor, callDeepSeekForMentorVariant, ChatMessage } from '../../ai/agents';
import { loadKnowledgeProfile, buildKnowledgeBlock, buildPathBlock } from '../../lib/knowledgeProfile';
import { loadCompletedSessions, saveCompletedSession, CompletedSession } from '../../lib/completedSessions';
import { completeTask, getDailyPlan } from '../../lib/userProgress';
import { loadSelectedPath, loadSelfAssessments } from '../../lib/selectedPath';
import { getPathById, isSkillMastered } from '../../data/careerPaths';
import { generateSkillExercise } from '../../ai/diagnosticAgent';
import { recordMentorSession, getActiveSkills } from '../../lib/learningMetrics';
import { ensureConceptTracked, getSlotConceptsForPrompt, pickFocusedConcept } from '../../lib/masteryEngine';
import { getMejoraSectionById } from '../../lib/mejoraSections';

const STORAGE_KEY = 'mentor_session';

interface MentorSession {
    exercise: string;
    messages: ChatMessage[];
    savedAt: number;
    skillContext?: string;
    taskId?: string;
    taskIndex?: number;
    totalTasks?: number;
    isTaskCard?: boolean;
}

function saveActiveSession(
    exercise: string,
    messages: ChatMessage[],
    skillContext?: string,
    taskId?: string,
    taskIndex?: number,
    totalTasks?: number,
    isTaskCard?: boolean,
) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        exercise, messages, savedAt: Date.now(), skillContext, taskId, taskIndex, totalTasks, isTaskCard,
    }));
}

function loadActiveSession(): MentorSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

/** Returns the taskId of any active (non-completed) mentor session, or null. */
export function getActiveMentorTaskId(): string | null {
    const s = loadActiveSession();
    return s?.taskId ?? null;
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
    const paramTaskTitle      = searchParams.get('taskTitle');
    const paramTaskDesc       = searchParams.get('taskDesc');        // exercise text from the card
    const paramSkillRef       = searchParams.get('skillRef');
    const paramTaskId         = searchParams.get('taskId');
    const paramTaskIndex      = searchParams.get('taskIndex');
    const paramTotalTasks     = searchParams.get('totalTasks');
    const paramResumeTaskId   = searchParams.get('resumeTaskId');   // restore existing session
    const paramTaskDifficulty = searchParams.get('taskDifficulty') as 'facil' | 'medio' | 'dificil' | null;
    const paramTaskDescFacil  = searchParams.get('taskDescFacil');
    const paramTaskDescMedio  = searchParams.get('taskDescMedio');
    const paramTaskDescDificil = searchParams.get('taskDescDificil');
    const paramPracticeDiff    = (searchParams.get('practiceDifficulty') ?? 'dificil') as 'facil' | 'medio' | 'dificil';
    const paramFocusPathId     = searchParams.get('focusPathId');    // set from Mentor → Mejora
    const paramSessionId       = searchParams.get('s');              // see lib/sessionKey.ts
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
    const [exercisePanelOpen, setExercisePanelOpen] = useState(false);
    const [mentorDifficulty, setMentorDifficulty] = useState<'facil' | 'medio' | 'dificil'>(paramTaskDifficulty ?? 'dificil');
    const [taskDescs] = useState<{ facil: string; medio: string | null; dificil: string | null }>({
        facil: paramTaskDescFacil ?? '',
        medio: paramTaskDescMedio ?? null,
        dificil: paramTaskDescDificil ?? null,
    });
    const [showCompletionPopup, setShowCompletionPopup] = useState(false);
    const [explainMode, setExplainMode] = useState(false);
    const [practiceNextDiff, setPracticeNextDiff] = useState<'facil' | 'medio' | 'dificil'>(paramPracticeDiff);
    // isTaskCardSession: true when launched from a PathDashboard task card (has taskId)
    const [isTaskCardSession, setIsTaskCardSession] = useState(!!(paramTaskId || paramResumeTaskId));
    // Saved before URL params are cleared so the popup still has them at completion time
    const [savedTaskId, setSavedTaskId] = useState<string | null>(null);
    const [savedTaskIndex, setSavedTaskIndex] = useState<number | null>(null);
    const [savedTotalTasks, setSavedTotalTasks] = useState<number | null>(null);
    // Persists across the session even after URL params are cleared — set once
    // when arriving from Mentor → Mejora, so every AI call in this session stays
    // scoped to that single PDF/clase instead of the full student profile.
    //
    // IMPORTANT: React Router does NOT remount this component when navigating
    // from /mentor?focusPathId=A straight to /mentor?focusPathId=B (same route,
    // only the query string changes) — so a plain useState(paramFocusPathId)
    // would freeze on whichever block was active the FIRST time this page
    // mounted, silently leaking that stale focus into a totally different
    // Mejora block's session. This effect re-syncs it every time a fresh
    // (non-empty) focusPathId shows up in the URL.
    const [focusPathId, setFocusPathId] = useState<string | null>(paramFocusPathId);
    useEffect(() => {
        if (paramFocusPathId && paramFocusPathId !== focusPathId) {
            setFocusPathId(paramFocusPathId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramFocusPathId]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getKnowledgeBlock = () => {
        const profile = loadKnowledgeProfile();
        const knowledgeBlock = buildKnowledgeBlock(profile);
        const pathId = loadSelectedPath();
        const path = pathId ? getPathById(pathId) : null;
        let block = knowledgeBlock;
        if (path && profile) {
            const ass = loadSelfAssessments(pathId!);
            const gapSkills = path.skills
                .filter(s => s.importance === 'critical' && !isSkillMastered(s, profile.concepts, ass))
                .map(s => s.name);
            block = knowledgeBlock + buildPathBlock(path.jobTitle, gapSkills);
        }
        if (focusPathId) {
            const focusPath = getMejoraSectionById(focusPathId);
            if (focusPath) {
                const sourceNames = focusPath.sources.map(s => s.fileName).join(', ');
                const sourcesText = focusPath.sources
                    .map(s => `--- INICIO CONTENIDO REAL DEL PDF "${s.fileName}" ---\n${s.rawText}\n--- FIN CONTENIDO REAL DEL PDF ---`)
                    .join('\n\n');
                block += `\n\nMODO "MEJORA" — FOCO EXCLUSIVO (CRÍTICO):
El estudiante ha elegido centrarse SOLO en el bloque "${focusPath.title}" (material: ${sourceNames}) porque no lo tiene claro todavía.
IGNORA el resto de su perfil para este ejercicio. Tu ÚNICA fuente de verdad es el contenido real de estos PDFs, reproducido íntegro a continuación — básate en él exactamente como está explicado, con los mismos ejemplos, métodos y sintaxis, sin inventar ni añadir nada que no aparezca aquí:

${sourcesText}

No introduzcas conceptos de otros bloques ni mezcles con el resto del currículo.`;
            }
        }
        return block;
    };

    // Auto-generate exercise when coming from PathDashboard
    useEffect(() => {
        const session = loadActiveSession();
        setCompletedSessions(loadCompletedSessions());

        if (paramResumeTaskId && session?.taskId === paramResumeTaskId && session.messages.length > 0) {
            // ── RESTORE mode: resume the saved session for this task card ──
            setExercise(session.exercise);
            setMessages(session.messages);
            setCurrentSkillContext(session.skillContext ?? null);
            setSavedTaskId(session.taskId ?? null);
            setSavedTaskIndex(session.taskIndex ?? null);
            setSavedTotalTasks(session.totalTasks ?? null);
            setIsTaskCardSession(session.isTaskCard ?? true);
            setExerciseSubmitted(true);
            setSearchParams(paramSessionId ? { s: paramSessionId } : {}, { replace: true });

        } else if (hasSkillContext) {
            // ── NEW exercise: coming from a skill/task button ──
            const skillLabel = paramSkillRef ?? paramTaskTitle ?? '';
            setCurrentSkillContext(skillLabel);
            if (paramTaskId) {
                setSavedTaskId(paramTaskId);
                setIsTaskCardSession(true);
            }
            if (taskIndex !== null) setSavedTaskIndex(taskIndex);
            if (totalTasks !== null) setSavedTotalTasks(totalTasks);

            setExerciseSubmitted(true);

            if (paramTaskDesc && paramTaskDesc.trim().length > 20) {
                // ── Fast path: use the exercise text from the card directly ──
                // This ensures the Mentor works on exactly the exercise the student saw in the card.
                setExercise(paramTaskDesc);
                setIsLoading(true);
                callDeepSeekForMentor(paramTaskDesc, [], 'init', getKnowledgeBlock()).then(resp => {
                    setMessages([{ role: 'assistant', content: resp }]);
                    setIsLoading(false);
                    setSearchParams(paramSessionId ? { s: paramSessionId } : {}, { replace: true });
                }).catch(() => setIsLoading(false));
            } else {
                // ── Fallback: generate a fresh exercise from the skill reference ──
                setIsGeneratingExercise(true);
                const pathId = loadSelectedPath();
                const path = pathId ? getPathById(pathId) : null;
                const profile = loadKnowledgeProfile();
                const focusPath = paramFocusPathId ? getMejoraSectionById(paramFocusPathId) : null;
                const knownConcepts = focusPath
                    ? focusPath.concepts.map(c => `${c.name}: ${c.description}`)
                    : (profile?.concepts ?? []);
                generateSkillExercise(
                    paramSkillRef ?? paramTaskTitle ?? '',
                    path?.title ?? 'Programación',
                    knownConcepts
                ).then(async generatedExercise => {
                    setExercise(generatedExercise);
                    setIsGeneratingExercise(false);
                    setIsLoading(true);
                    const resp = await callDeepSeekForMentor(generatedExercise, [], 'init', getKnowledgeBlock());
                    setMessages([{ role: 'assistant', content: resp }]);
                    setIsLoading(false);
                    setSearchParams(paramSessionId ? { s: paramSessionId } : {}, { replace: true });
                }).catch(() => {
                    setIsGeneratingExercise(false);
                    setExerciseSubmitted(false);
                });
            }

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
        if (exerciseSubmitted && exercise) {
            saveActiveSession(
                exercise, messages,
                currentSkillContext ?? undefined,
                savedTaskId ?? undefined,
                savedTaskIndex ?? undefined,
                savedTotalTasks ?? undefined,
                isTaskCardSession || undefined,
            );
        }
    }, [messages, exercise, exerciseSubmitted, currentSkillContext, savedTaskId, savedTaskIndex, savedTotalTasks, isTaskCardSession]);

    const isCompleted = manuallyCompleted || messages.some(m =>
        m.role === 'assistant' && (
            m.content.includes(TAG) ||
            m.content.includes('¡EJERCICIO COMPLETADO!')
        )
    );

    // Record session completion once when isCompleted first becomes true.
    // Works for both task-card exercises (currentSkillContext = card skillRef)
    // and free exercises (currentSkillContext = null → falls back to most active skill).
    const completionRecordedRef = useRef(false);
    useEffect(() => {
        if (!isCompleted || completionRecordedRef.current) return;
        completionRecordedRef.current = true;
        const pathId = loadSelectedPath();
        if (!pathId) return;
        const path = getPathById(pathId);
        // Prefer the explicit skill context (from task card URL params).
        // For free exercises, fall back to the concept the student has been practicing
        // most recently — not perfect but ensures some tracking happens.
        const BAD = ['Repaso', 'Práctica', 'Aprender', 'Básico', 'Intermedio', 'Avanzado'];
        const cleanActive = getActiveSkills(pathId, 7).filter(
            s => s.length > 3 && !BAD.some(p => s.startsWith(p))
        );
        const skillToRecord = currentSkillContext ?? cleanActive[0] ?? null;
        if (skillToRecord) {
            const skill = path?.skills.find(s => s.name === skillToRecord);
            recordMentorSession(pathId, skill?.id ?? skillToRecord, skillToRecord);
            ensureConceptTracked(pathId, skillToRecord);
        }
    }, [isCompleted, currentSkillContext]);
    // Open popup the first time isCompleted turns true (only when coming from a task card)
    const popupShownRef = useRef(false);
    useEffect(() => {
        if (isCompleted && !popupShownRef.current) {
            popupShownRef.current = true;
            setShowCompletionPopup(true);
        }
    }, [isCompleted]);

    const handleNextTask = () => {
        const pathId = loadSelectedPath();
        if (pathId && savedTaskId) completeTask(pathId, savedTaskId);
        saveCompletedSession({ exercise, messages, completedAt: Date.now(), isVariantOf: variantOrigin ?? undefined });
        clearActiveSession();
        const plan = pathId ? getDailyPlan(pathId) : null;
        const nextTask = plan?.tasks.find((t, i) => !t.completed && i > (savedTaskIndex ?? -1)) ?? null;
        navigate('/camino', { state: nextTask ? { autoStartTaskId: nextTask.id } : undefined });
    };

    const stripTag = (text: string) => text.replace(TAG, '').replace('¡EJERCICIO COMPLETADO!', '').trim();

    const handleExplainExercise = () => {
        setShowCompletionPopup(false);
        popupShownRef.current = false;
        setExplainMode(true);
        setMessages(prev => [
            ...prev,
            { role: 'assistant', content: 'Bien, ¿cuál es la parte que no has entendido o sobre la que quieres que profundice?' },
        ]);
    };

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
        if (!input.trim() || isLoading || (isCompleted && !explainMode)) return;
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
        // Record that the user is actively working this skill (variant = extra practice)
        if (currentSkillContext) {
            const pathId = loadSelectedPath();
            const path = pathId ? getPathById(pathId) : null;
            if (pathId) {
                const skill = path?.skills.find(s => s.name === currentSkillContext);
                recordMentorSession(pathId, skill?.id ?? currentSkillContext, currentSkillContext);
                ensureConceptTracked(pathId, currentSkillContext);
            }
        }
        saveCompletedSession({ exercise, messages, completedAt: Date.now(), isVariantOf: variantOrigin ?? undefined });
        clearActiveSession();
        setCompletedSessions(loadCompletedSessions());
        setManuallyCompleted(false);
        setExplainMode(false);

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
        setExplainMode(false);
        setCurrentSkillContext(null);
    };

    const handleDifficultyChange = async (d: 'facil' | 'medio' | 'dificil') => {
        if (d === mentorDifficulty) return;
        const newDesc = d === 'dificil' ? (taskDescs.dificil ?? taskDescs.facil)
            : d === 'medio' ? (taskDescs.medio ?? taskDescs.facil)
            : taskDescs.facil;
        if (!newDesc) return;
        if (messages.length > 0 && !isCompleted) {
            if (!window.confirm('¿Seguro? Cambiar dificultad reiniciará el ejercicio.')) return;
        }
        clearActiveSession();
        setMentorDifficulty(d);
        setMessages([]);
        setInput('');
        setSavedSession(null);
        setVariantOrigin(null);
        setManuallyCompleted(false);
        setExercise(newDesc);
        setExerciseSubmitted(true);
        setIsLoading(true);
        const resp = await callDeepSeekForMentor(newDesc, [], 'init', getKnowledgeBlock());
        setMessages([{ role: 'assistant', content: resp }]);
        setIsLoading(false);
    };

    const handlePracticeNext = async (d: 'facil' | 'medio' | 'dificil') => {
        const pathId = loadSelectedPath();
        saveCompletedSession({ exercise, messages, completedAt: Date.now(), isVariantOf: variantOrigin ?? undefined });
        clearActiveSession();
        // If we're in a "Mejora" focused session, stay within that same block's
        // concepts instead of pulling from the whole student profile.
        let concept: string | null = null;
        if (focusPathId && pathId) {
            concept = pickFocusedConcept(pathId, focusPathId, d);
        } else {
            const slots = pathId ? getSlotConceptsForPrompt(pathId) : null;
            concept = d === 'facil' ? (slots?.slot1[0] ?? null)
                : d === 'medio' ? (slots?.slot2[0] ?? null)
                : (slots?.slot3[0] ?? null);
        }
        if (!concept) return;
        setShowCompletionPopup(false);
        popupShownRef.current = false;
        setPracticeNextDiff(d);
        setMessages([]);
        setInput('');
        setSavedSession(null);
        setVariantOrigin(null);
        setManuallyCompleted(false);
        setCurrentSkillContext(concept);
        setExercisePanelOpen(false);
        setExercise('');
        setExerciseSubmitted(true);
        setIsGeneratingExercise(true);
        const path = pathId ? getPathById(pathId) : null;
        const profile = loadKnowledgeProfile();
        const newExercise = await generateSkillExercise(concept, path?.title ?? 'Programación', profile?.concepts ?? []);
        setExercise(newExercise);
        setIsGeneratingExercise(false);
        setIsLoading(true);
        const resp = await callDeepSeekForMentor(newExercise, [], 'init', getKnowledgeBlock());
        setMessages([{ role: 'assistant', content: resp }]);
        setIsLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

            {/* ── Completion popup ── */}
            {showCompletionPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowCompletionPopup(false)} />

                    {(isTaskCardSession || !!savedTaskId) ? (
                        /* ── Task card popup ── */
                        <div className="relative z-10 bg-[#1a1a1a] border border-emerald-500/40 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-emerald-500/10 text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-2xl font-bold text-light mb-1">¡Completado!</h2>
                            <p className="text-sm text-emerald-400 font-semibold mb-1">{currentSkillContext}</p>
                            {savedTaskIndex !== null && savedTotalTasks !== null && (
                                <p className="text-xs text-light/30 mb-6">Tarjeta {savedTaskIndex + 1} de {savedTotalTasks}</p>
                            )}
                            <div className="space-y-3 mt-6">
                                <button
                                    onClick={handleNextTask}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl text-sm transition-all"
                                >
                                    {savedTaskIndex !== null && savedTotalTasks !== null && savedTaskIndex + 1 >= savedTotalTasks
                                        ? '🎉 Terminar entrenamiento de hoy'
                                        : savedTaskIndex !== null && savedTotalTasks !== null
                                            ? `➡️ Siguiente tarjeta (${savedTaskIndex + 2}/${savedTotalTasks})`
                                            : '➡️ Siguiente tarjeta'}
                                </button>
                                <button
                                    onClick={handleExplainExercise}
                                    className="w-full bg-violet-900/40 hover:bg-violet-900/60 border border-violet-500/30 text-violet-300 font-semibold py-3 rounded-2xl text-sm transition-all"
                                >
                                    💬 Explicar el ejercicio
                                </button>
                                <button
                                    onClick={() => setShowCompletionPopup(false)}
                                    className="text-xs text-light/25 hover:text-light/50 transition-colors pt-1"
                                >
                                    Seguir en el chat
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── Practice / free mentor popup ── */
                        <div className="relative z-10 bg-[#1a1a1a] border border-emerald-500/40 rounded-3xl p-7 max-w-md w-full mx-4 shadow-2xl shadow-emerald-500/10">
                            <div className="text-center mb-5">
                                <div className="text-5xl mb-3">🏆</div>
                                <h2 className="text-xl font-bold text-light mb-1">¡Ejercicio completado!</h2>
                                {currentSkillContext && (
                                    <p className="text-sm text-emerald-400 font-semibold">{currentSkillContext}</p>
                                )}
                            </div>
                            {(() => {
                                const lastMsg = [...messages].reverse().find(m => m.role === 'assistant');
                                const feedback = lastMsg ? stripTag(lastMsg.content).slice(0, 220).trim() : null;
                                return feedback ? (
                                    <p className="text-xs text-light/50 bg-light/5 rounded-xl px-4 py-3 mb-5 leading-relaxed">
                                        {feedback}{feedback.length >= 220 ? '…' : ''}
                                    </p>
                                ) : null;
                            })()}
                            <p className="text-xs text-light/40 mb-2 font-semibold uppercase tracking-wider">¿Otro ejercicio?</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {(['facil', 'medio', 'dificil'] as const).map(d => {
                                    const isActive = practiceNextDiff === d;
                                    const cfg = {
                                        facil:   { label: '🟢 Fácil',  cls: isActive ? 'border-green-400  bg-green-900/30  text-green-200'  : 'border-green-500/30  text-green-400  hover:bg-green-900/20'  },
                                        medio:   { label: '🟡 Medio',  cls: isActive ? 'border-yellow-400 bg-yellow-900/30 text-yellow-200' : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/20' },
                                        dificil: { label: '🔴 Difícil', cls: isActive ? 'border-red-400   bg-red-900/30   text-red-200'    : 'border-red-500/30   text-red-400   hover:bg-red-900/20'   },
                                    }[d];
                                    return (
                                        <button key={d} onClick={() => setPracticeNextDiff(d)}
                                            className={`text-xs font-bold py-2 rounded-xl border transition-colors ${cfg.cls}`}>
                                            {cfg.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => handlePracticeNext(practiceNextDiff)}
                                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all mb-2"
                            >
                                ⚡ Generar ejercicio
                            </button>
                            <button
                                onClick={handleExplainExercise}
                                className="w-full bg-violet-900/40 hover:bg-violet-900/60 border border-violet-500/30 text-violet-300 font-semibold py-3 rounded-2xl text-sm transition-all mb-2"
                            >
                                💬 Explicar el ejercicio
                            </button>
                            <button
                                onClick={() => setShowCompletionPopup(false)}
                                className="w-full text-xs text-light/30 hover:text-light/60 transition-colors py-2"
                            >
                                Seguir en el chat
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-4 mb-3">
                <button onClick={() => navigate('/camino')} className="text-light/40 hover:text-light transition-colors text-sm">
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

            {/* Chat interface — full width */}
            {exerciseSubmitted && !isGeneratingExercise && (
                <div className="flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>

                    {/* Exercise accordion */}
                    <div className="flex-shrink-0 mb-3">
                        <button
                            onClick={() => setExercisePanelOpen(v => !v)}
                            className="w-full bg-[#1a1a1a] border border-violet-500/20 rounded-2xl px-5 py-3 flex items-center gap-3 hover:bg-light/5 transition-colors text-left"
                        >
                            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex-shrink-0">
                                📋 Ejercicio{variantOrigin ? ' · variante' : ''}
                            </span>
                            {currentSkillContext && (
                                <span className="text-sm text-light/50 flex-1 truncate">{currentSkillContext}</span>
                            )}
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); handleNewExercise(); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleNewExercise(); } }}
                                    className="text-xs text-light/30 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                    Nuevo
                                </span>
                                <span className="text-xs text-light/40">{exercisePanelOpen ? '▲ Ocultar' : '▼ Ver enunciado'}</span>
                            </div>
                        </button>
                        {exercisePanelOpen && (
                            <div className="bg-[#1a1a1a] border border-violet-500/20 border-t-0 rounded-b-2xl px-5 pb-4">
                                {taskDescs.facil && (
                                    <div className="flex items-center gap-2 pt-3 pb-2">
                                        {(['facil', 'medio', 'dificil'] as const).map(d => {
                                            const available = d === 'facil' ? !!taskDescs.facil : d === 'medio' ? !!taskDescs.medio : !!taskDescs.dificil;
                                            if (!available) return null;
                                            const isActive = mentorDifficulty === d;
                                            const label = d === 'facil' ? '🟢 Fácil' : d === 'medio' ? '🟡 Medio' : '🔴 Difícil';
                                            return (
                                                <button
                                                    key={d}
                                                    onClick={() => handleDifficultyChange(d)}
                                                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${isActive ? (d === 'dificil' ? 'bg-red-900/40 border-red-500/60 text-red-300' : d === 'medio' ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300' : 'bg-green-900/30 border-green-500/50 text-green-300') : 'border-light/10 text-light/30 hover:text-light/60'}`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {exercise ? (
                                    <p className="text-sm text-light/70 leading-relaxed whitespace-pre-wrap font-mono pt-1">{exercise}</p>
                                ) : (
                                    <div className="flex items-center gap-2 text-light/30 text-sm pt-3">
                                        <LoadingDots /> <span>Generando…</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chat — full width */}
                    <div className="flex-1 flex flex-col bg-[#1a1a1a] border border-light/10 rounded-2xl overflow-hidden min-h-0">
                        <div className="px-5 py-3 border-b border-light/10 flex items-center gap-3 flex-shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm">🧠</div>
                            <div>
                                <div className="text-sm font-bold text-light">Mentor IA</div>
                                <div className="text-xs text-light/40">Te guía sin darte las respuestas directas</div>
                            </div>
                            {isCompleted && (
                                <div className="ml-auto flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-500/30 rounded-full px-3 py-1">
                                    <span className="text-xs text-emerald-400 font-semibold">✅ Completado</span>
                                </div>
                            )}
                            {completedSessions.length > 0 && (
                                <button
                                    onClick={() => setHistoryOpen(h => !h)}
                                    className={`ml-auto text-xs text-light/30 hover:text-light/60 border border-light/10 px-3 py-1.5 rounded-lg transition-colors ${isCompleted ? '' : 'ml-auto'}`}
                                >
                                    📚 Historial ({completedSessions.length})
                                </button>
                            )}
                        </div>

                        {historyOpen && (
                            <div className="px-4 py-3 border-b border-light/10 bg-[#0f0f0f] flex-shrink-0 max-h-40 overflow-y-auto space-y-2">
                                {completedSessions.map(s => (
                                    <div key={s.id} className="bg-[#1a1a1a] rounded-xl p-2.5">
                                        <span className="text-xs text-emerald-400">✅ {formatDate(s.completedAt)}</span>
                                        {s.isVariantOf && <span className="text-xs text-violet-400 ml-1">variante</span>}
                                        <p className="text-xs text-light/40 font-mono line-clamp-1 mt-1">{s.exercise.slice(0, 100)}…</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                                    <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/20 rounded-tr-none text-light' : 'bg-[#0f0f0f] border border-light/10 rounded-tl-none text-light/80'}`}>
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
                        {isCompleted && !explainMode ? (
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
                                {explainMode && (
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-violet-400 font-semibold">💬 Modo explicación — pregúntame lo que quieras</span>
                                        <button
                                            onClick={() => setExplainMode(false)}
                                            className="text-xs text-light/30 hover:text-light/60 transition-colors"
                                        >
                                            Volver a completado
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={explainMode ? '¿Qué quieres que te explique?' : 'Escribe tu respuesta o pregunta… (Enter para enviar)'}
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
