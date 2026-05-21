import React, { useState } from 'react';

interface LoginProps {
    onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username.trim());
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center fade-in p-4 text-light">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">
                    Conquer<span className="text-primary">Blocks</span>
                </h1>
                <p className="text-light/60">El camino hacia convertirte en Full Stack Developer</p>
            </div>

            <div className="bg-[#1e1e1e] border border-light/10 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Inicia tu Aventura</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-light/70 mb-2">Nombre de Valiente (Usuario)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ej. Artorias, Ori..."
                            className="w-full bg-[#1a1a1a] border border-light/10 rounded-lg px-4 py-3 text-light focus:outline-none focus:border-primary transition-colors"
                            autoFocus
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all mt-4"
                    >
                        Entrar al Mundo
                    </button>
                </form>
            </div>

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]"></div>
            </div>
        </div>
    );
};

export default Login;
