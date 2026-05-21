import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface Module3Props {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a Linux y la Terminal",
    "Tema 2: Virtualbox",
    "Tema 3: Windows Subsystem Linux (WSL)",
    "Tema 4: Primeros comandos y tipos de archivos",
    "Tema 5: Gestión de usuarios y grupos",
    "Tema 6: Utilidades avanzadas"
];

const Module3: React.FC<Module3Props> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);
    const [history, setHistory] = useState<{ cmd: string, out: string }[]>([
        { cmd: '', out: 'ConquerOS bash - Bienvenido a la simulación de Terminal.' },
        { cmd: '', out: 'Escribe "ls" para listar archivos o "cat secreto.txt" para leer.' }
    ]);
    const [input, setInput] = useState('');

    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 3: INTRODUCCIÓN A LINUX Y LA TERMINAL" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }

    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = input.trim();
        let out = '';

        if (cmd === 'ls') {
            out = 'secreto.txt  bin  home  usr';
        } else if (cmd === 'cat secreto.txt') {
            out = '¡Has encontrado la clave de acceso! Has superado el reto básico de terminal.';
            setTimeout(() => onComplete(), 2000);
        } else if (cmd !== '') {
            out = `bash: ${cmd}: command not found`;
        }

        setHistory([...history, { cmd, out }]);
        setInput('');
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-primary font-mono font-bold tracking-widest text-sm uppercase">Módulo 3: Linux & Terminal</span>
            </div>

            <div className="bg-[#0f0f0f] border border-light/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-light/10">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-xs font-mono text-light/50">user@conquer-os:~</span>
                </div>

                <div className="p-4 h-96 overflow-y-auto font-mono text-sm" style={{ backgroundColor: '#0c0c0c' }}>
                    {history.map((h, i) => (
                        <div key={i} className="mb-2">
                            {h.cmd && (
                                <div className="text-light">
                                    <span className="text-accent">user@conquer-os</span>:<span className="text-primary">~</span>$ {h.cmd}
                                </div>
                            )}
                            {h.out && <div className="text-light/70 whitespace-pre-wrap">{h.out}</div>}
                        </div>
                    ))}

                    <form onSubmit={handleCommand} className="flex gap-2">
                        <span className="text-accent">user@conquer-os</span>:<span className="text-primary">~</span>$
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent text-light outline-none"
                            autoFocus
                            spellCheck="false"
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Module3;
