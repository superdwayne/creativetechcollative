import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';
import { Loader2, ArrowLeft, Sparkles, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';

const BetaAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, isPasswordRecovery, signIn, signInWithMagicLink, resetPasswordForEmail } = useAuth();
  const { success: hapticSuccess, error: hapticError } = useHaptics();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Magic link state
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  // Password reset state
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Show error from URL params (e.g. expired email link redirect)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      const friendly = urlError.includes('expired')
        ? 'Your email link has expired. Please sign in or request a new link below.'
        : urlError;
      setError(friendly);
    }
  }, [searchParams]);

  // Redirect to directory auth if already logged in
  // Beta members go directly to the directory auth to create/access their account
  // Skip redirect if user is in a password recovery flow
  useEffect(() => {
    if (!authLoading && user && !isPasswordRecovery) {
      navigate('/directory/auth');
    }
  }, [user, authLoading, isPasswordRecovery, navigate]);

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      hapticError();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        throw error;
      }
      hapticSuccess();
      // Navigation happens automatically via the useEffect above
    } catch (err: any) {
      console.error('[BetaAuthPage] Sign in error:', err);
      hapticError();
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await resetPasswordForEmail(email.trim());
      if (error) {
        throw error;
      }
      hapticSuccess();
      setResetEmailSent(true);
    } catch (err: any) {
      console.error('[BetaAuthPage] Password reset error:', err);
      hapticError();
      if (err.message?.includes('rate limit')) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'Failed to send password reset email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signInWithMagicLink(email.trim(), '/directory/auth');
      if (error) {
        throw error;
      }
      hapticSuccess();
      setMagicLinkSent(true);
    } catch (err: any) {
      console.error('[BetaAuthPage] Magic link error:', err);
      hapticError();
      if (err.message?.includes('rate limit')) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'Failed to send magic link');
      }
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Side - Info */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24 bg-black relative">
        {/* Back to Beta */}
        <Link
          to="/beta"
          className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Beta
        </Link>

        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <span className="text-xs font-secondary tracking-[0.3em] text-purple-400 uppercase">
              Beta Program
            </span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-primary font-medium leading-[0.95] tracking-tight mb-8">
            <span className="block text-white">Access your</span>
            <span className="block text-zinc-500">beta features</span>
          </h1>

          <p className="text-zinc-400 text-lg font-secondary leading-relaxed mb-12">
            Sign in with your approved email to access exclusive beta features including 
            the CTC Directory, direct messaging, and upcoming AI-powered tools.
          </p>

          <div className="flex gap-12 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">Early</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Access</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">Exclusive</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Features</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 bg-zinc-900/30">
        <div className="w-full max-w-md">
          {/* Mobile Back Link */}
          <Link
            to="/beta"
            className="lg:hidden mb-8 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Beta
          </Link>

          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="text-xs font-secondary tracking-[0.3em] text-purple-400 uppercase">
                Beta Program
              </span>
            </div>
            <h1 className="text-3xl font-primary font-medium">
              Sign in to access beta
            </h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="hidden lg:block text-2xl font-primary font-medium mb-2">
                Welcome back
              </h2>
              <p className="text-zinc-500 font-secondary text-sm">
                Sign in with your beta account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-secondary">
                {error}
              </div>
            )}


            {/* Password Reset Email Sent */}
            {resetEmailSent ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-400/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-primary font-medium text-white mb-2">
                    Check your email
                  </h3>
                  <p className="text-zinc-400 font-secondary text-sm">
                    We've sent a password reset link to <span className="text-white">{email}</span>.
                    <br />Click the link in the email to set a new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSent(false);
                    setShowResetForm(false);
                    setEmail('');
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-secondary"
                >
                  &larr; Back to sign in
                </button>
              </div>
            ) : showResetForm ? (
              /* Password Reset Form */
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-purple-400/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-zinc-400 font-secondary text-sm text-center mb-4">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                
                {/* Email Input */}
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black border border-zinc-800 px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {/* Send Reset Link Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:bg-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setError(null);
                  }}
                  className="w-full text-sm text-zinc-500 hover:text-white transition-colors font-secondary py-2"
                >
                  &larr; Back to password sign in
                </button>
              </form>
            ) : magicLinkSent ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-400/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-primary font-medium text-white mb-2">
                    Check your email
                  </h3>
                  <p className="text-zinc-400 font-secondary text-sm">
                    We've sent a magic link to <span className="text-white">{email}</span>.
                    <br />Click the link in the email to sign in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setShowMagicLinkForm(false);
                    setEmail('');
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-secondary"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : showMagicLinkForm ? (
              /* Magic Link Request Form */
              <form onSubmit={handleMagicLinkRequest} className="space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-purple-400/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-zinc-400 font-secondary text-sm text-center mb-4">
                  Enter your email and we'll send you a magic link to sign in instantly.
                </p>
                
                {/* Email Input */}
                <div>
                  <label htmlFor="magic-email" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    id="magic-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black border border-zinc-800 px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {/* Send Magic Link Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:bg-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMagicLinkForm(false);
                    setError(null);
                  }}
                  className="w-full text-sm text-zinc-500 hover:text-white transition-colors font-secondary py-2"
                >
                  ← Back to password sign in
                </button>
              </form>
            ) : (
              /* Email/Password Form */
              <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black border border-zinc-800 px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-black border border-zinc-800 px-4 py-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                      placeholder="Your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full border border-zinc-700 text-white font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Sign In with Email'
                  )}
                </button>

                {/* Forgot Password / Magic Link Options */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(true);
                      setError(null);
                    }}
                    className="text-sm text-zinc-500 hover:text-purple-400 transition-colors font-secondary py-2"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMagicLinkForm(true);
                      setError(null);
                    }}
                    className="text-sm text-zinc-500 hover:text-purple-400 transition-colors font-secondary py-2"
                  >
                    Use magic link
                  </button>
                </div>
              </form>
            )}

            {!magicLinkSent && !resetEmailSent && (
              <p className="text-xs text-zinc-600 font-secondary text-center">
                Don't have beta access?{' '}
                <Link to="/beta" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Apply for the beta program
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative Technology Collective
        </span>
      </div>
    </div>
  );
};

export default BetaAuthPage;
