import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a Java",
    "Tema 2: Fundamentos de Programación en Java",
    "Tema 3: Fundamentos de Programación en Java II",
    "Tema 4: Fundamentos de Programación en Java II",
    "Tema 5: Fundamentos de Programación en Java III",
    "Tema 6: Conceptos Avanzados en Java",
    "Tema 7: Serie de ejercicios Prácticos",
    "Tema 8: Introducción a Spring Framework",
    "Tema 9: Configuración inicial y estructura del proyecto",
    "Tema 10: Desarrollo de aplicaciones web con Spring Boot",
    "Tema 11: Uso de bases de datos con Spring Boot (Hibernate)",
    "Tema 12: Uso de bases de datos con Spring Boot (Hibernate) II",
    "Tema 13: Pruebas unitarias e integración con Spring Boot",
    "Tema 14: Proyecto Final – API REST Completa (Web de una Biblioteca)"
];

const Module14: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [code, setCode] = useState('@RestController\n@RequestMapping("/api/v1")\npublic class UserController {\n\n    // Crea el endpoint GET /hello que retorne "Hello Spring"\n    \n}');
    const [consoleOut, setConsoleOut] = useState<string>('');
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 14: JAVA Y SPRING" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const checkSpring = () => {
        const val = code.replace(/\s+/g, '').toLowerCase();
        if (val.includes('@getmapping("/hello")') && val.includes('return"hellospring"')) {
            setConsoleOut('BUILD SUCCESS\n[INFO] Starting Spring Boot...\n[INFO] Tomcat initialized with port(s): 8080 (http)\n[INFO] Endpoint: GET /api/v1/hello mapped correctly.\n\nPrueba del endpoint: "Hello Spring" ✔');
            setTimeout(() => onComplete(), 2000);
        } else {
            setConsoleOut('BUILD FAILED\n[ERROR] No valid GET /hello endpoint found returning "Hello Spring".');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in flex flex-col items-center justify-center">
            <div className="flex justify-between items-center mb-8 w-full">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-green-500 font-mono font-bold tracking-widest text-sm uppercase">Módulo 14: Java & Spring</span>
            </div>

            <div className="bg-[#2b2b2b] border border-[#5382a1] rounded-xl overflow-hidden shadow-2xl flex flex-col w-full">
                <div className="bg-[#3c3f41] px-4 py-2 border-b border-[#5382a1] flex justify-between">
                    <span className="text-xs font-mono text-light/50">UserController.java</span>
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full bg-[#2b2b2b] text-[#ed8b00] font-mono p-4 focus:outline-none resize-none"
                    spellCheck="false"
                    rows={10}
                />
                <div className="p-4 border-t border-[#5382a1]">
                    <button onClick={checkSpring} className="w-full bg-[#5382a1] text-white py-2 rounded font-bold hover:bg-[#3f637a] transition">MVN CLEAN INSTALL</button>
                </div>
            </div>

            <div className="w-full mt-6 bg-black border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col text-light">
                <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10">
                    <span className="text-xs font-mono text-light/50">Terminal (Maven)</span>
                </div>
                <div className="p-6 flex-1 whitespace-pre-wrap font-mono text-sm max-h-48 overflow-y-auto">
                    {consoleOut || '> Maven build tool ready.'}
                </div>
            </div>
        </div>
    );
};

export default Module14;
