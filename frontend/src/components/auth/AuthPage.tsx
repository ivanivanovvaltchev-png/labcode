import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Mode = 'signin' | 'signup';

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<Mode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error: authError } = mode === 'signin'
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (authError) {
            setError(translateError(authError.message));
        } else if (mode === 'signup') {
            setSuccess('¡Cuenta creada! Revisa tu email para confirmarla antes de entrar.');
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        setLoading(true);
        setError(null);
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (authError) { setError(translateError(authError.message)); setLoading(false); }
    };

    const switchMode = () => {
        setMode(m => m === 'signin' ? 'signup' : 'signin');
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-violet-500/5 blur-[100px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-wider text-white leading-none">LabCode</div>
                        <div className="text-xs text-white/30 tracking-widest uppercase">by ConquerBlocks</div>
                    </div>
                </div>

                <div className="bg-[#161616] border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1 text-center">
                        {mode === 'signin' ? 'Bienvenido de vuelta' : 'Crea tu cuenta gratis'}
                    </h2>
                    <p className="text-white/40 text-sm text-center mb-6">
                        {mode === 'signin' ? 'Continúa tu entrenamiento donde lo dejaste' : 'Tu progreso siempre sincronizado'}
                    </p>

                    {/* Google */}
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-800 font-semibold py-3 rounded-xl mb-4 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/25 text-xs">o con email</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <form onSubmit={handleEmail} className="space-y-3">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                        />
                        <input
                            type="password"
                            placeholder="Contraseña (mínimo 6 caracteres)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                            className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                        />

                        {error && (
                            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-4 py-3">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-1"
                        >
                            {loading ? 'Cargando…' : mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                        </button>
                    </form>

                    <p className="text-center text-white/40 text-sm mt-5">
                        {mode === 'signin' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                        <button onClick={switchMode} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                            {mode === 'signin' ? 'Regístrate gratis' : 'Inicia sesión'}
                        </button>
                    </p>
                </div>

                <p className="text-center text-white/20 text-xs mt-4">
                    Tu progreso se guarda de forma segura en la nube
                </p>
            </div>
        </div>
    );
};

function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
    if (msg.includes('Email not confirmed')) return 'Confirma tu email antes de entrar.';
    if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email.';
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('Unable to validate')) return 'Error de configuración. Contacta con soporte.';
    return msg;
}

export default AuthPage;
