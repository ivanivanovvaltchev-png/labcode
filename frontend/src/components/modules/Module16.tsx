import React, { useState } from 'react';
import ModuleCurriculum from './ModuleCurriculum';

interface ModuleProps {
    onComplete: () => void;
    onBack: () => void;
}

const themes = [
    "Tema 1: Tipos de procesos de selección",
    "Tema 2: Procesos de selección",
    "Tema 3: Investigación de la empresa objetivo",
    "Tema 4: Tipos de procesos",
    "Tema 5: La importancia del currículum",
    "Tema 6: Búsqueda de empleo en redes sociales I",
    "Tema 7: Búsqueda de empleo en redes sociales II",
    "Tema 8: Nuestra huella digital",
    "Tema 9: Soft Skills y Hard Skills",
    "Tema 10: Tu mejor versión",
    "Tema 11: Comunicación no verbal (CNV)",
    "Tema 12: Comunicación no verbal 2 (CNV)",
    "Tema 13: La entrevista",
    "Tema 14: Preguntas fáciles",
    "Tema 15: Preguntas prohibidas",
    "Tema 16: Final de la entrevista y consejos del reclutador"
];

const Module16: React.FC<ModuleProps> = ({ onComplete, onBack }) => {
    const [showCurriculum, setShowCurriculum] = useState(true);

    const [currentQ, setCurrentQ] = useState(0);
    const [hp, setHp] = useState(3);
    const [bossHp, setBossHp] = useState(3);
    if (showCurriculum) {
        return <ModuleCurriculum title="MÓDULO 16: PREPARACIÓN DE ENTREVISTAS DE TRABAJO" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;
    }

    const questions = [
        {
            q: '¿Qué es un closure en JavaScript?',
            options: ['Un objeto nativo del navegador', 'Una función que recuerda el ámbito léxico donde fue creada', 'Un tipo de base de datos'],
            a: 1
        },
        {
            q: '¿Cuál es la función del Virtual DOM en React?',
            options: ['Optimizar las actualizaciones usando una copia en memoria', 'Proteger contra XSS', 'Manejar la base de datos SQL'],
            a: 0
        },
        {
            q: '¿Por qué elegir PostgreSQL sobre MongoDB?',
            options: ['Por ser más rápido siempre', 'Por su rigido esquema relacional y soporte de transacciones complejas ACID', 'Porque usa JSON de forma nativa'],
            a: 1
        }
    ];


    const answer = (idx: number) => {
        if (idx === questions[currentQ].a) {
            setBossHp(prev => prev - 1);
            if (currentQ < questions.length - 1) {
                setCurrentQ(prev => prev + 1);
            } else {
                setTimeout(() => onComplete(), 2000);
            }
        } else {
            setHp(prev => Math.max(0, prev - 1));
            if (hp <= 1) {
                // failed
                alert('Entrevista fallida. Tendrás que repasar tus conceptos.');
                onBack();
            }
        }
    };

    if (bossHp <= 0) {
        return (
            <div className="max-w-4xl mx-auto p-8 fade-in text-center mt-32">
                <h1 className="text-6xl text-primary font-bold mb-8">¡OFERTA ACEPTADA!</h1>
                <p className="text-2xl text-light/70 mb-8">Has dominado el Master Full Stack y superado la Entrevista Técnica.</p>
                <button onClick={onBack} className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition text-lg">
                    Volver al Mundo
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 fade-in flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-light/50 hover:text-light flex items-center gap-2">
                    ← Volver al Mapa
                </button>
                <span className="text-red-500 font-mono font-bold tracking-widest text-sm uppercase">Módulo 16: Boss Final</span>
            </div>

            <div className="flex w-full justify-between items-center mb-12">
                <div className="text-center">
                    <div className="text-4xl mb-2">💻</div>
                    <div className="text-primary font-bold">Tu (Candidato)</div>
                    <div className="flex gap-1 mt-2 justify-center">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded shrink-0 ${i < hp ? 'bg-primary' : 'bg-[#0f0f0f] border border-light/10'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="text-4xl text-light/20 font-bold">VS</div>

                <div className="text-center">
                    <div className="text-4xl mb-2 animate-pulse">🕴️</div>
                    <div className="text-red-500 font-bold">Tech Lead</div>
                    <div className="flex gap-1 mt-2 justify-center">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded shrink-0 ${i < bossHp ? 'bg-red-500' : 'bg-[#0f0f0f] border border-light/10'}`}></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#0f0f0f]/80 p-8 rounded-2xl border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)] w-full">
                <h3 className="text-2xl font-bold text-light mb-6 text-center">"{questions[currentQ].q}"</h3>

                <div className="flex flex-col gap-4">
                    {questions[currentQ].options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => answer(i)}
                            className="w-full text-left p-4 rounded-xl border border-light/10 bg-[#0f0f0f] hover:bg-light/5 hover:border-primary/50 transition-all font-medium"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Module16;
