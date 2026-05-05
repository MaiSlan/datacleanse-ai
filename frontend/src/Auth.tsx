import { useState } from 'react';
import { supabase } from './lib/supabase';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.07] p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-xl mb-4">
            <Sparkles size={28} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to DataCleanse AI</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in or create an account to continue</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 bg-red-950/50 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading || !email || !password}
              className="flex-1 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}