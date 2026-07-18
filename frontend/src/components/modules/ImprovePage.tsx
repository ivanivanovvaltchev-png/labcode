import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSelectedPath } from '../../lib/selectedPath';
import { PRACTICE_PATHS } from '../../data/practicePaths';
import { getPracticePathProgress, getFocusedConceptsForPrompt } from '../../lib/masteryEngine';

type Difficulty = 'facil' | 'medio' | 'dificil';

const DIFF_CONFIG: Record<Difficulty, { label: string; title: string; desc: string; base: string; active: string }> = {
    facil: {
        label: '🟢 Fácil',
        title: 'Repaso',
        desc: 'El concepto de este PDF que mejor dominas ahora mismo.',
        base: 'border-green-500/40 bg-green-900/10 text-green-300',
        active: 'border-green-400 bg-green-900/30 text-green-200 ring-1 ring-green-500/40',
    },
    medio: {
        label: '🟡 Medio',
        title: 'Práctica activa',
        desc: 'Un concepto de este PDF que ya conoces pero necesita repaso.',
        base: 'border-yellow-500/40 bg-yellow-900/10 text-yellow-300',
        active: 'border-yellow-400 bg-yellow-900/30 text-yellow-200 ring-1 ring-yellow-500/40',
    },
    dificil: {
        label: '🔴 Difícil',
        title: 'Lo que menos dominas',
        desc: 'El concepto de este PDF donde más flojeas ahora mismo.',
        base: 'border-red-500/40 bg-red-900/10 text-red-300',
        active: 'border-red-400 bg-red-900/30 text-red-200 ring-1 ring-red-500/40',
    },
};

function aggregateMastery(pathId: string | null, practicePathId: string): number {
    if (!pathId) return 0;
    const progress = getPracticePathProgress(pathId, practicePathId);
    if (progress.length === 0) return 0;
    return Math.round(progress.reduce((s, c) => s + c.masteryPct, 0) / progress.length);
}

const ImprovePage: React.FC = () => {
    const navigate = useNavigate();
    const pathId = loadSelectedPath();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>('dificil');

    const selectedPath = selectedId ? PRACTICE_PATHS.find(p => p.id === selectedId) ?? null : null;
    const focused = pathId && selectedId ? getFocusedConceptsForPrompt(pathId, selectedId) : null;

    const conceptFor = (d: Difficulty): string | null => {
        if (!focused) return null;
        return focused[d];
    };

    const handleGenerate = () => {
        if (!selectedPath) return;
        const concept = conceptFor(difficulty);
        if (!concept) return;
        const params = new URLSearchParams({
            skillRef: concept,
            taskTitle: concept,
            practiceMode: 'true',
            practiceDifficulty: difficulty,
            focusPathId: selectedPath.id,
        });
        navigate(`/mentor?${params.toString()}`);
    };

    const currentConcept = conceptFor(difficulty);

    if (!pathId) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-24 pb-12 text-center">
                <p className="text-sm text-red-400">Selecciona un camino de aprendizaje primero.</p>
            </div>
        );
    }

    // ── Selection screen: choose which PDF/clase to focus on ──────────────────
    if (!selectedPath) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-light mb-1">🎯 Mejora</h1>
                    <p className="text-light/50 text-sm">
                        Elige un tema concreto para centrarte en él — el mentor practicará
                        solo con el contenido real de ese PDF hasta que lo domines.
                    </p>
                </div>

                <div className="space-y-3">
                    {PRACTICE_PATHS.map(path => {
                        const pct = aggregateMastery(pathId, path.id);
                        return (
                            <button
                                key={path.id}
                                onClick={() => { setSelectedId(path.id); setDifficulty('dificil'); }}
                                className="w-full text-left border border-light/10 hover:border-violet-500/40 bg-[#1a1a1a] hover:bg-violet-900/10 rounded-xl p-4 transition-all"
                            >
                                <div className="flex items-center justify-between gap-3 mb-1">
                                    <div className="font-bold text-sm text-light flex items-center gap-2">
                                        <span>{path.emoji}</span> {path.title}
                                    </div>
                                    <span className="text-xs font-mono text-light/40 flex-shrink-0">{pct}%</span>
                                </div>
                                <p className="text-xs text-light/40 mb-2 leading-relaxed">{path.description}</p>
                                <div className="w-full h-1.5 bg-light/10 rounded-full overflow-hidden mb-1.5">
                                    <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-xs text-light/25 truncate">📄 {path.sourceFile}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Focused practice screen for the chosen PracticePath ────────────────────
    return (
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
            <button
                onClick={() => setSelectedId(null)}
                className="text-xs text-light/40 hover:text-light/70 mb-4 flex items-center gap-1"
            >
                ← Volver a los caminos
            </button>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-light mb-1">{selectedPath.emoji} {selectedPath.title}</h1>
                <p className="text-light/50 text-sm">{selectedPath.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {(Object.entries(DIFF_CONFIG) as [Difficulty, typeof DIFF_CONFIG.facil][]).map(([d, cfg]) => {
                    const concept = conceptFor(d);
                    const isActive = difficulty === d;
                    return (
                        <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`rounded-xl border p-4 text-left transition-all ${isActive ? cfg.active : cfg.base + ' hover:opacity-80'}`}
                        >
                            <div className="font-bold text-sm mb-0.5">{cfg.label} — {cfg.title}</div>
                            <div className="text-xs opacity-60 mb-3 leading-relaxed">{cfg.desc}</div>
                            <div className="text-xs font-mono bg-black/30 rounded px-2 py-1 truncate opacity-80">
                                {concept ?? '—'}
                            </div>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={handleGenerate}
                disabled={!currentConcept}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base"
            >
                🎯 Practicar este tema →
            </button>

            {currentConcept && (
                <p className="text-center text-xs text-light/30 mt-3">
                    Se generará un ejercicio sobre <span className="text-light/50 font-mono">{currentConcept}</span>,
                    usando solo el contenido de <span className="text-light/50">{selectedPath.sourceFile}</span>.
                </p>
            )}
        </div>
    );
};

export default ImprovePage;
