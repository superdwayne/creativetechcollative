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
  BadgeCheck,
  Mail,
  Phone,
  Sparkles,
  Search,
  CreditCard,
  DollarSign,
  BarChart3,
  ArrowUpCircle,
  Trash2,
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
import { UserManagementSection } from '@/components/admin/UserManagementSection';

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

// Company type for admin view
interface AdminCompany {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  companySize: string | null;
  industry: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Credit usage type for admin view
interface CreditUsageCompany {
  companyId: string;
  companyName: string;
  freeUsed: number;
  purchasedRemaining: number;
  totalAnalyses: number;
  totalRevenue: number; // in cents
}

interface CreditUsageTotals {
  totalAnalyses: number;
  totalRevenue: number;
}

// Pending company request type
interface PendingCompanyRequest {
  id: string;
  companyName: string;
  companyWebsite: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  companySize: string | null;
  industry: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

// Beta application type
interface BetaApplication {
  id: string;
  name: string;
  email: string;
  interests: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Member types for admin member lists
interface BetaMember {
  id: string;
  name: string;
  email: string;
  interests: string[];
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  memberType: 'beta';
}

interface DirectoryMember {
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
  slug: string;
  approved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  memberType: 'directory';
  membershipType: 'beta' | 'full'; // beta = approved beta member, full = upgraded or direct signup
}

interface MemberCounts {
  betaTotal: number;
  betaApproved: number;
  betaPending: number;
  betaRejected: number;
  directoryTotal: number;
  directoryApproved: number;
  directoryPending: number;
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

  // Companies state
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [togglingVerifyId, setTogglingVerifyId] = useState<string | null>(null);

  // Pending company requests state
  const [pendingCompanyRequests, setPendingCompanyRequests] = useState<PendingCompanyRequest[]>([]);
  const [loadingCompanyRequests, setLoadingCompanyRequests] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  // Beta applications state
  const [betaApplications, setBetaApplications] = useState<BetaApplication[]>([]);
  const [loadingBetaApplications, setLoadingBetaApplications] = useState(false);
  const [approvingBetaId, setApprovingBetaId] = useState<string | null>(null);
  const [rejectingBetaId, setRejectingBetaId] = useState<string | null>(null);
  const [deletingBetaId, setDeletingBetaId] = useState<string | null>(null);

  // Member lists state (approved members)
  const [betaMembers, setBetaMembers] = useState<BetaMember[]>([]);
  const [directoryMembers, setDirectoryMembers] = useState<DirectoryMember[]>([]);
  const [upgradingMemberId, setUpgradingMemberId] = useState<string | null>(null);
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({
    betaTotal: 0,
    betaApproved: 0,
    betaPending: 0,
    betaRejected: 0,
    directoryTotal: 0,
    directoryApproved: 0,
    directoryPending: 0,
  });
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Credit usage state
  const [creditUsageCompanies, setCreditUsageCompanies] = useState<CreditUsageCompany[]>([]);
  const [creditUsageTotals, setCreditUsageTotals] = useState<CreditUsageTotals>({ totalAnalyses: 0, totalRevenue: 0 });
  const [loadingCreditUsage, setLoadingCreditUsage] = useState(false);

  // Grant credits state
  const [grantCreditsCompany, setGrantCreditsCompany] = useState<CreditUsageCompany | null>(null);
  const [grantCreditsAmount, setGrantCreditsAmount] = useState('');
  const [grantCreditsNote, setGrantCreditsNote] = useState('');
  const [grantingCredits, setGrantingCredits] = useState(false);

  // Web enrichment state
  const [webEnrichingProfileId, setWebEnrichingProfileId] = useState<string | null>(null);
  const [webEnrichmentResult, setWebEnrichmentResult] = useState<{
    profileId: string;
    profileName: string;
    discoveredProjects?: Array<{ title: string; description: string; url?: string }>;
    additionalSkills?: string[];
    summary?: string;
    error?: string;
  } | null>(null);

