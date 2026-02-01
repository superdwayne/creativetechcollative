import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Loader2, Mail, Lock, AlertCircle, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyByUserId, supabase } from '@/lib/supabase';

const CompanyAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn, signInWithGoogle, loading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

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
        redirectTo: `${window.location.origin}/company/auth`,
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

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle('/company');
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full max-w-md px-6 py-4 border border-zinc-700 hover:border-zinc-500 text-white font-secondary text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 max-w-md mb-6">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs font-secondary text-zinc-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>

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
          </form>

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
