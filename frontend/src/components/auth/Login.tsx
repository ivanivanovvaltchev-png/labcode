import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', isError: false });

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setMessage({ text: error.message, isError: true });
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setMessage({ text: error.message, isError: true });
            } else {
                setMessage({ text: '¡Registro exitoso! Ya puedes iniciar sesión (o revisa tu correo si tienes confirmación activada).', isError: false });
                setIsLogin(true);
            }
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/'
            }
        });
        if (error) setMessage({ text: "Error de Google: Es posible que no lo hayas habilitado en Supabase -> Authentication -> Providers.", isError: true });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] p-4 font-inter text-light fade-in">
            <div className="max-w-md w-full p-8 bg-[#121212] border border-light/10 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)] border border-light/10">
                        <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">LabCode</h2>
                    <p className="text-light/50 text-sm">{isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta de estudiante'}</p>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg text-sm text-center ${message.isError ? 'bg-red-900/20 text-red-400 border border-red-500/30' : 'bg-green-900/20 text-green-400 border border-green-500/30'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-mono text-light/50 uppercase tracking-wider mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-light/20 rounded-lg px-4 py-3 text-light focus:outline-none focus:border-primary transition-colors"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-light/50 uppercase tracking-wider mb-2">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-light/20 rounded-lg px-4 py-3 text-light focus:outline-none focus:border-primary transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </button>
                </form>

                <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-light/10"></div>
                    <span className="flex-shrink-0 mx-4 text-light/30 text-xs">o continúa con</span>
                    <div className="flex-grow border-t border-light/10"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] border border-light/10 text-light py-3 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors mt-2"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    Google
                </button>

                <div className="mt-8 text-center text-sm text-light/50">
                    {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setMessage({ text: '', isError: false }); }}
                        className="text-primary hover:underline font-medium"
                    >
                        {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
