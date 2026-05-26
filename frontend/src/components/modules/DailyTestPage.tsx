import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonCodeBlock, { splitQuestionCode } from '../ui/PythonCodeBlock';
import { loadSelectedPath, loadSelfAssessments } from '../../lib/selectedPath';
import { getPathById, getAvailableSkills } from '../../data/careerPaths';
import { loadKnowledgeProfile } from '../../lib/knowledgeProfile';
import { getHabilidadesValidadas, loadMetrics } from '../../lib/learningMetrics';
import { generateDailyTest } from '../../ai/diagnosticAgent';
import {
    TestQuestion, DailyCheckin, TestSession, EisenhowerMatrix,
    getTodayTest, saveTodayTest, todayStr, getRecentFailedSkills,
    calculateMatrix, recordTestResult, clearTodayTest,
} from '../../lib/dailyTest';

const MOOD_LABELS: Record<number, string> = {
    1: '😴 Agotado', 2: '😕 Cansado', 3: '😐 Normal', 4: '😊 Bien', 5: '🔥 Afilado',
};

type Step = 'checkin' | 'loading' | 'questions' | 'results';

const Q_COLORS = {
    Q1: { border: 'border-red-500/30', bg: 'bg-red-900/10', badge: 'bg-red-900/30 text-red-400', label: '🚨 Cuadrante I — Actúa ahora', sub: 'Urgente + Importante' },
    Q2: { border: 'border-blue-500/30', bg: 'bg-blue-900/10', badge: 'bg-blue-900/30 text-blue-400', label: '📅 Cuadrante II — Programa', sub: 'Importante + No Urgente' },
    Q3: { border: 'border-yellow-500/30', bg: 'bg-yellow-900/10', badge: 'bg-yellow-900/30 text-yellow-400', label: '⚡ Cuadrante III — Repasa rápido', sub: 'Urgente + No Importante' },
    Q4: { border: 'border-light/10', bg: 'bg-light/5', badge: 'bg-light/10 text-light/40', label: '⏳ Cuadrante IV — Pospón', sub: 'No Urgente + No Importante' },
};

const DailyTestPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('checkin');
    const [checkin, setCheckin] = useState<DailyCheckin>({ mood: 3, blocker: '', goal: '' });
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C'>>({});
    const [submitted, setSubmitted] = useState(false);
    const [matrix, setMatrix] = useState<EisenhowerMatrix | null>(null);
    const [todaySession, setTodaySession] = useState<TestSession | null>(null);
    const [error, setError] = useState('');

    const pathId = loadSelectedPath();
    const path = pathId ? getPathById(pathId) : null;
    const selfAssessments = pathId ? loadSelfAssessments(pathId) : {};
    const profile = loadKnowledgeProfile();
    const concepts = profile?.concepts ?? [];

    useEffect(() => {
        const existing = getTodayTest();
        if (existing?.score !== null && existing) {
            setTodaySession(existing);
            setQuestions(existing.questions);
            setAnswers(existing.answers);
            setMatrix(existing.matrix);
            setSubmitted(true);
            setStep('results');
        }
    }, []);

    const handleStartTest = async () => {
        if (!path || !pathId) return;
        setStep('loading');
        setError('');
        try {
            const available = getAvailableSkills(path, concepts, selfAssessments);
            const habilidades = getHabilidadesValidadas(path, concepts, selfAssessments);
            const recentFailed = getRecentFailedSkills(7);
            const qs = await generateDailyTest(path, available, recentFailed, habilidades);
            setQuestions(qs);
            setStep('questions');
        } catch {
            setError('Error al generar el test. Comprueba tu clave de API.');
            setStep('checkin');
        }
    };

    const handleSubmit = () => {
        if (!path || !pathId) return;
        const total = questions.length;
        const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
        const score = Math.round((correct / total) * 100);
        const failedSkills = questions
            .filter(q => answers[q.id] !== q.correctAnswer)
            .map(q => q.skillRef);
        const metrics = loadMetrics(pathId);
        const mat = calculateMatrix(path, metrics, failedSkills, checkin, concepts, selfAssessments);

        const session: TestSession = {
            date: todayStr(),
            checkin,
            questions,
            answers,
            score,
            completedAt: Date.now(),
            failedSkills,
            matrix: mat,
        };
        saveTodayTest(session);
        recordTestResult(pathId, questions, answers);
        setMatrix(mat);
        setSubmitted(true);
        setStep('results');
    };

    const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]);

    // ─── Check-in screen ──────────────────────────────────────────────────────
    if (step === 'checkin') {
        const existingToday = getTodayTest();
        return (
            <div className="max-w-2xl mx-auto px-6 py-10">
                <button onClick={() => navigate('/')} className="text-light/40 hover:text-light text-sm mb-8 block">← Volver</button>

                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🧪</div>
                    <h1 className="text-3xl font-bold text-light mb-2">Test Diario</h1>
                    <p className="text-light/40 text-sm">Active Recall + Matriz de Eisenhower · 3 preguntas · ~5 min</p>
                </div>

                {existingToday?.score !== null && existingToday && (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-emerald-300">✅ Test de hoy completado</p>
                            <p className="text-xs text-light/40 mt-0.5">Puntuación: {existingToday.score}/100</p>
                        </div>
                        <button
                            onClick={() => { setTodaySession(existingToday); setQuestions(existingToday.questions); setAnswers(existingToday.answers); setMatrix(existingToday.matrix); setSubmitted(true); setStep('results'); }}
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
                        >
                            Ver resultados →
                        </button>
                    </div>
                )}

                <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-7 space-y-7">
                    <div>
                        <p className="text-sm font-semibold text-light/70 mb-4">¿Cómo llegas hoy?</p>
                        <div className="flex gap-2">
                            {([1, 2, 3, 4, 5] as const).map(n => (
                                <button
                                    key={n}
                                    onClick={() => setCheckin(c => ({ ...c, mood: n }))}
                                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                                        checkin.mood === n
                                            ? 'border-violet-500 bg-violet-600/20 text-white'
                                            : 'border-light/10 text-light/40 hover:border-light/30'
                                    }`}
                                >
                                    {MOOD_LABELS[n].split(' ')[0]}<br />
                                    <span className="text-xs font-normal">{n}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-light/30 text-center mt-2">{MOOD_LABELS[checkin.mood]}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-light/70 mb-2">
                            ¿Qué tienes atascado o no te queda claro? <span className="text-light/30 font-normal">(opcional)</span>
                        </label>
                        <input
                            value={checkin.blocker}
                            onChange={e => setCheckin(c => ({ ...c, blocker: e.target.value }))}
                            placeholder="Ej: No entiendo bien cuándo usar for vs while"
                            className="w-full bg-[#0f0f0f] border border-light/10 rounded-xl px-4 py-3 text-sm text-light placeholder-light/25 focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-light/70 mb-2">
                            ¿Qué quieres conseguir hoy? <span className="text-light/30 font-normal">(opcional)</span>
                        </label>
                        <input
                            value={checkin.goal}
                            onChange={e => setCheckin(c => ({ ...c, goal: e.target.value }))}
                            placeholder="Ej: Terminar el ejercicio de listas y entender slicing"
                            className="w-full bg-[#0f0f0f] border border-light/10 rounded-xl px-4 py-3 text-sm text-light placeholder-light/25 focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <button
                        onClick={handleStartTest}
                        disabled={!path}
                        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-base transition-all"
                    >
                        {!path ? 'Selecciona un camino primero' : 'Empezar el test →'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Loading screen ───────────────────────────────────────────────────────
    if (step === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="text-5xl animate-pulse">🧠</div>
                <p className="text-light font-semibold">Generando tu test personalizado…</p>
                <p className="text-sm text-light/40">La IA prepara preguntas de tu nivel actual</p>
                <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2].map(i => <span key={i} className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
            </div>
        );
    }

    // ─── Questions screen ─────────────────────────────────────────────────────
    if (step === 'questions' && !submitted) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setStep('checkin')} className="text-light/40 hover:text-light text-sm">← Volver</button>
                    <span className="text-sm text-light/40">{Object.keys(answers).length}/{questions.length} respondidas</span>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-light mb-1">Test de Diagnóstico Rápido</h1>
                    <p className="text-sm text-light/40">Responde según tu comprensión teórica. No busques en internet.</p>
                </div>

                <div className="space-y-6">
                    {questions.map((q, idx) => {
                        const { prose, code } = splitQuestionCode(q.question);
                        return (
                        <div key={q.id} className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-6">
                            <div className="flex items-start gap-3 mb-1">
                                <span className="w-7 h-7 rounded-full bg-violet-900/40 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-300 flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <p className="text-base font-semibold text-light leading-snug">{prose}</p>
                            </div>
                            {code && <PythonCodeBlock code={code} />}
                            <div className="space-y-2.5">
                                {(['A', 'B', 'C'] as const).map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                                        className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all text-sm ${
                                            answers[q.id] === opt
                                                ? 'border-violet-500 bg-violet-600/20 text-white'
                                                : 'border-light/10 text-light/60 hover:border-light/30 hover:text-light/80'
                                        }`}
                                    >
                                        <span className={`font-bold flex-shrink-0 ${answers[q.id] === opt ? 'text-violet-300' : 'text-light/30'}`}>{opt}.</span>
                                        <span>{q.options[opt]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        );
                    })}
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-all"
                    >
                        {allAnswered ? 'Enviar respuestas →' : `Responde todas las preguntas (${Object.keys(answers).length}/${questions.length})`}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Results + Matrix screen ──────────────────────────────────────────────
    if (step === 'results' || submitted) {
        const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
        const score = todaySession?.score ?? Math.round((correct / questions.length) * 100);
        const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

        return (
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
                <button onClick={() => navigate('/')} className="text-light/40 hover:text-light text-sm">← Volver al Dashboard</button>

                {/* Score card */}
                <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-7 text-center">
                    <div className={`text-6xl font-bold ${scoreColor} mb-2`}>{score}%</div>
                    <p className="text-light font-semibold text-lg mb-1">
                        {score >= 80 ? '¡Sólido dominio conceptual!' : score >= 50 ? 'Buen intento — repasa los fallos' : 'Necesitas reforzar estos conceptos'}
                    </p>
                    <p className="text-sm text-light/40">{correct}/{questions.length} respuestas correctas</p>
                </div>

                {/* Question review */}
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-light/70 uppercase tracking-wider">Revisión de respuestas</h2>
                    {questions.map((q, idx) => {
                        const chosen = answers[q.id];
                        const isCorrect = chosen === q.correctAnswer;
                        const { prose: qProse, code: qCode } = splitQuestionCode(q.question);
                        return (
                            <div key={q.id} className={`border rounded-2xl p-5 ${isCorrect ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-red-500/30 bg-red-900/10'}`}>
                                <div className="flex items-start gap-2 mb-1">
                                    <span className="text-lg flex-shrink-0">{isCorrect ? '✅' : '❌'}</span>
                                    <p className="text-sm font-semibold text-light">{idx + 1}. {qProse}</p>
                                </div>
                                {qCode && <PythonCodeBlock code={qCode} />}
                                <div className="space-y-1.5 mb-3">
                                    {(['A', 'B', 'C'] as const).map(opt => (
                                        <div key={opt} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                                            opt === q.correctAnswer
                                                ? 'bg-emerald-900/30 text-emerald-300'
                                                : opt === chosen && !isCorrect
                                                ? 'bg-red-900/30 text-red-300'
                                                : 'text-light/40'
                                        }`}>
                                            <span className="font-bold flex-shrink-0">{opt}.</span>
                                            <span>{q.options[opt]}</span>
                                            {opt === q.correctAnswer && <span className="ml-auto flex-shrink-0">← correcta</span>}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-light/50 bg-[#0f0f0f] rounded-xl px-3 py-2 leading-relaxed">
                                    💡 {q.explanation}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Eisenhower Matrix */}
                {matrix && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-base font-bold text-light uppercase tracking-wider">Matriz de Eisenhower</h2>
                            <p className="text-sm text-light/40 mt-1">Prioridades calculadas en base a tu test, historial y check-in de hoy.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(
                                [
                                    ['Q1', matrix.Q1_urgent_important],
                                    ['Q2', matrix.Q2_important_not_urgent],
                                    ['Q3', matrix.Q3_urgent_not_important],
                                    ['Q4', matrix.Q4_not_urgent_not_important],
                                ] as const
                            ).map(([qKey, items]) => {
                                const cfg = Q_COLORS[qKey];
                                return (
                                    <div key={qKey} className={`border ${cfg.border} ${cfg.bg} rounded-2xl p-5`}>
                                        <div className="mb-3">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                            <p className="text-xs text-light/30 mt-1">{cfg.sub}</p>
                                        </div>
                                        {items.length === 0 ? (
                                            <p className="text-xs text-light/25 italic">Sin elementos en este cuadrante</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {items.map((item, i) => (
                                                    <div key={i} className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-light/80 truncate">{item.skillName}</p>
                                                            <p className="text-xs text-light/35 leading-snug">{item.reason}</p>
                                                        </div>
                                                        {item.masteryPct > 0 && (
                                                            <span className="text-xs text-light/30 flex-shrink-0">{item.masteryPct}%</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-violet-900/10 border border-violet-500/20 rounded-2xl p-5 flex items-start gap-3">
                            <span className="text-xl">🎯</span>
                            <div>
                                <p className="text-sm font-semibold text-light/80 mb-1">
                                    Enfócate hoy en: {matrix.Q1_urgent_important[0]?.skillName ?? matrix.Q2_important_not_urgent[0]?.skillName ?? 'tu plan de hoy'}
                                </p>
                                <p className="text-xs text-light/40">
                                    {matrix.Q1_urgent_important.length > 0
                                        ? `Tienes ${matrix.Q1_urgent_important.length} concepto${matrix.Q1_urgent_important.length > 1 ? 's' : ''} urgente${matrix.Q1_urgent_important.length > 1 ? 's' : ''} que reforzar antes de avanzar.`
                                        : 'No hay urgencias. Avanza con el temario del Máster.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all text-sm"
                    >
                        Ir al plan de hoy →
                    </button>
                    <button
                        onClick={() => navigate('/mentor')}
                        className="flex-1 bg-[#1a1a1a] hover:bg-light/5 border border-light/10 text-light/60 hover:text-light font-bold py-3 rounded-xl transition-all text-sm"
                    >
                        Practicar con Mentor →
                    </button>
                </div>

                <button
                    onClick={() => {
                        clearTodayTest();
                        setStep('checkin');
                        setQuestions([]);
                        setAnswers({});
                        setSubmitted(false);
                        setMatrix(null);
                        setTodaySession(null);
                    }}
                    className="w-full text-xs text-light/25 hover:text-light/50 py-2 transition-colors"
                >
                    ↺ Regenerar test (descarta el actual y genera uno nuevo)
                </button>
            </div>
        );
    }

    return null;
};

export default DailyTestPage;
