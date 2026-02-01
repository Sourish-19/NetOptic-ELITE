import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Loader } from 'lucide-react';

interface LoginPageProps {
    onLogin: (token: string, user: any) => void;
    onSwitchToSignup: () => void;
    API_BASE_URL: string;
    onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignup, API_BASE_URL, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Login failed');

            onLogin(data.token, data.user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-royal-950 text-emerald-50 p-4">
            <div className="w-full max-w-md p-8 bg-royal-900/50 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-2xl">
                <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
                <p className="text-center text-emerald-500/60 mb-8">Sign in to access NetOptic</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-emerald-500/80 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-emerald-500/40" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-royal-950/50 border border-emerald-500/20 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-emerald-500/20"
                                placeholder="eng@netoptic.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-emerald-500/80 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-emerald-500/40" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-royal-950/50 border border-emerald-500/20 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-emerald-500/20"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-emerald-500/60 flex flex-col gap-4">
                    <div>
                        Don't have an account?{' '}
                        <button onClick={onSwitchToSignup} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                            Sign up
                        </button>
                    </div>
                    <button onClick={onBack} className="text-emerald-500/40 hover:text-emerald-500/60 text-xs transition-colors">
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
