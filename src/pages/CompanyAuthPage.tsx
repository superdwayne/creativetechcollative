import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Loader2, Mail, Lock, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyByUserId } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup';

const CompanyAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const checkExistingCompany = async () => {
      if (user) {
        const company = await getCompanyByUserId(user.id);
        if (company) {
          navigate('/company/dashboard');
        } else {
          navigate('/company/register');
        }
      }
    };

    if (!authLoading) {
      checkExistingCompany();
    }
  }, [user, authLoading, navigate]);

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Enter your email to reset your password.');
      return;
    }

    try {
      if (!supabase) {
        setError('Password reset unavailable: Supabase not configured.');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/company/auth?mode=login`,
      });
      if (resetError) {
        setError(resetError.message || 'Failed to send reset email.');
        return;
      }
      setInfoMessage('Password reset email sent. Check your inbox.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    }
  };

  const handleResendConfirmation = async () => {
    setError('');
    setSuccessMessage('');
    setInfoMessage('');
    setIsResending(true);

    if (!email.trim()) {
      setError('Enter your email to resend a confirmation link.');
      setIsResending(false);
      return;
    }

    try {
      if (!supabase) {
        setError('Email confirmation unavailable: Supabase not configured.');
        setIsResending(false);
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (resendError) {
        setError(resendError.message || 'Failed to resend confirmation email.');
        return;
      }
      setInfoMessage('Confirmation email resent. Check your inbox.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend confirmation email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage('Check your email to confirm your account, then log in.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0">
          {/* Small Label */}
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              CTC Company Portal
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium leading-[0.95] tracking-tight mb-6">
            <span className="block">{mode === 'login' ? 'Welcome back' : 'Partner with'}</span>
            <span className="block text-zinc-500">
              {mode === 'login' ? '' : 'CTC talent'}
            </span>
          </h1>

          {/* Description */}
          <p className="text-zinc-400 text-lg max-w-md font-secondary leading-relaxed mb-10">
            {mode === 'login'
              ? 'Log in to manage your company profile, submit job specs, and connect with creative technologists.'
              : 'Create an account to access our network of vetted creative technologists and find the perfect match for your projects.'
            }
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={cn(
                "px-6 py-3 font-secondary text-sm tracking-wide transition-all",
                mode === 'login'
                  ? "bg-white text-black"
                  : "border border-zinc-700 text-white hover:border-zinc-500"
              )}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={cn(
                "px-6 py-3 font-secondary text-sm tracking-wide transition-all",
                mode === 'signup'
                  ? "bg-white text-black"
                  : "border border-zinc-700 text-white hover:border-zinc-500"
              )}
            >
              Sign Up
            </button>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 border border-green-500/30 text-green-400 text-sm font-secondary">
              {successMessage}
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 p-4 border border-blue-500/30 text-blue-400 text-sm font-secondary">
              {infoMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm font-secondary">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@company.com"
                  className="pl-12 h-14 bg-transparent border-zinc-800 focus:border-zinc-600 font-secondary"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  className="pl-12 h-14 bg-transparent border-zinc-800 focus:border-zinc-600 font-secondary"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-12 h-14 bg-transparent border-zinc-800 focus:border-zinc-600 font-secondary"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Log In' : 'Create Account'
              )}
            </button>

            {mode === 'login' && (
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-secondary text-zinc-500 hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  Forgot your password?
                </button>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="text-xs font-secondary text-zinc-500 hover:text-white transition-colors"
                  disabled={isResending}
                >
                  {isResending ? 'Resending...' : 'Resend confirmation'}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8">
            <button
              onClick={() => navigate('/directory')}
              className="text-sm font-secondary text-zinc-500 hover:text-white transition-colors"
            >
              Browse our talent directory
            </button>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex flex-1 relative items-center justify-center min-h-[50vh] lg:min-h-screen bg-gradient-to-br from-zinc-900/50 via-black to-black">
          <div className="relative z-10 flex flex-col items-center justify-center">
            <Building2 className="h-32 w-32 text-zinc-700 mb-8" />
            <div className="text-center">
              <p className="text-2xl font-primary text-zinc-500 mb-2">Find Creative</p>
              <p className="text-2xl font-primary text-white">Technologists</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Amsterdam London 2026
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative Technology Collective
        </span>
      </div>
    </div>
  );
};

export default CompanyAuthPage;
