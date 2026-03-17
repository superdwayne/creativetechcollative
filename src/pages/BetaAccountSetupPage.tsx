import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * BetaAccountSetupPage - Create password after beta signup
 * 
 * After submitting the beta application form, users are redirected here
 * to create a password for their account. Their email (username) is
 * passed via URL query parameter.
 */
const BetaAccountSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signOut } = useAuth();

  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    // Sign out any existing session to prevent conflicts
    await signOut();

    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error: signUpError } = await signUp(email, password, redirectUrl);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }

    setIsLoading(false);
  };

  // This page is deprecated — accounts are created by admin approval.
  // Redirect users to the beta signup page.
  if (!email) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-xs font-secondary tracking-[0.3em] text-purple-400 uppercase">
              Beta Program
            </span>
          </div>
          <h1 className="text-3xl font-primary font-medium mb-4">Apply for Beta Access</h1>
          <p className="text-zinc-400 font-secondary mb-4">
            To join the beta program, submit your application and our team will review it.
          </p>
          <p className="text-zinc-500 font-secondary text-sm mb-8">
            Once approved, you'll receive an email with a link to sign in and create your profile.
          </p>
          <Link
            to="/beta"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all"
          >
            Go to Beta Signup
            <ArrowRight className="h-4 w-4" />
          </Link>
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

          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-xs font-secondary tracking-[0.3em] text-purple-400 uppercase">
              Beta Program
            </span>
          </div>

          <h1 className="text-3xl font-primary font-medium mb-4">
            Account Created!
          </h1>

          <p className="text-zinc-400 font-secondary mb-4 leading-relaxed">
            {name ? `Welcome, ${name.split(' ')[0]}! ` : ''}Your account has been set up with <strong className="text-white">{email}</strong>.
          </p>
          <p className="text-zinc-500 font-secondary text-sm mb-8">
            Check your email for a confirmation link, then sign in to access the Beta Hub once your application is approved.
          </p>

          <Link
            to="/beta/auth"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all"
          >
            Go to Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Create password form
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <span className="text-xs font-secondary tracking-[0.3em] text-purple-400 uppercase">
            Beta Program
          </span>
        </div>

        <h1 className="text-3xl font-primary font-medium mb-2 text-center">
          Create Your Password
        </h1>

        <p className="text-zinc-400 font-secondary text-center mb-8">
          Setting up account for <strong className="text-white">{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                disabled={isLoading}
                className="w-full bg-black border border-zinc-800 px-4 py-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                placeholder="Create a password (min 6 characters)"
                required
                minLength={6}
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
                disabled={isLoading}
                className="w-full bg-black border border-zinc-800 px-4 py-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                placeholder="Confirm your password"
                required
                minLength={6}
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

          {/* Error */}
          {error && (
            <div className="text-sm font-secondary p-4 text-red-400 bg-red-400/10 border border-red-400/20">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800">
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
      </div>
    </div>
  );
};

export default BetaAccountSetupPage;