  // Email test state
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailType, setTestEmailType] = useState<'message' | 'profile_approved'>('message');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    pendingJobs: true,
    pendingProfiles: false,
    pendingCompanyRequests: false,
    betaApplications: false,
    betaMembers: true,
    directoryMembers: true,
    companies: true,
    creditUsage: true,
    testEmail: true,
    userManagement: true,
    jobSubmissions: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  // Web enrichment function - searches internet for profile info
  const webEnrichProfile = useCallback(async (profileId: string, profileName: string, autoApply: boolean = false) => {
    if (!session?.access_token) return;

    setWebEnrichingProfileId(profileId);
    setWebEnrichmentResult(null);

    try {
      const response = await fetch('/api/admin/enrich-profile-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ profileId, autoApply }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to web enrich profile');
      }

      setWebEnrichmentResult({
        profileId,
        profileName,
        discoveredProjects: data.discoveredProjects,
        additionalSkills: data.additionalSkills,
        summary: data.webSummary,
        error: data.error,
      });

      if (autoApply && data.success) {
        setToast({
          message: `Web enrichment applied to ${profileName}`,
          type: 'success',
        });
        // Refresh profiles to show updates
        fetchPendingProfiles();
      } else if (data.success) {
        setToast({
          message: `Found info for ${profileName} - review results below`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Error web enriching profile:', err);
      setWebEnrichmentResult({
        profileId,
        profileName,
        error: err instanceof Error ? err.message : 'Web enrichment failed',
      });
      setToast({
        message: err instanceof Error ? err.message : 'Failed to web enrich profile',
        type: 'error',
      });
    } finally {
      setWebEnrichingProfileId(null);
    }
  }, [session?.access_token, fetchPendingProfiles]);

  const fetchCompanies = useCallback(async () => {
    if (!session?.access_token) return;

    setLoadingCompanies(true);

    try {
      const response = await fetch('/api/admin/companies', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch companies');
      }

      setCompanies(data.companies);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  }, [session?.access_token]);

  const fetchPendingCompanyRequests = useCallback(async () => {
    if (!session?.access_token) return;

    setLoadingCompanyRequests(true);

    try {
      const response = await fetch('/api/admin/company-requests?status=pending', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch company requests');
      }

      setPendingCompanyRequests(data.requests);
    } catch (err) {
      console.error('Error fetching company requests:', err);
    } finally {
      setLoadingCompanyRequests(false);
    }
  }, [session?.access_token]);

  const approveCompanyRequest = async (requestId: string) => {
    if (!session?.access_token) return;

    setApprovingRequestId(requestId);

    try {
      const response = await fetch('/api/admin/company-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      // Remove from pending list
      setPendingCompanyRequests((prev) => prev.filter((r) => r.id !== requestId));
      
      // Refresh companies list
      fetchCompanies();

      setToast({ message: 'Company approved and account created!', type: 'success' });
    } catch (err: any) {
      console.error('Error approving company request:', err);
      setToast({ message: err.message || 'Failed to approve request', type: 'error' });
    } finally {
      setApprovingRequestId(null);
    }
  };

  const rejectCompanyRequest = async (requestId: string) => {
    if (!session?.access_token) return;

    setRejectingRequestId(requestId);

    try {
      const response = await fetch('/api/admin/company-requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      // Remove from pending list
      setPendingCompanyRequests((prev) => prev.filter((r) => r.id !== requestId));

      setToast({ message: 'Company request rejected', type: 'success' });
    } catch (err: any) {
      console.error('Error rejecting company request:', err);
      setToast({ message: err.message || 'Failed to reject request', type: 'error' });
    } finally {
      setRejectingRequestId(null);
    }
  };

  // Beta applications functions
  const fetchBetaApplications = useCallback(async () => {
    if (!session?.access_token) {
      console.warn('[Beta Applications] No session token available');
      return;
    }

    setLoadingBetaApplications(true);

    try {
      const response = await fetch('/api/admin/beta-applications?status=pending', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch beta applications');
      }

      console.log('[Beta Applications] Fetched:', data.applications?.length || 0, 'applications');
      setBetaApplications(data.applications || []);
    } catch (err: any) {
      console.error('Error fetching beta applications:', err);
      setToast({ message: `Failed to load beta applications: ${err.message}`, type: 'error' });
    } finally {
      setLoadingBetaApplications(false);
    }
  }, [session?.access_token]);

  const approveBetaApplication = async (applicationId: string) => {
    if (!session?.access_token) return;

    setApprovingBetaId(applicationId);

    try {
      const response = await fetch('/api/admin/beta-applications/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ applicationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      // Remove from pending list
      setBetaApplications((prev) => prev.filter((a) => a.id !== applicationId));

      setToast({ message: 'Beta application approved! User has been notified.', type: 'success' });
    } catch (err: any) {
      console.error('Error approving beta application:', err);
      setToast({ message: err.message || 'Failed to approve application', type: 'error' });
    } finally {
      setApprovingBetaId(null);
    }
  };

  const rejectBetaApplication = async (applicationId: string) => {
    if (!session?.access_token) return;

    setRejectingBetaId(applicationId);

    try {
      const response = await fetch('/api/admin/beta-applications/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ applicationId, sendEmail: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      // Remove from pending list
      setBetaApplications((prev) => prev.filter((a) => a.id !== applicationId));

      const emailMessage = data.emailSent 
        ? 'Beta application rejected and email sent' 
        : 'Beta application rejected (email failed to send)';
      setToast({ message: emailMessage, type: 'success' });
    } catch (err: any) {
      console.error('Error rejecting beta application:', err);
      setToast({ message: err.message || 'Failed to reject application', type: 'error' });
    } finally {
      setRejectingBetaId(null);
    }
  };

  const deleteBetaApplication = async (applicationId: string, applicationName: string) => {
    if (!session?.access_token) return;

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete the beta application for "${applicationName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingBetaId(applicationId);

    try {
      const response = await fetch('/api/admin/beta-applications/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ applicationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete application');
      }

      // Remove from pending list
      setBetaApplications((prev) => prev.filter((a) => a.id !== applicationId));
      // Also remove from beta members list if present
      setBetaMembers((prev) => prev.filter((m) => m.id !== applicationId));

      setToast({ message: `Beta application for ${applicationName} deleted`, type: 'success' });
    } catch (err: any) {
      console.error('Error deleting beta application:', err);
      setToast({ message: err.message || 'Failed to delete application', type: 'error' });
    } finally {
      setDeletingBetaId(null);
    }
  };

  // Upgrade a beta member to full directory member
  const upgradeMember = async (profileId: string) => {
    if (!session?.access_token) return;

    setUpgradingMemberId(profileId);

    try {
      const response = await fetch('/api/admin/members/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ profileId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade member');
      }

      // Update the member in the list
      setDirectoryMembers((prev) =>
        prev.map((member) =>
          member.id === profileId
            ? { ...member, membershipType: 'full' as const }
            : member
        )
      );

      setToast({ message: data.message || 'Member upgraded to full directory member', type: 'success' });
    } catch (err: any) {
      console.error('Error upgrading member:', err);
      setToast({ message: err.message || 'Failed to upgrade member', type: 'error' });
    } finally {
      setUpgradingMemberId(null);
    }
  };

  // Fetch all members (approved beta and directory members)
  const fetchMembers = useCallback(async () => {
    if (!session?.access_token) return;

    setLoadingMembers(true);

    try {
      const response = await fetch('/api/admin/members?type=all&status=approved', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch members');
      }

      console.log('[Members] Fetched:', {
        beta: data.betaMembers?.length || 0,
        directory: data.directoryMembers?.length || 0,
      });

      setBetaMembers(data.betaMembers || []);
      setDirectoryMembers(data.directoryMembers || []);
      setMemberCounts(data.counts || {
        betaTotal: 0,
        betaApproved: 0,
        betaPending: 0,
        betaRejected: 0,
        directoryTotal: 0,
        directoryApproved: 0,
        directoryPending: 0,
      });
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setToast({ message: `Failed to load members: ${err.message}`, type: 'error' });
    } finally {
      setLoadingMembers(false);
    }
  }, [session?.access_token]);

  const fetchCreditUsage = useCallback(async () => {
    if (!session?.access_token) return;

    setLoadingCreditUsage(true);

    try {
      const response = await fetch('/api/admin/credit-usage', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch credit usage');
      }

      setCreditUsageCompanies(data.companies);
      setCreditUsageTotals(data.totals);
    } catch (err) {
      console.error('Error fetching credit usage:', err);
    } finally {
      setLoadingCreditUsage(false);
    }
  }, [session?.access_token]);

  const grantCredits = async () => {
    if (!session?.access_token || !grantCreditsCompany || grantingCredits) return;

    const amount = parseInt(grantCreditsAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Please enter a valid credit amount', type: 'error' });
      return;
    }

    setGrantingCredits(true);

    try {
      const response = await fetch('/api/admin/grant-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyId: grantCreditsCompany.companyId,
          creditsAmount: amount,
          note: grantCreditsNote || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant credits');
      }

      // Update local state
      setCreditUsageCompanies((prev) =>
        prev.map((c) =>
          c.companyId === grantCreditsCompany.companyId
            ? { ...c, purchasedRemaining: data.newBalance }
            : c
        )
      );

      setToast({
        message: `Added ${amount} credits to ${grantCreditsCompany.companyName}`,
        type: 'success',
      });

      // Close modal and reset state
      setGrantCreditsCompany(null);
      setGrantCreditsAmount('');
      setGrantCreditsNote('');
    } catch (err) {
      console.error('Error granting credits:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to grant credits',
        type: 'error',
      });
    } finally {
      setGrantingCredits(false);
    }
  };

  const toggleCompanyVerification = async (companyId: string, verified: boolean) => {
    if (!session?.access_token || togglingVerifyId) return;

    setTogglingVerifyId(companyId);

    try {
      const response = await fetch('/api/admin/companies/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ companyId, verified }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update verification');
      }

      // Update local state
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, verified } : c))
      );

      // Show success toast
      setToast({
        message: verified ? 'Company verified' : 'Company unverified',
        type: 'success',
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error toggling verification:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update verification',
        type: 'error',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setTogglingVerifyId(null);
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

  // Send test email function
  const sendTestEmail = async () => {
    if (!session?.access_token || !testEmailAddress || sendingTestEmail) return;

    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const response = await fetch('/api/admin/test-email-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: testEmailAddress,
          type: testEmailType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send test email');
      }

      setTestEmailResult({
        success: true,
        message: data.message || `Test email sent to ${testEmailAddress}`,
      });
      setToast({
        message: `Test email sent to ${testEmailAddress}`,
        type: 'success',
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error sending test email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test email';
      setTestEmailResult({
        success: false,
        message: 'Failed to send email',
        error: errorMessage,
      });
      setToast({
        message: errorMessage,
        type: 'error',
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSendingTestEmail(false);
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
      fetchPendingCompanyRequests();
      fetchBetaApplications();
      fetchMembers();
      fetchCompanies();
      fetchCreditUsage();
    }
  }, [user, session, authLoading, navigate, fetchJobs, fetchPendingProfiles, fetchPendingCompanyRequests, fetchBetaApplications, fetchMembers, fetchCompanies, fetchCreditUsage]);

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
          <button
            onClick={() => toggleSection('pendingJobs')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Pending Jobs</h2>
              {jobs.filter((j) => j.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary rounded-full">
                  {jobs.filter((j) => j.status === 'pending').length}
                </span>
              )}
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-zinc-500 transition-transform duration-200",
              collapsedSections.pendingJobs ? "" : "rotate-180"
            )} />
          </button>

          {!collapsedSections.pendingJobs && (loading ? (
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
          ))}
        </div>

        {/* Pending Profiles Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('pendingProfiles')}
              className="flex items-center gap-2 group"
            >
              <UserCircle className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Pending Profiles</h2>
              {pendingProfiles.length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary rounded-full">
                  {pendingProfiles.length}
                </span>
              )}
              <ChevronDown className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                collapsedSections.pendingProfiles ? "" : "rotate-180"
              )} />
            </button>
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

          {!collapsedSections.pendingProfiles && (loadingProfiles ? (
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
                          <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-800">
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
                            <button
                              onClick={() => webEnrichProfile(profile.id, profile.fullName, true)}
                              disabled={webEnrichingProfileId === profile.id}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-secondary text-sm transition-colors disabled:opacity-50"
                            >
                              {webEnrichingProfileId === profile.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Searching web...
                                </>
                              ) : (
                                <>
                                  <Search className="h-4 w-4" />
                                  Web Enrich
                                </>
                              )}
                            </button>
                          </div>

                          {/* Web Enrichment Results */}
                          {webEnrichmentResult && webEnrichmentResult.profileId === profile.id && (
                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-secondary text-blue-400 flex items-center gap-2">
                                  <Search className="h-4 w-4" />
                                  Web Enrichment Results
                                </h4>
                                <button
                                  onClick={() => setWebEnrichmentResult(null)}
                                  className="text-zinc-500 hover:text-zinc-300"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              {webEnrichmentResult.error ? (
                                <p className="text-sm text-red-400">{webEnrichmentResult.error}</p>
                              ) : (
                                <div className="space-y-3">
                                  {webEnrichmentResult.summary && (
                                    <div>
                                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Summary</p>
                                      <p className="text-sm text-zinc-300">{webEnrichmentResult.summary}</p>
                                    </div>
                                  )}

                                  {webEnrichmentResult.discoveredProjects && webEnrichmentResult.discoveredProjects.length > 0 && (
                                    <div>
                                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                                        Discovered Projects ({webEnrichmentResult.discoveredProjects.length})
                                      </p>
                                      <div className="space-y-2">
                                        {webEnrichmentResult.discoveredProjects.map((project, idx) => (
                                          <div key={idx} className="bg-zinc-800/50 p-2 rounded text-sm">
                                            <p className="text-zinc-200 font-medium">{project.title}</p>
                                            <p className="text-zinc-400 text-xs mt-1">{project.description}</p>
                                            {project.url && (
                                              <a
                                                href={project.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 text-xs hover:underline mt-1 inline-flex items-center gap-1"
                                              >
                                                {project.url} <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {webEnrichmentResult.additionalSkills && webEnrichmentResult.additionalSkills.length > 0 && (
                                    <div>
                                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                                        Additional Skills Found
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {webEnrichmentResult.additionalSkills.map((skill) => (
                                          <span
                                            key={skill}
                                            className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Pending Company Requests Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('pendingCompanyRequests')}
              className="flex items-center gap-2 group"
            >
              <Building2 className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Pending Company Requests</h2>
              {pendingCompanyRequests.length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary rounded-full">
                  {pendingCompanyRequests.length}
                </span>
              )}
              <ChevronDown className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                collapsedSections.pendingCompanyRequests ? "" : "rotate-180"
              )} />
            </button>
            <button
              onClick={() => fetchPendingCompanyRequests()}
              disabled={loadingCompanyRequests}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingCompanyRequests ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {!collapsedSections.pendingCompanyRequests && (loadingCompanyRequests ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : pendingCompanyRequests.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <Building2 className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">No pending company requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCompanyRequests.map((request) => {
                const isExpanded = expandedRequestId === request.id;
                return (
                  <div key={request.id} className="border border-zinc-800">
                    {/* Request Header */}
                    <button
                      onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                          <Building2 className="h-5 w-5 text-yellow-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-primary text-white">{request.companyName}</h3>
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary border border-yellow-500/30">
                              Pending
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-zinc-500 font-secondary">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {request.contactEmail}
                            </span>
                            {request.industry && <span>{request.industry}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded Request Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-800">
                        <div className="pt-4 space-y-4">
                          {/* Contact Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Contact Name
                              </p>
                              <p className="text-sm text-zinc-300 font-secondary">
                                {request.contactName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Contact Email
                              </p>
                              <p className="text-sm text-zinc-300 font-secondary">
                                {request.contactEmail}
                              </p>
                            </div>
                            {request.contactPhone && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Phone
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {request.contactPhone}
                                </p>
                              </div>
                            )}
                            {request.companyWebsite && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Website
                                </p>
                                <a
                                  href={request.companyWebsite.startsWith('http') ? request.companyWebsite : `https://${request.companyWebsite}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-pink-400 hover:text-pink-300 font-secondary flex items-center gap-1"
                                >
                                  <Globe className="h-3 w-3" />
                                  {request.companyWebsite}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Company Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {request.industry && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Industry
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary">
                                  {request.industry}
                                </p>
                              </div>
                            )}
                            {request.companySize && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Company Size
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary capitalize">
                                  {request.companySize}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Approve/Reject Buttons */}
                          <div className="flex gap-3 pt-4 border-t border-zinc-800">
                            <button
                              onClick={() => approveCompanyRequest(request.id)}
                              disabled={approvingRequestId === request.id || rejectingRequestId === request.id}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                            >
                              {approvingRequestId === request.id ? (
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
                              onClick={() => rejectCompanyRequest(request.id)}
                              disabled={approvingRequestId === request.id || rejectingRequestId === request.id}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-secondary text-sm transition-colors disabled:opacity-50"
                            >
                              {rejectingRequestId === request.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Beta Applications Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('betaApplications')}
              className="flex items-center gap-2 group"
            >
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-primary text-white">Beta Applications</h2>
              <span className="ml-2 text-sm text-zinc-500">({betaApplications.length} pending)</span>
              <ChevronDown className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                collapsedSections.betaApplications ? "" : "rotate-180"
              )} />
            </button>
            <button
              onClick={() => fetchBetaApplications()}
              disabled={loadingBetaApplications}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingBetaApplications ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {!collapsedSections.betaApplications && (loadingBetaApplications ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : betaApplications.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-secondary">No pending beta applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {betaApplications.map((application) => (
                <div
                  key={application.id}
                  className="border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-primary text-white">{application.name}</h3>
                        <span className="px-2 py-0.5 text-xs font-secondary bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Beta Applicant
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400 font-secondary mb-3">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {application.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(application.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {application.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-zinc-500 font-secondary">Interests:</span>
                          {application.interests.map((interest) => (
                            <span
                              key={interest}
                              className="px-2 py-1 text-xs font-secondary bg-zinc-800 text-zinc-300 border border-zinc-700"
                            >
                              {interest.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveBetaApplication(application.id)}
                        disabled={approvingBetaId === application.id || rejectingBetaId === application.id || deletingBetaId === application.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approvingBetaId === application.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => rejectBetaApplication(application.id)}
                        disabled={approvingBetaId === application.id || rejectingBetaId === application.id || deletingBetaId === application.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rejectingBetaId === application.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => deleteBetaApplication(application.id, application.name)}
                        disabled={approvingBetaId === application.id || rejectingBetaId === application.id || deletingBetaId === application.id}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete application permanently"
                      >
                        {deletingBetaId === application.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Beta Members Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('betaMembers')}
              className="flex items-center gap-2 group"
            >
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl font-primary text-white">Beta Members</h2>
              <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-secondary rounded-full">
                {memberCounts.betaApproved} approved
              </span>
              <ChevronDown className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                collapsedSections.betaMembers ? "" : "rotate-180"
              )} />
            </button>
            <button
              onClick={() => fetchMembers()}
              disabled={loadingMembers}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingMembers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {!collapsedSections.betaMembers && (loadingMembers ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : betaMembers.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-secondary">No approved beta members yet</p>
            </div>
          ) : (
            <div className="border border-zinc-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-900 border-b border-zinc-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Interests</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Joined</th>
                    <th className="text-right px-4 py-3 text-sm font-secondary text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {betaMembers.map((member) => (
                    <tr key={member.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-secondary">{member.name}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-secondary bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                            Beta
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-secondary text-sm">{member.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {member.interests.slice(0, 3).map((interest) => (
                            <span key={interest} className="px-2 py-0.5 text-xs font-secondary bg-zinc-800 text-zinc-300 rounded">
                              {interest.replace(/-/g, ' ')}
                            </span>
                          ))}
                          {member.interests.length > 3 && (
                            <span className="text-xs text-zinc-500">+{member.interests.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-secondary text-sm">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteBetaApplication(member.id, member.name)}
                          disabled={deletingBetaId === member.id}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                          title="Delete beta member"
                        >
                          {deletingBetaId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Directory Members Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('directoryMembers')}
              className="flex items-center gap-2 group"
            >
              <Users className="h-5 w-5 text-blue-400" />
              <h2 className="text-xl font-primary text-white">Directory Members</h2>
              <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-secondary rounded-full">
                {memberCounts.directoryApproved} approved
              </span>
              <ChevronDown className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                collapsedSections.directoryMembers ? "" : "rotate-180"
              )} />
            </button>
            <button
              onClick={() => fetchMembers()}
              disabled={loadingMembers}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingMembers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {!collapsedSections.directoryMembers && (loadingMembers ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : directoryMembers.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-secondary">No approved directory members yet</p>
            </div>
          ) : (
            <div className="border border-zinc-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-900 border-b border-zinc-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Location</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Focus Areas</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Joined</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Links</th>
                    <th className="text-left px-4 py-3 text-sm font-secondary text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {directoryMembers.map((member) => (
                    <tr key={member.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {member.profilePictureUrl ? (
                            <img
                              src={member.profilePictureUrl}
                              alt={member.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                              <UserCircle className="w-5 h-5 text-zinc-500" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-secondary">{member.fullName}</span>
                              {member.membershipType === 'beta' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-secondary bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                                  BETA
                                </span>
                              )}
                            </div>
                            <span className="text-zinc-500 font-secondary text-xs">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-zinc-400 font-secondary text-sm">
                          <MapPin className="h-3 w-3" />
                          {member.location}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {member.focusAreas.slice(0, 2).map((area) => (
                            <span key={area} className="px-2 py-0.5 text-xs font-secondary bg-blue-500/10 text-blue-400 rounded">
                              {area.replace(/-/g, ' ')}
                            </span>
                          ))}
                          {member.focusAreas.length > 2 && (
                            <span className="text-xs text-zinc-500">+{member.focusAreas.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-secondary rounded",
                          member.availability === 'open-to-work' && "bg-green-500/20 text-green-400",
                          member.availability === 'open-to-collaborations' && "bg-blue-500/20 text-blue-400",
                          member.availability === 'not-available' && "bg-zinc-500/20 text-zinc-400"
                        )}>
                          {member.availability.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-secondary text-sm">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {member.portfolioUrl && (
                            <a
                              href={member.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-white transition-colors"
                              title="Portfolio"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                          {member.linkedinUrl && (
                            <a
                              href={member.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-blue-400 transition-colors"
                              title="LinkedIn"
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                          <a
                            href={`/directory/${member.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-white transition-colors"
                            title="View Profile"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {member.membershipType === 'beta' ? (
                          <button
                            onClick={() => upgradeMember(member.id)}
                            disabled={upgradingMemberId === member.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-400 border border-purple-500/30 font-secondary text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Upgrade to full directory member"
                          >
                            {upgradingMemberId === member.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ArrowUpCircle className="h-3 w-3" />
                            )}
                            Upgrade
                          </button>
                        ) : (
                          <span className="text-zinc-500 font-secondary text-xs">Full member</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Companies Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('companies')}
              className="flex items-center gap-2 group"
            >
              <Building2 className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Companies</h2>
              <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs font-secondary rounded-full">
                {companies.length}
              </span>
              <ChevronDown className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                collapsedSections.companies ? "" : "rotate-180"
              )} />
            </button>
            <button
              onClick={() => fetchCompanies()}
              disabled={loadingCompanies}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingCompanies ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {!collapsedSections.companies && (loadingCompanies ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : companies.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <Building2 className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">No companies registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => {
                const isExpanded = expandedCompanyId === company.id;
                return (
                  <div key={company.id} className="border border-zinc-800">
                    {/* Company Header */}
                    <button
                      onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                          <Building2 className="h-5 w-5 text-zinc-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-primary text-white">{company.companyName}</h3>
                            {company.verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-secondary border border-blue-500/30">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs font-secondary border border-zinc-500/30">
                                Unverified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-zinc-500 font-secondary">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {company.contactEmail}
                            </span>
                            {company.industry && <span>{company.industry}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(company.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded Company Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-800">
                        <div className="pt-4 space-y-4">
                          {/* Contact Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Contact Name
                              </p>
                              <p className="text-sm text-zinc-300 font-secondary">
                                {company.contactName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                Contact Email
                              </p>
                              <p className="text-sm text-zinc-300 font-secondary">
                                {company.contactEmail}
                              </p>
                            </div>
                            {company.contactPhone && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Phone
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {company.contactPhone}
                                </p>
                              </div>
                            )}
                            {company.companyWebsite && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Website
                                </p>
                                <a
                                  href={company.companyWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-pink-400 hover:text-pink-300 font-secondary flex items-center gap-1"
                                >
                                  <Globe className="h-3 w-3" />
                                  {company.companyWebsite}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Company Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {company.industry && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Industry
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary">
                                  {company.industry}
                                </p>
                              </div>
                            )}
                            {company.companySize && (
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Company Size
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary capitalize">
                                  {company.companySize}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Verification Toggle */}
                          <div className="flex gap-3 pt-4 border-t border-zinc-800">
                            {company.verified ? (
                              <button
                                onClick={() => toggleCompanyVerification(company.id, false)}
                                disabled={togglingVerifyId === company.id}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                              >
                                {togglingVerifyId === company.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Unverify
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleCompanyVerification(company.id, true)}
                                disabled={togglingVerifyId === company.id}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
                              >
                                {togglingVerifyId === company.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <BadgeCheck className="h-4 w-4" />
                                    Verify
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Credit Usage Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('creditUsage')}
              className="flex items-center gap-2 group"
            >
              <CreditCard className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Credit Usage</h2>
              <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs font-secondary rounded-full">
                {creditUsageCompanies.length}
              </span>
              <ChevronDown className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                collapsedSections.creditUsage ? "" : "rotate-180"
              )} />
            </button>
            <button
              onClick={() => fetchCreditUsage()}
              disabled={loadingCreditUsage}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-secondary text-sm transition-colors disabled:opacity-50"
            >
              {loadingCreditUsage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>

          {!collapsedSections.creditUsage && (
          <>
          {/* Platform Totals */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-zinc-800 p-4">
              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                Total Analyses
              </p>
              <p className="text-2xl font-primary text-pink-400">{creditUsageTotals.totalAnalyses}</p>
            </div>
            <div className="border border-zinc-800 p-4">
              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                <DollarSign className="h-3 w-3" />
                Total Revenue
              </p>
              <p className="text-2xl font-primary text-green-400">
                ${(creditUsageTotals.totalRevenue / 100).toFixed(2)}
              </p>
            </div>
          </div>

          {loadingCreditUsage ? (
            <div className="border border-zinc-800 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : creditUsageCompanies.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <CreditCard className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary">No credit usage data yet.</p>
            </div>
          ) : (
            <div className="border border-zinc-800 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
                <div className="text-xs font-secondary text-zinc-500 uppercase tracking-wide col-span-2">
                  Company
                </div>
                <div className="text-xs font-secondary text-zinc-500 uppercase tracking-wide text-center">
                  Free Used
                </div>
                <div className="text-xs font-secondary text-zinc-500 uppercase tracking-wide text-center">
                  Purchased
                </div>
                <div className="text-xs font-secondary text-zinc-500 uppercase tracking-wide text-center">
                  Total Analyses
                </div>
                <div className="text-xs font-secondary text-zinc-500 uppercase tracking-wide text-center">
                  Revenue
                </div>
                <div className="text-xs font-secondary text-zinc-500 uppercase tracking-wide text-right">
                  Actions
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-zinc-800">
                {creditUsageCompanies.map((company) => (
                  <div
                    key={company.companyId}
                    className="grid grid-cols-7 gap-4 px-4 py-3 hover:bg-zinc-900/30 transition-colors items-center"
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                      <span className="font-secondary text-sm text-zinc-300 truncate">
                        {company.companyName}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="font-secondary text-sm text-zinc-400">
                        {company.freeUsed}/5
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="font-secondary text-sm text-zinc-400">
                        {company.purchasedRemaining}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="font-secondary text-sm text-pink-400 font-medium">
                        {company.totalAnalyses}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className={cn(
                        'font-secondary text-sm font-medium',
                        company.totalRevenue > 0 ? 'text-green-400' : 'text-zinc-500'
                      )}>
                        ${(company.totalRevenue / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => setGrantCreditsCompany(company)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-secondary text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/30 hover:border-violet-500/50 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        Grant
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* Email Test Section */}
        <div className="mb-10">
          <button
            onClick={() => toggleSection('testEmail')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">Test Email Notifications</h2>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-zinc-500 transition-transform duration-200",
              collapsedSections.testEmail ? "" : "rotate-180"
            )} />
          </button>

          {!collapsedSections.testEmail && (
          <div className="border border-zinc-800 p-6">
            <p className="text-sm text-zinc-400 font-secondary mb-4">
              Send a test email to verify the notification system is working correctly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Email Input */}
              <div className="md:col-span-2">
                <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Email Type Select */}
              <div>
                <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                  Email Type
                </label>
                <select
                  value={testEmailType}
                  onChange={(e) => setTestEmailType(e.target.value as 'message' | 'profile_approved')}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white font-secondary text-sm focus:outline-none focus:border-zinc-500 appearance-none cursor-pointer"
                >
                  <option value="message" className="bg-zinc-900">New Message Notification</option>
                  <option value="profile_approved" className="bg-zinc-900">Profile Approved</option>
                </select>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={sendTestEmail}
                disabled={sendingTestEmail || !testEmailAddress}
                className="flex items-center gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-secondary text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingTestEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </button>

              {/* Result Message */}
              {testEmailResult && (
                <div className={cn(
                  "flex items-center gap-2 text-sm font-secondary",
                  testEmailResult.success ? "text-green-400" : "text-red-400"
                )}>
                  {testEmailResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {testEmailResult.success ? testEmailResult.message : testEmailResult.error}
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* User Management Section */}
        <div className="mb-10">
          <button
            onClick={() => toggleSection('userManagement')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">User Management</h2>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-zinc-500 transition-transform duration-200",
              collapsedSections.userManagement ? "" : "rotate-180"
            )} />
          </button>

          {!collapsedSections.userManagement && session?.access_token && (
            <UserManagementSection
              accessToken={session.access_token}
              onToast={(message, type) => {
                setToast({ message, type });
                setTimeout(() => setToast(null), 3000);
              }}
            />
          )}
        </div>

        {/* Jobs List */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('jobSubmissions')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-zinc-500" />
              <h2 className="text-xl font-primary">All Job Submissions</h2>
              <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs font-secondary rounded-full">
                {jobs.length}
              </span>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-zinc-500 transition-transform duration-200",
              collapsedSections.jobSubmissions ? "" : "rotate-180"
            )} />
          </button>

          {!collapsedSections.jobSubmissions && (
          <>
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
        </>
        )}
        </div>

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

      {/* Grant Credits Modal */}
      {grantCreditsCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setGrantCreditsCompany(null);
              setGrantCreditsAmount('');
              setGrantCreditsNote('');
            }}
          />

          {/* Dialog */}
          <div className="relative bg-zinc-900 border border-zinc-700 w-full max-w-md mx-4 p-6">
            {/* Close button */}
            <button
              onClick={() => {
                setGrantCreditsCompany(null);
                setGrantCreditsAmount('');
                setGrantCreditsNote('');
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-primary text-xl text-white mb-2">Grant Credits</h3>
            <p className="text-sm text-zinc-400 font-secondary mb-4">
              Add bonus credits to <span className="text-white">{grantCreditsCompany.companyName}</span>'s account.
            </p>

            {/* Current balance display */}
            <div className="mb-4 p-3 bg-zinc-800/50 border border-zinc-700">
              <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1">
                Current Balance
              </p>
              <p className="font-secondary text-sm text-zinc-300">
                {grantCreditsCompany.freeUsed < 5 ? 5 - grantCreditsCompany.freeUsed : 0} free + {grantCreditsCompany.purchasedRemaining} purchased credits
              </p>
            </div>

            {/* Credit amount input */}
            <div className="mb-4">
              <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                Credits to Add *
              </label>
              <input
                type="number"
                min="1"
                value={grantCreditsAmount}
                onChange={(e) => setGrantCreditsAmount(e.target.value)}
                placeholder="Enter credit amount"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Note textarea */}
            <div className="mb-6">
              <label className="block text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                Note (Optional)
              </label>
              <textarea
                value={grantCreditsNote}
                onChange={(e) => setGrantCreditsNote(e.target.value)}
                placeholder="e.g., Promotional bonus, support compensation..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-500 resize-none"
                rows={2}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setGrantCreditsCompany(null);
                  setGrantCreditsAmount('');
                  setGrantCreditsNote('');
                }}
                className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 font-secondary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={grantCredits}
                disabled={grantingCredits || !grantCreditsAmount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white font-secondary text-sm transition-colors disabled:opacity-50"
              >
                {grantingCredits ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Grant Credits
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
