import React, { useState } from 'react';
import { X, Mail, Lock, Shield, LogOut, Check, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, signInWithPassword, signUpWithPassword, signInWithGoogle, signOut } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Kripya valid email address enter karein.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password kam se kam 6 characters ka hona chahiye.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInWithPassword(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          setMessage(res.message || 'Login safal raha!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const res = await signUpWithPassword(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          setMessage(res.message || 'Account safalta-purvak create ho gaya!');
          // If session was created, auto-close; otherwise prompt to login
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setError(err.message || (mode === 'login' ? 'Login failed' : 'Sign up failed'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {user ? (
          /* User Profile & Sign Out */
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/40 flex items-center justify-center text-xl font-black mx-auto">
              {user.email.charAt(0).toUpperCase()}
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {user.name || user.email.split('@')[0]}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{user.email}</p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 mt-2">
                  <Shield className="w-3 h-3" />
                  ADMIN PRIVILEGES ACTIVE
                </span>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="w-full h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-400 font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('signOut')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Email + Password Auth Form */
          <div className="space-y-4">
            {/* Header Icon & Title */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-lime-400/20 text-lime-400 border border-lime-400/30 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-white">
                {mode === 'login' ? 'Creator Login' : 'Naya Account Banayein'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {mode === 'login'
                  ? 'Apne unlocked prompts aur orders dekhne ke liye login karein.'
                  : 'PromptBazaar par instant account banayein aur shopping karein.'}
              </p>
            </div>

            {/* Mode Tabs: Login vs Sign Up */}
            <div className="grid grid-cols-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-lime-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-lime-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Google Login Button */}
            <button
              onClick={async () => {
                setLoading(true);
                setError('');
                const res = await signInWithGoogle();
                if (res.error) {
                  setError(res.error);
                } else {
                  setMessage('Google Login safal raha!');
                  setTimeout(() => onClose(), 800);
                }
                setLoading(false);
              }}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-white hover:bg-gray-100 disabled:opacity-60 text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer border border-gray-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>{t('continueWithGoogle')}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="creator@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min 6 characters password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  <span>Login Karein</span>
                ) : (
                  <span>Account Banayein</span>
                )}
              </button>
            </form>

            {/* Bottom Toggle Link */}
            <div className="pt-2 text-center">
              {mode === 'login' ? (
                <p className="text-xs text-zinc-400">
                  Naya account banana hai?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-lime-400 font-bold hover:underline"
                  >
                    Sign Up karein
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Pehle se account hai?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-lime-400 font-bold hover:underline"
                  >
                    Login karein
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
