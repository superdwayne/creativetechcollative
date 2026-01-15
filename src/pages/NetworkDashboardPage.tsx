import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Edit,
  Trash2,
  ExternalLink,
  LogOut,
  Loader2,
  AlertCircle,
  MapPin,
  Briefcase,
  BadgeCheck,
  Sparkles,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NetworkProfile, FOCUS_AREAS, AVAILABILITY_OPTIONS } from '@/types/network-profile';
import { getProfileByUserId, deleteProfile, getMatchesForMember, updateMemberResponse, JobMatchWithDetails } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ImageCube from '../components/ImageCube';
import { PROJECT_TYPES, REMOTE_PREFERENCES, MemberResponse } from '@/types/job-matching';

const NetworkDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [respondingMatchId, setRespondingMatchId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const profileData = await getProfileByUserId(user.id);
      setProfile(profileData);

      // Fetch job matches if profile exists
      if (profileData) {
        const matches = await getMatchesForMember(profileData.id);
        setJobMatches(matches);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/directory/auth');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate, fetchData]);

  const handleRespondToMatch = async (matchId: string, response: MemberResponse) => {
    setRespondingMatchId(matchId);
    try {
      const result = await updateMemberResponse(matchId, response);
      if (result.success) {
        // Update local state
        setJobMatches((prev) =>
          prev.map((m) =>
            m.id === matchId ? { ...m, memberResponse: response } : m
          )
        );
      }
    } catch (err) {
      console.error('Error responding to match:', err);
    } finally {
      setRespondingMatchId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/directory');
  };

  const handleDelete = async () => {
    if (!profile) return;
    
    setIsDeleting(true);
    setError('');

    const result = await deleteProfile(profile.id);
    
    if (result.success) {
      setProfile(null);
      setShowDeleteConfirm(false);
    } else {
      setError(result.error || 'Failed to delete profile');
    }
    
    setIsDeleting(false);
  };

  const getAvailabilityLabel = (status: string) => {
    return AVAILABILITY_OPTIONS.find(o => o.value === status)?.label || status;
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'open-to-work':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'open-to-collaborations':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getFocusAreaLabel = (value: string) => {
    return FOCUS_AREAS.find(f => f.value === value)?.label || value;
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
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Dashboard Content */}
        <div className="flex-1 px-8 md:px-16 lg:px-24 py-20 lg:py-24">
          {/* Small Label */}
          <div className="mb-6">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              CTC Network
            </span>
          </div>
{/* Header */}
           <div className="flex items-start justify-between mb-10">
             <div>
               <h1 className="text-3xl md:text-4xl lg:text-5xl font-primary font-medium leading-[0.95] tracking-tight">
                 <span className="block">Welcome back</span>
                 <span className="block text-zinc-500">to your dashboard</span>
               </h1>
               <p className="mt-3 text-sm font-secondary text-zinc-400 max-w-md">
                 Manage your profile and visibility in the CTC Network.
               </p>
             </div>
             <button
               onClick={handleSignOut}
               className="flex items-center gap-2 px-6 py-3 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-colors"
             >
               <LogOut className="h-4 w-4" />
               Sign Out
             </button>
           </div>

{/* Account Info */}
           <div className="border-b border-zinc-800 pb-6 mb-4">
            <p className="text-sm font-secondary text-zinc-400">
              Logged in as <span className="text-white">{user?.email}</span>
            </p>
</div>
           {profile && (
             <div className="mb-6">
               {/* Approval Status Badge and Message */}
               {profile.approved ? (
                 <>
                   <div className="flex items-center gap-2 mb-2">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
                       <CheckCircle2 className="h-4 w-4" />
                       Approved
                     </span>
                   </div>
                   <p className="text-sm font-secondary text-green-400 mb-4">
                     Your profile is live in the directory.{' '}
                     <Link
                       to={`/directory/profile/${profile.slug}`}
                       className="underline hover:text-green-300 transition-colors"
                     >
                       View your public profile
                     </Link>
                   </p>
                 </>
               ) : (
                 <>
                   <div className="flex items-center gap-2 mb-2">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium border border-yellow-500/30">
                       <Clock className="h-4 w-4" />
                       Pending Review
                     </span>
                   </div>
                   <p className="text-sm font-secondary text-yellow-400">
                     Your profile is under review and will appear in the directory once approved.
                   </p>
                 </>
               )}
               <div className="mt-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 max-w-md">
                 <p className="text-sm font-secondary text-white mb-2">Getting started</p>
                 <ul className="text-sm font-secondary text-zinc-400 space-y-1">
                   <li>• Review your bio and skills</li>
                   <li>• Set availability so others know how to reach out</li>
                   <li>• Browse the directory and connect</li>
                 </ul>
               </div>
             </div>
           )}

           {error && (
             <div aria-live="polite" className="mb-6 p-4 border border-red-500/30 flex items-center gap-2 text-red-400 font-secondary text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {!profile ? (
            /* No Profile State */
            <div className="py-12">
              <User className="h-16 w-16 text-zinc-700 mb-6" />
              <h2 className="text-2xl font-primary text-white mb-3">No Profile Yet</h2>
              <p className="text-zinc-400 font-secondary mb-8 max-w-md">
                Create your profile to appear in the CTC Network directory and connect with the community.
              </p>
              <button
                onClick={() => navigate('/directory/create')}
                className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
              >
                Create Your Profile
              </button>
            </div>
        ) : (
          /* Profile Card */
          <>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-8 mb-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-xl font-medium text-white">
                      {profile.fullName}
                    </h2>
                    {profile.isCtcMember && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-medium border border-pink-500/30">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        CTC Member
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>

                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-4",
                    getAvailabilityColor(profile.availability)
                  )}>
                    <Briefcase className="h-3 w-3" />
                    {getAvailabilityLabel(profile.availability)}
                  </span>

                  <p className="text-zinc-300 text-sm mb-4">{profile.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300"
                      >
                        {getFocusAreaLabel(area)}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 6).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 6 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400">
                        +{profile.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

{/* Actions */}
             <div className="flex flex-col gap-4 mb-6">
               <div className="flex flex-wrap gap-4">
                 <button
                   onClick={() => navigate('/directory/edit')}
                   className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-black rounded-lg text-sm font-medium transition-colors"
                 >
                   <Edit className="h-4 w-4" />
                   Edit Profile
                 </button>
                 <Link
                   to={`/directory/profile/${profile.slug}`}
                   className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                 >
                   <ExternalLink className="h-4 w-4" />
                   View Public Profile
                 </Link>
               </div>
               <div className="mt-4">
                 <p className="text-xs font-secondary uppercase tracking-wide text-zinc-500 mb-2">Danger zone</p>
                 <button
                   onClick={() => setShowDeleteConfirm(true)}
                   className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                 >
                   <Trash2 className="h-4 w-4" />
                   Delete Profile
                 </button>
               </div>
             </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-primary text-white mb-4">Delete Profile?</h3>
                  <p className="text-zinc-400 mb-6">
                    This will permanently remove your profile from the CTC Network directory. This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Profile'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Job Matches Section */}
            <div className="mt-10 pt-8 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-pink-500" />
                <h3 className="text-lg font-primary text-white">Job Matches</h3>
                {jobMatches.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary rounded-full">
                    {jobMatches.length} {jobMatches.length === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </div>

              {jobMatches.length === 0 ? (
                <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/50 text-center">
                  <Sparkles className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm font-secondary text-zinc-400">
                    No job matches yet. Companies will see your profile when they post relevant opportunities.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-secondary text-zinc-400 mb-6">
                    These opportunities have been matched to your profile by our AI. Let us know if you're interested!
                  </p>

                <div className="space-y-4">
                  {jobMatches.map((match) => {
                    const isExpanded = expandedMatchId === match.id;
                    const projectTypeLabel = PROJECT_TYPES.find((p) => p.value === match.job.projectType)?.label || match.job.projectType;
                    const remoteLabel = REMOTE_PREFERENCES.find((r) => r.value === match.job.remotePreference)?.label || match.job.remotePreference;

                    return (
                      <div key={match.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                          className="w-full p-4 flex items-start justify-between text-left hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="font-primary text-white">{match.job.title}</h4>
                              <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-secondary rounded">
                                {match.matchScore}% match
                              </span>
                              {match.memberResponse ? (
                                <span
                                  className={cn(
                                    'px-2 py-0.5 text-xs font-secondary rounded',
                                    match.memberResponse === 'interested'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-zinc-500/20 text-zinc-400'
                                  )}
                                >
                                  {match.memberResponse === 'interested' ? 'Interested' : 'Not Interested'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-secondary rounded">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 font-secondary">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {match.company.companyName}
                              </span>
                              <span>{projectTypeLabel}</span>
                              <span>{remoteLabel}</span>
                              {match.job.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {match.job.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(match.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-zinc-800">
                            <div className="pt-4 space-y-4">
                              {/* Match Reasoning */}
                              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                                <p className="text-xs font-secondary text-pink-400 uppercase tracking-wide mb-1">
                                  Why you're a match
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary">
                                  {match.matchReasoning}
                                </p>
                              </div>

                              {/* Job Description */}
                              <div>
                                <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                  Description
                                </p>
                                <p className="text-sm text-zinc-300 font-secondary whitespace-pre-wrap">
                                  {match.job.description}
                                </p>
                              </div>

                              {/* Requirements */}
                              {match.job.requirements && (
                                <div>
                                  <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                    Requirements
                                  </p>
                                  <p className="text-sm text-zinc-300 font-secondary whitespace-pre-wrap">
                                    {match.job.requirements}
                                  </p>
                                </div>
                              )}

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-4">
                                {match.job.budgetRange && (
                                  <div>
                                    <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      Budget
                                    </p>
                                    <p className="text-sm text-zinc-300 font-secondary">
                                      {match.job.budgetRange}
                                    </p>
                                  </div>
                                )}
                                {match.job.timeline && (
                                  <div>
                                    <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Timeline
                                    </p>
                                    <p className="text-sm text-zinc-300 font-secondary">
                                      {match.job.timeline}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Skills */}
                              {match.skillMatches && match.skillMatches.length > 0 && (
                                <div>
                                  <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mb-2">
                                    Matched Skills
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {match.skillMatches.map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs font-secondary rounded"
                                      >
                                        {skill.skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Response Buttons */}
                              {!match.memberResponse && (
                                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                                  <button
                                    onClick={() => handleRespondToMatch(match.id, 'interested')}
                                    disabled={respondingMatchId === match.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-secondary text-sm rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {respondingMatchId === match.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    I'm Interested
                                  </button>
                                  <button
                                    onClick={() => handleRespondToMatch(match.id, 'not-interested')}
                                    disabled={respondingMatchId === match.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-secondary text-sm rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {respondingMatchId === match.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    Not Interested
                                  </button>
                                </div>
                              )}

                              {/* Already Responded */}
                              {match.memberResponse && (
                                <div className="pt-4 border-t border-zinc-800">
                                  <p className="text-sm text-zinc-400 font-secondary">
                                    {match.memberResponse === 'interested'
                                      ? "You've expressed interest. The company will be notified and may reach out to you."
                                      : "You've declined this opportunity. No further action needed."}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </>
        )}

{/* Community CTA */}
           <div className="mt-12 pt-8 border-t border-zinc-800">
             <h3 className="text-lg font-primary text-white mb-2">Explore the Community</h3>
             <p className="text-sm font-secondary text-zinc-400 mb-4 max-w-md">
               Discover other creative technologists in the CTC Network.
             </p>
             <div className="flex flex-wrap gap-4">
              <Link
                to="/directory"
                className="text-sm font-secondary text-zinc-400 hover:text-white transition-colors"
              >
                Browse Directory →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Cube */}
        <div className="hidden lg:flex flex-1 relative items-center justify-center min-h-[50vh] lg:min-h-screen">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-black" />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <ImageCube 
              size={4} 
              rotationSpeed={0.006} 
              position={{ x: 0, y: 0, z: 0 }} 
              forceVisible={true} 
            />
          </div>
        </div>
      </div>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Amsterdam • London • 2026
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative • Technology • Collective
        </span>
      </div>
    </div>
  );
};

export default NetworkDashboardPage;
