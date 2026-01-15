import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  ShieldCheck,
  Briefcase,
  Users,
  LogOut,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  MapPin,
  ExternalLink,
  RefreshCw,
  Filter,
  UserCircle,
  Calendar,
  Linkedin,
  Globe,
  X,
  CheckCheck,
  Link2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  JobStatus,
  JOB_STATUSES,
  PROJECT_TYPES,
  REMOTE_PREFERENCES,
} from '@/types/job-matching';
import { FOCUS_AREAS } from '@/types/network-profile';

// Types for admin API responses
interface JobSubmissionWithDetails {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  requirements: string | null;
  preferredSkills: string[] | null;
  focusAreas: string[] | null;
  budgetRange: string | null;
  projectType: string;
  remotePreference: string;
  location: string | null;
  timeline: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  matchCount: number;
}

interface ProfileDetails {
  id: string;
  fullName: string;
  email: string;
  location: string;
  bio: string;
  skills: string[];
  focusAreas: string[];
  availability: string;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  profilePictureUrl: string | null;
}

interface SkillMatchInfo {
  skill: string;
  relevance?: string;
  fromProfile?: boolean;
  fromPortfolio?: boolean;
}

interface MatchWithProfile {
  id: string;
  jobId: string;
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches: SkillMatchInfo[] | null;
  vectorSimilarity: number | null;
  adminApproved: boolean | null;
  memberNotified: boolean;
  memberResponse: string | null;
  createdAt: string;
  profile: ProfileDetails;
}

interface PendingProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  location: string;
  bio: string;
  skills: string[];
  focusAreas: string[];
  availability: string;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  profilePictureUrl: string | null;
  projects: Array<{
    title: string;
    description: string;
    url?: string;
    imageUrl?: string;
  }>;
  createdAt: string;
  slug: string;
}

// Pending match group types
interface PendingMatchJob {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  projectType: string;
  remotePreference: string;
  createdAt: string;
}

interface PendingMatchProfile {
  id: string;
  fullName: string;
  email: string;
  location: string;
  bio: string;
  skills: string[];
  focusAreas: string[];
  availability: string;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  profilePictureUrl: string | null;
}

interface PendingMatch {
  id: string;
  jobId: string;
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches: SkillMatchInfo[] | null;
  vectorSimilarity: number | null;
  adminApproved: boolean | null;
  memberNotified: boolean;
  memberResponse: string | null;
  createdAt: string;
  profile: PendingMatchProfile;
}

interface PendingMatchGroup {
  job: PendingMatchJob;
  matches: PendingMatch[];
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, signOut, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState<JobSubmissionWithDetails[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, MatchWithProfile[]>>({});
  const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>({});
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [reviewingMatchId, setReviewingMatchId] = useState<string | null>(null);

  // Pending profiles state
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  // Profile action states
  const [approvingProfileId, setApprovingProfileId] = useState<string | null>(null);
  const [rejectingProfileId, setRejectingProfileId] = useState<string | null>(null);
  const [rejectDialogProfile, setRejectDialogProfile] = useState<PendingProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Job action states
  const [rejectDialogJob, setRejectDialogJob] = useState<JobSubmissionWithDetails | null>(null);
  const [rejectJobReason, setRejectJobReason] = useState('');
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);

  // Pending matches state
  const [pendingMatchGroups, setPendingMatchGroups] = useState<PendingMatchGroup[]>([]);
  const [loadingPendingMatches, setLoadingPendingMatches] = useState(false);
  const [expandedPendingJobId, setExpandedPendingJobId] = useState<string | null>(null);
  const [approvingAllJobId, setApprovingAllJobId] = useState<string | null>(null);

