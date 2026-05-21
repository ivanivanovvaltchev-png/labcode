import React, { useState } from 'react';
import ModuleCurriculum, { ThemeScene } from './ModuleCurriculum';

interface Module2Props {
    onBack: () => void;
    onComplete: () => void;
}

const Module2: React.FC<Module2Props> = ({ onBack, onComplete }) => {
    const [isChallengeActive, setIsChallengeActive] = useState(false);

    // Logic for Final Challenge
    const [finalInput, setFinalInput] = useState("");
    const [finalError, setFinalError] = useState("");
    const [finalSuccess, setFinalSuccess] = useState(false);

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = finalInput.trim();
        // Check for an algorithm structure printing "Hola Mundo"
        const isValid = /Escribir\s+["']Hola\s+Mundo["']/i.test(code) || /Imprimir\s+["']Hola\s+Mundo["']/i.test(code);

        if (isValid) {
            setFinalSuccess(true);
            setFinalError('');
        } else {
            setFinalError('El código no es correcto. Asegúrate de usar la instrucción de salida (Escribir) e imprimir exactamente "Hola Mundo" entre comillas.');
            setFinalSuccess(false);
        }
    };

    const modulesScenes: ThemeScene[] = [
        {
            title: "Tema 1: Tu primer algoritmo (Variables)",
            theory: (
                <div className="space-y-4">
                    <p>En programación, una <strong>Variable</strong> es una caja donde guardamos información. Como si fuera una etiqueta, le damos un nombre ("nombre", "edad", "puntos").</p>
                    <p>En PSeInt, primero se define de qué tipo es la variable (Entero, Real, Logico, Texto) y luego se le asigna un valor con la flecha <code>&lt;-</code>.</p>
                    <div className="bg-black/30 p-4 rounded-lg font-mono text-sm border border-light/10 text-green-400">
                        Definir nombre Como Texto<br />
                        nombre &lt;- "Juan"<br />
                        Escribir nombre
                    </div>
                </div>
            ),
            type: 'game_editor',
            gameDescription: "Byte no recuerda quién es. Asígnale la cadena \"Byte\" a la variable 'nombre' y pídele que la diga (Escribir).",
            gameAction: "wake",
            initialCode: "Definir nombre Como Texto\nnombre <- \n\n",
            // Regex validates assignation of "Byte" and usage of Escribir nombre
            validationRegex: /nombre\s*<-\s*["']Byte["']\s*\n*\s*Escribir\s+nombre/i,
            successMsg: "¡Has inicializado correctamente a Byte!"
        },
        {
            title: "Tema 2: Operadores y Aritmética",
            theory: (
                <div className="space-y-4">
                    <p>Podemos usar variables numéricas para hacer <strong>cálculos matemáticos</strong>. Los operadores básicos son <code>+</code>, <code>-</code>, <code>*</code> (multiplicar), <code>/</code> (dividir) y <code>MOD</code> (resto).</p>
                    <p>Al imprimir (Escribir), puedes hacer el cálculo directamente o imprimir una variable que lo contenga.</p>
                    <div className="bg-black/30 p-4 rounded-lg font-mono text-sm border border-light/10 text-green-400">
                        Definir base, altura Como Entero<br />
                        base &lt;- 10<br />
                        Escribir base * 5
                    </div>
                </div>
            ),
            type: 'game_editor',
            gameDescription: "Byte necesita saltar un foso. La distancia se calcula basexaltura. Define la base a 2, la altura a 4, y Escribe el cálculo base * altura.",
            gameAction: "jump",
            initialCode: "Definir base, altura Como Entero\nbase <- 2\naltura <- 4\n// Imprime la multiplicación aquí:\n",
            validationRegex: /Escribir\s+base\s*\*\s*altura|Escribir\s+altura\s*\*\s*base/i,
            successMsg: "¡Cálculo correcto! La física ha funcionado a la perfección."
        },
        {
            title: "Tema 3: Control Condicional (SI-ENTONCES)",
            theory: (
                <div className="space-y-4">
                    <p>Un programa no siempre hace lo mismo. Las <strong>Condiciones</strong> permiten tomar decisiones. Utilizamos la estructura <code>Si ... Entonces</code>.</p>
                    <p>Los operadores lógicos evalúan condiciones: <code>=</code> (igual), <code>&gt;</code> (mayor), <code>&lt;</code> (menor).</p>
                    <div className="bg-black/30 p-4 rounded-lg font-mono text-sm border border-light/10 text-green-400">
                        Si energia &gt; 0 Entonces<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;Escribir "Podemos movernos"<br />
                        FinSi
                    </div>
                </div>
            ),
            type: 'game_editor',
            gameDescription: "Byte encuentra una puerta con Candado. Haz una condición: Si llaveUsuario es igual a Verdadero, Entonces Escribir \"Abrir\".",
            gameAction: "open",
            initialCode: "Definir llaveUsuario Como Logico\nllaveUsuario <- Verdadero\n\n// Escribe la condición aquí:\n",
            validationRegex: /Si\s+llaveUsuario\s*={1,2}\s*Verdadero\s+Entonces\s*\n*\s*Escribir\s+["']Abrir["']\s*\n*\s*Fin[ ]*Si/i,
            successMsg: "¡Lógica booleana aceptada! Candado desbloqueado."
        },
        {
            title: "Tema 4: Estructuras Iterativas (Bucles)",
            theory: (
                <div className="space-y-4">
                    <p>A veces tenemos que repetir una acción muchas veces. No queremos escribir el código 100 veces. Usamos los <strong>Bucles</strong>.</p>
                    <p>El bucle <code>Para</code> se usa cuando sabemos exactamente cuántas veces vamos a repetir algo (por ejemplo, contar del 1 al 10).</p>
                    <div className="bg-black/30 p-4 rounded-lg font-mono text-sm border border-light/10 text-green-400">
                        Para i&lt;-1 Hasta 10 Hacer<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;Escribir "Paso ", i<br />
                        FinPara
                    </div>
                </div>
            ),
            type: 'game_editor',
            gameDescription: "Byte debe subir 3 escalones de pura energía. Escribe un bucle Para que vaya desde 1 hasta 3, y dentro haz Escribir \"Subir\".",
            gameAction: "climb",
            initialCode: "// Escribe el bucle Para completo:\nPara i<-1 Hasta 3 Hacer\n    \nFinPara",
            validationRegex: /Para\s+i\s*<-\s*1\s+Hasta\s+3\s+Hacer\s*\n*\s*Escribir\s+["']Subir["']\s*\n*\s*Fin[ ]*Para/i,
            successMsg: "¡Iteraciones procesadas! Altura máxima alcanzada."
        },
        {
            title: "Tema 5: Arrays y Listas",
            theory: (
                <div className="space-y-4">
                    <p>Un <strong>Array (Arreglo)</strong> es como una cajonera donde cada cajón tiene un número (índice) y guarda algo dentro.</p>
                    <p>En PSeInt creamos arreglos con <code>Dimension</code>. IMPORTANTE: En la mayoría de lenguajes modernos los arreglos empiezan en la posición 0, pero en PSeInt puro empiezan en la 1.</p>
                    <div className="bg-black/30 p-4 rounded-lg font-mono text-sm border border-light/10 text-green-400">
                        Dimension mochila[3]<br />
                        mochila[1] &lt;- "Espada"<br />
                        Escribir mochila[1]
                    </div>
                </div>
            ),
            type: 'game_editor',
            gameDescription: "Hay una lista de comandos. Accede a la posición [2] del array comandos (que contiene 'Poder') y Escríbelo para activar el PowerUp de Byte.",
            gameAction: "powerup",
            initialCode: "Dimension comandos[3]\ncomandos[1] <- \"Correr\"\ncomandos[2] <- \"Poder\"\n\n// Accede aquí al array para Escribir el Poder:\n",
            validationRegex: /Escribir\s+comandos\[2\]/i,
            successMsg: "¡Sobrecarga de sistema! Arreglos dominados."
        }
    ];

    if (isChallengeActive) {
        return (
            <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen fade-in flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => setIsChallengeActive(false)} className="text-light/50 hover:text-light flex items-center gap-2 transition-colors">
                        ← Volver a Códices
                    </button>
                    <span className="text-primary font-mono font-bold tracking-widest text-sm uppercase">BOSS FIGHT</span>
                </div>

                <div className="bg-[#121212] border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col flex-1 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>

                    <div className="p-8 lg:p-12 text-center border-b border-light/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#0f0f0f] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                        <div className="w-24 h-24 mx-auto bg-primary/20 rounded-xl border border-primary/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] relative z-10 transform rotate-3">
                            <span className="text-5xl">👑</span>
                        </div>

                        <h2 className="text-3xl font-extrabold text-light mb-4 tracking-tight relative z-10">
                            La Prueba del Creador
                        </h2>
                        <p className="max-w-xl mx-auto text-light/70 text-lg relative z-10">
                            Todo programa, sistema operativo o juego increíble comenzó con un simple Hola Mundo. Escribe el algoritmo madre de PSeInt.
                        </p>
                    </div>

                    <div className="p-8 lg:p-12 bg-[#1a1a1a] flex-1 flex flex-col justify-center">
                        <div className="max-w-2xl mx-auto w-full">
                            <form onSubmit={handleFinalSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-mono text-primary flex justify-between">
                                        <span>Editor del Núcleo</span>
                                        <span>.psc</span>
                                    </label>
                                    <div className="bg-[#0a0a0a] rounded-xl border border-light/20 focus-within:border-primary shadow-inner p-1">
                                        <div className="bg-[#1e1e1e] px-4 py-2 border-b border-light/10 text-xs font-mono text-light/50 flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                        </div>
                                        <textarea
                                            value={finalInput}
                                            onChange={(e) => setFinalInput(e.target.value)}
                                            className="w-full h-48 bg-transparent text-light font-mono p-4 outline-none resize-none hide-scrollbar placeholder-light/20 focus:text-accent"
                                            placeholder="Algoritmo HolaMundo&#10;    // Escribe tu código aquí...&#10;FinAlgoritmo"
                                            spellCheck="false"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {finalError && (
                                    <div className="text-red-400 bg-red-400/10 p-4 rounded-lg text-sm border border-red-400/20 font-mono animate-pulse">
                                        [ERROR LEXICO]: {finalError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!finalInput.trim() || finalSuccess}
                                    className="w-full py-4 text-lg font-bold rounded-xl bg-primary hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-1"
                                >
                                    Compilar y Ejecutar
                                </button>
                            </form>

                            {finalSuccess && (
                                <div className="mt-8 text-center fade-in">
                                    <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-2xl relative overflow-hidden backdrop-blur-sm">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
                                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] relative z-10">
                                            <span className="text-4xl">🌟</span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-green-400 mb-2 relative z-10">¡Hola Mundo ejecutado!</h3>
                                        <p className="text-green-300 text-sm mb-8 relative z-10">
                                            La consola lee tu código alto y claro. El Módulo 2 ha sido conquistado oficialmente.
                                        </p>

                                        <button
                                            onClick={onComplete}
                                            className="px-8 py-3 bg-green-500 text-dark font-black rounded-xl hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all animate-bounce relative z-10"
                                        >
                                            Reclamar Recompensa (150 XP) →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ModuleCurriculum
            title="Módulo 2: PSeInt (Motor Code & Play)"
            scenes={modulesScenes}
            onBack={onBack}
            onStartChallenge={() => setIsChallengeActive(true)}
        />
    );
};

export default Module2;
