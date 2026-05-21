import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a HTML",
    "Tema 2: Texto y estructura en HTML",
    "Tema 3: Tablas, Formularios e Imágenes",
    "Tema 4: Contenido adicional"
];

const Module6: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [htmlInput, setHtmlInput] = useState('<!-- Crea un botón para continuar -->\n\n');
    const [rendered, setRendered] = useState(false);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 6: FRONTEND / HTML" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const checkHtml = () => {
        // Very simple check: ensure there is a <button> tag
        if (htmlInput.toLowerCase().includes('<button') && htmlInput.toLowerCase().includes('</button>')) {
            setRendered(true);
        }
    };

    const completeLevel = () => {
        onComplete();
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#E34F26] font-mono font-bold tracking-widest text-sm uppercase">Módulo 6: HTML</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10">
                        <span className="text-xs font-mono text-light/50">index.html</span>
                    </div>
                    <textarea
                        value={htmlInput}
                        onChange={(e) => setHtmlInput(e.target.value)}
                        className="flex-1 w-full bg-[#1a1a1a] text-[#E34F26] font-mono p-4 focus:outline-none resize-none"
                        spellCheck="false"
                        rows={10}
                    />
                    <div className="p-4 border-t border-light/10">
                        <button onClick={checkHtml} className="w-full bg-[#E34F26] text-white py-2 rounded font-bold hover:bg-orange-700 transition">Renderizar DOM</button>
                    </div>
                </div>

                <div className="bg-white border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col text-black">
                    <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                        <span className="text-xs font-sans text-gray-500">Navegador - Renderizado</span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col items-center justify-center bg-gray-50">
                        {rendered ? (
                            <div className="text-center">
                                <p className="mb-4 text-gray-600">DOM renderizado exitosamente:</p>
                                {/* Simulate rendering the user's button but attach our own completion logic to bypass XSS risks */}
                                <button onClick={completeLevel} className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600 cursor-pointer text-lg font-bold animate-bounce">
                                    [Botón Creado] - Clic para Continuar
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-center">Escribe código HTML válido y renderiza para ver el resultado aquí.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Module6;
