import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, EXERCISE_CATEGORIES, Exercise, UserProgress } from '../../types/exercises';
import { EXERCISE_CATALOG } from '../../data/exercises';
import { supabase } from '../../lib/supabaseClient';

interface ExerciseSelectorProps {
    onSelectExercise: (exercise: Exercise, language: string, startFromDay1: boolean) => void;
    userId?: string;
}

export function ExerciseSelector({ onSelectExercise, userId }: ExerciseSelectorProps) {
    const [selectedLang, setSelectedLang] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [ongoingExercises, setOngoingExercises] = useState<UserProgress[]>([]);

    React.useEffect(() => {
        if (!userId) return;
        const fetchOngoing = async () => {
            const { data } = await supabase
                .from('user_exercise_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('completed', false);
            if (data) {
                setOngoingExercises(data as UserProgress[]);
            }
        };
        fetchOngoing();
    }, [userId]);

    const getExerciseDetails = (exId: string) => EXERCISE_CATALOG.find(e => e.id === exId);

    const filteredExercises = EXERCISE_CATALOG.filter(ex => 
        selectedCategory ? ex.category === selectedCategory : true
    );

    const handleSelectExercise = (exercise: Exercise) => {
        if (!selectedLang) {
            alert("Por favor, selecciona un lenguaje primero.");
            return;
        }

        // Simular o comprobar en DB si ya tiene progreso.
        // Aquí por simplicidad le preguntamos directamente, el hook se encargará de resetear si elige "Empezar desde el día 1"
        const startFromDay1 = window.confirm(`¿Quieres empezar ${exercise.title} desde el Día 1?\n\nAceptar = Día 1. Cancelar = Continuar desde donde lo dejaste.`);
        onSelectExercise(exercise, selectedLang, startFromDay1);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 bg-zinc-900 text-white rounded-xl shadow-2xl">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Ejercicios Progresivos
            </h1>

            {/* Continuar donde lo dejaste */}
            {ongoingExercises.length > 0 && (
                <section className="space-y-4 mb-8">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <span>⏳</span> Continuar donde lo dejaste
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ongoingExercises.map(prog => {
                            const ex = getExerciseDetails(prog.exercise_id);
                            if (!ex) return null;
                            const langName = SUPPORTED_LANGUAGES.find(l => l.id === prog.language)?.name || prog.language;
                            const percentage = Math.round(((prog.current_day - 1) / ex.days.length) * 100);
                            
                            return (
                                <div key={prog.id} className="p-6 rounded-xl bg-zinc-800/80 border border-purple-500/30 hover:border-purple-500 transition-colors flex flex-col h-full relative overflow-hidden shadow-lg shadow-purple-900/10">
                                    <div className="absolute top-0 left-0 h-1 bg-purple-500 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                    <h3 className="text-lg font-bold mb-1 text-white">{ex.title}</h3>
                                    <p className="text-sm text-purple-300 mb-4 font-mono">{langName} • Día {prog.current_day} de {ex.days.length}</p>
                                    <div className="mt-auto flex justify-end">
                                        <button
                                            onClick={() => onSelectExercise(ex, prog.language, false)}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium shadow-md transition-all active:scale-95"
                                        >
                                            Continuar ➔
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Select Language */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Elige tu lenguaje o entorno</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => setSelectedLang(lang.id)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                selectedLang === lang.id 
                                    ? 'border-blue-500 bg-blue-500/20' 
                                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800'
                            }`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* Select Category */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Elige una categoría</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedCategory === '' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                        Todas
                    </button>
                    {EXERCISE_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* Select Exercise */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Selecciona tu reto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredExercises.map(ex => (
                        <div key={ex.id} className="p-6 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-purple-500 transition-colors flex flex-col h-full">
                            <h3 className="text-lg font-bold mb-2">{ex.title}</h3>
                            <p className="text-sm text-zinc-400 mb-4 flex-grow">{ex.description}</p>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="text-xs px-2 py-1 bg-zinc-700 rounded-md text-zinc-300">{ex.days.length} días/pasos</span>
                                <button
                                    onClick={() => handleSelectExercise(ex)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium shadow-lg transition-transform active:scale-95"
                                >
                                    ¡Empezar!
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
