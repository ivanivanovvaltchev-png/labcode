import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a Git y Control de Versiones",
    "Tema 2: Uso Básico de Git",
    "Tema 3: Trabajo Colaborativo Local",
    "Tema 4: Introducción a GitHub",
    "Tema 5: Trabajo Colaborativo en GitHub",
    "Tema 6: Flujo de Trabajo Avanzado",
    "Tema 7: Buenas Prácticas y Consejos",
    "Tema 8: Integración Continua y Despliegue",
    "Tema 9: Casos de Uso Específicos"
];

const Module5: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [step, setStep] = useState(0);
    const [output, setOutput] = useState<string[]>([]);
    const [input, setInput] = useState('');
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 5: GIT Y GITHUB" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = input.trim();
        let newOut = [...output, `> ${cmd}`];

        if (step === 0 && cmd === 'git init') {
            newOut.push('Initialized empty Git repository in /conquer-game/.git/');
            setStep(1);
        } else if (step === 1 && cmd === 'git add .') {
            newOut.push('Se han añadido los cambios al staging area.');
            setStep(2);
        } else if (step === 2 && cmd.startsWith('git commit -m')) {
            newOut.push('[main (root-commit) 5f3d4a2] ' + cmd.split('"')[1]);
            newOut.push('1 file changed, 1 insertion(+)');
            newOut.push('¡Acabas de hacer tu primer commit! Módulo completado.');
            setStep(3);
            setTimeout(() => onComplete(), 2000);
        } else {
            if (cmd !== '') {
                newOut.push(`git: '${cmd.split(' ')[1] || cmd}' is not a git command. See 'git --help'.`);
            }
        }

        setOutput(newOut);
        setInput('');
    };

    const getHint = () => {
        if (step === 0) return 'Inicializa el repositorio con "git init"';
        if (step === 1) return 'Agrega los archivos al staging area con "git add ."';
        if (step === 2) return 'Haz el commit usando "git commit -m \\"Mi primer commit\\""';
        return '¡Repositorio listo!';
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#F05032] font-mono font-bold tracking-widest text-sm uppercase">Módulo 5: Git & GitHub</span>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden shadow-2xl">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-[#c9d1d9] mb-2">Simulador de Control de Versiones</h2>
                    <p className="text-[#8b949e] mb-6 text-sm">
                        {getHint()}
                    </p>

                    <div className="h-64 overflow-y-auto font-mono text-sm text-[#8b949e] mb-4 bg-black p-4 rounded-md">
                        {output.map((out, i) => (
                            <div key={i} className={out.startsWith('>') ? 'text-white mt-2' : 'text-[#8b949e]'}>
                                {out}
                            </div>
                        ))}

                        <form onSubmit={handleCommand} className="flex gap-2 mt-2">
                            <span className="text-[#2ea043]">~/conquer-game</span> $
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 bg-transparent text-white outline-none"
                                autoFocus
                                spellCheck="false"
                            />
                        </form>
                    </div>

                    <div className="flex gap-2">
                        <div className={`flex-1 h-2 rounded-full transition-all ${step > 0 ? 'bg-[#2ea043]' : 'bg-[#30363d]'}`}></div>
                        <div className={`flex-1 h-2 rounded-full transition-all ${step > 1 ? 'bg-[#2ea043]' : 'bg-[#30363d]'}`}></div>
                        <div className={`flex-1 h-2 rounded-full transition-all ${step > 2 ? 'bg-[#2ea043]' : 'bg-[#30363d]'}`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Module5;
