import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveKnowledgeProfile, loadKnowledgeProfile, clearKnowledgeProfile, KnowledgeProfile } from '../../lib/knowledgeProfile';
import { analyzeKnowledgeFromCode } from '../../ai/knowledgeAnalyzer';

const KnowledgePage: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<KnowledgeProfile | null>(null);
    const [pendingFiles, setPendingFiles] = useState<{ name: string; content: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setProfile(loadKnowledgeProfile());
    }, []);

    const readFiles = (files: FileList) => {
        const pyFiles = Array.from(files).filter(f => f.name.endsWith('.py'));
        if (pyFiles.length === 0) {
            setError('Solo se aceptan archivos .py');
            return;
        }
        setError('');
        const readers = pyFiles.map(file =>
            new Promise<{ name: string; content: string }>(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve({ name: file.name, content: e.target?.result as string });
                reader.readAsText(file);
            })
        );
        Promise.all(readers).then(results => {
            setPendingFiles(prev => {
                const existing = new Set(prev.map(f => f.name));
                return [...prev, ...results.filter(r => !existing.has(r.name))];
            });
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        readFiles(e.dataTransfer.files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) readFiles(e.target.files);
    };

    const removeFile = (name: string) => {
        setPendingFiles(prev => prev.filter(f => f.name !== name));
    };

    const handleAnalyze = async () => {
        if (pendingFiles.length === 0) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const allCode = pendingFiles.map(f => `# --- ${f.name} ---\n${f.content}`).join('\n\n');
            const result = await analyzeKnowledgeFromCode(allCode);
            const newProfile: KnowledgeProfile = {
                concepts: result.concepts,
                summary: result.summary,
                analyzedFiles: [
                    ...(profile?.analyzedFiles ?? []),
                    ...pendingFiles.map(f => f.name).filter(n => !profile?.analyzedFiles.includes(n)),
                ],
                updatedAt: Date.now(),
            };
            saveKnowledgeProfile(newProfile);
            setProfile(newProfile);
            setPendingFiles([]);
        } catch {
            setError('Error al analizar los archivos. Comprueba tu clave de API.');
        }
        setIsAnalyzing(false);
    };

    const handleClear = () => {
        clearKnowledgeProfile();
        setProfile(null);
        setPendingFiles([]);
    };

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' · ' + new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/')} className="text-light/50 hover:text-light transition-colors text-sm">
                    ← Volver al mapa
                </button>
            </div>

            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-3">
                    📂 Mi Perfil de Aprendizaje
                </h1>
                <p className="text-light/50 text-sm max-w-xl mx-auto">
                    Sube tus ejercicios en Python y el sistema analizará qué conceptos ya conoces. El Mentor y el resto del proyecto adaptarán su enseñanza a tu nivel real.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload panel */}
                <div className="flex flex-col gap-4">
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                            dragOver
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-light/20 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                        }`}
                    >
                        <div className="text-4xl mb-3">📁</div>
                        <div className="text-sm font-semibold text-light/70 mb-1">Arrastra tus archivos .py aquí</div>
                        <div className="text-xs text-light/40">o haz clic para seleccionarlos</div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".py"
                            multiple
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>

                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                    {pendingFiles.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-4">
                            <div className="text-xs font-semibold text-light/50 uppercase tracking-wider mb-3">
                                Archivos listos para analizar
                            </div>
                            <div className="space-y-2 mb-4">
                                {pendingFiles.map(f => (
                                    <div key={f.name} className="flex items-center justify-between bg-[#0f0f0f] rounded-xl px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-emerald-400 text-sm">🐍</span>
                                            <span className="text-sm text-light/70 truncate">{f.name}</span>
                                        </div>
                                        <button onClick={() => removeFile(f.name)} className="text-light/30 hover:text-red-400 transition-colors text-xs ml-2 flex-shrink-0">✕</button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                            >
                                {isAnalyzing ? 'Analizando con IA…' : `Analizar ${pendingFiles.length} archivo${pendingFiles.length > 1 ? 's' : ''} →`}
                            </button>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="bg-[#1a1a1a] border border-emerald-500/20 rounded-2xl p-6 text-center">
                            <div className="flex justify-center gap-1 mb-3">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <p className="text-sm text-light/50">La IA está leyendo tu código y detectando qué conceptos conoces…</p>
                        </div>
                    )}
                </div>

                {/* Profile panel */}
                <div>
                    {profile ? (
                        <div className="bg-[#1a1a1a] border border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">✅ Perfil activo</span>
                                <span className="text-xs text-light/30">{formatDate(profile.updatedAt)}</span>
                            </div>

                            <div>
                                <div className="text-xs text-light/40 mb-2">Resumen de nivel</div>
                                <p className="text-sm text-light/70 leading-relaxed bg-[#0f0f0f] rounded-xl p-3">{profile.summary}</p>
                            </div>

                            <div>
                                <div className="text-xs text-light/40 mb-2">Conceptos detectados ({profile.concepts.length})</div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.concepts.map(c => (
                                        <span key={c} className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-full">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {profile.analyzedFiles.length > 0 && (
                                <div>
                                    <div className="text-xs text-light/40 mb-2">Archivos analizados</div>
                                    <div className="space-y-1">
                                        {profile.analyzedFiles.map(f => (
                                            <div key={f} className="text-xs text-light/40 flex items-center gap-1.5">
                                                <span className="text-emerald-500">🐍</span> {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleClear}
                                className="text-xs text-light/30 hover:text-red-400 transition-colors text-left mt-1"
                            >
                                Borrar perfil y empezar de cero
                            </button>
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1a] border border-light/10 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center gap-3">
                            <div className="text-4xl">📊</div>
                            <div className="text-sm font-semibold text-light/40">Aún no hay perfil</div>
                            <div className="text-xs text-light/30 max-w-xs">
                                Sube tus archivos .py y el sistema detectará qué has aprendido hasta ahora.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {profile && (
                <div className="mt-6 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-lg">💡</span>
                    <p className="text-sm text-light/50">
                        El <strong className="text-light/70">Modo Mentor</strong> y los ejercicios del proyecto ya están usando este perfil para adaptarse a tu nivel. Si aprendes conceptos nuevos, vuelve aquí y sube más archivos para actualizarlo.
                    </p>
                </div>
            )}
        </div>
    );
};

export default KnowledgePage;
