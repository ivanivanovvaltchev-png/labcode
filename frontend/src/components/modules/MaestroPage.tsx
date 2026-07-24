import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callDeepSeekForMaestro, ChatMessage } from '../../ai/agents';
import { loadSelectedPath } from '../../lib/selectedPath';
import { getPathById } from '../../data/careerPaths';
import { getMejoraKnowledgeIndex } from '../../lib/mejoraSections';
import { getProgressSummaryText } from '../../lib/masteryEngine';

const STORAGE_KEY = 'labcode_maestro_session';

function loadHistory(): ChatMessage[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveHistory(messages: ChatMessage[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

const SUGGESTIONS = [
    '¿Cómo voy con mi camino hasta ahora?',
    '¿Qué tan importante son los sets en una entrevista técnica?',
    'Explícame la diferencia entre tuplas y listas otra vez',
    '¿Qué debería repasar antes de seguir avanzando?',
];

const MaestroPage: React.FC = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const pathId = loadSelectedPath();
    const path = pathId ? getPathById(pathId) : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const send = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;
        const updated: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
        setMessages(updated);
        saveHistory(updated);
        setInput('');
        setIsLoading(true);

        const knowledgeIndex = getMejoraKnowledgeIndex();
        const progressSummary = pathId ? getProgressSummaryText(pathId) : 'El alumno todavía no ha seleccionado un camino de aprendizaje.';
        const resp = await callDeepSeekForMaestro(updated, knowledgeIndex, progressSummary, path?.title ?? 'Programación');

        const withReply: ChatMessage[] = [...updated, { role: 'assistant', content: resp }];
        setMessages(withReply);
        saveHistory(withReply);
        setIsLoading(false);
    };

    const handleSend = () => send(input);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleNewConversation = () => {
        if (messages.length > 0 && !window.confirm('¿Empezar una conversación nueva? Se perderá el historial actual.')) return;
        localStorage.removeItem(STORAGE_KEY);
        setMessages([]);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 mb-3">
                <button onClick={() => navigate('/camino')} className="text-light/40 hover:text-light transition-colors text-sm">
                    ← Volver
                </button>
                {messages.length > 0 && (
                    <button onClick={handleNewConversation} className="text-xs text-light/30 hover:text-red-400 transition-colors">
                        Nueva conversación
                    </button>
                )}
            </div>

            <div className="flex flex-col bg-[#1a1a1a] border border-light/10 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
                <div className="px-5 py-3 border-b border-light/10 flex items-center gap-3 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm">🎓</div>
                    <div>
                        <div className="text-sm font-bold text-light">Maestro</div>
                        <div className="text-xs text-light/40">Pregúntale lo que quieras — temario, dudas, tu progreso, carrera profesional…</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl">🎓</div>
                            <div>
                                <p className="text-light font-semibold mb-1">Hola, soy Maestro</p>
                                <p className="text-sm text-light/40 max-w-sm">
                                    Pregúntame lo que quieras sobre tu temario, cómo va tu progreso, o dudas generales de programación y carrera profesional.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className="text-xs text-light/50 hover:text-light/80 bg-[#0f0f0f] border border-light/10 hover:border-amber-500/30 rounded-full px-3 py-1.5 transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600/20' : 'bg-amber-600/20'}`}>
                                {msg.role === 'user' ? '👤' : '🎓'}
                            </div>
                            <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/20 rounded-tr-none text-light' : 'bg-[#0f0f0f] border border-light/10 rounded-tl-none text-light/80'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-600/20 flex items-center justify-center text-xs flex-shrink-0">🎓</div>
                            <div className="bg-[#0f0f0f] border border-light/10 rounded-2xl rounded-tl-none px-4 py-3">
                                <div className="flex gap-1 items-center h-5">
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-light/10 flex-shrink-0">
                    <div className="flex gap-3">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pregúntale a Maestro… (Enter para enviar)"
                            disabled={isLoading}
                            rows={2}
                            className="flex-1 bg-[#0f0f0f] border border-light/10 rounded-xl px-4 py-3 text-sm text-light placeholder-light/30 resize-none focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50 max-h-[120px]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 rounded-xl transition-all self-end py-3"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaestroPage;
