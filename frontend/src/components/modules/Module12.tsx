import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Introducción a Django",
    "Tema 2: Tu primer proyecto en Django",
    "Tema 3: Entorno de Desarrollo",
    "Tema 4: Modelo MVT",
    "Tema 5: Estructura de ficheros del proyecto",
    "Tema 6: Creación de tu primera aplicación",
    "Tema 7: Modelos I",
    "Tema 8: Modelos II",
    "Tema 9: Queries",
    "Tema 10: Admin de Django",
    "Tema 11: Views",
    "Tema 12: Urls",
    "Tema 13: Formularios",
    "Tema 14: Model Forms",
    "Tema 15: Templates",
    "Tema 16: Autenticación",
    "Tema 17: CCBV vs Function Views",
    "Tema 18: ListView y DetailView",
    "Tema 19: FormView, CreateView y UpdateView",
    "Tema 20: DeleteView",
    "Tema 21: Decorators, Middlewares y Session",
    "Tema 22: Tests",
    "Tema 23: Internacionalización y Rosetta"
];

const Module12: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [url, setUrl] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 12: DJANGO" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }


    const testDjangoEndpoint = () => {
        if (url.includes('/api/v1/users/') || url.includes('/api/users/')) {
            setResponse('HTTP 200 OK\nAllow: GET, POST, HEAD, OPTIONS\n\n{\n  "count": 1,\n  "results": [\n    {"id": 1, "username": "admin"}\n  ]\n}');
            setTimeout(() => onComplete(), 2000);
        } else {
            setResponse('HTTP 404 Not Found\n\nDetalles: No endpoint matches the given query.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in flex flex-col items-center justify-center">
            <div className="w-full flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-[#092E20] bg-green-500/20 px-2 py-1 rounded font-mono font-bold tracking-widest text-sm uppercase">Módulo 12: Django</span>
            </div>

            <div className="bg-[#0f0f0f]/80 p-8 rounded-2xl border border-[#092E20] shadow-[0_0_40px_rgba(9,46,32,0.6)] w-full">
                <h2 className="text-2xl font-bold text-light mb-4">DRF - Django Rest Framework</h2>
                <p className="text-light/60 mb-6">
                    Tu API de Django está alojada localmente. Introduce la URL correcta para obtener la lista de usuarios. (Hint: Usa `/api/users/`)
                </p>

                <div className="flex gap-2 w-full mb-6">
                    <span className="bg-[#0f0f0f] border border-light/10 text-light/50 px-4 py-2 rounded-l flex items-center">GET</span>
                    <input
                        type="text"
                        placeholder="http://localhost:8000/api/users/"
                        className="flex-1 bg-white/5 border border-light/10 text-light px-4 py-2 outline-none focus:border-green-500 transition-colors"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                    />
                    <button
                        onClick={testDjangoEndpoint}
                        className="bg-[#092E20] hover:bg-green-900 border border-green-700 text-green-400 px-6 py-2 rounded-r font-bold transition-colors"
                    >
                        Send
                    </button>
                </div>

                {response && (
                    <div className="bg-black/90 p-4 border border-light/10 rounded font-mono text-xs text-green-300 whitespace-pre-wrap">
                        {response}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Module12;
