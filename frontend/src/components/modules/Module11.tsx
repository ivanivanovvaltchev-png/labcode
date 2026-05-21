import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Instalación del software",
    "Tema 2: Introducción a las bases de datos",
    "Tema 3: El Modelo Relacional",
    "Tema 4: Introducción al lenguaje de consulta",
    "Tema 5: Cláusulas de filtrado de datos",
    "Tema 6: Cláusulas de ordenación de datos",
    "Tema 7: Funciones de cada tipo de dato",
    "Tema 8: Agrupaciones y funciones de grupo",
    "Tema 9: Uniones entre tablas: Las JOINS",
    "Tema 10: Subqueries o Subconsultas",
    "Tema 11: Operaciones de conjuntos",
    "Tema 12: Actualización de Bases de datos. DML",
    "Tema 13: Creación de Tablas y Constraints",
    "Tema 14: Vistas",
    "Tema 15: Índices",
    "Tema 16: Usuarios y permisos",
    "Tema 17: Procedimientos",
    "Tema 18: Control de Flujo",
    "Tema 19: Creación de funciones",
    "Tema 20: Control de errores",
    "Tema 21: Cursores",
    "Tema 22: Triggers"
];

const Module11: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [query, setQuery] = useState('SELECT \nFROM \nWHERE \n');
    const [result, setResult] = useState<string | null>(null);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 11: SQL" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const checkSQL = () => {
        const q = query.toLowerCase();
        if (q.includes('select') && q.includes('*') && q.includes('from') && q.includes('users')) {
            setResult('ID | Username | Role\n1  | admin    | super\n2  | guest    | user\n\n> 2 rows in set');
            setTimeout(() => onComplete(), 2000);
        } else {
            setResult('Error: syntax error or table not found (Hint: SELECT * FROM users)');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in flex flex-col items-center justify-center">
            <div className="w-full flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-blue-400 font-mono font-bold tracking-widest text-sm uppercase">Módulo 11: SQL</span>
            </div>

            <div className="bg-[#1e1e1e] border border-light/10 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full">
                <div className="bg-[#2d2d2d] px-4 py-2 border-b border-light/10 flex justify-between">
                    <span className="text-xs font-mono text-light/50">PostgreSQL Console</span>
                </div>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 w-full bg-[#1a1a1a] text-blue-300 font-mono p-4 focus:outline-none resize-none"
                    spellCheck="false"
                    rows={5}
                />
                <div className="p-4 border-t border-light/10">
                    <button onClick={checkSQL} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition">Ejecutar Query</button>
                </div>

                {result && (
                    <div className="p-4 bg-black font-mono text-green-400 text-sm whitespace-pre-wrap border-t border-light/10">
                        {result}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Module11;
