import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveKnowledgeProfile, loadKnowledgeProfile, clearKnowledgeProfile, KnowledgeProfile } from '../../lib/knowledgeProfile';
import { analyzeKnowledgeFromCode, extractCodeFromFile } from '../../ai/knowledgeAnalyzer';
import { loadSelectedPath, loadSelfAssessments } from '../../lib/selectedPath';
import { getPathById } from '../../data/careerPaths';
import {
    loadMetrics, seedMasteryFromProfile, calculateGapAnalysis,
    getRecentActivity, totalChallengesSolved, LearningMetrics,
} from '../../lib/learningMetrics';

const ACCEPTED_EXTS = ['.py', '.ipynb', '.txt'];
const FILE_ICONS: Record<string, string> = { '.py': '🐍', '.ipynb': '📓', '.txt': '📄' };

function fileExt(name: string): string {
    const m = name.match(/\.[^.]+$/);
    return m ? m[0].toLowerCase() : '';
}

function isAccepted(name: string): boolean {
    return ACCEPTED_EXTS.includes(fileExt(name));
}

const KnowledgePage: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<KnowledgeProfile | null>(null);
    const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
    const [pendingFiles, setPendingFiles] = useState<{ name: string; content: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'upload' | 'mastery' | 'gap' | 'activity'>('upload');

    const pathId = loadSelectedPath();
    const path = pathId ? getPathById(pathId) : null;
    const selfAssessments = pathId ? loadSelfAssessments(pathId) : {};

    useEffect(() => {
        const p = loadKnowledgeProfile();
        setProfile(p);
        if (pathId) {
            const m = loadMetrics(pathId);
            setMetrics(m);
            if (p && path) seedMasteryFromProfile(pathId, path, p.concepts, selfAssessments);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathId]);

    const readFiles = (files: FileList) => {
        const valid = Array.from(files).filter(f => isAccepted(f.name));
        if (valid.length === 0) { setError(`Solo se aceptan ${ACCEPTED_EXTS.join(', ')}`); return; }
        setError('');
        Promise.all(
            valid.map(file => new Promise<{ name: string; content: string }>(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve({ name: file.name, content: e.target?.result as string });
                reader.readAsText(file);
            }))
        ).then(results => {
            setPendingFiles(prev => {
                const existing = new Set(prev.map(f => f.name));
                return [...prev, ...results.filter(r => !existing.has(r.name))];
            });
        });
    };

    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); readFiles(e.dataTransfer.files); };
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) readFiles(e.target.files); };

    const handleAnalyze = async () => {
        if (pendingFiles.length === 0) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const allCode = pendingFiles
                .map(f => `# --- ${f.name} ---\n${extractCodeFromFile(f.name, f.content)}`)
                .join('\n\n');
            const result = await analyzeKnowledgeFromCode(allCode);
            const newProfile: KnowledgeProfile = {
                concepts: result.concepts,
                summary: result.summary,
                analyzedFiles: [
                    ...(profile?.analyzedFiles ?? []),
                    ...pendingFiles.map(f => f.name).filter(n => !profile?.analyzedFiles.includes(n)),
                ],
                updatedAt: Date.now(),
            };
            saveKnowledgeProfile(newProfile);
            setProfile(newProfile);
            // Re-seed mastery from freshly detected concepts
            if (pathId && path) {
                seedMasteryFromProfile(pathId, path, newProfile.concepts, selfAssessments);
                setMetrics(loadMetrics(pathId));
            }
            setPendingFiles([]);
        } catch {
            setError('Error al analizar. Comprueba tu clave de API.');
        }
        setIsAnalyzing(false);
    };

    const handleClear = () => { clearKnowledgeProfile(); setProfile(null); setPendingFiles([]); };

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' · ' + new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Gap analysis — only when path and metrics are loaded
    const gap = (path && metrics && profile)
        ? calculateGapAnalysis(path, metrics, profile.concepts, selfAssessments)
        : null;

    const recentActivity = metrics ? getRecentActivity(metrics, 7) : [];
    const maxActivity = Math.max(...recentActivity.map(d => d.challengesSolved + d.mentorSessions), 1);

    const tabCls = (t: typeof activeTab) =>
        `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t ? 'bg-violet-600 text-white' : 'text-light/40 hover:text-light/70'}`;

    return (
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-10 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="text-light/40 hover:text-light transition-colors text-sm">← Volver</button>
            </div>

            <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-2">
                    Mi Perfil de Aprendizaje
                </h1>
                <p className="text-light/40 text-sm max-w-xl mx-auto">
                    Sistema de análisis científico de tu progreso. Sube tus ejercicios (.py, .ipynb, .txt) y la IA construirá tu árbol de habilidades.
                </p>
            </div>

            {/* Stats strip */}
            {metrics && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Retos resueltos', value: totalChallengesSolved(metrics), icon: '🎯' },
                        { label: 'Habilidades detectadas', value: Object.keys(metrics.skillMastery).length, icon: '🧠' },
                        { label: 'Archivos analizados', value: profile?.analyzedFiles.length ?? 0, icon: '📂' },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-4 text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-2xl font-bold text-light">{value}</div>
                            <div className="text-xs text-light/40 mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab nav */}
            <div className="flex gap-2 bg-[#1a1a1a] border border-light/10 rounded-2xl p-2">
                <button onClick={() => setActiveTab('upload')} className={tabCls('upload')}>📂 Subir archivos</button>
                <button onClick={() => setActiveTab('mastery')} className={tabCls('mastery')}>🧠 Árbol de habilidades</button>
                <button onClick={() => setActiveTab('gap')} className={tabCls('gap')}>🎯 Gap Analysis</button>
                <button onClick={() => setActiveTab('activity')} className={tabCls('activity')}>📈 Actividad</button>
            </div>

            {/* ── TAB: UPLOAD ── */}
            {activeTab === 'upload' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Drop zone */}
                    <div className="flex flex-col gap-4">
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                                dragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-light/20 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                            }`}
                        >
                            <div className="text-5xl mb-4">📁</div>
                            <div className="text-base font-semibold text-light/70 mb-1">Arrastra tus archivos aquí</div>
                            <div className="text-sm text-light/40 mb-3">o haz clic para seleccionarlos</div>
                            <div className="flex justify-center gap-2">
                                {ACCEPTED_EXTS.map(ext => (
                                    <span key={ext} className="text-xs bg-[#0f0f0f] border border-light/10 text-light/50 px-2.5 py-1 rounded-full">
                                        {FILE_ICONS[ext]} {ext}
                                    </span>
                                ))}
                            </div>
                            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTS.join(',')} multiple onChange={handleFileInput} className="hidden" />
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                        {pendingFiles.length > 0 && (
                            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-5">
                                <div className="text-xs font-semibold text-light/50 uppercase tracking-wider mb-3">
                                    Listos para analizar
                                </div>
                                <div className="space-y-2 mb-4">
                                    {pendingFiles.map(f => (
                                        <div key={f.name} className="flex items-center justify-between bg-[#0f0f0f] rounded-xl px-3 py-2.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-base">{FILE_ICONS[fileExt(f.name)] ?? '📄'}</span>
                                                <span className="text-sm text-light/70 truncate">{f.name}</span>
                                                {f.name.endsWith('.ipynb') && (
                                                    <span className="text-xs text-teal-400 bg-teal-900/20 px-1.5 py-0.5 rounded-full flex-shrink-0">Jupyter</span>
                                                )}
                                            </div>
                                            <button onClick={() => setPendingFiles(p => p.filter(x => x.name !== f.name))} className="text-light/30 hover:text-red-400 transition-colors text-xs ml-2 flex-shrink-0">✕</button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm"
                                >
                                    {isAnalyzing ? 'Analizando con IA…' : `Analizar ${pendingFiles.length} archivo${pendingFiles.length > 1 ? 's' : ''} →`}
                                </button>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="bg-[#1a1a1a] border border-emerald-500/20 rounded-2xl p-6 text-center">
                                <div className="flex justify-center gap-1.5 mb-3">
                                    {[0, 1, 2].map(i => (
                                        <span key={i} className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                                    ))}
                                </div>
                                <p className="text-sm text-light/50">La IA está leyendo tu código y detectando qué conceptos conoces…</p>
                            </div>
                        )}
                    </div>

                    {/* Profile panel */}
                    <div>
                        {profile ? (
                            <div className="bg-[#1a1a1a] border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">✅ Perfil activo</span>
                                    <span className="text-xs text-light/30">{formatDate(profile.updatedAt)}</span>
                                </div>
                                <div>
                                    <div className="text-xs text-light/40 mb-2">Resumen de nivel</div>
                                    <p className="text-sm text-light/70 leading-relaxed bg-[#0f0f0f] rounded-xl p-3">{profile.summary}</p>
                                </div>
                                <div>
                                    <div className="text-xs text-light/40 mb-2">Conceptos detectados ({profile.concepts.length})</div>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.concepts.map(c => (
                                            <span key={c} className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-full">{c}</span>
                                        ))}
                                    </div>
                                </div>
                                {profile.analyzedFiles.length > 0 && (
                                    <div>
                                        <div className="text-xs text-light/40 mb-2">Archivos analizados</div>
                                        <div className="space-y-1.5">
                                            {profile.analyzedFiles.map(f => (
                                                <div key={f} className="text-xs text-light/40 flex items-center gap-1.5">
                                                    <span>{FILE_ICONS[fileExt(f)] ?? '📄'}</span> {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button onClick={handleClear} className="text-xs text-light/30 hover:text-red-400 transition-colors text-left">
                                    Borrar perfil y empezar de cero
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center gap-4">
                                <div className="text-5xl">📊</div>
                                <div className="text-base font-semibold text-light/40">Aún no hay perfil</div>
                                <div className="text-sm text-light/30 max-w-xs">Sube tus archivos de ejercicios y el sistema detectará qué has aprendido.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: MASTERY TREE ── */}
            {activeTab === 'mastery' && (
                <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-7">
                    <h2 className="text-lg font-bold text-light mb-1">Árbol de Habilidades</h2>
                    <p className="text-sm text-light/40 mb-6">
                        Dominio por habilidad según tu historial de práctica y código analizado. 80 %+ = dominada.
                    </p>
                    {!metrics || Object.keys(metrics.skillMastery).length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">🌱</div>
                            <p className="text-light/40 text-sm">Aún no hay datos de dominio. Completa ejercicios o sube tus archivos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.values(metrics.skillMastery)
                                .sort((a, b) => b.masteryPct - a.masteryPct)
                                .map(m => {
                                    const color = m.masteryPct >= 80 ? 'bg-emerald-500' : m.masteryPct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                                    const label = m.masteryPct >= 80 ? 'Dominada' : m.masteryPct >= 50 ? 'En progreso' : 'Inicio';
                                    return (
                                        <div key={m.skillId} className="bg-[#0f0f0f] border border-light/10 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-light/80 truncate pr-2">{m.skillName}</span>
                                                <span className="text-sm font-bold text-light flex-shrink-0">{m.masteryPct}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-light/10 rounded-full overflow-hidden">
                                                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${m.masteryPct}%` }} />
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-light/30">{label}</span>
                                                {m.practiceCount > 0 && (
                                                    <span className="text-xs text-light/25">{m.practiceCount} práctica{m.practiceCount !== 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: GAP ANALYSIS ── */}
            {activeTab === 'gap' && (
                <div className="space-y-5">
                    {!path ? (
                        <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-10 text-center">
                            <p className="text-light/40 text-sm">Selecciona un camino de carrera para ver el análisis de brecha.</p>
                            <button onClick={() => navigate('/elegir-camino')} className="mt-4 bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all">
                                Elegir camino →
                            </button>
                        </div>
                    ) : !gap ? (
                        <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-10 text-center">
                            <p className="text-light/40 text-sm">Sube tus archivos de ejercicios para que el sistema pueda calcular tu brecha de habilidades.</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary bar */}
                            <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-light mb-1">Análisis de Brecha — {path.jobTitle}</h2>
                                <p className="text-sm text-light/40 mb-5">Comparando tu nivel actual con los requisitos del mercado para {path.jobTitle}.</p>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4">
                                        <div className="text-3xl font-bold text-emerald-400">{gap.mastered.length}</div>
                                        <div className="text-xs text-light/40 mt-1">Dominadas ≥80%</div>
                                    </div>
                                    <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-4">
                                        <div className="text-3xl font-bold text-yellow-400">{gap.inProgress.length}</div>
                                        <div className="text-xs text-light/40 mt-1">En progreso</div>
                                    </div>
                                    <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
                                        <div className="text-3xl font-bold text-red-400">{gap.criticalGaps.length}</div>
                                        <div className="text-xs text-light/40 mt-1">Gaps críticos</div>
                                    </div>
                                </div>
                            </div>

                            {/* Mastered */}
                            {gap.mastered.length > 0 && (
                                <div className="bg-[#1a1a1a] border border-emerald-500/20 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">✅ Habilidades dominadas</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {gap.mastered.map(m => (
                                            <span key={m.skillId} className="bg-emerald-900/20 border border-emerald-500/30 text-emerald-300 text-sm px-3 py-1.5 rounded-full">
                                                {m.skillName} · {m.masteryPct}%
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* In progress */}
                            {gap.inProgress.length > 0 && (
                                <div className="bg-[#1a1a1a] border border-yellow-500/20 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4">📈 En progreso — refuerza estas</h3>
                                    <div className="space-y-3">
                                        {gap.inProgress.map(m => (
                                            <div key={m.skillId} className="flex items-center gap-4">
                                                <span className="text-sm text-light/70 w-52 flex-shrink-0 truncate">{m.skillName}</span>
                                                <div className="flex-1 h-2 bg-light/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${m.masteryPct}%` }} />
                                                </div>
                                                <span className="text-sm text-yellow-400 w-10 text-right flex-shrink-0">{m.masteryPct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Critical gaps */}
                            {gap.criticalGaps.length > 0 && (
                                <div className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4">🚨 Gaps críticos — necesitas aprender esto para trabajar como {path.jobTitle}</h3>
                                    <div className="space-y-3">
                                        {gap.criticalGaps.map(({ skill, mastery }) => (
                                            <div key={skill.id} className="flex items-center justify-between bg-[#0f0f0f] border border-red-500/10 rounded-xl px-4 py-3 gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-light/80">{skill.name}</p>
                                                    <p className="text-xs text-light/40 mt-0.5">{skill.description}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    <span className="text-sm font-bold text-red-400">{mastery ? `${mastery.masteryPct}%` : '0%'}</span>
                                                    <button
                                                        onClick={() => navigate(`/mentor?skillRef=${encodeURIComponent(skill.name)}&taskTitle=${encodeURIComponent(skill.name)}`)}
                                                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                                                    >
                                                        Practicar →
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Not started */}
                            {gap.notStarted.length > 0 && (
                                <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-light/40 uppercase tracking-wider mb-4">📚 Sin empezar ({gap.notStarted.length} habilidades)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {gap.notStarted.slice(0, 12).map(s => (
                                            <span key={s.id} className="bg-light/5 border border-light/10 text-light/40 text-xs px-2.5 py-1 rounded-full">{s.name}</span>
                                        ))}
                                        {gap.notStarted.length > 12 && (
                                            <span className="text-xs text-light/25 self-center">+{gap.notStarted.length - 12} más</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── TAB: ACTIVITY ── */}
            {activeTab === 'activity' && (
                <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-7">
                    <h2 className="text-lg font-bold text-light mb-1">Actividad reciente</h2>
                    <p className="text-sm text-light/40 mb-8">Retos completados y sesiones de mentor en los últimos 7 días.</p>

                    {recentActivity.every(d => d.challengesSolved + d.mentorSessions === 0) ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">🏃</div>
                            <p className="text-light/40 text-sm">Todavía no hay actividad registrada. ¡Completa tu primer reto!</p>
                        </div>
                    ) : (
                        <>
                            {/* Bar chart */}
                            <div className="flex items-end justify-between gap-3 h-36 mb-3">
                                {recentActivity.map(day => {
                                    const total = day.challengesSolved + day.mentorSessions;
                                    const heightPct = (total / maxActivity) * 100;
                                    const label = new Date(day.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' });
                                    return (
                                        <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
                                            <span className="text-xs text-light/40">{total > 0 ? total : ''}</span>
                                            <div className="w-full rounded-t-lg overflow-hidden" style={{ height: '96px', display: 'flex', alignItems: 'flex-end' }}>
                                                <div
                                                    className={`w-full rounded-t-lg transition-all duration-700 ${total > 0 ? 'bg-violet-500' : 'bg-light/5'}`}
                                                    style={{ height: total > 0 ? `${Math.max(heightPct, 8)}%` : '4px' }}
                                                />
                                            </div>
                                            <span className="text-xs text-light/40 capitalize">{label}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Skills worked this week */}
                            {recentActivity.some(d => d.skillsWorked.length > 0) && (
                                <div className="mt-6 border-t border-light/10 pt-5">
                                    <div className="text-xs text-light/40 uppercase tracking-wider mb-3">Habilidades practicadas esta semana</div>
                                    <div className="flex flex-wrap gap-2">
                                        {[...new Set(recentActivity.flatMap(d => d.skillsWorked))].map(s => (
                                            <span key={s} className="bg-violet-900/20 border border-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Tip */}
            {profile && (
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-5 flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-sm text-light/50">
                        El <strong className="text-light/70">Modo Mentor</strong> y los planes diarios ya usan este perfil. Cuando termines un ejercicio con el mentor o marques una tarea como hecha, el árbol de habilidades se actualiza automáticamente.
                    </p>
                </div>
            )}
        </div>
    );
};

export default KnowledgePage;
