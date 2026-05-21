import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a Node.js",
    "Tema 2: Fundamentos de Node.js",
    "Tema 3: Asincronía en Node.js",
    "Tema 4: Introducción a Express.js",
    "Tema 5: Profundizando en Express.js",
    "Tema 6: Introducción a MongoDB y Mongoose",
    "Tema 7: Creación de un API REST: Fundamentos",
    "Tema 8: Desarrollo Avanzado de API REST",
    "Tema 9: Mejores Prácticas y Performance en Node.js",
    "Tema 10: Proyecto Final API REST Completa"
];

const Module13: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [code, setCode] = useState('const express = require("express");\nconst app = express();\n\n// Crea una ruta GET "/ping" que devuelva "pong"\n\n\napp.listen(3000);');
    const [success, setSuccess] = useState(false);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 13: NODE.JS (JAVASCRIPT)" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const checkNode = () => {
        const minCode = code.replace(/\s+/g, '').toLowerCase();
        if (minCode.includes('app.get("/ping"') || minCode.includes("app.get('/ping'")) {
            if (minCode.includes('res.send("pong")') || minCode.includes("res.send('pong')") || minCode.includes("res.json('pong')")) {
                setSuccess(true);
                setTimeout(() => onComplete(), 2000);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#339933] font-mono font-bold tracking-widest text-sm uppercase">Módulo 13: Node.js</span>
            </div>

            <div className="bg-[#1e1e1e] border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10 flex justify-between">
                    <span className="text-xs font-mono text-light/50">server.js (Express)</span>
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-[#339933] font-mono p-6 focus:outline-none resize-none h-64"
                    spellCheck="false"
                />
                <div className="p-4 border-t border-light/10 flex justify-between items-center bg-[#2d2d2d]">
                    <button onClick={checkNode} className="bg-[#339933] text-black px-8 py-2 rounded font-bold hover:bg-green-600 transition">Test Route</button>
                    {success && <span className="text-green-400 font-bold ml-4 animate-pulse">Servidor Express corriendo - Ruta /ping configurada.</span>}
                </div>
            </div>
        </div>
    );
};

export default Module13;
