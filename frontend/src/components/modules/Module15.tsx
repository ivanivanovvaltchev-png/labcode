import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a Rust",
    "Tema 2: Tipos en Rust",
    "Tema 3: Flujo de control en Rust",
    "Tema 4: Lógica en Rust",
    "Tema 5: Tipos avanzados en Rust",
    "Tema 6: Data ownership en Rust",
    "Tema 7: Manejo de errores",
    "Tema 8: Librería standard de Rust",
    "Tema 9: Módulos y Testing en Rust",
    "Tema 10: Desarrollo de aplicación de línea de comandos"
];

const Module15: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [code, setCode] = useState('fn main() {\n    // Imprime "LabCode" usando la macro estándar\n    \n}');
    const [consoleOut, setConsoleOut] = useState<string>('');
    const [success, setSuccess] = useState(false);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 15: RUST" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const compileRust = () => {
        const val = code.replace(/\s+/g, '');
        if (val.includes('println!("LabCode");') || val.includes("println!('LabCode');")) {
            setConsoleOut('$ cargo run\n   Compiling conquer_game v0.1.0\n    Finished dev [unoptimized + debuginfo] target(s) in 0.52s\n     Running `target/debug/conquer_game`\nLabCode');
            setSuccess(true);
            setTimeout(() => onComplete(), 2000);
        } else {
            setConsoleOut('error: expected macro `println!` with "LabCode" argument.\n\nerror: aborting due to previous error');
            setSuccess(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in">
            <div className="flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#DEA584] font-mono font-bold tracking-widest text-sm uppercase">Módulo 15: Rust</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10 flex justify-between">
                        <span className="text-xs font-mono text-light/50">src/main.rs</span>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 w-full bg-[#1a1a1a] text-[#DEA584] font-mono p-4 focus:outline-none resize-none"
                        spellCheck="false"
                        rows={10}
                    />
                    <div className="p-4 border-t border-light/10">
                        <button onClick={compileRust} className="w-full bg-[#DEA584] text-black py-2 rounded font-bold hover:bg-orange-400 transition">cargo run</button>
                    </div>
                </div>

                <div className="bg-black/90 border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col text-light">
                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10">
                        <span className="text-xs font-mono text-light/50">Terminal (Cargo)</span>
                    </div>
                    <div className="p-6 flex-1 whitespace-pre-wrap font-mono text-sm">
                        {consoleOut || '> Esperando compilación...'}
                    </div>
                    {success && (
                        <div className="p-4 bg-[#DEA584]/20 text-[#DEA584] text-center font-bold">
                            Seguridad de memoria garantizada. ✔
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Module15;
