import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSelectedPath } from '../../lib/selectedPath';
import { getSlotConceptsForPrompt } from '../../lib/masteryEngine';

type Difficulty = 'facil' | 'medio' | 'dificil';

const DIFF_CONFIG: Record<Difficulty, {
    label: string; title: string; desc: string;
    base: string; active: string;
}> = {
    facil: {
        label: '🟢 Fácil',
        title: 'Repaso',
        desc: 'Conceptos que ya dominas. Práctica ligera para que no se oxiden.',
        base: 'border-green-500/40 bg-green-900/10 text-green-300',
        active: 'border-green-400 bg-green-900/30 text-green-200 ring-1 ring-green-500/40',
    },
    medio: {
        label: '🟡 Medio',
        title: 'Práctica activa',
        desc: 'Conceptos en desarrollo. Consolida lo que estás aprendiendo.',
        base: 'border-yellow-500/40 bg-yellow-900/10 text-yellow-300',
        active: 'border-yellow-400 bg-yellow-900/30 text-yellow-200 ring-1 ring-yellow-500/40',
    },
    dificil: {
        label: '🔴 Difícil',
        title: 'Concepto nuevo',
        desc: 'Lo más reciente del currículo. Empuja tu límite actual.',
        base: 'border-red-500/40 bg-red-900/10 text-red-300',
        active: 'border-red-400 bg-red-900/30 text-red-200 ring-1 ring-red-500/40',
    },
};

const PracticePage: React.FC = () => {
    const navigate = useNavigate();
    const [difficulty, setDifficulty] = useState<Difficulty>('dificil');

    const pathId = loadSelectedPath();
    const slots = pathId ? getSlotConceptsForPrompt(pathId) : null;

    const conceptFor = (d: Difficulty): string | null => {
        if (!slots) return null;
        if (d === 'facil') return slots.slot1[0] ?? null;
        if (d === 'medio') return slots.slot2[0] ?? null;
        return slots.slot3[0] ?? null;
    };

    const handleGenerate = () => {
        const concept = conceptFor(difficulty);
        if (!concept) return;
        const params = new URLSearchParams({
            skillRef: concept,
            taskTitle: concept,
            practiceMode: 'true',
            practiceDifficulty: difficulty,
        });
        navigate(`/mentor?${params.toString()}`);
    };

    const currentConcept = conceptFor(difficulty);

    return (
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-light mb-1">⚡ Práctica libre</h1>
                <p className="text-light/50 text-sm">
                    El mentor genera un ejercicio personalizado según tu nivel actual.<br />
                    Elige la dificultad y te asigna el concepto más relevante de ese nivel.
                </p>
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

            {!pathId ? (
                <p className="text-center text-sm text-red-400 mt-4">Selecciona un camino de aprendizaje primero.</p>
            ) : (
                <button
                    onClick={handleGenerate}
                    disabled={!currentConcept}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base"
                >
                    ⚡ Generar ejercicio →
                </button>
            )}

            {currentConcept && (
                <p className="text-center text-xs text-light/30 mt-3">
                    Se generará un ejercicio sobre <span className="text-light/50 font-mono">{currentConcept}</span>
                </p>
            )}
        </div>
    );
};

export default PracticePage;
