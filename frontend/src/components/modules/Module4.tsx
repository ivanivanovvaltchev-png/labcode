import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Configuración y Entorno de Desarrollo",
    "Tema 2: Gestión de entornos virtuales",
    "Tema 3: Python inicial",
    "Tema 4: Estructuras de datos",
    "Tema 5: Funciones",
    "Tema 6: Gestión de archivos",
    "Tema 7: Programación orientada a objetos",
    "Tema 8: Ejercicios avanzados con explicación"
];

const Module4: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);
    const [history, setHistory] = useState<{ cmd: string, out: string }[]>([
        { cmd: '', out: 'Python 3.10.12 (main, Nov 20 2023, 15:14:05) [GCC 11.4.0] on linux\nType "help", "copyright", "credits" or "license" for more information.' }
    ]);
    const [input, setInput] = useState('');

    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 4: PYTHON BÁSICO Y AVANZADO" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }

    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = input.trim();
        let out = '';

        if (cmd === 'print("Hola LabCode")' || cmd === "print('Hola LabCode')") {
            out = 'Hola LabCode';
            setTimeout(() => onComplete(), 2000);
        } else if (cmd !== '') {
            try {
                // very basic mocked eval for integers
                if (/^[0-9+\-*/().\s]+$/.test(cmd)) {
                    // eslint-disable-next-line
                    out = String(eval(cmd));
                } else {
                    out = `NameError: name '${cmd.split(' ')[0]}' is not defined`;
                }
            } catch (e) {
                out = 'SyntaxError: invalid syntax';
            }
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
                <span className="text-yellow-500 font-mono font-bold tracking-widest text-sm uppercase">Módulo 4: Python</span>
            </div>

            <div className="bg-[#0f0f0f] border border-light/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-light/10">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-xs font-mono text-light/50">python - Interactive Shell</span>
                </div>

                <div className="p-4 h-96 overflow-y-auto font-mono text-sm text-light/80" style={{ backgroundColor: '#131313' }}>
                    {history.map((h, i) => (
                        <div key={i} className="mb-2">
                            {h.cmd && (
                                <div className="text-light">
                                    <span className="text-light/50">{'>>> '}</span>{h.cmd}
                                </div>
                            )}
                            {h.out && <div className="text-yellow-500/80 whitespace-pre-wrap">{h.out}</div>}
                        </div>
                    ))}

                    <form onSubmit={handleCommand} className="flex gap-2">
                        <span className="text-light/50">{'>>> '}</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent text-light outline-none"
                            autoFocus
                            spellCheck="false"
                            placeholder='Try print("Hola LabCode")'
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Module4;
