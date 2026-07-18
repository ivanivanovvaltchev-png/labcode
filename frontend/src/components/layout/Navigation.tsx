import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSelectedPath, loadSelfAssessments } from '../../lib/selectedPath';
import { CAREER_PATHS, calculateProgress } from '../../data/careerPaths';
import { loadKnowledgeProfile } from '../../lib/knowledgeProfile';
import { loadMetrics } from '../../lib/learningMetrics';
import { supabase } from '../../lib/supabaseClient';
import { pushToCloud, clearLocalData } from '../../lib/cloudSync';

interface NavigationProps {
    user?: string | null;
    xp?: number;
    userId?: string;
}

const pathColor: Record<string, { cls: string; bar: string }> = {
    'python-junior': { cls: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/40', bar: 'bg-yellow-400' },
    'fullstack-dev': { cls: 'text-violet-400 bg-violet-900/20 border-violet-500/40', bar: 'bg-violet-400' },
};

// XP scale: 0 XP = 0% curriculum, 10 000 XP = 100% curriculum.
// Each level = 1 000 XP = 10% of the curriculum completed.
const MAX_XP = 10_000;
const XP_PER_LEVEL = 1_000;

const Navigation: React.FC<NavigationProps> = ({ user = 'Estudiante', userId }) => {
    const navigate = useNavigate();
    const [signingOut, setSigningOut] = useState(false);
    const [mentorOpen, setMentorOpen] = useState(false);
    const mentorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (mentorRef.current && !mentorRef.current.contains(e.target as Node)) {
                setMentorOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Compute real curriculum progress for XP display
    const selectedPathId = loadSelectedPath();
    const activePath = selectedPathId ? CAREER_PATHS.find(p => p.id === selectedPathId) : null;

    let curriculumPct = 0;
    if (activePath && selectedPathId) {
        const profile = loadKnowledgeProfile();
        const selfAssessments = loadSelfAssessments(selectedPathId);
        const metrics = loadMetrics(selectedPathId);
        const { pct } = calculateProgress(
            activePath,
            profile?.concepts ?? [],
            selfAssessments,
            metrics.skillMastery
        );
        curriculumPct = pct;
    }

    const xp = Math.round(curriculumPct * (MAX_XP / 100));  // 0–10 000
    const level = Math.min(10, Math.floor(xp / XP_PER_LEVEL) + 1);


    const col = selectedPathId ? (pathColor[selectedPathId] ?? pathColor['fullstack-dev']) : null;

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

                    <div className="relative" ref={mentorRef}>
                        <button
                            onClick={() => setMentorOpen(v => !v)}
                            className="text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 bg-violet-900/20 px-3 py-1.5 rounded-lg border border-violet-500/30 transition-colors"
                        >
                            🧠 <span className="hidden lg:inline">Mentor</span>
                            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {mentorOpen && (
                            <div className="absolute top-full mt-1.5 left-0 min-w-[200px] bg-[#1a1a1a] border border-violet-500/30 rounded-xl overflow-hidden shadow-2xl z-50">
                                <Link
                                    to="/mentor"
                                    onClick={() => setMentorOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-violet-300 hover:bg-violet-900/30 transition-colors"
                                >
                                    <span>🧠</span>
                                    <div>
                                        <div className="font-semibold">Ayuda con ejercicio</div>
                                        <div className="text-xs text-violet-300/50">El mentor te guía paso a paso</div>
                                    </div>
                                </Link>
                                <div className="border-t border-violet-500/20" />
                                <Link
                                    to="/practica"
                                    onClick={() => setMentorOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-violet-300 hover:bg-violet-900/30 transition-colors"
                                >
                                    <span>⚡</span>
                                    <div>
                                        <div className="font-semibold">Práctica libre</div>
                                        <div className="text-xs text-violet-300/50">Ejercicios según tu nivel actual</div>
                                    </div>
                                </Link>
                                <div className="border-t border-violet-500/20" />
                                <Link
                                    to="/mejora"
                                    onClick={() => setMentorOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-violet-300 hover:bg-violet-900/30 transition-colors"
                                >
                                    <span>🎯</span>
                                    <div>
                                        <div className="font-semibold">Mejora</div>
                                        <div className="text-xs text-violet-300/50">Centrarte en un PDF/tema concreto</div>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>

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
                            <div className="w-16 h-1.5 bg-light/10 rounded-full overflow-hidden hidden md:block" title={`${curriculumPct}% del camino completado`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${col?.bar ?? 'bg-accent'}`}
                                    style={{ width: `${curriculumPct}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono text-accent whitespace-nowrap" title={`${curriculumPct}% curriculum → ${xp} / ${MAX_XP} XP`}>
                                {xp.toLocaleString()} XP
                            </span>
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
