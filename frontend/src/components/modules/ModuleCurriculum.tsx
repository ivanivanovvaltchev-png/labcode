import React, { useState, useEffect } from 'react';

export interface ThemeScene {
    title: string;
    theory: React.ReactNode;
    type: 'quiz' | 'terminal' | 'final_code' | 'game_editor';
    question?: string;
    options?: string[];
    correctAnswer?: string;
    instruction?: string;
    expectedInput?: string[];
    successMsg?: string;
    // For Game Editor
    initialCode?: string;
    validationRegex?: RegExp;
    gameAction?: string; // e.g., 'wake', 'jump', 'open', 'climb'
    gameDescription?: string;
}

interface ModuleCurriculumProps {
    title: string;
    scenes?: ThemeScene[];
    themes?: string[];
    onBack: () => void;
    onStartChallenge: () => void;
}

const ModuleCurriculum: React.FC<ModuleCurriculumProps> = ({ title, scenes: rawScenes, themes, onBack, onStartChallenge }) => {
    // Adapter to prevent old modules that still use "themes" from crashing the new UI
    const scenes: ThemeScene[] = rawScenes || (themes ? themes.map(t => ({
        title: t,
        theory: <p className="text-light/50 italic">Contenido interactivo en desarrollo para este módulo. Próximamente se añadirán los retos en tiempo real.</p>,
        type: 'quiz',
        question: '¿Marcar como leído en modo desarrollo?',
        options: ['Sí, avanzar'],
        correctAnswer: 'Sí, avanzar',
        successMsg: 'Avanzando al siguiente tema.'
    })) : []);

    const [currentTheme, setCurrentTheme] = useState(0);
    const [activeThemeForView, setActiveThemeForView] = useState(0);

    // Interaction States
    const [userInput, setUserInput] = useState('');
    const [codeContent, setCodeContent] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    const activeScene = scenes[activeThemeForView];

    useEffect(() => {
        // Reset states when changing active view
        setUserInput('');
        setErrorMsg('');
        setSuccessMsg('');
        setIsAnimating(false);
        setCodeContent(activeScene?.initialCode || '');

        // If they click back to an already completed theme, mark as success instantly for UX
        if (activeThemeForView < currentTheme && activeScene) {
            setSuccessMsg("✓ Reto ya completado anteriormente.");
            if (activeScene.type === 'game_editor') {
                setIsAnimating(true); // show the success state of the character
            }
        }
    }, [activeThemeForView, currentTheme, activeScene]);

    const handleQuizAnswer = (option: string) => {
        if (option === activeScene.correctAnswer) {
            setSuccessMsg(activeScene.successMsg || "¡Correcto!");
            setErrorMsg('');
        } else {
            setErrorMsg('Respuesta incorrecta. Lee de nuevo la teoría.');
            setSuccessMsg('');
        }
    };

    const handleTerminalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedInput = userInput.trim().toLowerCase();
        const isMatch = activeScene.expectedInput?.some(ans => normalizedInput === ans.toLowerCase() || normalizedInput.includes(ans.toLowerCase()));

        if (isMatch) {
            setSuccessMsg(activeScene.successMsg || "¡Comando ejecutado con éxito!");
            setErrorMsg('');
        } else {
            setErrorMsg('Salida incorrecta. Inténtalo de nuevo.');
            setSuccessMsg('');
        }
    };

    const handleCodeSubmit = () => {
        if (!activeScene.validationRegex) return;

        const isMatch = activeScene.validationRegex.test(codeContent);

        if (isMatch) {
            setErrorMsg('');
            setIsAnimating(true);
            setTimeout(() => {
                setSuccessMsg(activeScene.successMsg || "¡El código funciona perfectamente!");
            }, 1000); // Wait for the animation before showing success popup
        } else {
            setErrorMsg('Error de Sintaxis o Lógica. Revisa bien los comandos PSeInt de la teoría.');
            setSuccessMsg('');
            setIsAnimating(false);
        }
    };

    const handleNext = () => {
        if (activeThemeForView === currentTheme && currentTheme < scenes.length - 1) {
            setCurrentTheme(prev => prev + 1);
            setActiveThemeForView(prev => prev + 1);
        } else if (activeThemeForView < currentTheme) {
            setActiveThemeForView(currentTheme);
        } else if (activeThemeForView === scenes.length - 1 && currentTheme === scenes.length - 1) {
            setCurrentTheme(scenes.length);
            setActiveThemeForView(scenes.length);
        }
    };

    // Helper to render the character "Byte" based on action
    const renderByte = (action?: string, animating?: boolean) => {
        let characterClass = "transition-all duration-1000 transform";
        let characterIcon = "🤖";
        let environment = null;

        if (action === 'wake') {
            characterClass += animating ? " scale-125 opacity-100 animate-bounce" : " scale-75 opacity-50 grayscale";
            characterIcon = animating ? "🤖💡" : "🤖💤";
        } else if (action === 'jump') {
            characterIcon = "🤖";
            characterClass += animating ? " -translate-y-24 translate-x-32 rotate-12" : " translate-y-0 translate-x-0";
            environment = <div className="absolute bottom-4 left-32 w-16 h-8 bg-dark/80 rounded-t-lg border border-red-500/30"></div>; // foso
        } else if (action === 'open') {
            characterIcon = animating ? "🤖🚶‍♂️" : "🤖🔒";
            characterClass += animating ? " translate-x-24 opacity-0" : " translate-x-0";
            environment = <div className={`absolute right-12 bottom-0 w-8 h-24 bg-brown-600 transition-all duration-1000 origin-left ${animating ? 'rotate-[-100deg] opacity-50' : 'rotate-0'}`} style={{ backgroundColor: '#8b4513' }}><div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-10 left-1"></div></div>
        } else if (action === 'climb') {
            characterClass += animating ? " -translate-y-16 translate-x-16" : " translate-y-0 translate-x-0";
            environment = (
                <div className="absolute bottom-0 right-16 flex items-end">
                    <div className="w-12 h-8 bg-[#333] border-t border-r border-[#555]"></div>
                    <div className="w-12 h-16 bg-[#333] border-t border-r border-[#555]"></div>
                    <div className="w-12 h-24 bg-[#333] border-t border-r border-[#555]"></div>
                </div>
            );
        } else if (action === 'powerup') {
            characterClass += animating ? " scale-150 drop-shadow-[0_0_20px_rgba(59,130,246,1)]" : " scale-100";
            characterIcon = animating ? "🤖⚡" : "🤖❓";
        }

        return (
            <div className="relative w-full h-48 bg-[#0a0a0a] rounded-xl border border-light/5 overflow-hidden flex items-end px-12 pb-4 shadow-inner">
                {/* Fondo retro grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                {environment}

                <div className={`text-5xl relative z-10 ${characterClass}`}>
                    {characterIcon}
                    {animating && action === 'wake' && (
                        <div className="absolute -top-6 -right-16 bg-white text-black text-xs px-2 py-1 rounded shadow-lg font-bold">
                            ¡Hola, soy Byte!
                        </div>
                    )}
                </div>

                <div className="absolute bottom-2 left-4 text-[10px] text-light/30 font-mono tracking-widest uppercase">
                    Mundo de Byte // v1.0
                </div>
            </div>
        );
    };

    if (!activeScene) return null;

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-8 fade-in min-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2 transition-colors font-medium">
                    ← Volver al Mapa
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-primary font-mono font-bold tracking-widest text-sm uppercase">{title}</span>
                    <span className="text-light/40 text-xs mt-1">
                        Progreso General: {Math.round((Math.min(currentTheme, scenes.length) / scenes.length) * 100)}%
                    </span>
                </div>
            </div>

            {/* Layout a 2 Columnas */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-6 xl:gap-8 min-h-[70vh]">

                {/* Panel Izquierdo: Lista de Temas */}
                <div className="bg-[#0f0f0f]/80 border border-light/10 rounded-2xl p-6 shadow-xl flex flex-col h-full">
                    <h2 className="text-2xl font-bold text-light mb-1">Códices de Mando</h2>
                    <p className="text-light/50 mb-6 text-sm font-mono">Controla a Byte repasando la teoría</p>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {scenes.map((scene, idx) => {
                            const isCompleted = idx < currentTheme;
                            const isCurrent = idx === currentTheme;
                            const isLocked = idx > currentTheme;
                            const isViewing = idx === activeThemeForView && activeThemeForView < scenes.length;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !isLocked && setActiveThemeForView(idx)}
                                    disabled={isLocked}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ${isViewing
                                            ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)] text-light transform scale-[1.02]'
                                            : isCompleted
                                                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                                : isCurrent
                                                    ? 'bg-[#1e1e1e] border-light/30 text-light hover:bg-[#252525]'
                                                    : 'bg-[#121212] border-light/5 text-light/30 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className={`font-medium ${isViewing ? 'text-primary' : ''} text-sm xl:text-base`}>
                                            {scene.title.split(':')[0]}
                                        </span>
                                        {isCompleted && !isViewing && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">✓</span>}
                                        {isCurrent && !isViewing && <span className="text-xs bg-yellow-500/20 text-yellow-500 tracking-wide px-2 py-1 rounded font-bold animate-pulse">ACTIVO</span>}
                                        {isLocked && <span className="text-xs opacity-50 border border-light/10 px-2 py-1 rounded">Bloqueado</span>}
                                    </div>
                                    <div className={`text-xs mt-1 relative z-10 ${isViewing ? 'text-light/90 font-bold' : isCompleted ? 'text-green-400/70' : 'text-light/50'}`}>
                                        {scene.title.split(':')[1]?.trim() || ''}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-light/10">
                        <button
                            onClick={onStartChallenge}
                            disabled={currentTheme < scenes.length}
                            className={`w-full py-4 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${currentTheme < scenes.length
                                ? 'bg-light/5 text-light/20 cursor-not-allowed border border-light/10'
                                : 'bg-primary hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] border border-primary/50 element-glow'
                                }`}
                        >
                            {currentTheme < scenes.length ? '🔒 Gran Práctica Final' : '🚀 Iniciar Gran Práctica Final'}
                        </button>
                    </div>
                </div>

                {/* Panel Derecho: Contenido de Teoría e Interacción Game Editor */}
                <div className="flex flex-col gap-6 h-full min-h-[600px]">
                    {activeThemeForView < scenes.length ? (
                        <>
                            {/* CAJA TEORÍA */}
                            <div className="bg-[#121212] border border-light/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col flex-1 relative max-h-[35%] lg:max-h-[45%]">
                                <div className="bg-gradient-to-r from-accent/20 to-transparent px-6 py-3 border-b border-light/10 flex items-center gap-3">
                                    <div className="p-1.5 bg-accent/20 rounded-lg shadow-inner">
                                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                    </div>
                                    <h2 className="text-lg lg:text-xl font-bold text-light">{activeScene.title}</h2>
                                </div>
                                <div className="p-4 lg:p-6 text-light/90 leading-relaxed overflow-y-auto flex-1 prose prose-invert prose-p:text-light/80 prose-li:text-light/80 max-w-none text-sm">
                                    {activeScene.theory}
                                </div>
                            </div>

                            {/* CAJA EJERCICIO/INTERACCIÓN: CODE & PLAY */}
                            <div className="bg-[#1e1e1e] border border-light/10 rounded-2xl shadow-xl flex flex-col flex-1">
                                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-light/10 rounded-t-2xl">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="ml-4 text-xs font-mono text-light/50">
                                        {activeScene.type === 'game_editor' ? 'byte_motor.exe' : activeScene.type === 'quiz' ? 'evaluacion.exe' : 'terminal.exe'}
                                    </span>
                                </div>

                                <div className="p-4 lg:p-6 flex flex-col flex-1 min-h-0">

                                    {/* --- GAME EDITOR TYPE --- */}
                                    {activeScene.type === 'game_editor' && (
                                        <div className="flex flex-col h-full gap-4">
                                            {/* Vista del Juego */}
                                            {renderByte(activeScene.gameAction, isAnimating)}

                                            {/* Editor de PSeInt real */}
                                            <div className="flex flex-col flex-1 min-h-0 relative">
                                                <div className="mb-2 flex justify-between items-center text-sm font-bold text-light/80">
                                                    <span>Misión: {activeScene.gameDescription}</span>
                                                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">IDE PSeInt</span>
                                                </div>
                                                <div className="relative flex-1 bg-[#0a0a0a] rounded-xl border border-light/20 focus-within:border-accent shadow-inner flex flex-col min-h-[150px]">
                                                    <div className="absolute top-2 left-2 flex flex-col text-right pr-2 border-r border-light/10 text-light/20 font-mono text-sm pointer-events-none select-none">
                                                        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                                                    </div>
                                                    <textarea
                                                        value={codeContent}
                                                        onChange={(e) => setCodeContent(e.target.value)}
                                                        disabled={!!successMsg || activeThemeForView < currentTheme}
                                                        className="w-full flex-1 bg-transparent text-accent font-mono text-sm sm:text-base p-2 pl-8 outline-none resize-none hide-scrollbar whitespace-pre custom-scrollbar"
                                                        placeholder="// Escribe tu pseudocódigo aquí..."
                                                        spellCheck="false"
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleCodeSubmit}
                                                    disabled={!!successMsg || !codeContent.trim() || activeThemeForView < currentTheme}
                                                    className="w-full mt-4 py-3 rounded-lg bg-green-600/90 text-white font-bold hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                                >
                                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    Ejecutar Script
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- LEGACY QUIZ / TERMINAL --- */}
                                    {activeScene.type === "quiz" && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-light/90">{activeScene.question}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {activeScene.options?.map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleQuizAnswer(opt)}
                                                        disabled={!!successMsg || activeThemeForView < currentTheme}
                                                        className={`text-left p-4 rounded-xl border transition-all ${(successMsg || activeThemeForView < currentTheme) && opt === activeScene.correctAnswer
                                                                ? 'bg-green-500/20 border-green-500/50 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                                                : 'bg-dark/50 border-light/10 text-light/80 hover:bg-light/5 hover:border-light/30'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeScene.type === "terminal" && (
                                        <div className="space-y-6">
                                            <h3 className="text-sm lg:text-base text-accent font-mono whitespace-pre-wrap leading-relaxed">{activeScene.instruction}</h3>
                                            <form onSubmit={handleTerminalSubmit} className="flex flex-col sm:flex-row gap-3">
                                                <div className="flex items-center flex-1 bg-[#0a0a0a] rounded-lg px-4 border border-light/20 focus-within:border-accent transition-colors shadow-inner">
                                                    <span className="text-accent font-mono mr-3">{'>'}</span>
                                                    <input
                                                        type="text"
                                                        value={userInput}
                                                        onChange={(e) => setUserInput(e.target.value)}
                                                        disabled={!!successMsg || activeThemeForView < currentTheme}
                                                        className="bg-transparent text-light font-mono h-12 w-full outline-none"
                                                        placeholder="Respuesta..."
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={!!successMsg || !userInput.trim() || activeThemeForView < currentTheme}
                                                    className="px-8 py-3 rounded-lg bg-accent text-dark font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-accent transition-colors"
                                                >
                                                    Enviar
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Feedback de Error */}
                                    {errorMsg && (
                                        <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-[shake_0.5s_ease-in-out] opacity-90 backdrop-blur-sm z-50">
                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <p className="text-sm">{errorMsg}</p>
                                        </div>
                                    )}

                                    {/* Estado de Éxito / Completado */}
                                    {successMsg && (
                                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-green-500/10 border border-green-500/30 p-4 rounded-xl fade-in relative overflow-hidden z-20">
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent"></div>
                                            <div className="flex items-center gap-3 text-green-400 font-bold relative z-10 w-full sm:w-auto">
                                                <div className="bg-green-500/20 p-2 rounded-full hidden sm:block">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <span className="text-sm">{successMsg}</span>
                                            </div>

                                            {activeThemeForView === currentTheme && activeThemeForView < scenes.length - 1 && (
                                                <button
                                                    onClick={handleNext}
                                                    className="w-full sm:w-auto px-6 py-2 bg-green-500 hover:bg-green-400 text-dark font-bold rounded-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.3)] relative z-10 shrink-0"
                                                >
                                                    Siguiente Tema →
                                                </button>
                                            )}

                                            {activeThemeForView === currentTheme && activeThemeForView === scenes.length - 1 && (
                                                <button
                                                    onClick={handleNext}
                                                    className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-blue-400 text-white font-bold rounded-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative z-10 shrink-0"
                                                >
                                                    Finalizar Temario
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        // Estado cuando se han completado todos los temas
                        <div className="bg-[#121212] border border-primary/30 rounded-2xl p-12 shadow-[0_0_50px_rgba(59,130,246,0.1)] h-full flex flex-col items-center justify-center text-center fade-in">
                            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.4)] text-5xl">
                                👨‍💻
                            </div>
                            <h2 className="text-3xl font-bold text-light mb-4">¡Teoría y Práctica Completada!</h2>
                            <p className="text-light/60 max-w-md mb-8">Sabes usar variables, bucles y condiciones en el motor de juego. Es hora del verdadero Desafío Final.</p>

                            <button
                                onClick={onStartChallenge}
                                className="px-8 py-4 text-lg bg-primary hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] transition-all transform hover:scale-105"
                            >
                                Iniciar Gran Práctica Final
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ModuleCurriculum;
