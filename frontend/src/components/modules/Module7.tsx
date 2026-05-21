import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a CSS",
    "Tema 2: Unidades de Medida en CSS",
    "Tema 3: Tipos de Etiqueta y CSS del Navegador",
    "Tema 4: Cascada y Prioridad",
    "Tema 5: Selectores",
    "Tema 6: Selectores II",
    "Tema 7: Selectores III",
    "Tema 8: Texto en CSS",
    "Tema 9: Tipografías en CSS",
    "Tema 10: Iconos tipográficos",
    "Tema 11: Modelo de Caja",
    "Tema 12: Imágenes",
    "Tema 13: Posicionamiento I",
    "Tema 14: Posicionamiento II",
    "Tema 15: Tablas y Listas",
    "Tema 16: Flexbox Básico",
    "Tema 17: Grid Básico",
    "Tema 18: Interactividad",
    "Tema 19: Degradados, Sombras y Efectos",
    "Tema 20: Responsive Web Design",
    "Tema 21: Variables",
    "Tema 22: Transformaciones",
    "Tema 23: Animaciones",
    "Tema 24: Frameworks CSS: Tailwind, Bootstrap y Bulma",
    "Tema 25: Preprocesadores CSS"
];

const Module7: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [cssInput, setCssInput] = useState('.puerta {\n  /* Haz que el color de fondo sea azul (blue) */\n  background-color: \n}');
    const [isUnlocked, setIsUnlocked] = useState(false);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 7: CSS" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const checkCss = () => {
        // Parse minimally aiming for background blue implementation
        const lowerCss = cssInput.toLowerCase();
        if (lowerCss.includes('background-color') && (lowerCss.includes('blue') || lowerCss.includes('#0000ff'))) {
            setIsUnlocked(true);
            setTimeout(() => onComplete(), 2000);
        } else {
            setIsUnlocked(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#1572B6] font-mono font-bold tracking-widest text-sm uppercase">Módulo 7: CSS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10">
                        <span className="text-xs font-mono text-light/50">styles.css</span>
                    </div>
                    <textarea
                        value={cssInput}
                        onChange={(e) => {
                            setCssInput(e.target.value);
                        }}
                        onKeyUp={checkCss}
                        className="flex-1 w-full bg-[#1a1a1a] text-[#1572B6] font-mono p-4 focus:outline-none resize-none"
                        spellCheck="false"
                        rows={10}
                    />
                </div>

                <div className="bg-[#0f0f0f]/50 border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 left-4 bg-[#0f0f0f]/80 px-3 py-1 text-xs rounded-full border border-light/10">
                        Elemento: .puerta
                    </div>

                    <div className="p-8">
                        <div
                            className="w-32 h-48 border-4 border-[#333] transition-all duration-1000 flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                            style={{
                                backgroundColor: isUnlocked ? 'blue' : 'transparent',
                                borderColor: isUnlocked ? '#80bfff' : '#333'
                            }}
                        >
                            {isUnlocked ? (
                                <div className="text-white text-5xl animate-bounce">🔓</div>
                            ) : (
                                <div className="text-gray-600 text-5xl">🔒</div>
                            )}

                            {isUnlocked && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Module7;
