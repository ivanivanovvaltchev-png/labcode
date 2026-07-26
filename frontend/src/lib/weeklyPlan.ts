import { todayString } from './userProgress';

/**
 * A WEEKLY PLAN is a cyclic, multi-day training routine — the kind of thing
 * Maestro designs when the student asks "créame un plan diario/semanal para
 * reforzar lo más importante" instead of just "dame un ejercicio para hoy".
 * Unlike the single-day DailyPlan (userProgress.ts, "Tu entrenamiento de
 * hoy"), this repeats in a fixed cycle of N days (e.g. 4-5) that the system
 * rotates through automatically based on the calendar date — the student
 * never has to pick which day it is, they just open "Plan Semanal" and see
 * today's exercise for the cycle.
 */

export interface WeeklyPlanDay {
    id: string;
    /** 1-based position in the cycle (Día 1, Día 2, …). */
    dayNumber: number;
    /** Short theme, e.g. "El procesador de datos del día". */
    theme: string;
    /** Fácil version: full step-by-step statement. */
    description: string;
    descriptionMedio?: string;
    descriptionDificil?: string;
    /** Real concept name(s) this day reinforces — must match the student's actual Mejora concepts. */
    skillRef: string;
}

export interface WeeklyPlan {
    title: string;
    createdAt: number;
    /** YYYY-MM-DD the cycle started — day 1 of the rotation. */
    startDate: string;
    days: WeeklyPlanDay[];
    /** dayId → list of YYYY-MM-DD dates it was marked done (repeats each cycle). */
    completedDates: Record<string, string[]>;
}

const KEY_PREFIX = 'labcode_weekly_plan_';

export function loadWeeklyPlan(pathId: string): WeeklyPlan | null {
    try {
        const raw = localStorage.getItem(KEY_PREFIX + pathId);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveWeeklyPlan(pathId: string, plan: WeeklyPlan): void {
    localStorage.setItem(KEY_PREFIX + pathId, JSON.stringify(plan));
}

export function clearWeeklyPlan(pathId: string): void {
    localStorage.removeItem(KEY_PREFIX + pathId);
}

/** Which day of the cycle corresponds to today's calendar date. */
export function getTodayCycleDay(plan: WeeklyPlan): WeeklyPlanDay {
    const start = new Date(plan.startDate + 'T00:00:00');
    const today = new Date(todayString() + 'T00:00:00');
    const diffDays = Math.round((today.getTime() - start.getTime()) / 86_400_000);
    const n = plan.days.length;
    const idx = ((diffDays % n) + n) % n;
    return plan.days[idx];
}

export function isDayDoneToday(plan: WeeklyPlan, dayId: string): boolean {
    return (plan.completedDates[dayId] ?? []).includes(todayString());
}

export function markDayCompletedToday(pathId: string, plan: WeeklyPlan, dayId: string): WeeklyPlan {
    const today = todayString();
    const existing = plan.completedDates[dayId] ?? [];
    if (existing.includes(today)) return plan;
    const updated: WeeklyPlan = {
        ...plan,
        completedDates: { ...plan.completedDates, [dayId]: [...existing, today] },
    };
    saveWeeklyPlan(pathId, updated);
    return updated;
}
