import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Exercise, ExerciseDay, UserProgress, UserAttempt } from '../types/exercises';
import { evaluateProgressiveCode, generateExerciseVariant, getProgressiveHint, getProgressiveSolution, getProgressiveChatResponse, getCompleteExerciseSolution, getDoubtChatResponse } from '../ai/progressiveAgent';

interface UseProgressiveExerciseProps {
    exercise: Exercise;
    language: string;
    userId: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function useProgressiveExercise({ exercise, language, userId }: UseProgressiveExerciseProps) {
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [attempt, setAttempt] = useState<UserAttempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [currentCode, setCurrentCode] = useState('');
    const [currentDayStr, setCurrentDayStr] = useState<ExerciseDay>(exercise.days[0]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatting, setIsChatting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [doubtChatMessages, setDoubtChatMessages] = useState<ChatMessage[]>([]);
    const [isDoubtChatting, setIsDoubtChatting] = useState(false);

    const loadProgress = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        
        try {
            // Load main progress
            const { data: progData, error: progErr } = await supabase
                .from('user_exercise_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('exercise_id', exercise.id)
                .eq('language', language)
                .single();

            let currentProgId;
            let dayToLoad = 1;

            if (progErr && progErr.code === 'PGRST116') {
                // Not found, create it
                const { data: newProg, error: insertProgErr } = await supabase
                    .from('user_exercise_progress')
                    .insert({ user_id: userId, exercise_id: exercise.id, language, current_day: 1 })
                    .select()
                    .single();
                
                if (insertProgErr) throw insertProgErr;
                setProgress(newProg as UserProgress);
                currentProgId = newProg.id;
            } else if (progData) {
                setProgress(progData as UserProgress);
                currentProgId = progData.id;
                dayToLoad = progData.current_day;
            }

            // Set the day object
            const dayObj = exercise.days.find(d => d.dayNumber === dayToLoad) || exercise.days[0];
            setCurrentDayStr(dayObj);

            // Load attempt for the current day
            if (currentProgId) {
                const { data: attData, error: attErr } = await supabase
                    .from('user_exercise_attempts')
                    .select('*')
                    .eq('progress_id', currentProgId)
                    .eq('day_number', dayObj.dayNumber)
                    .single();

                if (attErr && attErr.code === 'PGRST116') {
                    // Create attempt
                    const defaultChat: ChatMessage[] = [{
                        role: 'assistant',
                        content: `¡Hola! Antes de escribir código, pensemos en el **objetivo de hoy**: "${dayObj.objective}".\n¿Cómo estructurarías lógicamente los pasos para lograrlo? Cuéntame tu idea y te iré guiando.`
                    }];
                    const { data: newAtt, error: insertAttErr } = await supabase
                        .from('user_exercise_attempts')
                        .insert({ progress_id: currentProgId, day_number: dayObj.dayNumber, chat_messages: defaultChat })
                        .select()
                        .single();
                    if (insertAttErr) throw insertAttErr;
                    setAttempt(newAtt as UserAttempt);
                    setChatMessages(newAtt.chat_messages || defaultChat);
                } else if (attData) {
                    setAttempt(attData as UserAttempt);
                    if (attData.last_code_submitted) {
                        setCurrentCode(attData.last_code_submitted);
                    }
                    if (attData.is_success) {
                        setIsSuccess(true);
                    } else {
                        setIsSuccess(false);
                    }
                    if (attData.chat_messages && attData.chat_messages.length > 0) {
                        setChatMessages(attData.chat_messages);
                    } else {
                        const defaultChat: ChatMessage[] = [{
                            role: 'assistant',
                            content: `¡Hola! Antes de escribir código, pensemos en el **objetivo de hoy**: "${dayObj.objective}".\n¿Cómo estructurarías lógicamente los pasos para lograrlo? Cuéntame tu idea y te iré guiando.`
                        }];
                        setChatMessages(defaultChat);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading progress:", error);
        } finally {
            setLoading(false);
        }
    }, [userId, exercise, language]);

    useEffect(() => {
        loadProgress();
    }, [loadProgress]);

    const submitCode = async () => {
        if (!currentDayStr || !progress || !attempt) return;
        setEvaluating(true);
        setFeedback(null);

        try {
            // Evaluamos con AI, prestando atención al objective si es una variante
            const evaluationObjective = attempt.variant_text || currentDayStr.objective;
            const tempDay = { ...currentDayStr, objective: evaluationObjective };
            const chatContextStr = chatMessages.length > 1
                ? chatMessages.map(msg => `${msg.role === 'user' ? 'Alumno' : 'Tutor IA'}: ${msg.content}`).join('\n\n')
                : undefined;
            const evaluation = await evaluateProgressiveCode(currentCode, exercise.title, tempDay, language, chatContextStr);
            
            if (evaluation.isCorrect) {
                setFeedback(evaluation.feedback);
                setIsSuccess(true);
                
                // Update progress in DB (save last code and success state to avoid showing it false on reload)
                const { data } = await supabase.from('user_exercise_attempts')
                    .update({ last_code_submitted: currentCode, is_success: true, failed_attempts: 0 })
                    .eq('id', attempt.id)
                    .select()
                    .single();
                    
                if (data) setAttempt(data as UserAttempt);

            } else {
                setFeedback(evaluation.feedback);
                
                // Incrementar failed attempts
                const newFails = attempt.failed_attempts + 1;
                const { data } = await supabase.from('user_exercise_attempts')
                    .update({ 
                        failed_attempts: newFails,
                        last_code_submitted: currentCode 
                    })
                    .eq('id', attempt.id)
                    .select()
                    .single();
                    
                if (data) setAttempt(data as UserAttempt);
            }

        } catch (error: any) {
            setFeedback("Error al evaluar: " + error.message);
        } finally {
            setEvaluating(false);
        }
    };

    const nextDay = async () => {
        if (!progress) return;
        const nextDayNum = currentDayStr.dayNumber + 1;
        const nextDayObj = exercise.days.find(d => d.dayNumber === nextDayNum);
        
        if (nextDayObj) {
            // Avanzamos progreso
            const { data } = await supabase.from('user_exercise_progress')
                .update({ current_day: nextDayNum })
                .eq('id', progress.id)
                .select()
                .single();
                
            if (data) {
                setProgress(data as UserProgress);
                setIsSuccess(false);
                setFeedback(null);
                setCurrentCode('');
                // Ensure the previous attempt doesn't bleed into the next one
                setAttempt(null);
                await loadProgress();
            }
        } else {
            // Completamos ejercicio
            await supabase.from('user_exercise_progress')
                .update({ completed: true })
                .eq('id', progress.id);
        }
    };

    const getHint = async () => {
        if (!attempt) return;
        const hintText = await getProgressiveHint(exercise.title, currentDayStr, language, attempt.failed_attempts);
        setFeedback("💡 " + hintText);
        
        await supabase.from('user_exercise_attempts')
            .update({ hints_used: attempt.hints_used + 1 })
            .eq('id', attempt.id);
    };

    const getSolution = async () => {
        if (!attempt || attempt.failed_attempts < 3) return;
        setEvaluating(true);
        const solText = await getProgressiveSolution(exercise.title, currentDayStr, language);
        setFeedback("✅ Solución del día de hoy:\n\n" + solText);
        setEvaluating(false);
    };

    const fetchCompleteSolution = async () => {
        setEvaluating(true);
        try {
            const solText = await getCompleteExerciseSolution(exercise.title, language);
            setFeedback("✅ Solución Completa:\n\n" + solText);
        } catch (error: any) {
            setFeedback("Error al obtener la solución completa: " + error.message);
        } finally {
            setEvaluating(false);
        }
    };

    const getVariant = async () => {
        if (!attempt) return;
        setEvaluating(true);
        
        try {
            const variantText = await generateExerciseVariant(exercise.title, currentDayStr, language);
            
            if (variantText.includes('❌ Error') || variantText.includes('⚠️ Error')) {
                throw new Error(variantText);
            }

            const defaultChat: ChatMessage[] = [{
                role: 'assistant',
                content: `¡Genial! Aceptaste el reto de practicar más.\n\n**Nueva Variante:**\n${variantText}\n\n¿Por dónde quieres que empecemos a planificarla?`
            }];
            
            const { data, error } = await supabase.from('user_exercise_attempts')
                .update({ 
                    variant_text: variantText, 
                    is_success: false, 
                    failed_attempts: 0, 
                    last_code_submitted: '',
                    chat_messages: defaultChat
                })
                .eq('id', attempt.id)
                .select()
                .single();
                
            if (error) throw error;
                
            if (data) {
                setAttempt(data as UserAttempt);
                setChatMessages(defaultChat);
                setCurrentCode('');
                setIsSuccess(false);
                setFeedback(null);
            }
        } catch (error: any) {
            console.error("Error generating variant:", error);
            alert("Hubo un error al generar la variante. Inténtalo de nuevo.");
        } finally {
            setEvaluating(false);
        }
    }

    const resetToDay1 = async () => {
        if (!progress) return;
        await supabase.from('user_exercise_progress')
            .update({ current_day: 1, completed: false })
            .eq('id', progress.id);
        await loadProgress();
    };

    const sendChatMessage = async (message: string) => {
        if (!message.trim() || isChatting) return;
        
        setIsChatting(true);
        const newUserMsg: ChatMessage = { role: 'user', content: message };
        const newHistory = [...chatMessages, newUserMsg];
        setChatMessages(newHistory);

        try {
            const aiResponse = await getProgressiveChatResponse(
                exercise.title,
                currentDayStr,
                language,
                newHistory
            );
            
            const finalHistory = [...newHistory, { role: 'assistant', content: aiResponse }];
            setChatMessages(finalHistory as ChatMessage[]);

            if (attempt) {
                await supabase.from('user_exercise_attempts')
                    .update({ chat_messages: finalHistory })
                    .eq('id', attempt.id);
            }
        } catch (error) {
            console.error(error);
            setChatMessages([...newHistory, { role: 'assistant', content: '❌ Hubo un error al comunicar con el tutor.' }]);
        } finally {
            setIsChatting(false);
        }
    };

    // Se eliminó el reseteo del chat, ahora se carga de la base de datos

    const sendDoubtChatMessage = async (message: string) => {
        if (!message.trim() || isDoubtChatting) return;
        
        setIsDoubtChatting(true);
        const newUserMsg: ChatMessage = { role: 'user', content: message };
        const newHistory = [...doubtChatMessages, newUserMsg];
        setDoubtChatMessages(newHistory);

        try {
            const aiResponse = await getDoubtChatResponse(
                exercise.title,
                language,
                newHistory,
                currentDayStr.objective || ""
            );
            
            setDoubtChatMessages([...newHistory, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error(error);
            setDoubtChatMessages([...newHistory, { role: 'assistant', content: '❌ Hubo un error al comunicar con la IA.' }]);
        } finally {
            setIsDoubtChatting(false);
        }
    };

    const startTraining = async () => {
        await sendDoubtChatMessage("Necesito comenzar un entrenamiento práctico ahora mismo. Dame un mini-ejercicio para afianzar este concepto.");
    };

    return {
        currentDayObj: currentDayStr,
        progress,
        attempt,
        loading,
        evaluating,
        feedback,
        currentCode,
        setCurrentCode,
        submitCode,
        nextDay,
        getHint,
        getSolution,
        fetchCompleteSolution,
        getVariant,
        resetToDay1,
        chatMessages,
        isChatting,
        sendChatMessage,
        doubtChatMessages,
        setDoubtChatMessages,
        isDoubtChatting,
        sendDoubtChatMessage,
        startTraining,
        isSuccess,
        setIsSuccess
    };
}
