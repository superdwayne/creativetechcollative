import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, isPasswordRecovery, updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processingCode, setProcessingCode] = useState(false);
  const codeProcessed = useRef(false);

  // Handle PKCE code exchange if Supabase redirected here with ?code=xxx
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && supabase && !codeProcessed.current) {
      codeProcessed.current = true;
      setProcessingCode(true);
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('[ResetPasswordPage] Code exchange error:', error);
          setError('Invalid or expired reset link. Please request a new one.');
        }
        setProcessingCode(false);
      });
    }
  }, [searchParams]);

  // Also handle hash fragment tokens (implicit flow)
  useEffect(() => {
    if (supabase && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (error) {
            console.error('[ResetPasswordPage] Session error:', error);
            setError('Invalid or expired reset link. Please request a new one.');
          }
          // Clear hash to avoid reprocessing
          window.history.replaceState(null, '', window.location.pathname);
        });
      }
    }
  }, []);

  const validatePassword = (): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        throw error;
      }
      setSuccess(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/beta/hub');
      }, 2000);
    } catch (err: any) {
      console.error('[ResetPasswordPage] Error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (authLoading || processingCode) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-zinc-400 font-secondary">Processing reset link...</p>
        </div>
      </div>
    );
  }

  // Waiting for auth to process the recovery token
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {error ? (
            <>
              <div className="h-16 w-16 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-primary font-medium mb-4">Reset Link Expired</h1>
              <p className="text-zinc-400 font-secondary mb-8">{error}</p>
              <button
                onClick={() => navigate('/beta/auth')}
                className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-all inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">Processing reset link...</p>
              <p className="text-zinc-600 font-secondary text-sm mt-2">
                If this takes too long, please request a new reset link.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-primary font-medium mb-4">Password Updated</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            Your password has been successfully changed. Redirecting you now...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-purple-400/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-primary font-medium mb-3">Set New Password</h1>
          <p className="text-zinc-400 font-secondary">
            Enter your new password below for{' '}
            <span className="text-white">{user.email}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-secondary">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-black border border-zinc-800 px-4 py-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                placeholder="At least 8 characters"
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
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-black border border-zinc-800 px-4 py-4 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                placeholder="Re-enter your password"
                required
                minLength={8}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        {/* Back to sign in */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/beta/auth')}
            className="text-sm text-zinc-500 hover:text-white transition-colors font-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
