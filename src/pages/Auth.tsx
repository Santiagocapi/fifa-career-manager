// ============================================================
// src/pages/Auth.tsx
// Login / Register page.
// Uses React Hook Form for form state + validation.
//
// WHY REACT HOOK FORM?
// Regular forms with useState get messy fast:
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [emailError, setEmailError] = useState('')
//   ... 10 more useState calls ...
//
// React Hook Form handles all of this with ONE register() call.
// It also only re-renders when necessary (better performance).
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { clsx } from 'clsx';

interface AuthFormData {
  email: string;
  password: string;
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (mode === 'login') {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        setSubmitError(error);
      } else {
        navigate('/careers');
      }
    } else {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        setSubmitError(error);
      } else {
        setSubmitSuccess('Account created! Check your email to confirm, then log in.');
        setMode('login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-pitch-900 flex items-center justify-center p-4">
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full
                        bg-neon-400/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center
                          w-16 h-16 rounded-2xl bg-neon-400/10 border border-neon-400/20
                          mb-4 shadow-neon">
            <Shield size={32} className="text-neon-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">
            Career Manager
          </h1>
          <p className="text-white/50 text-sm">
            Your FIFA coaching career hub
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-pitch-900 rounded-xl mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setSubmitError(null); setSubmitSuccess(null); }}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  mode === m
                    ? 'bg-neon-400 text-pitch-950 shadow-neon-sm'
                    : 'text-white/50 hover:text-white'
                )}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email field */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  placeholder="manager@club.com"
                  className="pl-10 w-full"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            {/* Password field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 w-full"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: mode === 'register'
                      ? { value: 6, message: 'Password must be at least 6 characters' }
                      : undefined
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {/* Error / Success messages */}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="bg-neon-400/10 border border-neon-400/20 rounded-xl p-3 text-neon-400 text-sm">
                {submitSuccess}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center mt-2 py-3"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Loading...</>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
