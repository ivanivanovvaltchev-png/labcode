import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSelectedPath } from '../../lib/selectedPath';
import { CAREER_PATHS } from '../../data/careerPaths';
import { supabase } from '../../lib/supabaseClient';
import { pushToCloud, clearLocalData } from '../../lib/cloudSync';

interface NavigationProps {
    user?: string | null;
    xp?: number;
    userId?: string;
}

const pathColor: Record<string, { cls: string; bar: string }> = {
    'python-dev':       { cls: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/40', bar: 'bg-yellow-400' },
    'frontend-dev':     { cls: 'text-pink-400 bg-pink-900/20 border-pink-500/40',       bar: 'bg-pink-400'   },
    'fullstack-python': { cls: 'text-blue-400 bg-blue-900/20 border-blue-500/40',       bar: 'bg-blue-400'   },
    'master-complete':  { cls: 'text-violet-400 bg-violet-900/20 border-violet-500/40', bar: 'bg-violet-400' },
};

const Navigation: React.FC<NavigationProps> = ({ user = 'Estudiante', xp = 0, userId }) => {
    const navigate = useNavigate();
    const [signingOut, setSigningOut] = useState(false);
    const level = Math.floor(xp / 300) + 1;
    const levelProgress = xp % 300;
    const levelPct = Math.round((levelProgress / 300) * 100);

    const selectedPathId = loadSelectedPath();
    const activePath = selectedPathId ? CAREER_PATHS.find(p => p.id === selectedPathId) : null;
    const col = selectedPathId ? (pathColor[selectedPathId] ?? pathColor['master-complete']) : null;

    const handleSignOut = async () => {
        setSigningOut(true);
        if (userId) await pushToCloud(userId);
        clearLocalData();
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 w-full bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-light/10 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">

                {/* ── Left: Logo ── */}
                <div
                    className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 w-36"
                    onClick={() => navigate('/')}
                >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center text-white flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold tracking-wider text-light hidden sm:inline-block">LabCode</span>
                </div>

                {/* ── Center: Nav links ── */}
                <div className="flex-1 flex items-center justify-center gap-2">
                    {activePath && col ? (
                        <Link
                            to="/camino"
                            className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${col.cls}`}
                        >
                            <span>{activePath.emoji}</span>
                            <span className="hidden md:inline">{activePath.title}</span>
                            <span className="md:hidden">Camino</span>
                        </Link>
                    ) : (
                        <Link
                            to="/elegir-camino"
                            className="text-sm font-bold text-light/50 hover:text-light flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-light/10 hover:border-light/30 transition-colors"
                        >
                            🎯 <span className="hidden sm:inline">Elegir camino</span>
                        </Link>
                    )}

                    <Link to="/mentor" className="text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 bg-violet-900/20 px-3 py-1.5 rounded-lg border border-violet-500/30 transition-colors">
                        🧠 <span className="hidden lg:inline">Mentor</span>
                    </Link>

                    <Link to="/perfil-aprendizaje" className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors">
                        📂 <span className="hidden lg:inline">Mi Perfil</span>
                    </Link>

                    <Link to="/test-diario" className="text-sm font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors">
                        🧪 <span className="hidden lg:inline">Test</span>
                    </Link>

                    <Link to="/error-test" className="text-sm font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors">
                        ⚠️ <span className="hidden lg:inline">Errores</span>
                    </Link>
                </div>

                {/* ── Right: User + XP + Sign out ── */}
                <div className="flex items-center gap-2 flex-shrink-0 w-36 justify-end">
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-light/80 hidden sm:inline max-w-[80px] truncate">{user}</span>
                            <span className="text-xs text-light/40 hidden md:inline">Lvl {level}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-light/10 rounded-full overflow-hidden hidden md:block">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${col?.bar ?? 'bg-accent'}`}
                                    style={{ width: `${levelPct}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono text-accent">{xp} XP</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        title="Cerrar sesión"
                        className="text-light/30 hover:text-light/70 transition-colors disabled:opacity-30 flex-shrink-0 ml-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

            </div>
        </nav>
    );
};

export default Navigation;
