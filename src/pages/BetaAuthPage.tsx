import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react';

const BetaAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to beta hub if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/beta/hub');
    }
  }, [user, authLoading, navigate]);

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        throw error;
      }
      // Navigation happens automatically via the useEffect above
    } catch (err: any) {
      console.error('[BetaAuthPage] Sign in error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle('/beta/hub');
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('[BetaAuthPage] Google sign in error:', err);
      setError(err.message || 'Failed to sign in with Google');
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

            {/* Google Sign In - Primary option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-zinc-900/30 text-zinc-600 font-secondary">
                  or sign in with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
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
            </form>

            <p className="text-xs text-zinc-600 font-secondary text-center">
              Don't have beta access?{' '}
              <Link to="/beta" className="text-purple-400 hover:text-purple-300 transition-colors">
                Apply for the beta program
              </Link>
            </p>
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
