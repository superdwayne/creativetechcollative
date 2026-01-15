import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { TagInput } from '../components/ui/tag-input';
import {
  Loader2,
  Building2,
  Briefcase,
  Plus,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  X,
  Sparkles,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyByUserId, getJobSubmissionsByCompany, getMatchesWithProfilesByJobId } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Company,
  JobSubmission,
  JobMatchWithProfile,
  PROJECT_TYPES,
  REMOTE_PREFERENCES,
  ProjectType,
  RemotePreference,
  JOB_STATUSES,
} from '@/types/job-matching';
import { FOCUS_AREAS, SUGGESTED_SKILLS } from '@/types/network-profile';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  preferredSkills: string[];
  focusAreas: string[];
  budgetRange: string;
  projectType: ProjectType;
  remotePreference: RemotePreference;
  location: string;
  timeline: string;
}

const initialJobFormData: JobFormData = {
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
};

const CompanyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, signOut, loading: authLoading } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Matches state
  const [jobMatches, setJobMatches] = useState<Record<string, JobMatchWithProfile[]>>({});
  const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>({});

  // Job form state
  const [jobFormData, setJobFormData] = useState<JobFormData>(initialJobFormData);
  const [jobFormErrors, setJobFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobSubmitError, setJobSubmitError] = useState('');
  const [jobSubmitSuccess, setJobSubmitSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [companyData, jobsData] = await Promise.all([
        getCompanyByUserId(user.id),
        getCompanyByUserId(user.id).then((c) =>
          c ? getJobSubmissionsByCompany(c.id) : []
        ),
      ]);

      if (!companyData) {
        navigate('/company/register');
        return;
      }

      setCompany(companyData);
      setJobs(jobsData);

      // Prefetch match counts for all matched jobs
      const matchedJobs = jobsData.filter((job) => job.status === 'matched');
      if (matchedJobs.length > 0) {
        const matchPromises = matchedJobs.map(async (job) => {
          const matches = await getMatchesWithProfilesByJobId(job.id);
          const approvedMatches = matches.filter((m) => m.adminApproved === true);
          return { jobId: job.id, matches: approvedMatches };
        });

        const results = await Promise.all(matchPromises);
        const matchesMap: Record<string, JobMatchWithProfile[]> = {};
        results.forEach(({ jobId, matches }) => {
          matchesMap[jobId] = matches;
        });
        setJobMatches(matchesMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
      loadData();
    }
  }, [user, authLoading, navigate, loadData]);

  // Fetch matches when a job is expanded
  const fetchMatchesForJob = useCallback(
    async (jobId: string) => {
      if (loadingMatches[jobId] || jobMatches[jobId]) return;

      setLoadingMatches((prev) => ({ ...prev, [jobId]: true }));

      try {
        const matches = await getMatchesWithProfilesByJobId(jobId);
        // Only show approved matches to companies
        const approvedMatches = matches.filter((m) => m.adminApproved === true);
        setJobMatches((prev) => ({ ...prev, [jobId]: approvedMatches }));
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoadingMatches((prev) => ({ ...prev, [jobId]: false }));
      }
    },
    [loadingMatches, jobMatches]
  );

  // Fetch matches when job is expanded
  useEffect(() => {
    if (expandedJobId) {
      fetchMatchesForJob(expandedJobId);
    }
  }, [expandedJobId, fetchMatchesForJob]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/company/auth');
  };

  const updateJobField = <K extends keyof JobFormData>(field: K, value: JobFormData[K]) => {
    setJobFormData((prev) => ({ ...prev, [field]: value }));
    if (jobFormErrors[field]) {
      setJobFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleFocusArea = (area: string) => {
    setJobFormData((prev) => {
      const current = prev.focusAreas;
      if (current.includes(area)) {
        return { ...prev, focusAreas: current.filter((a) => a !== area) };
      }
      return { ...prev, focusAreas: [...current, area] };
    });
  };

  const validateJobForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!jobFormData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!jobFormData.description.trim()) {
      newErrors.description = 'Job description is required';
    } else if (jobFormData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    setJobFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateJobForm() || !session) return;

    setIsSubmittingJob(true);
    setJobSubmitError('');

    try {
      const response = await fetch('/api/submit-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: jobFormData.title.trim(),
          description: jobFormData.description.trim(),
          requirements: jobFormData.requirements.trim() || undefined,
          preferredSkills: jobFormData.preferredSkills.length > 0 ? jobFormData.preferredSkills : undefined,
          focusAreas: jobFormData.focusAreas.length > 0 ? jobFormData.focusAreas : undefined,
          budgetRange: jobFormData.budgetRange.trim() || undefined,
          projectType: jobFormData.projectType,
          remotePreference: jobFormData.remotePreference,
          location: jobFormData.location.trim() || undefined,
          timeline: jobFormData.timeline.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit job');
      }

      setJobSubmitSuccess(true);
      setJobFormData(initialJobFormData);

      // Reload jobs
      setTimeout(() => {
        setJobSubmitSuccess(false);
        setShowJobForm(false);
        loadData();
      }, 2000);
    } catch (error: unknown) {
      console.error('Submit job error:', error);
      setJobSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmittingJob(false);
    }
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

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-8 md:px-16 py-20 lg:py-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              CTC Company Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-primary font-medium leading-[0.95] tracking-tight mt-2">
              Dashboard
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

        {/* Company Profile Card */}
        {company && (
          <div className="border border-zinc-800 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-8 w-8 text-zinc-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-primary">{company.companyName}</h2>
                  {company.verified ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-secondary border border-green-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-secondary border border-yellow-500/30">
                      <Clock className="h-3 w-3" />
                      Pending Verification
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-zinc-400 font-secondary">
                  {company.industry && <span>{company.industry}</span>}
                  {company.companySize && (
                    <span className="capitalize">{company.companySize}</span>
                  )}
                  {company.companyWebsite && (
                    <a
                      href={company.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-primary flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-zinc-500" />
              Your Job Submissions
            </h2>
            <button
              onClick={() => setShowJobForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Job
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="border border-zinc-800 p-8 text-center">
              <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 font-secondary mb-4">
                No job submissions yet. Submit a job spec to find matching creative technologists.
              </p>
              <button
                onClick={() => setShowJobForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Submit Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border border-zinc-800">
                  <button
                    onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-primary text-lg">{job.title}</h3>
                        {getStatusBadge(job.status)}
                        {job.status === 'matched' && jobMatches[job.id] && jobMatches[job.id].length > 0 && (
                          <span className="flex items-center gap-1 text-xs font-secondary text-zinc-400">
                            <Users className="h-3 w-3" />
                            {jobMatches[job.id].length} {jobMatches[job.id].length === 1 ? 'match' : 'matches'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-secondary">
                        <span className="capitalize">{job.projectType.replace('-', ' ')}</span>
                        <span className="capitalize">{job.remotePreference}</span>
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
                    {expandedJobId === job.id ? (
                      <ChevronUp className="h-5 w-5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-500" />
                    )}
                  </button>

                  {expandedJobId === job.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-zinc-800">
                      <div className="pt-4 space-y-4">
                        <div>
                          <h4 className="text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                            Description
                          </h4>
                          <p className="text-zinc-300 font-secondary text-sm whitespace-pre-wrap">
                            {job.description}
                          </p>
                        </div>

                        {job.requirements && (
                          <div>
                            <h4 className="text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                              Requirements
                            </h4>
                            <p className="text-zinc-300 font-secondary text-sm whitespace-pre-wrap">
                              {job.requirements}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {job.budgetRange && (
                            <div>
                              <h4 className="text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-1 flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Budget
                              </h4>
                              <p className="text-zinc-300 font-secondary text-sm">
                                {job.budgetRange}
                              </p>
                            </div>
                          )}
                          {job.timeline && (
                            <div>
                              <h4 className="text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Timeline
                              </h4>
                              <p className="text-zinc-300 font-secondary text-sm">
                                {job.timeline}
                              </p>
                            </div>
                          )}
                        </div>

                        {job.preferredSkills && job.preferredSkills.length > 0 && (
                          <div>
                            <h4 className="text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                              Preferred Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {job.preferredSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs font-secondary"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {job.focusAreas && job.focusAreas.length > 0 && (
                          <div>
                            <h4 className="text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                              Focus Areas
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {job.focusAreas.map((area) => {
                                const areaInfo = FOCUS_AREAS.find((a) => a.value === area);
                                return (
                                  <span
                                    key={area}
                                    className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs font-secondary"
                                  >
                                    {areaInfo?.label || area}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Pending Status Message */}
                        {job.status === 'pending' && (
                          <div className="pt-4 border-t border-zinc-800">
                            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                              <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-secondary text-yellow-400">
                                  Awaiting admin review
                                </p>
                                <p className="text-xs font-secondary text-zinc-400 mt-1">
                                  Our team will review your job submission and match you with suitable creative technologists.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Matches Section */}
                        {job.status === 'matched' && (
                          <div className="pt-4 border-t border-zinc-800">
                            {loadingMatches[job.id] ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                              </div>
                            ) : jobMatches[job.id] && jobMatches[job.id].length > 0 ? (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Sparkles className="h-4 w-4 text-pink-500" />
                                  <h4 className="text-sm font-primary text-white">
                                    Approved Candidates ({jobMatches[job.id].length})
                                  </h4>
                                </div>
                                <p className="text-xs font-secondary text-zinc-500 mb-4">
                                  These candidates have been matched and approved by our team. They have been notified about this opportunity.
                                </p>
                                <div className="space-y-3">
                                  {jobMatches[job.id].map((match) => (
                                    <div
                                      key={match.id}
                                      className="p-4 bg-zinc-800/50 border border-zinc-700"
                                    >
                                      <div className="flex items-start gap-4">
                                        {/* Profile Picture */}
                                        <a
                                          href={`/directory/profile/${match.profile.slug}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-shrink-0"
                                        >
                                          {match.profile.profilePictureUrl ? (
                                            <img
                                              src={match.profile.profilePictureUrl}
                                              alt={match.profile.fullName}
                                              className="w-12 h-12 rounded-full object-cover border border-zinc-600 hover:border-zinc-400 transition-colors"
                                            />
                                          ) : (
                                            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center border border-zinc-600 hover:border-zinc-400 transition-colors">
                                              <Users className="h-5 w-5 text-zinc-400" />
                                            </div>
                                          )}
                                        </a>

                                        {/* Match Info */}
                                        <div className="flex-1 min-w-0">
                                          {/* Member Name and View Profile Link */}
                                          <div className="flex items-center gap-2 mb-2">
                                            <a
                                              href={`/directory/profile/${match.profile.slug}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="font-primary text-white hover:text-pink-400 transition-colors"
                                            >
                                              {match.profile.fullName}
                                            </a>
                                            <a
                                              href={`/directory/profile/${match.profile.slug}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                              title="View full profile"
                                            >
                                              <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                          </div>

                                          {/* Status Badges */}
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary">
                                              {match.matchScore}% match
                                            </span>
                                            {match.memberNotified && (
                                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-secondary">
                                                Notified
                                              </span>
                                            )}
                                            {match.memberResponse === 'interested' && (
                                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-secondary flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Interested
                                              </span>
                                            )}
                                            {match.memberResponse === 'not-interested' && (
                                              <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs font-secondary">
                                                Not Interested
                                              </span>
                                            )}
                                          </div>

                                          {/* Match Reasoning */}
                                          <p className="text-sm text-zinc-300 font-secondary mb-2">
                                            {match.matchReasoning}
                                          </p>

                                          {/* Skill Matches */}
                                          {match.skillMatches && match.skillMatches.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {match.skillMatches.map((skill, idx) => (
                                                <span
                                                  key={idx}
                                                  className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs font-secondary"
                                                >
                                                  {skill.skill}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Connect Soon Badge */}
                                        {match.memberResponse === 'interested' && (
                                          <div className="flex-shrink-0">
                                            <span className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-secondary">
                                              <Mail className="h-3 w-3" />
                                              We'll connect you soon
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-zinc-400 font-secondary text-sm">
                                <Users className="h-4 w-4" />
                                Matches are being reviewed by our team. We'll notify you once candidates are approved.
                              </div>
                            )}
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

        {/* Job Submission Modal */}
        {showJobForm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-primary">Submit New Job</h2>
                <button
                  onClick={() => {
                    setShowJobForm(false);
                    setJobFormData(initialJobFormData);
                    setJobFormErrors({});
                    setJobSubmitError('');
                    setJobSubmitSuccess(false);
                  }}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {jobSubmitSuccess ? (
                <div className="p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-primary mb-2">Job Submitted!</h3>
                  <p className="text-zinc-400 font-secondary text-sm">
                    Your job has been submitted and is pending review. We'll notify you once matches
                    are available.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitJob} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                      Job Title *
                    </label>
                    <Input
                      value={jobFormData.title}
                      onChange={(e) => updateJobField('title', e.target.value)}
                      placeholder="e.g., Creative Technologist for AR Experience"
                      className={cn('h-12', jobFormErrors.title && 'border-red-500')}
                    />
                    {jobFormErrors.title && (
                      <p className="text-red-400 text-sm mt-1">{jobFormErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                      Description *
                    </label>
                    <Textarea
                      value={jobFormData.description}
                      onChange={(e) => updateJobField('description', e.target.value)}
                      placeholder="Describe the project, goals, and what you're looking for..."
                      rows={5}
                      className={cn(jobFormErrors.description && 'border-red-500')}
                    />
                    {jobFormErrors.description && (
                      <p className="text-red-400 text-sm mt-1">{jobFormErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                      Requirements (Optional)
                    </label>
                    <Textarea
                      value={jobFormData.requirements}
                      onChange={(e) => updateJobField('requirements', e.target.value)}
                      placeholder="Specific requirements, experience level, certifications..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                        Project Type *
                      </label>
                      <select
                        value={jobFormData.projectType}
                        onChange={(e) => updateJobField('projectType', e.target.value as ProjectType)}
                        className="w-full h-12 px-4 bg-transparent border border-zinc-800 text-white font-secondary focus:border-zinc-600 focus:outline-none appearance-none cursor-pointer"
                      >
                        {PROJECT_TYPES.map((type) => (
                          <option key={type.value} value={type.value} className="bg-zinc-900">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                        Remote Preference *
                      </label>
                      <select
                        value={jobFormData.remotePreference}
                        onChange={(e) =>
                          updateJobField('remotePreference', e.target.value as RemotePreference)
                        }
                        className="w-full h-12 px-4 bg-transparent border border-zinc-800 text-white font-secondary focus:border-zinc-600 focus:outline-none appearance-none cursor-pointer"
                      >
                        {REMOTE_PREFERENCES.map((pref) => (
                          <option key={pref.value} value={pref.value} className="bg-zinc-900">
                            {pref.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                        Location (Optional)
                      </label>
                      <Input
                        value={jobFormData.location}
                        onChange={(e) => updateJobField('location', e.target.value)}
                        placeholder="e.g., Amsterdam, Netherlands"
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                        Budget Range (Optional)
                      </label>
                      <Input
                        value={jobFormData.budgetRange}
                        onChange={(e) => updateJobField('budgetRange', e.target.value)}
                        placeholder="e.g., $10,000 - $25,000"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                      Timeline (Optional)
                    </label>
                    <Input
                      value={jobFormData.timeline}
                      onChange={(e) => updateJobField('timeline', e.target.value)}
                      placeholder="e.g., 3 months, Q2 2026, ASAP"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                      Focus Areas
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {FOCUS_AREAS.map((area) => {
                        const isSelected = jobFormData.focusAreas.includes(area.value);
                        return (
                          <button
                            key={area.value}
                            type="button"
                            onClick={() => toggleFocusArea(area.value)}
                            className={cn(
                              'p-3 border text-left transition-all',
                              isSelected
                                ? 'border-white bg-white/10 text-white'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                            )}
                          >
                            <div className="font-secondary text-sm">{area.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                      Preferred Skills
                    </label>
                    <TagInput
                      tags={jobFormData.preferredSkills}
                      onTagsChange={(tags) => updateJobField('preferredSkills', tags)}
                      suggestions={SUGGESTED_SKILLS}
                      placeholder="Type a skill and press Enter..."
                    />
                  </div>

                  {jobSubmitError && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{jobSubmitError}</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowJobForm(false);
                        setJobFormData(initialJobFormData);
                        setJobFormErrors({});
                        setJobSubmitError('');
                      }}
                      className="flex-1 px-6 py-3 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingJob}
                      className="flex-1 px-6 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              )}
            </div>
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
    </div>
  );
};

export default CompanyDashboardPage;
