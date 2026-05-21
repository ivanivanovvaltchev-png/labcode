import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPathById, PathSkill, isSkillMastered, calculateProgress } from '../../data/careerPaths';
import { loadSelectedPath } from '../../lib/selectedPath';
import { loadSelfAssessments, saveSelfAssessments } from '../../lib/selectedPath';
import { loadKnowledgeProfile } from '../../lib/knowledgeProfile';
import { isOnboardingComplete, getDiagnosticResult, getDailyPlan, completeTask, todayString } from '../../lib/userProgress';
import { generateDailyPlan } from '../../ai/diagnosticAgent';
import { saveDailyPlan } from '../../lib/userProgress';

const categoryLabel: Record<string, string> = {
    python: '🐍 Python',
    git: '🌿 Git',
    sql: '🗄️ SQL',
    html: '🏗️ HTML',
    css: '🎨 CSS',
    js: '⚡ JavaScript',
    react: '⚛️ React',
    django: '🎸 Django',
    deploy: '🚀 Deploy',
    soft: '🧠 Soft Skills',
};

const importanceBadge: Record<string, string> = {
    critical: 'bg-red-900/30 text-red-400 border-red-500/30',
    important: 'bg-amber-900/30 text-amber-400 border-amber-500/30',
    bonus: 'bg-light/5 text-light/40 border-light/10',
};

function getStatusMessage(pct: number): { msg: string; color: string; emoji: string } {
    if (pct >= 100) return { msg: '¡Enhorabuena! Estás listo para postular a este empleo.', color: 'text-emerald-400', emoji: '🎉' };
    if (pct >= 80) return { msg: 'Casi listo. Un último esfuerzo y podrás postular.', color: 'text-emerald-400', emoji: '🔥' };
    if (pct >= 50) return { msg: 'Buen avance. Sigue practicando las habilidades pendientes.', color: 'text-yellow-400', emoji: '💪' };
    if (pct >= 20) return { msg: 'En progreso. Cada ejercicio te acerca al objetivo.', color: 'text-blue-400', emoji: '📈' };
    return { msg: 'Empezando el camino. ¡El primer paso ya está dado!', color: 'text-light/60', emoji: '🚶' };
}

const PathDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState<Record<string, boolean>>({});
    const [profileConcepts, setProfileConcepts] = useState<string[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['python', 'git']));
    const [dailyPlan, setDailyPlan] = useState<ReturnType<typeof getDailyPlan>>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    const pathId = loadSelectedPath();
    const path = pathId ? getPathById(pathId) : null;

    useEffect(() => {
        if (!pathId) return;
        setAssessments(loadSelfAssessments(pathId));
        const profile = loadKnowledgeProfile();
        setProfileConcepts(profile?.concepts ?? []);

        // Load or generate today's daily plan
        const existing = getDailyPlan(pathId);
        if (existing && existing.date === todayString()) {
            setDailyPlan(existing);
        }
    }, [pathId]);

    const toggleAssessment = useCallback((skillId: string) => {
        if (!pathId) return;
        setAssessments(prev => {
            const next = { ...prev, [skillId]: !prev[skillId] };
            saveSelfAssessments(pathId, next);
            return next;
        });
    }, [pathId]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    };

    if (!path) { navigate('/elegir-camino'); return null; }

    // Redirect to onboarding if not complete
    if (pathId && !isOnboardingComplete(pathId)) {
        navigate('/onboarding');
        return null;
    }

    const diagResult = pathId ? getDiagnosticResult(pathId) : null;

    const handleGenerateTodayPlan = async () => {
        if (!pathId || !path) return;
        setIsGeneratingPlan(true);
        const profile = loadKnowledgeProfile();
        const tasks = await generateDailyPlan(path, diagResult?.weakAreas ?? [], profile?.concepts ?? []);
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
        setDailyPlan(getDailyPlan(pathId));
    };

    const taskTypeIcon: Record<string, string> = { learn: '📖', practice: '💻', review: '🔄' };
    const taskTypeColor: Record<string, string> = {
        learn: 'border-blue-500/20 bg-blue-900/10',
        practice: 'border-violet-500/20 bg-violet-900/10',
        review: 'border-amber-500/20 bg-amber-900/10',
    };

    const { pct, mastered, total, criticalMastered, criticalTotal } = calculateProgress(path, profileConcepts, assessments);
    const status = getStatusMessage(pct);

    const masteredSkills = path.skills.filter(s => isSkillMastered(s, profileConcepts, assessments));
    const pendingSkills = path.skills.filter(s => !isSkillMastered(s, profileConcepts, assessments));
    const nextSkill = pendingSkills.find(s => s.importance === 'critical') ?? pendingSkills[0];

    // Group pending skills by category
    const pendingByCategory = pendingSkills.reduce<Record<string, PathSkill[]>>((acc, s) => {
        (acc[s.category] ??= []).push(s);
        return acc;
    }, {});

    const colorMap: Record<string, string> = {
        'python-dev': 'yellow', 'frontend-dev': 'pink', 'fullstack-python': 'blue', 'master-complete': 'violet',
    };
    const col = colorMap[path.id] ?? 'violet';
    const progressBarColor: Record<string, string> = {
        yellow: 'bg-yellow-400', pink: 'bg-pink-400', blue: 'bg-blue-400', violet: 'bg-violet-400',
    };
    const textColor: Record<string, string> = {
        yellow: 'text-yellow-400', pink: 'text-pink-400', blue: 'text-blue-400', violet: 'text-violet-400',
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* ── Hero ── */}
            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{path.emoji}</span>
                            <h1 className={`text-2xl font-bold ${textColor[col]}`}>{path.title}</h1>
                        </div>
                        <p className="text-sm text-light/40">Objetivo: <span className="text-light/60">{path.jobTitle}</span></p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => navigate('/mentor')}
                            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                        >
                            🧠 Entrenar ahora
                        </button>
                        <button
                            onClick={() => navigate('/elegir-camino')}
                            className="bg-light/5 hover:bg-light/10 border border-light/10 text-light/50 text-sm px-4 py-2 rounded-xl transition-all"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-light/70">Progreso hacia el objetivo</span>
                        <span className={`text-2xl font-bold ${textColor[col]}`}>{pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#0f0f0f] rounded-full overflow-hidden border border-light/10">
                        <div
                            className={`h-full ${progressBarColor[col]} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-light/30">
                        <span>{criticalMastered}/{criticalTotal} habilidades críticas dominadas</span>
                        <span>{mastered}/{total} en total</span>
                    </div>
                </div>

                {/* Status message */}
                <div className={`text-sm font-semibold ${status.color}`}>
                    {status.emoji} {status.msg}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── Left: Mastered ── */}
                <div className="lg:col-span-4">
                    <div className="bg-[#1a1a1a] border border-emerald-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">✅</span>
                            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Ya dominas ({masteredSkills.length})</h2>
                        </div>
                        {masteredSkills.length === 0 ? (
                            <p className="text-xs text-light/30 italic">
                                Sube tus ejercicios a <button onClick={() => navigate('/perfil-aprendizaje')} className="text-emerald-400 underline">Mi Perfil</button> para detectar tus habilidades automáticamente.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {masteredSkills.map(s => (
                                    <div key={s.id} className="flex items-center gap-2 bg-emerald-900/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                                        <span className="text-emerald-400 text-xs flex-shrink-0">✓</span>
                                        <div className="min-w-0">
                                            <p className="text-sm text-light/80 font-medium truncate">{s.name}</p>
                                            <p className="text-xs text-light/30">{categoryLabel[s.category]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {masteredSkills.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-light/10">
                                <button
                                    onClick={() => navigate('/perfil-aprendizaje')}
                                    className="text-xs text-emerald-500/60 hover:text-emerald-400 transition-colors"
                                >
                                    + Subir más ejercicios para actualizar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Pending ── */}
                <div className="lg:col-span-8 flex flex-col gap-4">

                    {/* Next step recommendation */}
                    {nextSkill && pct < 100 && (
                        <div className="bg-[#1a1a1a] border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs text-violet-400 font-semibold mb-1">⚡ Siguiente paso recomendado</div>
                                <p className="text-sm font-bold text-light">{nextSkill.name}</p>
                                <p className="text-xs text-light/40 mt-0.5">{nextSkill.description}</p>
                            </div>
                            <button
                                onClick={() => navigate('/mentor')}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
                            >
                                Practicar →
                            </button>
                        </div>
                    )}

                    {/* Pending skills by category */}
                    <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">📚</span>
                            <h2 className="text-sm font-bold text-light/60 uppercase tracking-wider">Por aprender ({pendingSkills.length})</h2>
                        </div>

                        {pendingSkills.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="text-4xl mb-2">🎉</div>
                                <p className="text-sm font-bold text-emerald-400">¡Todas las habilidades dominadas!</p>
                                <p className="text-xs text-light/40 mt-1">Estás preparado para postular a empleos de {path.jobTitle}.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(pendingByCategory).map(([cat, skills]) => (
                                    <div key={cat} className="border border-light/10 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleCategory(cat)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 bg-light/5 hover:bg-light/8 transition-colors"
                                        >
                                            <span className="text-sm font-semibold text-light/70">{categoryLabel[cat] ?? cat}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-light/30">{skills.length} pendientes</span>
                                                <span className="text-xs text-light/30">{expandedCategories.has(cat) ? '▲' : '▼'}</span>
                                            </div>
                                        </button>

                                        {expandedCategories.has(cat) && (
                                            <div className="divide-y divide-light/5">
                                                {skills.map(skill => (
                                                    <div key={skill.id} className="flex items-center justify-between px-4 py-3 gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className="text-sm text-light/70 font-medium">{skill.name}</p>
                                                                <span className={`text-xs px-1.5 py-0.5 rounded-full border ${importanceBadge[skill.importance]}`}>
                                                                    {skill.importance === 'critical' ? 'clave' : skill.importance === 'important' ? 'importante' : 'bonus'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-light/30">{skill.description}</p>
                                                            <p className="text-xs text-light/20 mt-0.5">{skill.masterRef}</p>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {skill.selfAssess && (
                                                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={assessments[skill.id] === true}
                                                                        onChange={() => toggleAssessment(skill.id)}
                                                                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                                                    />
                                                                    <span className="text-xs text-light/30 group-hover:text-light/50 transition-colors whitespace-nowrap">
                                                                        Lo sé
                                                                    </span>
                                                                </label>
                                                            )}
                                                            <button
                                                                onClick={() => navigate('/mentor')}
                                                                className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors whitespace-nowrap"
                                                            >
                                                                Practicar →
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate('/perfil-aprendizaje')} className="bg-[#1a1a1a] hover:bg-light/5 border border-emerald-500/20 rounded-xl p-4 text-left transition-all">
                            <div className="text-lg mb-1">📂</div>
                            <div className="text-sm font-semibold text-emerald-400">Subir ejercicios</div>
                            <div className="text-xs text-light/30 mt-0.5">Actualiza tu perfil</div>
                        </button>
                        <button onClick={() => navigate('/error-test')} className="bg-[#1a1a1a] hover:bg-light/5 border border-red-500/20 rounded-xl p-4 text-left transition-all">
                            <div className="text-lg mb-1">⚠️</div>
                            <div className="text-sm font-semibold text-red-400">Test de errores</div>
                            <div className="text-xs text-light/30 mt-0.5">Refuerza lo fallado</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Daily Plan ── */}
            <div className="mt-6 bg-[#1a1a1a] border border-light/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📋</span>
                        <h2 className="text-sm font-bold text-light/70 uppercase tracking-wider">Plan de hoy</h2>
                        {diagResult && <span className="text-xs text-light/30">· basado en tu diagnóstico ({diagResult.score}%)</span>}
                    </div>
                    <button
                        onClick={handleGenerateTodayPlan}
                        disabled={isGeneratingPlan}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-40"
                    >
                        {isGeneratingPlan ? 'Generando…' : dailyPlan ? '🔄 Nuevo plan' : '✨ Generar plan'}
                    </button>
                </div>

                {!dailyPlan && !isGeneratingPlan && (
                    <div className="text-center py-8">
                        <p className="text-sm text-light/40 mb-3">Genera tu rutina de entrenamiento personalizada para hoy</p>
                        <button onClick={handleGenerateTodayPlan} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all">
                            ✨ Generar plan de hoy
                        </button>
                    </div>
                )}

                {isGeneratingPlan && (
                    <div className="flex items-center justify-center gap-2 py-8">
                        {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                        <span className="text-sm text-light/40 ml-2">Creando tu rutina…</span>
                    </div>
                )}

                {dailyPlan && !isGeneratingPlan && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {dailyPlan.tasks.map(task => (
                            <div key={task.id} className={`border rounded-xl p-4 transition-all ${task.completed ? 'opacity-50 border-light/10 bg-light/5' : taskTypeColor[task.type as keyof typeof taskTypeColor]}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg">{taskTypeIcon[task.type as keyof typeof taskTypeIcon]}</span>
                                    {task.completed
                                        ? <span className="text-xs text-emerald-400 font-semibold">✅ Hecho</span>
                                        : <button onClick={() => handleCompleteTask(task.id)} className="text-xs text-light/30 hover:text-emerald-400 transition-colors">Marcar hecho</button>
                                    }
                                </div>
                                <p className="text-sm font-bold text-light mb-1 line-clamp-1">{task.title}</p>
                                <p className="text-xs text-light/40 leading-relaxed line-clamp-2">{task.description}</p>
                                <button onClick={() => navigate('/mentor')} className="text-xs text-violet-400 hover:text-violet-300 mt-2 transition-colors">
                                    Practicar →
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PathDashboard;
