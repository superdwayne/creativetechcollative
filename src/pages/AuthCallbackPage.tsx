import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getProfileByUserId, getProfileByEmail, linkProfileToUser, getCompanyByUserId } from '@/lib/supabase';

/**
 * Auth Callback Page
 *
 * Handles OAuth and magic link authentication callbacks from Supabase.
 * When a user signs in with Google or clicks a magic link, they're redirected here.
 * This page extracts the auth tokens from the URL and completes the sign-in.
 *
 * Supports both directory (creative tech) and company flows via the returnTo parameter.
 */
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Determine which flow the user came from
  const returnTo = searchParams.get('returnTo') || '';

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        setStatus('error');
        setErrorMessage('Authentication not configured');
        return;
      }

      try {
        // Get the auth data from URL hash (Supabase puts tokens in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (some flows use query params)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');

        if (code) {
          // Exchange code for session (PKCE flow)
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Auth callback error:', error);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          if (data.session) {
            setStatus('success');
            await redirectToDestination(data.session.user.id, data.session.user.email);
          }
        } else if (accessToken && refreshToken) {
          // Set session directly from tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Auth callback error:', error);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          if (data.session) {
            setStatus('success');
            await redirectToDestination(data.session.user.id, data.session.user.email);
          }
        } else {
          // No tokens found, check if already logged in
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            setStatus('success');
            await redirectToDestination(session.user.id, session.user.email);
          } else {
            setStatus('error');
            setErrorMessage('No authentication tokens found. Please try signing in again.');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleAuthCallback();
  }, []);

  const redirectToDestination = async (userId: string, userEmail?: string) => {
    // Check if this is a beta flow (from account setup or direct beta auth)
    const isBetaFlow = returnTo.includes('/beta');
    
    // Check if there's a pending beta account to link (from BetaAccountSetupPage Google sign-in)
    const betaToken = localStorage.getItem('beta_account_token');
    const expectedEmail = localStorage.getItem('beta_expected_email');
    
    if (isBetaFlow || betaToken) {
      // Clean up localStorage
      localStorage.removeItem('beta_account_token');
      localStorage.removeItem('beta_expected_email');
      
      // If we have a token, try to link the beta application
      if (betaToken && userEmail) {
        try {
          // Verify email matches if we have an expected email
          if (expectedEmail && expectedEmail.toLowerCase() !== userEmail.toLowerCase()) {
            console.warn('[AuthCallback] Email mismatch - expected:', expectedEmail, 'got:', userEmail);
            // Still allow login but don't link the token
          } else {
            // Link the beta application to this user
            const response = await fetch('/api/beta/link-google-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: betaToken, userId, email: userEmail }),
            });
            
            if (response.ok) {
              console.log('[AuthCallback] Successfully linked beta account');
            } else {
              console.warn('[AuthCallback] Failed to link beta account:', await response.text());
            }
          }
        } catch (err) {
          console.error('[AuthCallback] Error linking beta account:', err);
          // Continue with redirect even if linking fails
        }
      }
      
      // Short delay to show success message
      setTimeout(() => {
        navigate('/beta/hub', { replace: true });
      }, 1000);
      return;
    }
    
    // Check if this is a company flow
    const isCompanyFlow = returnTo.includes('/company');

    // Check if there's a specific custom return URL (like /messages?matchId=...)
    // This supports returning to specific pages after login from email links
    if (returnTo && (returnTo.startsWith('/messages') || returnTo.startsWith('/directory/profile'))) {
      // Ensure user has a profile before redirecting to these pages
      let profile = await getProfileByUserId(userId);
      
      // If no linked profile, check if a profile exists with the user's email
      if (!profile && userEmail) {
        const profileByEmail = await getProfileByEmail(userEmail);
        if (profileByEmail) {
          const linked = await linkProfileToUser(profileByEmail.id, userId);
          if (linked) {
            profile = profileByEmail;
          }
        }
      }
      
      // Short delay to show success message
      setTimeout(() => {
        if (profile) {
          // Return to the specific URL they were trying to access
          navigate(returnTo, { replace: true });
        } else {
          // No profile - need to create one first
          navigate('/directory/create', { replace: true });
        }
      }, 1000);
      return;
    }

    if (isCompanyFlow) {
      // Company flow - check if user has a company
      const company = await getCompanyByUserId(userId);

      // Short delay to show success message
      setTimeout(() => {
        if (company) {
          navigate('/company/dashboard', { replace: true });
        } else {
          navigate('/company/register', { replace: true });
        }
      }, 1000);
      return;
    }

    // Directory flow - check if user has a network profile
    let profile = await getProfileByUserId(userId);

    // If no linked profile, check if a profile exists with the user's email
    if (!profile && userEmail) {
      const profileByEmail = await getProfileByEmail(userEmail);
      if (profileByEmail) {
        // Found a profile with matching email - link it to this user
        const linked = await linkProfileToUser(profileByEmail.id, userId);
        if (linked) {
          profile = profileByEmail;
        }
      }
    }

    // Short delay to show success message
    setTimeout(() => {
      if (profile) {
        navigate('/directory/dashboard', { replace: true });
      } else {
        navigate('/directory/create', { replace: true });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
            <h1 className="text-xl font-primary mb-2">Signing you in...</h1>
            <p className="text-zinc-400 font-secondary text-sm">
              Please wait while we complete your authentication.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-primary mb-2">Welcome!</h1>
            <p className="text-zinc-400 font-secondary text-sm">
              Redirecting you to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-primary mb-2">Authentication Failed</h1>
            <p className="text-zinc-400 font-secondary text-sm mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate(returnTo.includes('/company') ? '/company/auth' : '/directory/auth')}
              className="px-6 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
