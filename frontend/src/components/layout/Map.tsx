import React from 'react';
import { useNavigate } from 'react-router-dom';

const MOD_DATA = [
    { id: 1, title: 'Introducción a la Informática', type: 'puzzle' },
    { id: 2, title: 'PSeInt', type: 'algorithm' },
    { id: 3, title: 'Linux y Terminal', type: 'system' },
    { id: 4, title: 'Python', type: 'backend' },
    { id: 5, title: 'Git & GitHub', type: 'tool' },
    { id: 6, title: 'HTML', type: 'frontend' },
    { id: 7, title: 'CSS', type: 'frontend' },
    { id: 8, title: 'JavaScript', type: 'frontend' },
    { id: 9, title: 'React', type: 'frontend' },
    { id: 10, title: 'Astro', type: 'frontend' },
    { id: 11, title: 'SQL', type: 'database' },
    { id: 12, title: 'Django', type: 'backend' },
    { id: 13, title: 'Node.js', type: 'backend' },
    { id: 14, title: 'Java & Spring', type: 'backend' },
    { id: 15, title: 'Rust', type: 'system' },
    { id: 16, title: 'Boss: Entrevistas', type: 'challenge' },
];

const Map: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen fade-in">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold tracking-tight text-light sm:text-5xl">
                    El Mapa de <span className="text-primary">Conocimiento</span>
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-light/70">
                    Selecciona cualquier módulo para practicar con el Asistente de IA.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                {MOD_DATA.map((mod) => (
                    <div
                        key={mod.id}
                        onClick={() => navigate(`/module/${mod.id}`)}
                        className="relative p-6 rounded-2xl border transition-all duration-300 bg-[#0f0f0f]/50 border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:-translate-y-2 cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-mono font-bold text-primary">
                                MOD {mod.id}
                            </span>
                            <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-light mb-2">{mod.title}</h3>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-light/5 text-light/70 border border-light/10 uppercase tracking-widest">
                            {mod.type}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Map;
