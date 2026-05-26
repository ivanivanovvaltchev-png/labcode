import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPathById, getAvailableSkills } from '../../data/careerPaths';
import { getHabilidadesValidadas } from '../../lib/learningMetrics';
import { loadKnowledgeProfile, saveKnowledgeProfile } from '../../lib/knowledgeProfile';
import { analyzeKnowledgeFromCode, extractCodeFromFile } from '../../ai/knowledgeAnalyzer';
import { generateDiagnosticExam, evaluateDiagnosticExam, generateDailyPlan, DiagnosticQuestion } from '../../ai/diagnosticAgent';
import { markOnboardingComplete, saveDiagnosticResult, saveDailyPlan, todayString } from '../../lib/userProgress';
import { extractTextFromPDF } from '../../lib/pdfExtractor';
import { addTheoryContext, loadTheoryContexts, removeTheoryContext, TheoryContext } from '../../lib/theoryContext';

interface Props { pathId: string; }

type Step = 'welcome' | 'upload' | 'exam_intro' | 'exam' | 'evaluating' | 'results' | 'plan';

const STEP_LABELS = ['Bienvenida', 'Tu material', 'Diagnóstico', 'Resultados', 'Plan de hoy'];
const STEP_INDEX: Record<Step, number> = { welcome: 0, upload: 1, exam_intro: 2, exam: 2, evaluating: 2, results: 3, plan: 4 };

const CODE_EXTS = ['.py', '.ipynb', '.txt'];

function fileExt(name: string): string {
    const m = name.match(/\.[^.]+$/);
    return m ? m[0].toLowerCase() : '';
}

