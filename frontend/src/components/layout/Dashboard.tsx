import React from 'react';

// Reusing MOD_DATA or declaring minimal version for badges
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

interface DashboardProps {
    user: string;
    xp: number;
    unlockedModules: number[];
    onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, xp, unlockedModules, onBack }) => {
    const level = Math.floor(xp / 100) + 1;
    const progressToNext = xp % 100;

    // A module is complete if the next one is unlocked.
    const completedCount = unlockedModules.length > 1 ? unlockedModules.slice(1).length : 0;
    const totalModules = MOD_DATA.length;

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-primary font-mono font-bold tracking-widest text-sm uppercase">Perfil del Alumno</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="col-span-1 md:col-span-2 bg-[#1e1e1e] border border-light/10 rounded-2xl p-8 shadow-xl flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-[#0f0f0f] border-4 border-primary flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <span className="text-4xl">👑</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-light">{user}</h2>
                        <div className="text-primary font-mono font-bold mt-1 text-sm bg-primary/10 inline-block px-3 py-1 rounded-full border border-primary/20">
                            NIVEL {level} (Developer en Ascenso)
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-xs font-mono text-light/50 mb-1">
                                <span>XP: {xp}</span>
                                <span>Siguiente Nivel: 100 XP</span>
                            </div>
                            <div className="w-full h-2 bg-[#0f0f0f] rounded-full overflow-hidden border border-light/10">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressToNext}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1e1e1e] border border-light/10 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold text-accent mb-2">{completedCount}/{totalModules}</div>
                    <div className="text-light/50 font-mono text-sm uppercase tracking-widest text-center">Módulos<br />Completados</div>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-light mb-6">Tus Insignias (Badges)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
                {MOD_DATA.map((mod) => {
                    const isCompleted = unlockedModules.includes(mod.id + 1);
                    return (
                        <div key={mod.id} className="flex flex-col items-center group">
                            <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all 
                  ${isCompleted
                                        ? 'bg-[#0f0f0f] border-2 border-accent text-accent shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-110'
                                        : 'bg-[#0f0f0f] border border-light/5 text-light/10 grayscale'}`}
                            >
                                <span className="text-2xl font-bold">{mod.id}</span>
                            </div>
                            <span className={`text-[10px] text-center uppercase tracking-wider ${isCompleted ? 'text-accent' : 'text-light/30'} opacity-0 group-hover:opacity-100 transition-opacity absolute mt-16 bg-black/80 px-2 py-1 z-10 rounded`}>{mod.title}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;
