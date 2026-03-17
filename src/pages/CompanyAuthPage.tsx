import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Loader2, Mail, Lock, AlertCircle, Building2, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';
import { getCompanyByUserId, supabase } from '@/lib/supabase';

type AuthMode = 'magic-link' | 'password';

const CompanyAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn, signInWithMagicLink, loading: authLoading } = useAuth();
  const { success: hapticSuccess, error: hapticError } = useHaptics();

  const [authMode, setAuthMode] = useState<AuthMode>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    const checkExistingCompany = async () => {
      if (user) {
        // Check if user has a company
        const company = await getCompanyByUserId(user.id);

        if (company) {
          // User has a company, go to dashboard
          navigate('/company/dashboard');
        } else {
          // No company linked - this shouldn't happen with the new flow
          // but handle gracefully by showing an error
          setError('No company found for your account. Please contact support if you believe this is an error.');
        }
      }
    };

    if (!authLoading) {
      checkExistingCompany();
    }
  }, [user, authLoading, navigate]);

  const handleForgotPassword = async () => {
    setError('');
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
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message || 'Failed to send reset email.');
        return;
      }
      setInfoMessage('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signInWithMagicLink(email.trim(), '/company/dashboard');
      if (error) {
        hapticError();
        setError(error.message);
      } else {
        hapticSuccess();
        setMagicLinkSent(true);
        setInfoMessage('Check your email for a magic link to sign in.');
      }
    } catch (err: any) {
      hapticError();
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        hapticError();
        setError(error.message);
      } else {
        hapticSuccess();
      }
    } catch (err: any) {
      hapticError();
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (authMode === 'magic-link') {
      return handleMagicLinkSubmit(e);
    }
    return handlePasswordSubmit(e);
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
              CTC Talent Matching
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium leading-[0.95] tracking-tight mb-6">
            <span className="block">Welcome back</span>
          </h1>

          {/* Description */}
          <p className="text-zinc-400 text-lg max-w-md font-secondary leading-relaxed mb-10">
            Log in to manage your job listings, review matches, and connect with creative technologists.
          </p>

          {/* Magic Link Sent Success State */}
          {magicLinkSent ? (
            <div className="max-w-md">
              <div className="mb-6 p-6 border border-green-500/30 bg-green-500/5 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Check your email</h3>
                    <p className="text-zinc-400 text-sm">We sent a magic link to <span className="text-white">{email}</span></p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  Click the link in your email to sign in. The link expires in 1 hour.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setInfoMessage('');
                  }}
                  className="text-xs font-secondary text-zinc-500 hover:text-white transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              {infoMessage && (
                <div className="mb-6 p-4 border border-blue-500/30 text-blue-400 text-sm font-secondary max-w-md">
                  {infoMessage}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm font-secondary max-w-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Auth Mode Toggle */}
              <div className="flex gap-2 mb-6 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('magic-link');
                    setError('');
                  }}
                  className={`flex-1 px-4 py-3 border font-secondary text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                    authMode === 'magic-link'
                      ? 'border-white text-white bg-white/5'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Magic Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setError('');
                  }}
                  className={`flex-1 px-4 py-3 border font-secondary text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                    authMode === 'password'
                      ? 'border-white text-white bg-white/5'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <KeyRound className="h-4 w-4" />
                  Password
                </button>
              </div>

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
                      placeholder="your@email.com"
                      className="pl-12 h-14 bg-transparent border-zinc-800 focus:border-zinc-600 font-secondary"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {authMode === 'password' && (
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
                        placeholder="Your password"
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
                      {authMode === 'magic-link' ? 'Sending link...' : 'Logging in...'}
                    </>
                  ) : authMode === 'magic-link' ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Send Magic Link
                    </>
                  ) : (
                    'Log In'
                  )}
                </button>

                {authMode === 'password' && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-secondary text-zinc-500 hover:text-white transition-colors"
                      disabled={isSubmitting}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {authMode === 'magic-link' && (
                  <p className="text-center text-xs text-zinc-600 font-secondary">
                    We'll send you a secure link to sign in instantly — no password needed.
                  </p>
                )}
              </form>
            </>
          )}

          {/* Request Access CTA */}
          <div className="mt-12 pt-8 border-t border-zinc-800 max-w-md">
            <p className="text-zinc-500 text-sm font-secondary mb-4">
              Don't have an account yet?
            </p>
            <Link
              to="/company/request-access"
              className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-700 text-white hover:border-zinc-500 hover:bg-zinc-900/50 font-secondary text-sm tracking-wide transition-all"
            >
              Request Access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-zinc-600 text-xs font-secondary mt-3">
              Submit your company details for review. Once approved, you'll receive an email to set up your account.
            </p>
          </div>

          <div className="mt-8">
            <Link
              to="/discover-talent"
              className="block text-sm font-secondary text-zinc-500 hover:text-white transition-colors"
            >
              Learn more about our talent network
            </Link>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex flex-1 relative items-center justify-center min-h-[50vh] lg:min-h-screen">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-black" />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center border border-white/5">
              <Building2 className="h-16 w-16 text-zinc-400" />
            </div>
            <p className="mt-8 text-zinc-600 text-sm font-secondary tracking-wide text-center max-w-xs">
              Connect with creative technologists for your next project
            </p>
          </div>
        </div>
      </div>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Amsterdam . London . 2026
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative . Technology . Collective
        </span>
      </div>
    </div>
  );
};

export default CompanyAuthPage;
