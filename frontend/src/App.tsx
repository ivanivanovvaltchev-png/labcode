import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/layout/Dashboard';
import Map from './components/layout/Map';
import AIPracticePage from './components/modules/AIPracticePage';
import ErrorTestPage from './components/modules/ErrorTestPage';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { ProgressiveExerciseView } from './components/exercises/ProgressiveExerciseView';
import MentorPage from './components/modules/MentorPage';
import PracticePage from './components/modules/PracticePage';
import ImprovePage from './components/modules/ImprovePage';
import KnowledgePage from './components/modules/KnowledgePage';
import DailyTestPage from './components/modules/DailyTestPage';
import PathSelector from './components/layout/PathSelector';
import PathDashboard from './components/modules/PathDashboard';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import AuthPage from './components/auth/AuthPage';
import { loadSelectedPath } from './lib/selectedPath';
import { isOnboardingComplete, getTotalXP } from './lib/userProgress';
import { pullFromCloud, pushToCloud, clearLocalData } from './lib/cloudSync';

// Smart home: shows PathSelector or PathDashboard
const SmartHome: React.FC = () => {
    const pathId = loadSelectedPath();
    if (!pathId) return <PathSelector />;
    if (!isOnboardingComplete(pathId)) return <OnboardingFlow pathId={pathId} />;
    return <PathDashboard />;
};

// Onboarding guard for explicit /onboarding route
const OnboardingRoute: React.FC = () => {
    const pathId = loadSelectedPath();
    if (!pathId) return <Navigate to="/elegir-camino" replace />;
    return <OnboardingFlow pathId={pathId} />;
};

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [xp, setXp] = useState(getTotalXP());
    const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const userIdRef = useRef<string | null>(null);

    // Push to cloud periodically and on unload
    const startSyncInterval = (userId: string) => {
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = setInterval(() => pushToCloud(userId), 10_000);

        const onUnload = () => pushToCloud(userId);
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    };

    useEffect(() => {
        let cleanupUnload: (() => void) | undefined;

        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setIsLoading(false);
            if (s) {
                userIdRef.current = s.user.id;
                // Pull from cloud in background — don't block the UI
                pullFromCloud(s.user.id).then(() => setXp(getTotalXP()));
                cleanupUnload = startSyncInterval(s.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            if (s) {
                userIdRef.current = s.user.id;
                pullFromCloud(s.user.id).then(() => setXp(getTotalXP()));
                cleanupUnload = startSyncInterval(s.user.id);
            } else {
                // Signed out — push latest data FIRST, then clear local storage
                if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
                const uid = userIdRef.current;
                if (uid) {
                    pushToCloud(uid).finally(() => {
                        clearLocalData();
                        userIdRef.current = null;
                    });
                } else {
                    clearLocalData();
                }
            }
        });

        // Refresh XP (same-tab localStorage updates)
        const onStorage = () => setXp(getTotalXP());
        window.addEventListener('storage', onStorage);

        // Immediate cloud push when progress is saved (plan generated, task completed, etc.)
        const onProgressSaved = () => {
            supabase.auth.getSession().then(({ data: { session: cur } }) => {
                if (cur) pushToCloud(cur.user.id);
            });
        };
        window.addEventListener('labcode:progress_saved', onProgressSaved);
        const xpInterval = setInterval(() => setXp(getTotalXP()), 3000);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('labcode:progress_saved', onProgressSaved);
            clearInterval(xpInterval);
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
            cleanupUnload?.();
        };
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center animate-pulse">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <span className="text-white/40 font-mono text-sm">Cargando LabCode…</span>
                </div>
            </div>
        );
    }

    // Not logged in → show auth page
    if (!session) {
        return <AuthPage />;
    }

    const user = session.user.email?.split('@')[0] ?? 'Estudiante';

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-[#0f0f0f] text-light font-sans selection:bg-primary/30 flex flex-col">
                <Navigation user={user} xp={xp} userId={session.user.id} />

                <main className="pt-16 flex-1 relative z-10 w-full">
                    <Routes>
                        <Route path="/" element={<SmartHome />} />
                        <Route path="/camino" element={<PathDashboard />} />
                        <Route path="/elegir-camino" element={<PathSelector isChanging />} />
                        <Route path="/onboarding" element={<OnboardingRoute />} />
                        <Route path="/modulos" element={<Map />} />
                        <Route path="/dashboard" element={<Dashboard user={user} xp={xp} unlockedModules={Array.from({ length: 16 }, (_, i) => i + 1)} onBack={() => { }} />} />
                        <Route path="/module/:id" element={<AIPracticePage />} />
                        <Route path="/error-test" element={<ErrorTestPage />} />
                        <Route path="/ejercicios-progresivos" element={<ProgressiveExerciseView />} />
                        <Route path="/mentor" element={<MentorPage />} />
                        <Route path="/practica" element={<PracticePage />} />
                        <Route path="/mejora" element={<ImprovePage />} />
                        <Route path="/perfil-aprendizaje" element={<KnowledgePage />} />
                        <Route path="/test-diario" element={<DailyTestPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
