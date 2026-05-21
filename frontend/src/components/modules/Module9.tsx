import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a React JS",
    "Tema 2: Tu primer proyecto de React JS con Vite",
    "Tema 3: ¿Qué es un componente?",
    "Tema 4: Ciclo de vida de un componente",
    "Tema 5: Organización de archivos y carpetas",
    "Tema 6: Fundamentos de JSX",
    "Tema 7: React Dev Tools",
    "Tema 8: Estilos CSS en React",
    "Tema 9: Eventos en React JS",
    "Tema 10: Comunicación entre componentes",
    "Tema 11: ¿Qué son los efectos?",
    "Tema 12: ¿Qué es el estado?",
    "Tema 13: Local Storage con React JS",
    "Tema 14: Estados de carga",
    "Tema 15: Formularios en React JS",
    "Tema 16: Comunicación con el servidor",
    "Tema 17: Rutas y navegación",
    "Tema 18: Portales",
    "Tema 19: React Context",
    "Tema 20: Proyecto Lista de Todos",
    "Tema 21: Obtener lista de todos del servidor",
    "Tema 22: Crear todo",
    "Tema 23: Eliminar Todo",
    "Tema 24: Despliegue en Github Pages",
    "Tema 25: NextJS",
    "Tema 26: De React a Angular (diferencias y similitudes)",
    "Tema 27: De React a Vuejs (diferencias y similitudes)"
];

const Module9: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);
    const [code, setCode] = useState('import React from "react";\n\nfunction Contador() {\n  // Agrega el hook useState aquí\n  \n  return <button>Clicks: 0</button>;\n}\n\nexport default Contador;');
    const [compiled, setCompiled] = useState(false);
    const [clicks, setClicks] = useState(0);

    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 9: REACT: BÁSICO, INTERMEDIO Y AVANZADO" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }

    const checkReact = () => {
        // Basic AST check mock
        if (code.includes('useState') && code.includes('const [')) {
            setCompiled(true);
        } else {
            setCompiled(false);
        }
    };

    const handleSimulatedClick = () => {
        setClicks(prev => prev + 1);
        if (clicks >= 4) {
            setTimeout(() => onComplete(), 1000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#61DAFB] font-mono font-bold tracking-widest text-sm uppercase">Módulo 9: React</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10 flex justify-between">
                        <span className="text-xs font-mono text-light/50">Contador.tsx</span>
                        <span className="text-xs font-mono text-[#61DAFB]">React Compiler</span>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 w-full bg-[#1a1a1a] text-[#61DAFB] font-mono p-4 focus:outline-none resize-none"
                        spellCheck="false"
                        rows={12}
                    />
                    <div className="p-4 border-t border-light/10">
                        <button onClick={checkReact} className="w-full bg-[#61DAFB] text-black py-2 rounded font-bold hover:bg-[#4fa8c2] transition">Compilar Componente</button>
                    </div>
                </div>

                <div className="bg-[#0f0f0f]/50 border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center relative p-8">
                    <h3 className="text-light/50 font-mono mb-6 text-sm">Vista Previa (HMR)</h3>

                    {compiled ? (
                        <div className="text-center animate-pulse-slow">
                            <p className="text-light mb-4">¡Componente Compilado! Interactúa para validar el estado.</p>
                            <button
                                onClick={handleSimulatedClick}
                                className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition"
                            >
                                Clicks Interactivos: {clicks} / 5
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-center">Exporta un componente válido que use useState para continuar.</p>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Module9;
