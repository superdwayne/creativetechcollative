import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Briefcase,
  Users,
  LogOut,
  Loader2,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  ExternalLink,
  CreditCard,
  X,
  MessageSquare,
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { TagInput } from '../components/ui/tag-input';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/hooks/usePresence';
import {
  Company,
  JobSubmission,
  JobMatchWithProfile,
  PROJECT_TYPES,
  REMOTE_PREFERENCES,
  JOB_STATUSES,
  ProjectType,
  RemotePreference,
} from '@/types/job-matching';
import { FOCUS_AREAS } from '@/types/network-profile';
import {
  getCompanyByUserId,
  getJobSubmissionsByCompany,
  getMatchesWithProfilesByJobId,
  supabase,
} from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface CompanyCredits {
  freeAnalysesRemaining: number;
  purchasedCredits: number;
  bonusCredits: number;
}

interface JobWithMatches extends JobSubmission {
  matches: JobMatchWithProfile[];
  isExpanded: boolean;
  isLoadingMatches: boolean;
}

const CompanyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, signOut, loading: authLoading } = useAuth();
  
  // Track user presence to avoid sending email notifications when they're active
  usePresence();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [credits, setCredits] = useState<CompanyCredits | null>(null);
  const [jobs, setJobs] = useState<JobWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Job form state
  const [showJobForm, setShowJobForm] = useState(false);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobFormError, setJobFormError] = useState('');
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    preferredSkills: [] as string[],
    focusAreas: [] as string[],
    budgetRange: '',
    projectType: 'project-based' as ProjectType,
    remotePreference: 'flexible' as RemotePreference,
    location: '',
    timeline: '',
  });

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch company
      const companyData = await getCompanyByUserId(user.id);
      if (!companyData) {
        navigate('/company/register');
        return;
      }
      setCompany(companyData);

      // Fetch jobs
      const jobsData = await getJobSubmissionsByCompany(companyData.id);
      setJobs(jobsData.map(job => ({
        ...job,
        matches: [],
        isExpanded: false,
        isLoadingMatches: false,
      })));

      // Fetch credits
      if (supabase) {
        const { data: creditsData } = await supabase
          .from('company_analysis_credits')
          .select('free_analyses_remaining, purchased_credits, bonus_credits')
          .eq('company_id', companyData.id)
          .single();

        if (creditsData) {
          setCredits({
            freeAnalysesRemaining: creditsData.free_analyses_remaining || 0,
            purchasedCredits: creditsData.purchased_credits || 0,
            bonusCredits: creditsData.bonus_credits || 0,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/company/auth');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate, fetchData]);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!session?.access_token) return;
      
      try {
        const response = await fetch('/api/messages/unread-count', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUnreadMessageCount(data.count || 0);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    if (session?.access_token) {
      fetchUnreadCount();
    }
  }, [session?.access_token]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleJobExpand = async (jobId: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        // If expanding and no matches loaded yet, fetch them
        if (!job.isExpanded && job.matches.length === 0) {
          loadMatchesForJob(jobId);
          return { ...job, isExpanded: true, isLoadingMatches: true };
        }
        return { ...job, isExpanded: !job.isExpanded };
      }
      return job;
    }));
  };

  const loadMatchesForJob = async (jobId: string) => {
    try {
      const matches = await getMatchesWithProfilesByJobId(jobId);
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, matches, isLoadingMatches: false }
          : job
      ));
    } catch (err) {
      console.error('Error loading matches:', err);
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, isLoadingMatches: false }
          : job
      ));
    }
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    // Validation
    if (!jobForm.title.trim()) {
      setJobFormError('Job title is required');
      return;
    }
    if (!jobForm.description.trim()) {
      setJobFormError('Job description is required');
      return;
    }

    setIsSubmittingJob(true);
    setJobFormError('');

    try {
      const response = await fetch('/api/submit-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: jobForm.title.trim(),
          description: jobForm.description.trim(),
          requirements: jobForm.requirements.trim() || undefined,
          preferredSkills: jobForm.preferredSkills.length > 0 ? jobForm.preferredSkills : undefined,
          focusAreas: jobForm.focusAreas.length > 0 ? jobForm.focusAreas : undefined,
          budgetRange: jobForm.budgetRange.trim() || undefined,
          projectType: jobForm.projectType,
          remotePreference: jobForm.remotePreference,
          location: jobForm.location.trim() || undefined,
          timeline: jobForm.timeline.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit job');
      }

      // Add new job to list
      setJobs(prev => [{
        ...data.job,
        matches: [],
        isExpanded: false,
        isLoadingMatches: false,
      }, ...prev]);

      // Reset form
      setJobForm({
        title: '',
        description: '',
        requirements: '',
        preferredSkills: [],
        focusAreas: [],
        budgetRange: '',
        projectType: 'project-based',
        remotePreference: 'flexible',
        location: '',
        timeline: '',
      });
      setShowJobForm(false);
    } catch (err: any) {
      console.error('Error submitting job:', err);
      setJobFormError(err.message || 'Failed to submit job');
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = JOB_STATUSES.find(s => s.value === status);
    const colorMap: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      reviewed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      matched: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      closed: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
      rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
    };
    const iconMap: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3.5 w-3.5" />,
      reviewed: <CheckCircle2 className="h-3.5 w-3.5" />,
      matched: <Users className="h-3.5 w-3.5" />,
      closed: <XCircle className="h-3.5 w-3.5" />,
      rejected: <XCircle className="h-3.5 w-3.5" />,
    };

    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
        colorMap[status] || colorMap.pending
      )}>
        {iconMap[status] || iconMap.pending}
        {statusInfo?.label || status}
      </span>
    );
  };

  const totalCredits = credits
    ? credits.freeAnalysesRemaining + credits.purchasedCredits + credits.bonusCredits
    : 0;

  const totalMatches = jobs.reduce((acc, job) => {
    // Count approved matches
    const approvedMatches = job.matches.filter(m => m.adminApproved).length;
    return acc + approvedMatches;
  }, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-white animate-spin" />
          </div>
          <p className="text-zinc-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No company found</p>
          <button
            onClick={() => navigate('/company/register')}
            className="px-6 py-3 bg-white text-black font-secondary text-sm"
          >
            Register Your Company
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-zinc-800/50 backdrop-blur-sm bg-black/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase hover:text-zinc-300 transition-colors">
              CTC Talent
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm font-medium text-white">Dashboard</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white text-sm transition-all hover:bg-zinc-800/50 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-500/20 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Company Header */}
        <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm mb-8">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/5 via-transparent to-violet-500/5 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row gap-8 items-start">
            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center border border-white/5">
                  <Building2 className="h-8 w-8 text-zinc-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{company.companyName}</h1>
                  <p className="text-zinc-400 text-sm">{company.contactName} • {company.contactEmail}</p>
                </div>
              </div>

              {company.verified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Company
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  Pending Verification
                </span>
              )}
            </div>

            {/* Credits Card */}
            <div className="lg:w-72 bg-zinc-800/30 rounded-xl p-5 border border-zinc-700/50">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-pink-400" />
                <span className="text-sm font-medium text-zinc-300">Analysis Credits</span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{totalCredits}</div>
              {credits && (
                <div className="text-xs text-zinc-500 space-y-1">
                  {credits.freeAnalysesRemaining > 0 && (
                    <p>{credits.freeAnalysesRemaining} free credits</p>
                  )}
                  {credits.purchasedCredits > 0 && (
                    <p>{credits.purchasedCredits} purchased</p>
                  )}
                  {credits.bonusCredits > 0 && (
                    <p>{credits.bonusCredits} bonus</p>
                  )}
                </div>
              )}
              <Link
                to="/company/purchase-credits"
                className="mt-4 block text-center px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-sm font-medium hover:bg-pink-500/30 transition-colors"
              >
                Purchase Credits
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{jobs.length}</p>
                <p className="text-xs text-zinc-500">Jobs Submitted</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalMatches}</p>
                <p className="text-xs text-zinc-500">Approved Matches</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {jobs.filter(j => j.status === 'pending').length}
                </p>
                <p className="text-xs text-zinc-500">Pending Review</p>
              </div>
            </div>
          </div>
          <Link
            to="/messages"
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center relative">
                <MessageSquare className="h-5 w-5 text-pink-400" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{unreadMessageCount}</p>
                <p className="text-xs text-zinc-500 group-hover:text-pink-400 transition-colors">Unread Messages</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Submit New Job Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowJobForm(!showJobForm)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-xl font-medium text-sm hover:bg-zinc-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Submit New Job
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              showJobForm && "rotate-180"
            )} />
          </button>

          {showJobForm && (
            <div className="mt-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">New Job Specification</h3>

              {jobFormError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {jobFormError}
                </div>
              )}

              <form onSubmit={handleSubmitJob} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Job Title *</label>
                  <Input
                    value={jobForm.title}
                    onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Creative Developer for Interactive Installation"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Description *</label>
                  <Textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the project, goals, and what you're looking for..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Requirements</label>
                  <Textarea
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="Must-have qualifications and experience..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Preferred Skills</label>
                  <TagInput
                    tags={jobForm.preferredSkills}
                    onTagsChange={(tags) => setJobForm(prev => ({ ...prev, preferredSkills: tags }))}
                    placeholder="Add skills (e.g., Three.js, Unity, React)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Focus Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_AREAS.map((area) => (
                      <button
                        key={area.value}
                        type="button"
                        onClick={() => {
                          setJobForm(prev => ({
                            ...prev,
                            focusAreas: prev.focusAreas.includes(area.value)
                              ? prev.focusAreas.filter(a => a !== area.value)
                              : [...prev.focusAreas, area.value]
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm border transition-colors",
                          jobForm.focusAreas.includes(area.value)
                            ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        {area.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Project Type</label>
                    <select
                      value={jobForm.projectType}
                      onChange={(e) => setJobForm(prev => ({ ...prev, projectType: e.target.value as ProjectType }))}
                      className="w-full h-12 px-4 bg-transparent border border-zinc-800 rounded-md text-white font-secondary"
                    >
                      {PROJECT_TYPES.map((type) => (
                        <option key={type.value} value={type.value} className="bg-zinc-900">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Remote Preference</label>
                    <select
                      value={jobForm.remotePreference}
                      onChange={(e) => setJobForm(prev => ({ ...prev, remotePreference: e.target.value as RemotePreference }))}
                      className="w-full h-12 px-4 bg-transparent border border-zinc-800 rounded-md text-white font-secondary"
                    >
                      {REMOTE_PREFERENCES.map((pref) => (
                        <option key={pref.value} value={pref.value} className="bg-zinc-900">
                          {pref.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Location</label>
                    <Input
                      value={jobForm.location}
                      onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Budget Range</label>
                    <Input
                      value={jobForm.budgetRange}
                      onChange={(e) => setJobForm(prev => ({ ...prev, budgetRange: e.target.value }))}
                      placeholder="e.g., €5,000 - €10,000"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Timeline</label>
                    <Input
                      value={jobForm.timeline}
                      onChange={(e) => setJobForm(prev => ({ ...prev, timeline: e.target.value }))}
                      placeholder="e.g., 3 months"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJobForm(false)}
                    className="px-6 py-3 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingJob}
                    className="px-6 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmittingJob ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Job'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Jobs List */}
        <div>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Your Jobs
            <span className="text-zinc-600">({jobs.length})</span>
          </h2>

          {jobs.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
              <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-2">No jobs submitted yet</p>
              <p className="text-zinc-600 text-sm">
                Submit your first job to start matching with creative technologists
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden"
                >
                  {/* Job Header */}
                  <button
                    onClick={() => toggleJobExpand(job.id)}
                    className="w-full p-5 flex items-center gap-4 text-left hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white truncate">{job.title}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>{PROJECT_TYPES.find(t => t.value === job.projectType)?.label}</span>
                        <span>•</span>
                        <span>{REMOTE_PREFERENCES.find(r => r.value === job.remotePreference)?.label}</span>
                        {job.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {job.matches.filter(m => m.adminApproved).length > 0 && (
                        <span className="text-sm text-emerald-400">
                          {job.matches.filter(m => m.adminApproved).length} matches
                        </span>
                      )}
                      {job.isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {job.isExpanded && (
                    <div className="border-t border-zinc-800/50 p-5">
                      {/* Job Details */}
                      <div className="mb-6">
                        <p className="text-zinc-400 text-sm mb-4">{job.description}</p>
                        {job.preferredSkills && job.preferredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.preferredSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Matches Section */}
                      <div>
                        <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Matched Candidates
                        </h4>

                        {job.isLoadingMatches ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                          </div>
                        ) : job.matches.filter(m => m.adminApproved).length === 0 ? (
                          <div className="py-8 text-center text-zinc-500 text-sm">
                            {job.status === 'pending' ? (
                              'Waiting for admin review and matching'
                            ) : job.status === 'matched' ? (
                              'No approved matches yet'
                            ) : (
                              'No matches available'
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {job.matches
                              .filter(m => m.adminApproved)
                              .map((match) => (
                                <div
                                  key={match.id}
                                  className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4"
                                >
                                  <div className="flex items-start gap-3">
                                    {match.profile.profilePictureUrl ? (
                                      <img
                                        src={match.profile.profilePictureUrl}
                                        alt={match.profile.fullName}
                                        className="w-12 h-12 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/30 to-violet-500/30 flex items-center justify-center text-lg font-bold text-white">
                                        {match.profile.fullName.charAt(0)}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium text-white truncate">
                                          {match.profile.fullName}
                                        </h5>
                                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                                          {Math.round(match.matchScore)}% match
                                        </span>
                                      </div>
                                      {match.profile.location && (
                                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {match.profile.location}
                                        </p>
                                      )}
                                      <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                                        {match.matchReasoning}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-4">
                                    <Link
                                      to={`/directory/profile/${match.profile.slug}`}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-700/50 text-zinc-300 rounded-lg text-xs hover:bg-zinc-700 transition-colors"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      View Profile
                                    </Link>
                                                    <Link
                                                      to={`/messages?matchId=${match.id}`}
                                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-xs hover:bg-pink-500/30 transition-colors"
                                                    >
                                                      <MessageSquare className="h-3.5 w-3.5" />
                                                      Message
                                                    </Link>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboardPage;
