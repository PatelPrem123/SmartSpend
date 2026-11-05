import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Wallet, Lock, Mail, User, ArrowRight, AlertCircle, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await register(name, email, password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const hasLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Get instant access to multi-account budgeting & precision reports
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>

            <div className="mt-2.5 space-y-1.5 px-1">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasLength ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  {hasLength && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className={hasLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasLetter && hasNumber ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  {hasLetter && hasNumber && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className={hasLetter && hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                  Contains letters and numbers
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !hasLength || !hasLetter || !hasNumber}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
