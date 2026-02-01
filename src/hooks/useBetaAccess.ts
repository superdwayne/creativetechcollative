import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface BetaApplication {
  id: string;
  name: string;
  email: string;
  interests: string[];
  status: 'pending' | 'approved' | 'rejected';
  user_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface BetaAccessState {
  loading: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  isAdmin: boolean;
  betaApplication: BetaApplication | null;
  error: string | null;
  hasProfile: boolean;
  profileStatus: 'none' | 'pending' | 'approved' | 'rejected';
  refetch: () => Promise<void>;
}

/**
 * Hook to check if the current user has beta access
 * Returns loading state, approval status, and beta application details
 */
export function useBetaAccess(): BetaAccessState {
  const { user, session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [betaApplication, setBetaApplication] = useState<BetaApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchBetaStatus = useCallback(async () => {
    if (!user || !session) {
      setLoading(false);
      setBetaApplication(null);
      setHasProfile(false);
      setProfileStatus('none');
      setIsAdmin(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check beta application status via API
      const response = await fetch('/api/beta/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to check beta status');
      }

      const data = await response.json();
      setBetaApplication(data.betaApplication || null);
      setHasProfile(data.hasProfile || false);
      setProfileStatus(data.profileStatus || 'none');
      setIsAdmin(data.isAdmin === true);
    } catch (err: any) {
      console.error('[useBetaAccess] Error:', err);
      setError(err.message || 'Failed to check beta status');
      setBetaApplication(null);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    if (!authLoading) {
      fetchBetaStatus();
    }
  }, [authLoading, fetchBetaStatus]);

  // A user is considered approved if:
  // 1. They are an admin, OR
  // 2. Their beta application is approved, OR
  // 3. They have an approved directory profile (existing CTC members)
  const isApproved = isAdmin || betaApplication?.status === 'approved' || profileStatus === 'approved';
  const isPending = !isAdmin && betaApplication?.status === 'pending' && profileStatus !== 'approved';
  const isRejected = !isAdmin && betaApplication?.status === 'rejected' && profileStatus !== 'approved';

  return {
    loading: authLoading || loading,
    isApproved,
    isPending,
    isRejected,
    isAdmin,
    betaApplication,
    error,
    hasProfile,
    profileStatus,
    refetch: fetchBetaStatus,
  };
}

export default useBetaAccess;