  const fetchPendingProfiles = useCallback(async () => {
    if (!session?.access_token) return;

    setLoadingProfiles(true);

    try {
      const response = await fetch('/api/admin/profiles', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profiles');
      }

      setPendingProfiles(data.profiles);
    } catch (err) {
      console.error('Error fetching pending profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  }, [session?.access_token]);

  const fetchPendingMatches = useCallback(async () => {
    if (!session?.access_token) return;

    setLoadingPendingMatches(true);

    try {
      const response = await fetch('/api/admin/pending-matches', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending matches');
      }

      setPendingMatchGroups(data.groups);
    } catch (err) {
      console.error('Error fetching pending matches:', err);
    } finally {
      setLoadingPendingMatches(false);
    }
  }, [session?.access_token]);

  const approveAllMatchesForJob = async (jobId: string, matchIds: string[]) => {
    if (!session?.access_token || approvingAllJobId) return;

    setApprovingAllJobId(jobId);

    try {
      // Approve all matches sequentially
      let approvedCount = 0;
      for (const matchId of matchIds) {
        const response = await fetch('/api/review-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ matchId, approved: true }),
        });

        if (response.ok) {
          approvedCount++;
        }
      }

      // Remove the group from pending matches
      setPendingMatchGroups((prev) => prev.filter((group) => group.job.id !== jobId));
      setExpandedPendingJobId(null);

      // Show success toast
      setToast({
        message: `${approvedCount} match${approvedCount !== 1 ? 'es' : ''} approved`,
        type: 'success',
      });
      setTimeout(() => setToast(null), 3000);

      // Refresh main matches if the job is expanded
      if (expandedJobId === jobId) {
        await fetchMatchesForJob(jobId);
      }
    } catch (err) {
      console.error('Error approving all matches:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to approve matches',
        type: 'error',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setApprovingAllJobId(null);
    }
  };

  const reviewPendingMatch = async (matchId: string, jobId: string, approved: boolean) => {
    if (!session?.access_token || reviewingMatchId) return;

    setReviewingMatchId(matchId);

    try {
      const response = await fetch('/api/review-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ matchId, approved }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review match');
      }

      // Update local state - remove match from pending groups
      setPendingMatchGroups((prev) => {
        const newGroups = prev.map((group) => {
          if (group.job.id === jobId) {
            return {
              ...group,
              matches: group.matches.filter((m) => m.id !== matchId),
            };
          }
          return group;
        });
        // Remove groups with no matches left
        return newGroups.filter((group) => group.matches.length > 0);
      });

      // Show toast
      setToast({
        message: approved ? 'Match approved' : 'Match rejected',
        type: 'success',
      });
      setTimeout(() => setToast(null), 3000);

      // Refresh main matches if the job is expanded
      if (expandedJobId === jobId) {
        await fetchMatchesForJob(jobId);
      }
    } catch (err) {
      console.error('Error reviewing match:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Review failed',
        type: 'error',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setReviewingMatchId(null);
    }
  };

  const approveProfile = async (profileId: string) => {
    if (!session?.access_token || approvingProfileId) return;

    setApprovingProfileId(profileId);

    try {
      const response = await fetch('/api/admin/profiles/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ profileId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve profile');
      }

      // Remove profile from pending list with animation effect (immediate removal)
      setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId));
      setExpandedProfileId(null);

      // Show success toast
      setToast({ message: 'Profile approved', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error approving profile:', err);
      setToast({ message: err instanceof Error ? err.message : 'Failed to approve profile', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setApprovingProfileId(null);
    }
  };

  const rejectProfile = async () => {
    if (!session?.access_token || !rejectDialogProfile || rejectingProfileId) return;

    const profileId = rejectDialogProfile.id;
    setRejectingProfileId(profileId);

    try {
      const response = await fetch('/api/admin/profiles/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ profileId, reason: rejectReason || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject profile');
      }

      // Remove profile from pending list
      setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId));
      setExpandedProfileId(null);
      setRejectDialogProfile(null);
      setRejectReason('');

      // Show success toast
      setToast({ message: 'Profile rejected', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error rejecting profile:', err);
      setToast({ message: err instanceof Error ? err.message : 'Failed to reject profile', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setRejectingProfileId(null);
    }
  };

  const rejectJob = async () => {
    if (!session?.access_token || !rejectDialogJob || rejectingJobId) return;

    const jobId = rejectDialogJob.id;
    setRejectingJobId(jobId);

    try {
      const response = await fetch('/api/admin/jobs/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId, reason: rejectJobReason || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject job');
      }

      // Refresh jobs list
      await fetchJobs();
      setExpandedJobId(null);
      setRejectDialogJob(null);
      setRejectJobReason('');

      // Show success toast
      setToast({ message: 'Job rejected', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error rejecting job:', err);
      setToast({ message: err instanceof Error ? err.message : 'Failed to reject job', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setRejectingJobId(null);
    }
  };

  const fetchJobs = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/jobs?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError('Admin access required. Please contact support if you believe this is an error.');
          return;
        }
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, statusFilter, pagination.page, pagination.limit]);

  const fetchMatchesForJob = useCallback(
    async (jobId: string) => {
      if (!session?.access_token || loadingMatches[jobId]) return;

      setLoadingMatches((prev) => ({ ...prev, [jobId]: true }));

      try {
        const response = await fetch(`/api/admin/matches?jobId=${jobId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch matches');
        }

        setMatches((prev) => ({ ...prev, [jobId]: data.matches }));
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoadingMatches((prev) => ({ ...prev, [jobId]: false }));
      }
    },
    [session?.access_token, loadingMatches]
  );

  const runMatching = async (jobId: string) => {
    if (!session?.access_token || matchingJobId) return;

    setMatchingJobId(jobId);

    try {
      const response = await fetch('/api/match-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run matching');
      }

      // Refresh jobs and matches
      await fetchJobs();
      if (expandedJobId === jobId) {
        await fetchMatchesForJob(jobId);
      }

      // Show success toast with match count
      const matchCount = data.matches?.length ?? 0;
      setToast({
        message: `Job approved - ${matchCount} candidate${matchCount !== 1 ? 's' : ''} matched`,
        type: 'success',
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error running matching:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Matching failed',
        type: 'error',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setMatchingJobId(null);
    }
  };

  const reviewMatch = async (matchId: string, approved: boolean) => {
    if (!session?.access_token || reviewingMatchId) return;

    setReviewingMatchId(matchId);

    try {
      const response = await fetch('/api/review-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ matchId, approved }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review match');
      }

      // Update local state
      setMatches((prev) => {
        const newMatches = { ...prev };
        for (const jobId of Object.keys(newMatches)) {
          newMatches[jobId] = newMatches[jobId].map((m) =>
            m.id === matchId ? { ...m, adminApproved: approved, memberNotified: data.match.memberNotified } : m
          );
        }
        return newMatches;
      });
    } catch (err) {
      console.error('Error reviewing match:', err);
      setError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setReviewingMatchId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/directory/auth');
      return;
    }

    if (user && session) {
      fetchJobs();
      fetchPendingProfiles();
      fetchPendingMatches();
    }
  }, [user, session, authLoading, navigate, fetchJobs, fetchPendingProfiles, fetchPendingMatches]);

  useEffect(() => {
    if (expandedJobId && !matches[expandedJobId]) {
      fetchMatchesForJob(expandedJobId);
    }
  }, [expandedJobId, matches, fetchMatchesForJob]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = JOB_STATUSES.find((s) => s.value === status);
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      matched: 'bg-green-500/20 text-green-400 border-green-500/30',
      closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
      <span
        className={cn(
          'px-3 py-1 text-xs font-secondary border',
          statusColors[status] || statusColors.pending
        )}
      >
        {statusInfo?.label || status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error && error.includes('Admin access required')) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldCheck className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-primary mb-2">Access Denied</h1>
          <p className="text-zinc-400 font-secondary mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-20 lg:py-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-pink-500" />
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
                CTC Admin Portal
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-primary font-medium leading-[0.95] tracking-tight">
              Job Matching Dashboard
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 font-secondary text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Error Alert */}
        {error && !error.includes('Admin access required') && (
          <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 font-secondary text-sm">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-zinc-800 p-4">
            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1">
              Total Jobs
            </p>
            <p className="text-2xl font-primary">{pagination.total}</p>
          </div>
          <div className="border border-zinc-800 p-4">
            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1">
              Pending
            </p>
            <p className="text-2xl font-primary text-yellow-400">
              {jobs.filter((j) => j.status === 'pending').length}
            </p>
          </div>
          <div className="border border-zinc-800 p-4">
            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1">
              Matched
            </p>
            <p className="text-2xl font-primary text-green-400">
              {jobs.filter((j) => j.status === 'matched').length}
            </p>
          </div>
          <div className="border border-zinc-800 p-4">
            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1">
              Total Matches
            </p>
            <p className="text-2xl font-primary text-pink-400">
              {jobs.reduce((acc, j) => acc + j.matchCount, 0)}
            </p>
          </div>
        </div>

        {/* Pending Jobs Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Pending Jobs</h2>
              {jobs.filter((j) => j.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary rounded-full">
                  {jobs.filter((j) => j.status === 'pending').length}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : jobs.filter((j) => j.status === 'pending').length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">
                No pending jobs to review. All caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs
                .filter((j) => j.status === 'pending')
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  const jobMatches = matches[job.id] || [];
                  const isLoadingMatches = loadingMatches[job.id];
                  const projectTypeLabel =
                    PROJECT_TYPES.find((p) => p.value === job.projectType)?.label ||
                    job.projectType;
                  const remoteLabel =
                    REMOTE_PREFERENCES.find((r) => r.value === job.remotePreference)
                      ?.label || job.remotePreference;

                  return (
                    <div key={job.id} className="border border-zinc-800">
                      {/* Job Header */}
                      <button
                        onClick={() =>
                          setExpandedJobId(isExpanded ? null : job.id)
                        }
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-primary text-lg">{job.title}</h3>
                            {getStatusBadge(job.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-secondary">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {job.companyName}
                            </span>
                            <span>{projectTypeLabel}</span>
                            <span>{remoteLabel}</span>
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-zinc-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-zinc-500" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-zinc-800">
                          <div className="pt-4 space-y-4">
                            {/* Job Description */}
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Description
                              </p>
                              <p className="text-sm text-zinc-300 font-secondary whitespace-pre-wrap">
                                {job.description}
                              </p>
                            </div>

                            {job.requirements && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Requirements
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary whitespace-pre-wrap">
                                  {job.requirements}
                                </p>
                              </div>
                            )}

                            {/* Preferred Skills */}
                            {job.preferredSkills && job.preferredSkills.length > 0 && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Preferred Skills
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.preferredSkills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs font-secondary"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Focus Areas */}
                            {job.focusAreas && job.focusAreas.length > 0 && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Focus Areas
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {job.focusAreas.map((area) => {
                                    const areaInfo = FOCUS_AREAS.find((a) => a.value === area);
                                    return (
                                      <span
                                        key={area}
                                        className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary"
                                      >
                                        {areaInfo?.label || area}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Additional Job Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {job.budgetRange && (
                                <div>
                                  <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1">
                                    Budget Range
                                  </p>
                                  <p className="text-sm text-zinc-300 font-secondary">
                                    {job.budgetRange}
                                  </p>
                                </div>
                              )}
                              {job.timeline && (
                                <div>
                                  <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1">
                                    Timeline
                                  </p>
                                  <p className="text-sm text-zinc-300 font-secondary">
                                    {job.timeline}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-zinc-800">
                              <button
                                onClick={() => runMatching(job.id)}
                                disabled={matchingJobId === job.id}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                              >
                                {matchingJobId === job.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Running AI matching...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setRejectDialogJob(job)}
                                disabled={matchingJobId === job.id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-secondary text-sm transition-colors disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Pending Matches Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Pending Matches</h2>
              {pendingMatchGroups.reduce((acc, group) => acc + group.matches.length, 0) > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary rounded-full">
                  {pendingMatchGroups.reduce((acc, group) => acc + group.matches.length, 0)}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchPendingMatches()}
              disabled={loadingPendingMatches}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingPendingMatches ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {loadingPendingMatches ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : pendingMatchGroups.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">
                No pending matches to review. All caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMatchGroups.map((group) => {
                const isExpanded = expandedPendingJobId === group.job.id;
                const projectTypeLabel =
                  PROJECT_TYPES.find((p) => p.value === group.job.projectType)?.label ||
                  group.job.projectType;

                return (
                  <div key={group.job.id} className="border border-zinc-800">
                    {/* Job Header */}
                    <button
                      onClick={() => setExpandedPendingJobId(isExpanded ? null : group.job.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-primary text-lg">{group.job.title}</h3>
                          <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary">
                            {group.matches.length} pending match{group.matches.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-secondary">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {group.job.companyName}
                          </span>
                          <span>{projectTypeLabel}</span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500" />
                      )}
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-800">
                        <div className="pt-4 space-y-4">
                          {/* Approve All Button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                approveAllMatchesForJob(
                                  group.job.id,
                                  group.matches.map((m) => m.id)
                                )
                              }
                              disabled={approvingAllJobId === group.job.id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                            >
                              {approvingAllJobId === group.job.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCheck className="h-4 w-4" />
                                  Approve All ({group.matches.length})
                                </>
                              )}
                            </button>
                          </div>

                          {/* Match Cards */}
                          <div className="space-y-3">
                            {group.matches.map((match) => (
                              <div
                                key={match.id}
                                className="p-4 bg-zinc-900/50 border border-zinc-800"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    {/* Profile Picture */}
                                    {match.profile.profilePictureUrl ? (
                                      <img
                                        src={match.profile.profilePictureUrl}
                                        alt={match.profile.fullName}
                                        className="w-10 h-10 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
                                        <UserCircle className="h-5 w-5 text-zinc-500" />
                                      </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-1">
                                        <span className="font-primary text-white">
                                          {match.profile.fullName}
                                        </span>
                                        <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary">
                                          {match.matchScore}% match
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-3 text-sm text-zinc-400 font-secondary mb-2">
                                        <span>{match.profile.email}</span>
                                        {match.profile.location && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {match.profile.location}
                                          </span>
                                        )}
                                        {match.profile.portfolioUrl && (
                                          <a
                                            href={match.profile.portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-pink-400 hover:text-pink-300"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Portfolio
                                          </a>
                                        )}
                                      </div>
                                      <p className="text-sm text-zinc-400 font-secondary line-clamp-2">
                                        {match.matchReasoning}
                                      </p>
                                      {match.skillMatches && match.skillMatches.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {match.skillMatches.slice(0, 5).map((skill, idx) => (
                                            <span
                                              key={idx}
                                              className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs font-secondary"
                                            >
                                              {skill.skill}
                                            </span>
                                          ))}
                                          {match.skillMatches.length > 5 && (
                                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs font-secondary">
                                              +{match.skillMatches.length - 5}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 flex-shrink-0">
                                    <button
                                      onClick={() =>
                                        reviewPendingMatch(match.id, group.job.id, true)
                                      }
                                      disabled={reviewingMatchId === match.id}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-secondary transition-colors disabled:opacity-50"
                                    >
                                      {reviewingMatchId === match.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3" />
                                      )}
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        reviewPendingMatch(match.id, group.job.id, false)
                                      }
                                      disabled={reviewingMatchId === match.id}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-secondary transition-colors disabled:opacity-50"
                                    >
                                      {reviewingMatchId === match.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <XCircle className="h-3 w-3" />
                                      )}
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Profiles Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Pending Profiles</h2>
              {pendingProfiles.length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary rounded-full">
                  {pendingProfiles.length}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchPendingProfiles()}
              disabled={loadingProfiles}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingProfiles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {loadingProfiles ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : pendingProfiles.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">
                No pending profiles to review. All caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProfiles.map((profile) => {
                const isExpanded = expandedProfileId === profile.id;
                return (
                  <div key={profile.id} className="border border-zinc-800">
                    {/* Profile Header */}
                    <button
                      onClick={() => setExpandedProfileId(isExpanded ? null : profile.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Profile Picture */}
                        {profile.profilePictureUrl ? (
                          <img
                            src={profile.profilePictureUrl}
                            alt={profile.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <UserCircle className="h-5 w-5 text-zinc-500" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-primary text-white">{profile.fullName}</h3>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-zinc-500 font-secondary">
                            <span>{profile.email}</span>
                            {profile.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {profile.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(profile.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Focus Area Tags */}
                        <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
                          {profile.focusAreas.slice(0, 3).map((area) => {
                            const areaInfo = FOCUS_AREAS.find((a) => a.value === area);
                            return (
                              <span
                                key={area}
                                className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs font-secondary"
                              >
                                {areaInfo?.label || area}
                              </span>
                            );
                          })}
                          {profile.focusAreas.length > 3 && (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs font-secondary">
                              +{profile.focusAreas.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded Profile Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-800">
                        <div className="pt-4 space-y-4">
                          {/* Bio */}
                          <div>
                            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                              Bio
                            </p>
                            <p className="text-sm text-zinc-300 font-secondary whitespace-pre-wrap">
                              {profile.bio || 'No bio provided.'}
                            </p>
                          </div>

                          {/* Skills */}
                          {profile.skills.length > 0 && (
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Skills
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {profile.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs font-secondary"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Focus Areas (full list) */}
                          {profile.focusAreas.length > 0 && (
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Focus Areas
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {profile.focusAreas.map((area) => {
                                  const areaInfo = FOCUS_AREAS.find((a) => a.value === area);
                                  return (
                                    <span
                                      key={area}
                                      className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary"
                                    >
                                      {areaInfo?.label || area}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Links */}
                          <div className="flex flex-wrap gap-4">
                            {profile.portfolioUrl && (
                              <a
                                href={profile.portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300 font-secondary"
                              >
                                <Globe className="h-4 w-4" />
                                Portfolio
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {profile.linkedinUrl && (
                              <a
                                href={profile.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-secondary"
                              >
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>

                          {/* Projects */}
                          {profile.projects.length > 0 && (
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Projects ({profile.projects.length})
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {profile.projects.map((project, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-zinc-900/50 border border-zinc-800"
                                  >
                                    <h4 className="font-primary text-sm text-white mb-1">
                                      {project.title}
                                    </h4>
                                    <p className="text-xs text-zinc-400 font-secondary line-clamp-2">
                                      {project.description}
                                    </p>
                                    {project.url && (
                                      <a
                                        href={project.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 mt-2 font-secondary"
                                      >
                                        View Project <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t border-zinc-800">
                            <button
                              onClick={() => approveProfile(profile.id)}
                              disabled={approvingProfileId === profile.id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                            >
                              {approvingProfileId === profile.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setRejectDialogProfile(profile)}
                              disabled={approvingProfileId === profile.id}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-secondary text-sm transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-secondary text-zinc-400">Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as JobStatus | '');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 bg-transparent border border-zinc-800 text-white font-secondary text-sm focus:border-zinc-600 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-zinc-900">
              All Statuses
            </option>
            {JOB_STATUSES.map((status) => (
              <option key={status.value} value={status.value} className="bg-zinc-900">
                {status.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchJobs()}
            className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Jobs List */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-zinc-500" />
            <h2 className="text-xl font-primary">Job Submissions</h2>
          </div>

          {jobs.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">
                No job submissions found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                const jobMatches = matches[job.id] || [];
                const isLoadingMatches = loadingMatches[job.id];
                const projectTypeLabel =
                  PROJECT_TYPES.find((p) => p.value === job.projectType)?.label ||
                  job.projectType;
                const remoteLabel =
                  REMOTE_PREFERENCES.find((r) => r.value === job.remotePreference)
                    ?.label || job.remotePreference;

                return (
                  <div key={job.id} className="border border-zinc-800">
                    {/* Job Header */}
                    <button
                      onClick={() =>
                        setExpandedJobId(isExpanded ? null : job.id)
                      }
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-primary text-lg">{job.title}</h3>
                          {getStatusBadge(job.status)}
                          {job.matchCount > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary">
                              <Users className="h-3 w-3" />
                              {job.matchCount} matches
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-secondary">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {job.companyName}
                          </span>
                          <span>{projectTypeLabel}</span>
                          <span>{remoteLabel}</span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          <span>
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500" />
                      )}
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-800">
                        <div className="pt-4 space-y-4">
                          {/* Job Description */}
                          <div>
                            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                              Description
                            </p>
                            <p className="text-sm text-zinc-300 font-secondary whitespace-pre-wrap">
                              {job.description}
                            </p>
                          </div>

                          {job.requirements && (
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Requirements
                              </p>
                              <p className="text-sm text-zinc-300 font-secondary whitespace-pre-wrap">
                                {job.requirements}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t border-zinc-800">
                            {(job.status === 'pending' ||
                              job.status === 'reviewed') && (
                              <button
                                onClick={() => runMatching(job.id)}
                                disabled={matchingJobId === job.id}
                                className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                              >
                                {matchingJobId === job.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Running...
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4" />
                                    Run Matching
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => fetchMatchesForJob(job.id)}
                              disabled={isLoadingMatches}
                              className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 font-secondary text-sm transition-colors disabled:opacity-50"
                            >
                              {isLoadingMatches ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              Refresh Matches
                            </button>
                          </div>

                          {/* Matches Section */}
                          {isLoadingMatches ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                            </div>
                          ) : jobMatches.length > 0 ? (
                            <div className="pt-4 border-t border-zinc-800">
                              <div className="flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-pink-500" />
                                <h4 className="text-sm font-primary">
                                  Matched Candidates ({jobMatches.length})
                                </h4>
                              </div>
                              <div className="space-y-3">
                                {jobMatches.map((match) => (
                                  <div
                                    key={match.id}
                                    className="p-4 bg-zinc-900/50 border border-zinc-800"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <span className="font-primary text-white">
                                            {match.profile.fullName}
                                          </span>
                                          <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary">
                                            {match.matchScore}% match
                                          </span>
                                          {match.adminApproved === true && (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-secondary">
                                              Approved
                                            </span>
                                          )}
                                          {match.adminApproved === false && (
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-secondary">
                                              Rejected
                                            </span>
                                          )}
                                          {match.memberNotified && (
                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-secondary">
                                              Notified
                                            </span>
                                          )}
                                          {match.memberResponse && (
                                            <span
                                              className={cn(
                                                'px-2 py-0.5 text-xs font-secondary',
                                                match.memberResponse ===
                                                  'interested'
                                                  ? 'bg-green-500/20 text-green-400'
                                                  : 'bg-zinc-500/20 text-zinc-400'
                                              )}
                                            >
                                              {match.memberResponse ===
                                              'interested'
                                                ? 'Interested'
                                                : 'Not Interested'}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-zinc-400 font-secondary mb-2">
                                          <span>{match.profile.email}</span>
                                          {match.profile.location && (
                                            <span className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {match.profile.location}
                                            </span>
                                          )}
                                          {match.profile.portfolioUrl && (
                                            <a
                                              href={match.profile.portfolioUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-pink-400 hover:text-pink-300"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              Portfolio
                                            </a>
                                          )}
                                        </div>
                                        <p className="text-sm text-zinc-400 font-secondary mb-2">
                                          {match.matchReasoning}
                                        </p>
                                        {match.skillMatches &&
                                          match.skillMatches.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {match.skillMatches.map(
                                                (skill, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs font-secondary"
                                                  >
                                                    {skill.skill}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>

                                      {/* Approval Buttons */}
                                      {match.adminApproved === null && (
                                        <div className="flex gap-2 flex-shrink-0">
                                          <button
                                            onClick={() =>
                                              reviewMatch(match.id, true)
                                            }
                                            disabled={
                                              reviewingMatchId === match.id
                                            }
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-secondary transition-colors disabled:opacity-50"
                                          >
                                            {reviewingMatchId === match.id ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <CheckCircle2 className="h-3 w-3" />
                                            )}
                                            Approve
                                          </button>
                                          <button
                                            onClick={() =>
                                              reviewMatch(match.id, false)
                                            }
                                            disabled={
                                              reviewingMatchId === match.id
                                            }
                                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-secondary transition-colors disabled:opacity-50"
                                          >
                                            {reviewingMatchId === match.id ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <XCircle className="h-3 w-3" />
                                            )}
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : job.matchCount === 0 && job.status !== 'pending' ? (
                            <div className="pt-4 border-t border-zinc-800 text-center py-6">
                              <p className="text-zinc-500 font-secondary text-sm">
                                No matches generated yet. Run matching to find candidates.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm font-secondary text-zinc-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Vertical Text on Left Edge */}
        <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Amsterdam London 2026
          </span>
        </div>

        {/* Vertical Text on Right Edge */}
        <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Creative Technology Collective
          </span>
        </div>
      </div>

      {/* Rejection Confirmation Dialog */}
      {rejectDialogProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setRejectDialogProfile(null);
              setRejectReason('');
            }}
          />

          {/* Dialog */}
          <div className="relative bg-zinc-900 border border-zinc-700 w-full max-w-md mx-4 p-6">
            {/* Close button */}
            <button
              onClick={() => {
                setRejectDialogProfile(null);
                setRejectReason('');
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-primary text-xl text-white mb-2">Reject Profile</h3>
            <p className="text-sm text-zinc-400 font-secondary mb-4">
              Are you sure you want to reject <span className="text-white">{rejectDialogProfile.fullName}</span>'s profile? This will permanently delete their profile.
            </p>

            {/* Reason textarea */}
            <div className="mb-6">
              <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter a reason for rejection..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-500 resize-none"
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectDialogProfile(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 font-secondary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={rejectProfile}
                disabled={rejectingProfileId === rejectDialogProfile.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
              >
                {rejectingProfileId === rejectDialogProfile.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Reject Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Rejection Confirmation Dialog */}
      {rejectDialogJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setRejectDialogJob(null);
              setRejectJobReason('');
            }}
          />

          {/* Dialog */}
          <div className="relative bg-zinc-900 border border-zinc-700 w-full max-w-md mx-4 p-6">
            {/* Close button */}
            <button
              onClick={() => {
                setRejectDialogJob(null);
                setRejectJobReason('');
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-primary text-xl text-white mb-2">Reject Job</h3>
            <p className="text-sm text-zinc-400 font-secondary mb-4">
              Are you sure you want to reject the job <span className="text-white">"{rejectDialogJob.title}"</span>? This will mark the job as rejected.
            </p>

            {/* Reason textarea */}
            <div className="mb-6">
              <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={rejectJobReason}
                onChange={(e) => setRejectJobReason(e.target.value)}
                placeholder="Enter a reason for rejection..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-500 resize-none"
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectDialogJob(null);
                  setRejectJobReason('');
                }}
                className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 font-secondary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={rejectJob}
                disabled={rejectingJobId === rejectDialogJob.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
              >
                {rejectingJobId === rejectDialogJob.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Reject Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 border font-secondary text-sm',
            toast.type === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
