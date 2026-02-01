import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyByUserId } from '@/lib/supabase';

/**
 * CompanyRegisterPage - Legacy route handler
 * 
 * This page now redirects users to the appropriate destination:
 * - If logged in with a company: redirect to dashboard
 * - If logged in without a company: this shouldn't happen in the new flow
 * - If not logged in: redirect to the new request-access flow
 * 
 * The new company registration flow is:
 * 1. Company requests access at /company/request-access (no auth required)
 * 2. Admin approves the request
 * 3. Company receives email with magic link to set up account
 * 4. Company is redirected to dashboard
 */
const CompanyRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const handleRedirect = async () => {
      if (authLoading) return;

      if (!user) {
        // Not logged in - redirect to the new request-access flow
        navigate('/company/request-access', { replace: true });
        return;
      }

      // User is logged in - check if they have a company
      const company = await getCompanyByUserId(user.id);
      if (company) {
        // Already has a company - go to dashboard
        navigate('/company/dashboard', { replace: true });
      } else {
        // Logged in but no company - this is an edge case
        // Redirect to request-access with a note that they may need to contact support
        navigate('/company/request-access', { replace: true });
      }
    };

    handleRedirect();
  }, [user, authLoading, navigate]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
      <p className="text-zinc-400 text-sm font-secondary">Redirecting...</p>
    </div>
  );
};

export default CompanyRegisterPage;
