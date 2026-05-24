import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPathById, getAvailableSkills } from '../../data/careerPaths';
import { getHabilidadesValidadas } from '../../lib/learningMetrics';
import { loadKnowledgeProfile, saveKnowledgeProfile } from '../../lib/knowledgeProfile';
import { analyzeKnowledgeFromCode } from '../../ai/knowledgeAnalyzer';
import { generateDiagnosticExam, evaluateDiagnosticExam, generateDailyPlan, DiagnosticQuestion } from '../../ai/diagnosticAgent';
import { markOnboardingComplete, saveDiagnosticResult, saveDailyPlan, todayString } from '../../lib/userProgress';

interface Props { pathId: string; }

type Step = 'welcome' | 'upload' | 'exam_intro' | 'exam' | 'evaluating' | 'results' | 'plan';

const STEP_LABELS = ['Bienvenida', 'Tus ejercicios', 'Diagnóstico', 'Resultados', 'Plan de hoy'];
const STEP_INDEX: Record<Step, number> = { welcome: 0, upload: 1, exam_intro: 2, exam: 2, evaluating: 2, results: 3, plan: 4 };

const OnboardingFlow: React.FC<Props> = ({ pathId }) => {
    const navigate = useNavigate();
    const path = getPathById(pathId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('welcome');
    const [pendingFiles, setPendingFiles] = useState<{ name: string; content: string }[]>([]);
    const [isAnalyzingFiles, setIsAnalyzingFiles] = useState(false);
    const [profileReady, setProfileReady] = useState(!!loadKnowledgeProfile());
    const [dragOver, setDragOver] = useState(false);

    const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQ, setCurrentQ] = useState(0);

    const [evalResult, setEvalResult] = useState<Awaited<ReturnType<typeof evaluateDiagnosticExam>> | null>(null);
    const [dailyTasks, setDailyTasks] = useState<Awaited<ReturnType<typeof generateDailyPlan>>>([]);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    if (!path) { navigate('/elegir-camino'); return null; }

    // ── File handling ──────────────────────────────────────────────────────────
    const readFiles = (files: FileList) => {
        const pyFiles = Array.from(files).filter(f => f.name.endsWith('.py'));
        if (!pyFiles.length) return;
        Promise.all(pyFiles.map(f => new Promise<{ name: string; content: string }>(res => {
            const r = new FileReader();
            r.onload = e => res({ name: f.name, content: e.target?.result as string });
            r.readAsText(f);
        }))).then(results => setPendingFiles(prev => {
            const existing = new Set(prev.map(x => x.name));
            return [...prev, ...results.filter(r => !existing.has(r.name))];
        }));
    };

    const handleAnalyzeFiles = async () => {
        if (!pendingFiles.length) return;
        setIsAnalyzingFiles(true);
        const allCode = pendingFiles.map(f => `# --- ${f.name} ---\n${f.content}`).join('\n\n');
        const result = await analyzeKnowledgeFromCode(allCode);
        const existing = loadKnowledgeProfile();
        saveKnowledgeProfile({
            concepts: [...new Set([...(existing?.concepts ?? []), ...result.concepts])],
            summary: result.summary,
            analyzedFiles: [...new Set([...(existing?.analyzedFiles ?? []), ...pendingFiles.map(f => f.name)])],
            updatedAt: Date.now(),
        });
        setPendingFiles([]);
        setProfileReady(true);
        setIsAnalyzingFiles(false);
    };

    // ── Exam ────────────────────────────────────────────────────────────────────
    const handleStartExam = async () => {
        setStep('exam_intro');
        const profile = loadKnowledgeProfile();
        const qs = await generateDiagnosticExam(path, profile?.concepts ?? []);
        setQuestions(qs);
        setStep('exam');
    };

    const handleSubmitExam = async () => {
        setStep('evaluating');
        const result = await evaluateDiagnosticExam(path, questions, answers);
        saveDiagnosticResult({ pathId, score: result.totalScore, xpEarned: result.xpEarned, weakAreas: result.weakAreas, feedback: result.summary, completedAt: Date.now() });
        setEvalResult(result);
        setStep('results');
    };

    const handleGeneratePlan = async () => {
        setIsGeneratingPlan(true);
        setStep('plan');
        const profile = loadKnowledgeProfile();
        const concepts = profile?.concepts ?? [];
        const selfAssessments: Record<string, boolean> = {};
        const available = getAvailableSkills(path, concepts, selfAssessments);
        const habilidades = getHabilidadesValidadas(path, concepts, selfAssessments);
        const tasks = await generateDailyPlan(path, evalResult?.weakAreas ?? [], concepts, available, habilidades);
        const plan = {
            date: todayString(),
            tasks: tasks.map((t, i) => ({ ...t, id: `task-${i}`, completed: false })),
            generatedAt: Date.now(),
        };
        saveDailyPlan(pathId, plan);
        setDailyTasks(tasks);
        setIsGeneratingPlan(false);
    };

    const handleFinish = () => {
        markOnboardingComplete(pathId);
        navigate('/camino');
    };

    const stepIdx = STEP_INDEX[step];
    const typeIcon = { learn: '📖', practice: '💻', review: '🔄' };
    const typeLabel = { learn: 'Aprender', practice: 'Practicar', review: 'Repasar' };
    const typeColor = { learn: 'border-blue-500/30 bg-blue-900/10', practice: 'border-violet-500/30 bg-violet-900/10', review: 'border-amber-500/30 bg-amber-900/10' };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Progress steps */}
            <div className="flex items-center justify-center gap-2 mb-10">
                {STEP_LABELS.map((label, i) => (
                    <React.Fragment key={i}>
                        <div className={`flex items-center gap-1.5 ${i <= stepIdx ? 'text-light/80' : 'text-light/20'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${i < stepIdx ? 'bg-emerald-500 border-emerald-500 text-white' : i === stepIdx ? 'border-violet-500 text-violet-400' : 'border-light/20 text-light/20'}`}>
                                {i < stepIdx ? '✓' : i + 1}
                            </div>
                            <span className="text-xs hidden sm:inline">{label}</span>
                        </div>
                        {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-px max-w-8 ${i < stepIdx ? 'bg-emerald-500/50' : 'bg-light/10'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* ── WELCOME ── */}
            {step === 'welcome' && (
                <div className="text-center">
                    <div className="text-6xl mb-4">{path.emoji}</div>
                    <h1 className="text-3xl font-bold text-light mb-2">¡Camino elegido!</h1>
                    <h2 className="text-xl text-violet-400 font-semibold mb-4">{path.title}</h2>
                    <p className="text-light/50 text-sm mb-8 leading-relaxed">
                        Antes de empezar a entrenar, necesitamos evaluar tu nivel real para crear un plan de aprendizaje personalizado. Serán dos pasos rápidos.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                            { icon: '📂', title: 'Sube tus ejercicios', desc: 'Analizamos lo que ya sabes' },
                            { icon: '🎯', title: 'Diagnóstico inicial', desc: 'Determinamos tu nivel real' },
                        ].map(c => (
                            <div key={c.title} className="bg-[#1a1a1a] border border-light/10 rounded-xl p-4 text-left">
                                <div className="text-2xl mb-2">{c.icon}</div>
                                <div className="text-sm font-semibold text-light/80">{c.title}</div>
                                <div className="text-xs text-light/40 mt-1">{c.desc}</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setStep('upload')} className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all">
                        Empezar evaluación →
                    </button>
                </div>
            )}

            {/* ── UPLOAD ── */}
            {step === 'upload' && (
                <div>
                    <h2 className="text-2xl font-bold text-light mb-2 text-center">📂 Sube tus ejercicios</h2>
                    <p className="text-light/50 text-sm mb-6 text-center">
                        Sube los archivos <code className="bg-light/10 px-1 rounded">.py</code> que hayas hecho hasta ahora. La IA detectará qué conceptos ya conoces.
                    </p>

                    {profileReady && loadKnowledgeProfile() && (
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-4 mb-4">
                            <div className="text-sm font-semibold text-emerald-400 mb-1">✅ Perfil existente detectado</div>
                            <div className="text-xs text-light/50">{loadKnowledgeProfile()!.concepts.length} conceptos detectados anteriormente. Puedes añadir más o continuar.</div>
                        </div>
                    )}

                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); readFiles(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-light/20 hover:border-violet-500/50'}`}
                    >
                        <div className="text-3xl mb-2">📁</div>
                        <div className="text-sm font-semibold text-light/60">Arrastra archivos .py o haz clic</div>
                        <input ref={fileInputRef} type="file" accept=".py" multiple onChange={e => e.target.files && readFiles(e.target.files)} className="hidden" />
                    </div>

                    {pendingFiles.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-light/10 rounded-xl p-4 mb-4">
                            {pendingFiles.map(f => (
                                <div key={f.name} className="flex items-center justify-between py-1">
                                    <span className="text-sm text-light/60 font-mono">🐍 {f.name}</span>
                                    <button onClick={() => setPendingFiles(p => p.filter(x => x.name !== f.name))} className="text-xs text-light/30 hover:text-red-400">✕</button>
                                </div>
                            ))}
                            <button onClick={handleAnalyzeFiles} disabled={isAnalyzingFiles} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm transition-all">
                                {isAnalyzingFiles ? 'Analizando…' : `Analizar ${pendingFiles.length} archivo${pendingFiles.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={() => { setStep('exam_intro'); handleStartExam(); }}
                            className="flex-1 bg-[#1a1a1a] hover:bg-light/5 border border-light/10 text-light/50 font-bold py-3 rounded-xl text-sm transition-all"
                        >
                            Continuar sin subir ejercicios
                        </button>
                        <button
                            onClick={handleStartExam}
                            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
                        >
                            Continuar al diagnóstico →
                        </button>
                    </div>
                </div>
            )}

            {/* ── EXAM GENERATING ── */}
            {(step === 'exam_intro' || (step === 'exam' && questions.length === 0)) && (
                <div className="text-center py-16">
                    <div className="text-4xl mb-4">🎯</div>
                    <h2 className="text-xl font-bold text-light mb-2">Generando tu diagnóstico…</h2>
                    <p className="text-sm text-light/50 mb-6">La IA está creando preguntas personalizadas para tu nivel</p>
                    <div className="flex justify-center gap-2">
                        {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </div>
                </div>
            )}

            {/* ── EXAM ── */}
            {step === 'exam' && questions.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-light">🎯 Diagnóstico inicial</h2>
                        <span className="text-sm text-light/40">{currentQ + 1} / {questions.length}</span>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1.5 mb-6">
                        {questions.map((_, i) => (
                            <div key={i} onClick={() => setCurrentQ(i)} className={`flex-1 h-1.5 rounded-full cursor-pointer transition-all ${i < currentQ ? 'bg-emerald-500' : i === currentQ ? 'bg-violet-500' : 'bg-light/10'}`} />
                        ))}
                    </div>

                    <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-6 mb-4">
                        <div className="text-xs text-violet-400 font-semibold mb-3">{questions[currentQ].skillRef}</div>
                        <p className="text-light font-medium leading-relaxed mb-4">{questions[currentQ].question}</p>
                        {questions[currentQ].hint && (
                            <details className="mb-4">
                                <summary className="text-xs text-light/30 cursor-pointer hover:text-light/50">💡 Ver pista</summary>
                                <p className="text-xs text-light/40 mt-2 pl-3 border-l border-light/10">{questions[currentQ].hint}</p>
                            </details>
                        )}
                        <textarea
                            value={answers[questions[currentQ].id] ?? ''}
                            onChange={e => setAnswers(prev => ({ ...prev, [questions[currentQ].id]: e.target.value }))}
                            placeholder="Escribe tu respuesta aquí. No te preocupes si no sabes todo — el objetivo es conocer tu nivel real."
                            rows={5}
                            className="w-full bg-[#0f0f0f] border border-light/10 rounded-xl p-4 text-sm text-light placeholder-light/25 resize-none focus:outline-none focus:border-violet-500/50 transition-colors font-mono"
                        />
                    </div>

                    <div className="flex gap-3">
                        {currentQ > 0 && (
                            <button onClick={() => setCurrentQ(q => q - 1)} className="px-5 py-3 bg-light/5 hover:bg-light/10 border border-light/10 text-light/50 font-bold rounded-xl text-sm transition-all">
                                ← Anterior
                            </button>
                        )}
                        {currentQ < questions.length - 1 ? (
                            <button onClick={() => setCurrentQ(q => q + 1)} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                                Siguiente →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitExam}
                                disabled={Object.keys(answers).length < questions.length * 0.6}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all"
                            >
                                Enviar respuestas y ver resultados →
                            </button>
                        )}
                    </div>

                    {currentQ === questions.length - 1 && Object.keys(answers).length < questions.length * 0.6 && (
                        <p className="text-xs text-light/30 text-center mt-2">Responde al menos {Math.ceil(questions.length * 0.6)} preguntas para continuar</p>
                    )}
                </div>
            )}

            {/* ── EVALUATING ── */}
            {step === 'evaluating' && (
                <div className="text-center py-16">
                    <div className="text-4xl mb-4">🧠</div>
                    <h2 className="text-xl font-bold text-light mb-2">Evaluando tus respuestas…</h2>
                    <p className="text-sm text-light/50 mb-6">La IA está analizando tu nivel real. Un momento…</p>
                    <div className="flex justify-center gap-2">
                        {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </div>
                </div>
            )}

            {/* ── RESULTS ── */}
            {step === 'results' && evalResult && (
                <div>
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-3">{evalResult.totalScore >= 70 ? '🔥' : evalResult.totalScore >= 40 ? '💪' : '🚶'}</div>
                        <h2 className="text-2xl font-bold text-light mb-1">Diagnóstico completado</h2>
                        <div className="text-4xl font-bold text-violet-400 mb-1">{evalResult.totalScore}%</div>
                        <p className="text-sm text-light/50">{evalResult.xpEarned} XP obtenidos</p>
                    </div>

                    <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-5 mb-4">
                        <p className="text-sm text-light/70 leading-relaxed italic">"{evalResult.summary}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {evalResult.strongAreas.length > 0 && (
                            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                                <div className="text-xs font-semibold text-emerald-400 mb-2">✅ Puntos fuertes</div>
                                {evalResult.strongAreas.map(a => <div key={a} className="text-xs text-light/60">• {a}</div>)}
                            </div>
                        )}
                        {evalResult.weakAreas.length > 0 && (
                            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                                <div className="text-xs font-semibold text-red-400 mb-2">🎯 A reforzar</div>
                                {evalResult.weakAreas.map(a => <div key={a} className="text-xs text-light/60">• {a}</div>)}
                            </div>
                        )}
                    </div>

                    {/* Per-question breakdown */}
                    <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-4 mb-5">
                        <div className="text-xs font-semibold text-light/40 uppercase tracking-wider mb-3">Desglose por pregunta</div>
                        <div className="space-y-2">
                            {evalResult.evaluations.map((ev, i) => (
                                <div key={ev.questionId} className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${ev.score >= 7 ? 'bg-emerald-900/40 text-emerald-400' : ev.score >= 4 ? 'bg-amber-900/40 text-amber-400' : 'bg-red-900/40 text-red-400'}`}>
                                        {ev.score}
                                    </div>
                                    <div>
                                        <div className="text-xs text-light/50 font-medium">{questions[i]?.skillRef}</div>
                                        <div className="text-xs text-light/30">{ev.feedback}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleGeneratePlan} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                        Ver mi plan de entrenamiento →
                    </button>
                </div>
            )}

            {/* ── PLAN ── */}
            {step === 'plan' && (
                <div>
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-2">📋</div>
                        <h2 className="text-2xl font-bold text-light mb-1">Tu plan para hoy</h2>
                        <p className="text-sm text-light/40">Basado en tu diagnóstico — ~45-60 minutos</p>
                    </div>

                    {isGeneratingPlan ? (
                        <div className="text-center py-10">
                            <div className="flex justify-center gap-2 mb-3">
                                {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                            </div>
                            <p className="text-sm text-light/40">Generando tu rutina personalizada…</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {dailyTasks.map((task, i) => (
                                <div key={i} className={`border rounded-2xl p-4 ${typeColor[task.type as keyof typeof typeColor]}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{typeIcon[task.type as keyof typeof typeIcon]}</span>
                                        <span className="text-xs font-semibold text-light/50 uppercase tracking-wider">{typeLabel[task.type as keyof typeof typeLabel]}</span>
                                    </div>
                                    <p className="text-sm font-bold text-light mb-1">{task.title}</p>
                                    <p className="text-xs text-light/50 leading-relaxed">{task.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isGeneratingPlan && (
                        <button onClick={handleFinish} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                            🚀 ¡Empezar a entrenar!
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default OnboardingFlow;