const OnboardingFlow: React.FC<Props> = ({ pathId }) => {
    const navigate = useNavigate();
    const path = getPathById(pathId);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('welcome');

    // ── Code files ────────────────────────────────────────────────────────────
    const [pendingFiles, setPendingFiles] = useState<{ name: string; content: string }[]>([]);
    const [isAnalyzingFiles, setIsAnalyzingFiles] = useState(false);
    const [profileReady, setProfileReady] = useState(!!loadKnowledgeProfile());
    const [dragOver, setDragOver] = useState(false);
    const [fileError, setFileError] = useState('');

    // ── PDF files ─────────────────────────────────────────────────────────────
    const [theoryCtxs, setTheoryCtxs] = useState<TheoryContext[]>([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState('');

    useEffect(() => { setTheoryCtxs(loadTheoryContexts()); }, []);

    // ── Exam ──────────────────────────────────────────────────────────────────
    const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQ, setCurrentQ] = useState(0);
    const [evalResult, setEvalResult] = useState<Awaited<ReturnType<typeof evaluateDiagnosticExam>> | null>(null);
    const [dailyTasks, setDailyTasks] = useState<Awaited<ReturnType<typeof generateDailyPlan>>>([]);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    if (!path) { navigate('/elegir-camino'); return null; }

    // ── Code file handling ────────────────────────────────────────────────────
    const readCodeFiles = (files: FileList) => {
        const valid = Array.from(files).filter(f => CODE_EXTS.includes(fileExt(f.name)));
        if (!valid.length) { setFileError(`Solo se aceptan ${CODE_EXTS.join(', ')}`); return; }
        setFileError('');
        Promise.all(valid.map(f => new Promise<{ name: string; content: string }>(res => {
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
        const allCode = pendingFiles
            .map(f => `# --- ${f.name} ---\n${extractCodeFromFile(f.name, f.content)}`)
            .join('\n\n');
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

    // ── PDF handling ──────────────────────────────────────────────────────────
    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const pdfs = Array.from(files).filter(f => f.name.endsWith('.pdf'));
        if (!pdfs.length) { setPdfError('Solo se aceptan archivos .pdf'); return; }
        setPdfLoading(true);
        setPdfError('');
        try {
            for (const file of pdfs) {
                const rawText = await extractTextFromPDF(file);
                addTheoryContext({ fileName: file.name, rawText, charCount: rawText.length, extractedAt: Date.now() });
            }
            setTheoryCtxs(loadTheoryContexts());
        } catch {
            setPdfError('Error al leer el PDF. Asegúrate de que no esté protegido con contraseña.');
        }
        setPdfLoading(false);
        if (e.target) e.target.value = '';
    };

    const handleRemovePdf = (fileName: string) => {
        removeTheoryContext(fileName);
        setTheoryCtxs(loadTheoryContexts());
    };

    // ── Exam ──────────────────────────────────────────────────────────────────
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

    const totalPdfChars = theoryCtxs.reduce((s, c) => s + c.charCount, 0);
    const hasMaterial = profileReady || theoryCtxs.length > 0;

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
                        Antes de empezar a entrenar, la IA necesita conocerte. Sube tu material y realizarás un diagnóstico rápido para que el sistema sepa exactamente qué generarte cada día.
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {[
                            { icon: '📘', title: 'Sube tus PDFs', desc: 'El material que has visto en clase' },
                            { icon: '🐍', title: 'Sube tus ejercicios', desc: 'Los .py que hayas resuelto' },
                            { icon: '🎯', title: 'Diagnóstico inicial', desc: '5 ejercicios para medir tu nivel real' },
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
                <div className="space-y-5">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-light mb-1">Sube tu material</h2>
                        <p className="text-light/40 text-sm">Cuanto más subas, más preciso será el diagnóstico y el entrenamiento diario.</p>
                    </div>

                    {/* ── PDFs de teoría ── */}
                    <div className={`border rounded-2xl p-5 flex flex-col gap-4 transition-all ${theoryCtxs.length > 0 ? 'border-blue-500/30 bg-blue-900/10' : 'border-light/10 bg-[#1a1a1a]'}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-lg">📘</span>
                                    <span className="text-sm font-bold text-light">Material teórico (PDFs)</span>
                                    {theoryCtxs.length > 0 && (
                                        <span className="text-xs bg-blue-900/40 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                                            {theoryCtxs.length} PDF{theoryCtxs.length > 1 ? 's' : ''} · {totalPdfChars.toLocaleString()} chars
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-light/40">Los apuntes, PDFs de clase o material oficial del curso. La IA solo generará contenido que aparezca en estos documentos.</p>
                            </div>
                            <button
                                onClick={() => pdfInputRef.current?.click()}
                                disabled={pdfLoading}
                                className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                            >
                                {pdfLoading ? 'Extrayendo…' : '+ Añadir PDF'}
                            </button>
                            <input ref={pdfInputRef} type="file" accept=".pdf" multiple onChange={handlePdfUpload} className="hidden" />
                        </div>

                        {pdfError && <p className="text-xs text-red-400">{pdfError}</p>}

                        {theoryCtxs.length > 0 && (
                            <div className="space-y-2">
                                {theoryCtxs.map(ctx => (
                                    <div key={ctx.fileName} className="bg-[#0f0f0f] rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-blue-300 truncate">📄 {ctx.fileName}</span>
                                                <span className="text-xs text-light/30 flex-shrink-0">{ctx.charCount.toLocaleString()} chars</span>
                                            </div>
                                            <p className="text-xs text-light/30 italic truncate mt-0.5">{ctx.rawText.slice(0, 80)}…</p>
                                        </div>
                                        <button onClick={() => handleRemovePdf(ctx.fileName)} className="text-light/25 hover:text-red-400 transition-colors text-xs flex-shrink-0">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Ejercicios de código ── */}
                    <div className="border border-light/10 bg-[#1a1a1a] rounded-2xl p-5 flex flex-col gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-lg">🐍</span>
                                <span className="text-sm font-bold text-light">Ejercicios realizados</span>
                                {profileReady && (
                                    <span className="text-xs bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                                        {loadKnowledgeProfile()?.concepts.length ?? 0} conceptos detectados
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-light/40">Archivos .py, .ipynb o .txt con los ejercicios que hayas resuelto. La IA detectará qué conceptos ya dominas.</p>
                        </div>

                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); readCodeFiles(e.dataTransfer.files); }}
                            onClick={() => codeInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-light/15 hover:border-emerald-500/40'}`}
                        >
                            <div className="text-2xl mb-1">📁</div>
                            <div className="text-xs font-semibold text-light/50">Arrastra .py / .ipynb / .txt o haz clic</div>
                            <input ref={codeInputRef} type="file" accept={CODE_EXTS.join(',')} multiple onChange={e => e.target.files && readCodeFiles(e.target.files)} className="hidden" />
                        </div>

                        {fileError && <p className="text-xs text-red-400">{fileError}</p>}

                        {pendingFiles.length > 0 && (
                            <div className="space-y-1.5">
                                {pendingFiles.map(f => (
                                    <div key={f.name} className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-3 py-2">
                                        <span className="text-xs text-light/60 font-mono truncate">🐍 {f.name}</span>
                                        <button onClick={() => setPendingFiles(p => p.filter(x => x.name !== f.name))} className="text-xs text-light/30 hover:text-red-400 ml-2 flex-shrink-0">✕</button>
                                    </div>
                                ))}
                                <button
                                    onClick={handleAnalyzeFiles}
                                    disabled={isAnalyzingFiles}
                                    className="w-full mt-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition-all"
                                >
                                    {isAnalyzingFiles ? 'Analizando con IA…' : `Analizar ${pendingFiles.length} archivo${pendingFiles.length > 1 ? 's' : ''} →`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Continuar ── */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={handleStartExam}
                            className="flex-1 bg-light/5 hover:bg-light/10 border border-light/10 text-light/40 font-bold py-3 rounded-xl text-sm transition-all"
                        >
                            Continuar sin material
                        </button>
                        <button
                            onClick={handleStartExam}
                            disabled={!hasMaterial}
                            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all"
                        >
                            {hasMaterial ? 'Ir al diagnóstico →' : 'Sube material primero'}
                        </button>
                    </div>
                    <p className="text-xs text-light/25 text-center -mt-1">
                        La IA usará todo lo que subas para personalizar el diagnóstico y el entrenamiento diario.
                    </p>
                </div>
            )}

            {/* ── EXAM GENERATING ── */}
            {(step === 'exam_intro' || (step === 'exam' && questions.length === 0)) && (
                <div className="text-center py-16">
                    <div className="text-4xl mb-4">🎯</div>
                    <h2 className="text-xl font-bold text-light mb-2">Generando tu diagnóstico…</h2>
                    <p className="text-sm text-light/50 mb-6">La IA está creando 5 ejercicios personalizados para evaluar tu nivel real</p>
                    <div className="flex justify-center gap-2">
                        {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </div>
                </div>
            )}

            {/* ── EXAM ── */}
            {step === 'exam' && questions.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-light">🎯 Diagnóstico inicial</h2>
                        <span className="text-sm text-light/40">{currentQ + 1} / {questions.length}</span>
                    </div>
                    <p className="text-xs text-light/30 mb-5">Responde como puedas. No es un examen — es para conocer tu punto de partida real.</p>

                    {/* Progress dots */}
                    <div className="flex gap-1.5 mb-5">
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
                            placeholder="Escribe tu respuesta aquí. Código, explicación, lo que sepas — no importa si no está perfecto."
                            rows={6}
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
                                disabled={Object.keys(answers).length < Math.ceil(questions.length * 0.6)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all"
                            >
                                Enviar y ver resultados →
                            </button>
                        )}
                    </div>

                    {currentQ === questions.length - 1 && Object.keys(answers).length < Math.ceil(questions.length * 0.6) && (
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
                        <div className="text-xs font-semibold text-light/40 uppercase tracking-wider mb-3">Desglose por ejercicio</div>
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
