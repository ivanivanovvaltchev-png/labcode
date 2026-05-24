import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPathById, isSkillMastered, calculateProgress, getAvailableSkills } from '../../data/careerPaths';
import { loadSelectedPath, loadSelfAssessments, saveSelfAssessments } from '../../lib/selectedPath';
import { loadKnowledgeProfile } from '../../lib/knowledgeProfile';
import { isOnboardingComplete, getDiagnosticResult, getDailyPlan, completeTask, todayString, saveDailyPlan } from '../../lib/userProgress';
import { generateDailyPlan } from '../../ai/diagnosticAgent';
import { recordPractice, getHabilidadesValidadas } from '../../lib/learningMetrics';
import { getTodayTest } from '../../lib/dailyTest';

const taskTypeIcon: Record<string, string> = { learn: '📖', practice: '💻', review: '🔄' };
const taskTypeName: Record<string, string> = { learn: 'Aprender', practice: 'Practicar', review: 'Repasar' };
const taskTypeColor: Record<string, string> = {
    learn: 'border-blue-500/30 bg-blue-900/10',
    practice: 'border-violet-500/30 bg-violet-900/10',
    review: 'border-amber-500/30 bg-amber-900/10',
};
const taskTypeBadge: Record<string, string> = {
    learn: 'text-blue-400 bg-blue-900/30',
    practice: 'text-violet-400 bg-violet-900/30',
    review: 'text-amber-400 bg-amber-900/30',
};

const pathColors: Record<string, { text: string; bar: string; border: string }> = {
    'python-dev':       { text: 'text-yellow-400', bar: 'bg-yellow-400', border: 'border-yellow-500/30' },
    'frontend-dev':     { text: 'text-pink-400',   bar: 'bg-pink-400',   border: 'border-pink-500/30'   },
    'fullstack-python': { text: 'text-blue-400',   bar: 'bg-blue-400',   border: 'border-blue-500/30'   },
    'master-complete':  { text: 'text-violet-400', bar: 'bg-violet-400', border: 'border-violet-500/30' },
};

const PathDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState<Record<string, boolean>>({});
    const [profileConcepts, setProfileConcepts] = useState<string[]>([]);
    const [dailyPlan, setDailyPlan] = useState<ReturnType<typeof getDailyPlan>>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [showSkillsDetail, setShowSkillsDetail] = useState(false);

    const pathId = loadSelectedPath();
    const path = pathId ? getPathById(pathId) : null;

    useEffect(() => {
        if (!pathId) return;
        setAssessments(loadSelfAssessments(pathId));
        const profile = loadKnowledgeProfile();
        setProfileConcepts(profile?.concepts ?? []);
        const existing = getDailyPlan(pathId);
        if (existing && existing.date === todayString()) setDailyPlan(existing);
    }, [pathId]);

    const toggleAssessment = useCallback((skillId: string) => {
        if (!pathId) return;
        setAssessments(prev => {
            const next = { ...prev, [skillId]: !prev[skillId] };
            saveSelfAssessments(pathId, next);
            return next;
        });
    }, [pathId]);

    if (!path) { navigate('/elegir-camino'); return null; }
    if (pathId && !isOnboardingComplete(pathId)) { navigate('/onboarding'); return null; }

    const diagResult = pathId ? getDiagnosticResult(pathId) : null;
    const { pct, mastered, total, criticalMastered, criticalTotal } = calculateProgress(path, profileConcepts, assessments);
    const col = pathColors[path.id] ?? pathColors['master-complete'];

    const masteredSkills = path.skills.filter(s => isSkillMastered(s, profileConcepts, assessments));
    const pendingSkills = path.skills.filter(s => !isSkillMastered(s, profileConcepts, assessments));
    const nextCritical = pendingSkills.find(s => s.importance === 'critical');
    const todayTest = getTodayTest();

    const handleGeneratePlan = async () => {
        if (!pathId || !path) return;
        setIsGeneratingPlan(true);
        const profile = loadKnowledgeProfile();
        const concepts = profile?.concepts ?? [];
        const available = getAvailableSkills(path, concepts, assessments);
        const habilidades = getHabilidadesValidadas(path, concepts, assessments);
        const tasks = await generateDailyPlan(path, diagResult?.weakAreas ?? [], concepts, available, habilidades);
        const plan = {
            date: todayString(),
            tasks: tasks.map((t, i) => ({ ...t, id: `task-${Date.now()}-${i}`, completed: false })),
            generatedAt: Date.now(),
        };
        saveDailyPlan(pathId, plan);
        setDailyPlan(plan);
        setIsGeneratingPlan(false);
    };

    const handleCompleteTask = (taskId: string) => {
        if (!pathId) return;
        completeTask(pathId, taskId);
        // Record practice for the completed skill
        const task = dailyPlan?.tasks.find(t => t.id === taskId);
        if (task) {
            const skill = path?.skills.find(s => s.name === task.skillRef);
            recordPractice(pathId, skill?.id ?? task.skillRef, task.skillRef);
        }
        setDailyPlan(getDailyPlan(pathId));
    };

    const goToMentor = (taskTitle: string, taskDesc: string, skillRef: string) => {
        const params = new URLSearchParams({ taskTitle, taskDesc, skillRef });
        navigate(`/mentor?${params.toString()}`);
    };

    const completedCount = dailyPlan?.tasks.filter(t => t.completed).length ?? 0;
    const totalTasks = dailyPlan?.tasks.length ?? 0;

    return (
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-10 space-y-6">

            {/* ── Header ── */}
            <div className={`bg-[#1a1a1a] border ${col.border} rounded-2xl px-7 py-6`}>
                <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{path.emoji}</span>
                        <div>
                            <h1 className={`text-2xl font-bold ${col.text} leading-none`}>{path.title}</h1>
                            <p className="text-sm text-light/40 mt-1">Objetivo: {path.jobTitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-4xl font-bold ${col.text}`}>{pct}%</span>
                        <button
                            onClick={() => navigate('/elegir-camino')}
                            className="text-sm text-light/30 hover:text-light/60 border border-light/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>
                <div className="w-full h-3 bg-[#0f0f0f] rounded-full overflow-hidden border border-light/10">
                    <div className={`h-full ${col.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-sm text-light/30">
                    <span>{criticalMastered}/{criticalTotal} habilidades clave dominadas</span>
                    <span>{mastered}/{total} total</span>
                </div>
            </div>

            {/* ── Test Diario prompt ── */}
            <div className={`border rounded-2xl px-7 py-5 flex items-center justify-between gap-4 ${todayTest?.score !== null && todayTest ? 'border-emerald-500/20 bg-emerald-900/5' : 'border-violet-500/20 bg-violet-900/5'}`}>
                <div className="flex items-center gap-4">
                    <span className="text-3xl">{todayTest?.score !== null && todayTest ? '✅' : '🧪'}</span>
                    <div>
                        <p className="text-base font-bold text-light">
                            {todayTest?.score !== null && todayTest ? `Test completado · ${todayTest.score}/100` : 'Test Diario pendiente'}
                        </p>
                        <p className="text-sm text-light/40">
                            {todayTest?.score !== null && todayTest
                                ? `Matrix de Eisenhower actualizada · Q1: ${todayTest.matrix?.Q1_urgent_important.length ?? 0} urgentes`
                                : 'Active Recall + Matriz de prioridades · ~5 min'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/test-diario')}
                    className={`font-bold text-sm px-5 py-2.5 rounded-xl transition-all flex-shrink-0 ${
                        todayTest?.score !== null && todayTest
                            ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50'
                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                    }`}
                >
                    {todayTest?.score !== null && todayTest ? 'Ver resultados →' : 'Hacer test →'}
                </button>
            </div>

            {/* ── Plan de hoy (MAIN) ── */}
            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl px-7 py-7">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-light">Tu entrenamiento de hoy</h2>
                        {diagResult && (
                            <p className="text-sm text-light/30 mt-1">
                                Basado en tu diagnóstico ({diagResult.score}/100)
                                {dailyPlan && ` · ${completedCount}/${totalTasks} completadas`}
                            </p>
                        )}
                    </div>
                    {dailyPlan && !isGeneratingPlan && (
                        <button
                            onClick={handleGeneratePlan}
                            className="text-sm text-light/30 hover:text-light/60 transition-colors border border-light/10 px-4 py-2 rounded-lg"
                        >
                            🔄 Nuevo plan
                        </button>
                    )}
                </div>

                {/* No plan yet */}
                {!dailyPlan && !isGeneratingPlan && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-light/60 text-lg font-semibold mb-2">¿Qué practicamos hoy?</p>
                        <p className="text-sm text-light/30 mb-7 max-w-sm mx-auto">
                            La IA genera 3 ejercicios personalizados según tus puntos débiles del diagnóstico.
                        </p>
                        <button
                            onClick={handleGeneratePlan}
                            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-4 rounded-xl text-base transition-all"
                        >
                            ✨ Generar plan de hoy
                        </button>
                    </div>
                )}

                {/* Generating */}
                {isGeneratingPlan && (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <div className="flex gap-2">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                        <p className="text-base text-light/40">Creando tu rutina personalizada…</p>
                    </div>
                )}

                {/* Plan cards */}
                {dailyPlan && !isGeneratingPlan && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {dailyPlan.tasks.map((task, idx) => (
                            <div
                                key={task.id}
                                className={`relative border rounded-2xl p-6 flex flex-col gap-4 transition-all ${task.completed ? 'opacity-40 border-light/10 bg-light/5' : taskTypeColor[task.type]}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${taskTypeBadge[task.type]}`}>
                                        {taskTypeIcon[task.type]} {taskTypeName[task.type]}
                                    </span>
                                    <span className="text-sm text-light/20 font-mono">#{idx + 1}</span>
                                </div>

                                <div className="flex-1">
                                    <p className="text-base font-bold text-light mb-2">{task.title}</p>
                                    <p className="text-sm text-light/50 leading-relaxed">{task.description}</p>
                                </div>

                                <div className="flex flex-col gap-2 pt-2 border-t border-light/10">
                                    {task.completed ? (
                                        <div className="text-center text-sm text-emerald-400 font-semibold py-1">✅ Completado · +30 XP</div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => goToMentor(task.title, task.description, task.skillRef)}
                                                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
                                            >
                                                Empezar ejercicio →
                                            </button>
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="w-full text-sm text-light/25 hover:text-emerald-400 transition-colors py-1"
                                            >
                                                Marcar como hecho
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Siguiente paso si no hay plan ── */}
            {!dailyPlan && nextCritical && (
                <div className="bg-[#1a1a1a] border border-violet-500/20 rounded-2xl px-7 py-5 flex items-center justify-between gap-4">
                    <div>
                        <div className="text-sm text-violet-400 font-semibold mb-1">⚡ Siguiente habilidad clave</div>
                        <p className="text-base font-bold text-light">{nextCritical.name}</p>
                        <p className="text-sm text-light/40 mt-0.5">{nextCritical.description}</p>
                    </div>
                    <button
                        onClick={() => goToMentor(nextCritical.name, nextCritical.description, nextCritical.name)}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all flex-shrink-0"
                    >
                        Practicar →
                    </button>
                </div>
            )}

            {/* ── Detalle de habilidades (colapsable) ── */}
            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setShowSkillsDetail(v => !v)}
                    className="w-full flex items-center justify-between px-7 py-5 hover:bg-light/5 transition-colors"
                >
                    <div className="text-base font-semibold text-light/70">
                        ✅ Dominas <span className="text-emerald-400 font-bold">{masteredSkills.length}</span>
                        <span className="text-light/30 mx-2">·</span>
                        📚 Por aprender <span className="text-light font-bold">{pendingSkills.length}</span>
                    </div>
                    <span className="text-sm text-light/30">{showSkillsDetail ? '▲ Ocultar' : '▼ Ver detalle'}</span>
                </button>

                {showSkillsDetail && (
                    <div className="px-7 pb-7 border-t border-light/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">

                            {/* Mastered */}
                            <div>
                                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Ya dominas</h3>
                                {masteredSkills.length === 0 ? (
                                    <p className="text-sm text-light/30 italic">
                                        <button onClick={() => navigate('/perfil-aprendizaje')} className="text-emerald-400 underline">Sube tus ejercicios</button> para detectar tus habilidades.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {masteredSkills.map(s => (
                                            <div key={s.id} className="flex items-center gap-2 px-4 py-2 bg-emerald-900/10 border border-emerald-500/15 rounded-xl">
                                                <span className="text-emerald-400 text-sm">✓</span>
                                                <span className="text-sm text-light/70">{s.name}</span>
                                            </div>
                                        ))}
                                        <button onClick={() => navigate('/perfil-aprendizaje')} className="text-sm text-light/25 hover:text-emerald-400 transition-colors mt-1 pl-1">
                                            + Actualizar perfil
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Pending */}
                            <div>
                                <h3 className="text-sm font-bold text-light/40 uppercase tracking-wider mb-3">Por aprender</h3>
                                <div className="space-y-2">
                                    {pendingSkills.slice(0, 8).map(s => (
                                        <div key={s.id} className="flex items-center justify-between px-4 py-2 bg-light/5 border border-light/10 rounded-xl gap-2">
                                            <div className="min-w-0">
                                                <span className="text-sm text-light/60 truncate block">{s.name}</span>
                                                {s.importance === 'critical' && (
                                                    <span className="text-xs text-red-400/70">clave</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {s.selfAssess && (
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={assessments[s.id] === true}
                                                            onChange={() => toggleAssessment(s.id)}
                                                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                                        />
                                                        <span className="text-sm text-light/25">Lo sé</span>
                                                    </label>
                                                )}
                                                <button
                                                    onClick={() => goToMentor(s.name, s.description, s.name)}
                                                    className="text-sm text-violet-400/60 hover:text-violet-400 transition-colors whitespace-nowrap"
                                                >
                                                    Practicar →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingSkills.length > 8 && (
                                        <p className="text-sm text-light/25 pl-1">+{pendingSkills.length - 8} más por aprender</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PathDashboard;
