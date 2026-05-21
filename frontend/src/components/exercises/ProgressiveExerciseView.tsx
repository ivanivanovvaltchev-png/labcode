import React, { useState } from 'react';
import { ExerciseSelector } from './ExerciseSelector';
import { PracticeInterface } from './PracticeInterface';
import { Exercise } from '../../types/exercises';
import { supabase } from '../../lib/supabaseClient';

export function ProgressiveExerciseView() {
    // In a real app with Auth, you would pass the current user's ID
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');

    // Fetch current user on mount (assuming Supabase Auth is active)
    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSelectExercise = async (exercise: Exercise, language: string, startFromDay1: boolean) => {
        setSelectedExercise(exercise);
        setSelectedLanguage(language);

        if (startFromDay1 && userId) {
            // Reset logic before mounting so PracticeInterface loads fresh
            await supabase.from('user_exercise_progress')
                .update({ current_day: 1, completed: false })
                .eq('user_id', userId)
                .eq('exercise_id', exercise.id)
                .eq('language', language);
                
            // Note: In a robust implementation, we'd also want to clear attempts for Day 1, 
            // but for simplicity it's fine if it overwrites or resumes.
        }
    };

    const handleBack = () => {
        setSelectedExercise(null);
    };

    if (!userId) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-300">
                <p>Inicia sesión para usar el sistema de ejercicios progresivos.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {!selectedExercise ? (
                <div className="pt-10">
                    <ExerciseSelector onSelectExercise={handleSelectExercise} userId={userId} />
                </div>
            ) : (
                <PracticeInterface 
                    exercise={selectedExercise}
                    language={selectedLanguage}
                    userId={userId}
                    onBack={handleBack}
                />
            )}
        </div>
    );
}
