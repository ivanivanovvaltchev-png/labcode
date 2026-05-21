import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 0: Introducción a JS",
    "Tema 1: Conceptos básicos del lenguaje",
    "Tema 2: Conceptos propios del lenguaje",
    "Tema 3: Arrays, String y Number",
    "Tema 4: Sentencias de control de flujo",
    "Tema 5: Sentencias iterativas básicas",
    "Tema 6: Debugging",
    "Tema 7a: Manejo de Arrays en profundidad",
    "Tema 7b: Manejo de Arrays en profundidad II",
    "Tema 8: DOM",
    "Tema 9: Eventos",
    "Tema 10: EmacScript",
    "Tema 11: Ajax",
    "Tema 12: Asincronía",
    "Tema 13: TypeScript"
];

const Module8: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [jsInput, setJsInput] = useState('// Usa fetch para solicitar los datos\nasync function getData() {\n  \n}');
    const [consoleOut, setConsoleOut] = useState<string>('');
    const [success, setSuccess] = useState(false);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 8: JAVASCRIPT" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const checkJs = () => {
        const val = jsInput.toLowerCase();
        if (val.includes('await fetch') || val.includes('.then(')) {
            setConsoleOut('> Solicitud asíncrona enviada...\n> 200 OK\n> [ Datos Recibidos Correctamente ]');
            setSuccess(true);
            setTimeout(() => onComplete(), 2000);
        } else {
            setConsoleOut('> Error: No se ha detectado una llamada de red asíncrona.');
            setSuccess(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-yellow-400 font-mono font-bold tracking-widest text-sm uppercase">Módulo 8: JavaScript</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10">
                        <span className="text-xs font-mono text-light/50">app.js - Asincronía</span>
                    </div>
                    <textarea
                        value={jsInput}
                        onChange={(e) => setJsInput(e.target.value)}
                        className="flex-1 w-full bg-[#1a1a1a] text-yellow-300 font-mono p-4 focus:outline-none resize-none"
                        spellCheck="false"
                        rows={10}
                    />
                    <div className="p-4 border-t border-light/10">
                        <button onClick={checkJs} className="w-full bg-yellow-400 text-black py-2 rounded font-bold hover:bg-yellow-500 transition">Ejecutar Script</button>
                    </div>
                </div>

                <div className="bg-black/90 border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col text-light">
                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10">
                        <span className="text-xs font-mono text-light/50">Terminal Integrada</span>
                    </div>
                    <div className="p-6 flex-1 whitespace-pre-wrap font-mono text-sm">
                        {consoleOut || '> Sistema listo. Esperando ejecución de la función.'}
                    </div>
                    {success && (
                        <div className="p-4 bg-green-500/20 text-green-400 text-center font-bold">
                            Promesas y asincronía controladas. ✔
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Module8;
