import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface Module1Props {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a la Informática"
];

const Module1: React.FC<Module1Props> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);
    const [cpuStatus, setCpuStatus] = useState(false);
    const [ramStatus, setRamStatus] = useState(false);
    const [diskStatus, setDiskStatus] = useState(false);

    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 1: INTRODUCCIÓN A LA INFORMÁTICA Y PSEUDOCÓDIGO" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }

    const checkCompletion = (cpu: boolean, ram: boolean, disk: boolean) => {
        if (cpu && ram && disk) {
            setTimeout(() => onComplete(), 1000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-primary font-mono font-bold tracking-widest text-sm uppercase">Módulo 1: Fundamentos</span>
            </div>

            <div className="bg-[#0f0f0f]/50 border border-light/10 rounded-2xl p-8 shadow-xl">
                <h2 className="text-3xl font-bold text-light mb-4">El Despertar de la Máquina</h2>
                <p className="text-light/70 mb-8 max-w-2xl">
                    Para entender la Informática, primero debes conocer sus componentes clave.
                    Activa la Unidad Central de Procesamiento (CPU), la Memoria Volátil (RAM) y
                    el Almacenamiento Persistente (Disco) en el orden correcto o simultáneamente para arrancar el sistema.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => { setCpuStatus(!cpuStatus); checkCompletion(!cpuStatus, ramStatus, diskStatus); }}
                        className={`p-6 rounded-xl border-2 transition-all ${cpuStatus ? 'bg-primary/20 border-primary text-primary' : 'bg-[#0f0f0f]/30 border-light/10 hover:border-primary/50 text-light/50'}`}
                    >
                        <div className="text-2xl mb-2">🧠</div>
                        <div className="font-bold">CPU</div>
                        <div className="text-xs mt-2 opacity-70">Procesamiento</div>
                    </button>

                    <button
                        onClick={() => { setRamStatus(!ramStatus); checkCompletion(cpuStatus, !ramStatus, diskStatus); }}
                        className={`p-6 rounded-xl border-2 transition-all ${ramStatus ? 'bg-accent/20 border-accent text-accent' : 'bg-[#0f0f0f]/30 border-light/10 hover:border-accent/50 text-light/50'}`}
                    >
                        <div className="text-2xl mb-2">⚡</div>
                        <div className="font-bold">RAM</div>
                        <div className="text-xs mt-2 opacity-70">Memoria Rápida Volátil</div>
                    </button>

                    <button
                        onClick={() => { setDiskStatus(!diskStatus); checkCompletion(cpuStatus, ramStatus, !diskStatus); }}
                        className={`p-6 rounded-xl border-2 transition-all ${diskStatus ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-[#0f0f0f]/30 border-light/10 hover:border-purple-500/50 text-light/50'}`}
                    >
                        <div className="text-2xl mb-2">💾</div>
                        <div className="font-bold">Disco Duro</div>
                        <div className="text-xs mt-2 opacity-70">Almacenamiento Permanente</div>
                    </button>
                </div>

                {(cpuStatus && ramStatus && diskStatus) && (
                    <div className="mt-8 p-4 bg-accent/10 border border-accent/20 rounded-lg text-accent text-center animate-pulse">
                        ¡SISTEMA INICIADO EXITOSAMENTE! Obteniendo experiencia...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Module1;
