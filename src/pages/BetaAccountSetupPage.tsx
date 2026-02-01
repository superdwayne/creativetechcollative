import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Sparkles, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const BetaAccountSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signInWithGoogle } = useAuth();
  
  const token = searchParams.get('token');
  
  // State
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [applicationInfo, setApplicationInfo] = useState<{ name: string; email: string } | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidationError('No token provided. Please use the link from your approval email.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/beta/create-account?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setIsValid(true);
          setApplicationInfo({ name: data.name, email: data.email });
        } else {
          setValidationError(data.error || 'Invalid or expired link');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setValidationError('Failed to validate link. Please try again.');
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  // Password validation
  const passwordErrors = [];
  if (password.length > 0 && password.length < 8) {
    passwordErrors.push('At least 8 characters');
  }
  if (confirmPassword.length > 0 && password !== confirmPassword) {
    passwordErrors.push('Passwords must match');
  }

  const isFormValid = password.length >= 8 && password === confirmPassword;

  // Handle Google sign-in for account creation
  const handleGoogleSignIn = async () => {
    if (!token) return;
    
    setIsGoogleLoading(true);
    setError(null);

    try {
      // Store the token in localStorage so we can link the account after OAuth
      localStorage.setItem('beta_account_token', token);
      localStorage.setItem('beta_expected_email', applicationInfo?.email || '');
      
      // Redirect to Google OAuth with beta hub as return destination
      const { error } = await signInWithGoogle('/beta/hub');
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('[BetaAccountSetupPage] Google sign in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
      // Clean up localStorage on error
      localStorage.removeItem('beta_account_token');
      localStorage.removeItem('beta_expected_email');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || !token) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/beta/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        
        // Auto sign in the user
        setTimeout(async () => {
          try {
            const { error: signInError } = await signIn(data.email, password);
            if (!signInError) {
              navigate('/beta/hub');
            } else {
              // If auto-signin fails, redirect to auth page
              navigate('/beta/auth');
            }
          } catch {
            navigate('/beta/auth');
          }
        }, 1500);
      } else {
        setError(data.error || 'Failed to create account');
        
        // If there's a redirect suggestion, show it
        if (data.redirect) {
          setTimeout(() => {
            navigate(data.redirect);
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-zinc-400 font-secondary">Validating your link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValid) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-primary font-medium mb-4">Invalid Link</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            {validationError}
          </p>
          <div className="space-y-4">
            <Link
              to="/beta/auth"
              className="block px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all"
            >
              Sign In Instead
            </Link>
            <Link
              to="/beta"
              className="block px-8 py-4 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-all"
            >
              Apply for Beta Access
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-primary font-medium mb-4">Account Created!</h1>
          <p className="text-zinc-400 font-secondary mb-4">
            Welcome to the beta program, {applicationInfo?.name?.split(' ')[0]}!
          </p>
          <p className="text-zinc-500 font-secondary text-sm">
            Signing you in...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-purple-400 mx-auto mt-4" />
        </div>
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
            <span className="block text-white">Create your</span>
            <span className="block text-zinc-500">account</span>
          </h1>

          <p className="text-zinc-400 text-lg font-secondary leading-relaxed mb-12">
            You've been approved for the beta program! Set a password to secure your account 
            and start exploring exclusive features.
          </p>

          <div className="flex gap-12 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">Secure</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Password</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">Instant</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
              Create your account
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="hidden lg:block text-2xl font-primary font-medium mb-2">
                Welcome, {applicationInfo?.name?.split(' ')[0]}!
              </h2>
              <p className="text-zinc-500 font-secondary text-sm">
                Create a password to secure your account
              </p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                Email
              </label>
              <div className="w-full bg-zinc-900 border border-zinc-800 px-4 py-4 text-zinc-400 font-primary text-base">
                {applicationInfo?.email}
              </div>
            </div>

            {/* Google Sign In - Primary option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isCreating || isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
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
                  or create a password
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-black border border-zinc-800 px-4 py-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                  placeholder="Create a password"
                  required
                  minLength={8}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-black border border-zinc-800 px-4 py-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            {passwordErrors.length > 0 && (
              <div className="text-sm text-red-400 font-secondary">
                {passwordErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-secondary">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isCreating}
              className="w-full bg-white text-black font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-xs text-zinc-600 font-secondary text-center pt-2">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>

            <div className="pt-6 border-t border-zinc-800 mt-6">
              <p className="text-sm text-zinc-500 font-secondary text-center">
                Already have an account?{' '}
                <Link 
                  to="/beta/auth" 
                  className="text-white hover:text-zinc-300 transition-colors underline underline-offset-2"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
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

export default BetaAccountSetupPage;
