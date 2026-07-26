import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSelectedPath } from '../../lib/selectedPath';
import { mintSessionId } from '../../lib/sessionKey';
import {
    loadWeeklyPlan,
    clearWeeklyPlan,
    getTodayCycleDay,
    isDayDoneToday,
    markDayCompletedToday,
    WeeklyPlanDay,
} from '../../lib/weeklyPlan';

type Difficulty = 'facil' | 'medio' | 'dificil';

const WeeklyPlanPage: React.FC = () => {
    const navigate = useNavigate();
    const pathId = loadSelectedPath();
    const [plan, setPlan] = useState(() => (pathId ? loadWeeklyPlan(pathId) : null));
    const [difficulty, setDifficulty] = useState<Difficulty>('facil');

    if (!pathId) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-24 pb-12 text-center">
                <p className="text-sm text-red-400">Selecciona un camino de aprendizaje primero.</p>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-24 pb-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl mb-4">📅</div>
                <h1 className="text-2xl font-bold text-light mb-2">Plan Semanal</h1>
                <p className="text-light/50 text-sm mb-6">
                    Todavía no tienes un plan cíclico activo. Habla con Maestro sobre lo que quieres reforzar
                    y pídele que te cree un plan — luego actívalo desde ahí y aparecerá aquí.
                </p>
                <button
                    onClick={() => navigate('/maestro')}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                    🎓 Ir a Maestro
                </button>
            </div>
        );
    }

    const todayDay = getTodayCycleDay(plan);
    const doneToday = isDayDoneToday(plan, todayDay.id);

    const descFor = (d: Difficulty, day: WeeklyPlanDay): string => {
        if (d === 'dificil') return day.descriptionDificil ?? day.description;
        if (d === 'medio') return day.descriptionMedio ?? day.description;
        return day.description;
    };

    const handlePracticeNow = () => {
        const params = new URLSearchParams({
            taskTitle: todayDay.theme,
            taskDesc: descFor(difficulty, todayDay),
            skillRef: todayDay.skillRef,
            taskDifficulty: difficulty,
            taskDescFacil: todayDay.description,
            s: mintSessionId(),
        });
        if (todayDay.descriptionMedio) params.set('taskDescMedio', todayDay.descriptionMedio);
        if (todayDay.descriptionDificil) params.set('taskDescDificil', todayDay.descriptionDificil);
        navigate(`/mentor?${params.toString()}`);
    };

    const handleMarkDone = () => {
        if (!pathId) return;
        const updated = markDayCompletedToday(pathId, plan, todayDay.id);
        setPlan(updated);
    };

    const handleDiscardPlan = () => {
        if (!pathId) return;
        if (!window.confirm('¿Desactivar el plan semanal actual? Podrás crear uno nuevo desde Maestro cuando quieras.')) return;
        clearWeeklyPlan(pathId);
        setPlan(null);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-light mb-1">📅 {plan.title}</h1>
                    <p className="text-light/40 text-sm">Ciclo de {plan.days.length} días — se repite automáticamente. Hoy toca el Día {todayDay.dayNumber}.</p>
                </div>
                <button onClick={handleDiscardPlan} className="text-xs text-light/30 hover:text-red-400 transition-colors whitespace-nowrap">
                    Desactivar plan
                </button>
            </div>

            <div className="bg-[#1a1a1a] border border-violet-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-violet-300 uppercase tracking-wide">Hoy · Día {todayDay.dayNumber}</p>
                    {doneToday && <span className="text-xs text-emerald-400 font-semibold">✅ Hecho hoy</span>}
                </div>
                <h2 className="text-lg font-bold text-light mb-3">{todayDay.theme}</h2>

                <div className="flex gap-2 mb-4">
                    {(['facil', 'medio', 'dificil'] as Difficulty[]).map(d => (
                        <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                difficulty === d
                                    ? 'border-violet-400 bg-violet-900/30 text-violet-200'
                                    : 'border-light/10 text-light/40 hover:text-light/70'
                            }`}
                        >
                            {d === 'facil' ? '🟢 Fácil' : d === 'medio' ? '🟡 Medio' : '🔴 Difícil'}
                        </button>
                    ))}
                </div>

                <p className="text-sm text-light/60 leading-relaxed whitespace-pre-wrap mb-5">{descFor(difficulty, todayDay)}</p>

                <div className="flex gap-2">
                    <button
                        onClick={handlePracticeNow}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                    >
                        ▶ Practicar ahora
                    </button>
                    <button
                        onClick={handleMarkDone}
                        disabled={doneToday}
                        className="text-sm border border-light/10 text-light/60 hover:text-light/90 disabled:opacity-40 px-4 py-2.5 rounded-xl transition-colors"
                    >
                        ✅ Marcar como hecho hoy
                    </button>
                </div>
            </div>

            <p className="text-xs font-bold text-light/40 uppercase tracking-wide mb-3">Todos los días del ciclo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plan.days.map(day => (
                    <div
                        key={day.id}
                        className={`rounded-xl p-3 border ${
                            day.id === todayDay.id ? 'border-violet-400/50 bg-violet-900/10' : 'border-light/10 bg-[#0f0f0f]'
                        }`}
                    >
                        <p className="text-xs font-bold text-light/70 mb-1">
                            Día {day.dayNumber} · {day.theme} {day.id === todayDay.id && <span className="text-violet-300">(hoy)</span>}
                        </p>
                        <p className="text-xs text-light/40 leading-relaxed line-clamp-3">{day.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeeklyPlanPage;
