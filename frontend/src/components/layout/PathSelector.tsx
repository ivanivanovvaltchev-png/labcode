import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CAREER_PATHS, CareerPath } from '../../data/careerPaths';
import { saveSelectedPath } from '../../lib/selectedPath';

const colorMap: Record<string, { border: string; glow: string; badge: string; btn: string; text: string }> = {
    yellow: {
        border: 'border-yellow-500/30 hover:border-yellow-500/70',
        glow: 'hover:shadow-[0_0_40px_rgba(234,179,8,0.2)]',
        badge: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
        btn: 'bg-yellow-500 hover:bg-yellow-400',
        text: 'text-yellow-400',
    },
    pink: {
        border: 'border-pink-500/30 hover:border-pink-500/70',
        glow: 'hover:shadow-[0_0_40px_rgba(236,72,153,0.2)]',
        badge: 'bg-pink-900/30 text-pink-400 border-pink-500/30',
        btn: 'bg-pink-500 hover:bg-pink-400',
        text: 'text-pink-400',
    },
    blue: {
        border: 'border-blue-500/30 hover:border-blue-500/70',
        glow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]',
        badge: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
        btn: 'bg-blue-500 hover:bg-blue-400',
        text: 'text-blue-400',
    },
    violet: {
        border: 'border-violet-500/30 hover:border-violet-500/70',
        glow: 'hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]',
        badge: 'bg-violet-900/30 text-violet-400 border-violet-500/30',
        btn: 'bg-violet-500 hover:bg-violet-400',
        text: 'text-violet-400',
    },
};

const PathCard: React.FC<{ path: CareerPath; onSelect: (id: string) => void }> = ({ path, onSelect }) => {
    const c = colorMap[path.colorClass];
    const criticalCount = path.skills.filter(s => s.importance === 'critical').length;
    return (
        <div
            className={`bg-[#1a1a1a] border rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 cursor-pointer group ${c.border} ${c.glow}`}
            onClick={() => onSelect(path.id)}
        >
            <div className="flex items-start justify-between">
                <span className="text-5xl">{path.emoji}</span>
                <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
                        {path.estimatedMonths}
                    </span>
                    <span className="text-xs text-light/30">{path.salaryRange}</span>
                </div>
            </div>

            <div>
                <h2 className={`text-xl font-bold mb-1 ${c.text}`}>{path.title}</h2>
                <p className="text-sm text-light/50 leading-relaxed">{path.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {path.jobExamples.map(j => (
                    <span key={j} className="text-xs bg-light/5 border border-light/10 text-light/50 px-2 py-0.5 rounded-full">
                        {j}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-light/10">
                <span className="text-xs text-light/30">{criticalCount} habilidades clave</span>
                <button
                    className={`${c.btn} text-white text-sm font-bold px-5 py-2 rounded-xl transition-all`}
                    onClick={(e) => { e.stopPropagation(); onSelect(path.id); }}
                >
                    Elegir este camino →
                </button>
            </div>
        </div>
    );
};

const PathSelector: React.FC<{ isChanging?: boolean }> = ({ isChanging = false }) => {
    const navigate = useNavigate();

    const handleSelect = (pathId: string) => {
        saveSelectedPath(pathId);
        navigate('/camino');
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {isChanging && (
                <button onClick={() => navigate('/camino')} className="text-light/40 hover:text-light text-sm mb-6 transition-colors">
                    ← Volver
                </button>
            )}

            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-light/5 border border-light/10 px-4 py-1.5 rounded-full text-xs text-light/50 mb-4">
                    🎯 Cada camino es un objetivo laboral real
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-light mb-3">
                    ¿Cuál es tu objetivo?
                </h1>
                <p className="text-light/50 max-w-xl mx-auto text-sm">
                    Elige el empleo al que quieres llegar. LabCode se configurará para prepararte exactamente para ese camino, basándose en lo que ya sabes y lo que te falta.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {CAREER_PATHS.map(path => (
                    <PathCard key={path.id} path={path} onSelect={handleSelect} />
                ))}
            </div>

            <p className="text-center text-xs text-light/30 mt-8">
                Puedes cambiar de camino en cualquier momento desde tu dashboard.
            </p>
        </div>
    );
};

export default PathSelector;
