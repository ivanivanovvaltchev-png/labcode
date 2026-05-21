import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a Astro",
    "Tema 2: Estructura de un proyecto en Astro",
    "Tema 3: Componentes y slots",
    "Tema 4: Renderización e imports",
    "Tema 5: Estilos CSS en Astro",
    "Tema 6: Integraciones con otros frameworks",
    "Tema 7: Directivas client",
    "Tema 8: Barra de herramientas de Astro",
    "Tema 9: Rutas dinámicas y paginación",
    "Tema 10: Internacionalización de un proyecto en Astro",
    "Tema 11: Content pages y collections"
];

const Module10: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [fuel, setFuel] = useState(0);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 10: ASTRO" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const launch = () => {
        if (fuel >= 100) {
            setTimeout(() => onComplete(), 2000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in flex flex-col items-center justify-center">
            <div className="w-full flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#FF5D01] font-mono font-bold tracking-widest text-sm uppercase">Módulo 10: Astro</span>
            </div>

            <div className="bg-[#0f0f0f]/80 p-12 rounded-full border border-light/10 shadow-[0_0_50px_rgba(255,93,1,0.2)] text-center max-w-lg w-full">
                <div className="text-6xl mb-6">{fuel >= 100 ? '🚀' : '🛰️'}</div>
                <h2 className="text-3xl font-bold text-light mb-4">Despliegue Espacial</h2>
                <p className="text-light/60 mb-8">
                    Astro es el framework web para construir sitios rápidos. Rellena el tanque de rendimiento estático.
                </p>

                <div className="w-full h-8 bg-black/50 rounded-full overflow-hidden border border-light/20 mb-6">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-[#FF5D01] transition-all duration-300"
                        style={{ width: `${fuel}%` }}
                    />
                </div>

                <div className="flex gap-4 mb-8 justify-center">
                    <button onClick={() => setFuel(Math.min(100, fuel + 25))} className="bg-light/10 hover:bg-light/20 px-4 py-2 rounded text-sm text-light font-bold">
                        + SSG
                    </button>
                    <button onClick={() => setFuel(Math.min(100, fuel + 25))} className="bg-light/10 hover:bg-light/20 px-4 py-2 rounded text-sm text-light font-bold">
                        + Islands
                    </button>
                </div>

                <button
                    onClick={launch}
                    disabled={fuel < 100}
                    className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${fuel >= 100 ? 'bg-[#FF5D01] hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(255,93,1,0.5)]' : 'bg-[#0f0f0f]/50 text-light/30 border border-light/10 cursor-not-allowed'}`}
                >
                    {fuel >= 100 ? 'DESPEGAR' : 'CARGANDO COMBUSTIBLE...'}
                </button>
            </div>
        </div>
    );
};

export default Module10;
