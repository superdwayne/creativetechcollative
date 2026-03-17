import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Edit,
  ExternalLink,
  LogOut,
  Loader2,
  AlertCircle,
  MapPin,
  Briefcase,
  BadgeCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  Clock,
  Wand2,
  Plus,
  X,
  Search,
  FolderOpen,
  Globe,
  Linkedin,
  Link2,
  Mail,
  ArrowUpRight,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/hooks/usePresence';
import { NetworkProfile, FOCUS_AREAS, AVAILABILITY_OPTIONS } from '@/types/network-profile';
import { getProfileByUserId, deleteProfile } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NetworkDashboardPage: React.FC = () => {
  // Track user presence to avoid sending email notifications when they're active
  usePresence();
  const navigate = useNavigate();
  const { user, session, signOut, loading: authLoading, isCompanyUser } = useAuth();
  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentSuccess, setEnrichmentSuccess] = useState(false);
  const [enrichmentMessage, setEnrichmentMessage] = useState('');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  // New profile creation flow state
  const [firstName, setFirstName] = useState('');
  const [enrichUrl, setEnrichUrl] = useState('');
  const [showNameStep, setShowNameStep] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Enrichment preview modal state
  const [showEnrichmentPreview, setShowEnrichmentPreview] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<{
    discoveredProjects: Array<{ title: string; description: string; url?: string; client?: string; selected: boolean }>;
    additionalSkills: Array<{ name: string; selected: boolean }>;
    workHistory: Array<{ company: string; role: string; duration?: string; description?: string; selected: boolean }>;
    enrichedBio: string;
    useBio: boolean;
  } | null>(null);
  const [customSkill, setCustomSkill] = useState('');
  const [customProject, setCustomProject] = useState({ title: '', description: '', url: '' });
  const [isApplying, setIsApplying] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const profileData = await getProfileByUserId(user.id);
      setProfile(profileData);
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

    if (!authLoading && isCompanyUser) {
      navigate('/company/dashboard');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, isCompanyUser, navigate, fetchData]);

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

  // Enrich profile with web data - shows preview first
  const handleEnrichProfile = async () => {
    if (!profile) return;

    setIsEnriching(true);
    setEnrichmentSuccess(false);
    setEnrichmentMessage('');
    setError('');

    try {
      const response = await fetch('/api/enrich-profile-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          currentSkills: profile.skills || [],
          currentBio: profile.bio || '',
          linkedinUrl: profile.linkedinUrl || '',
          portfolioUrl: profile.portfolioUrl || '',
          location: profile.location || '',
          focusAreas: profile.focusAreas || [],
          existingProjects: profile.projects || [],
        }),
      });

      // Handle timeout and server errors
      if (response.status === 504) {
        throw new Error('The search took too long. Please try again or add information manually.');
      }

      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      // Safely parse JSON
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search for profile data');
      }

      if (data.success) {
        const hasData =
          (data.discoveredProjects?.length > 0) ||
          (data.additionalSkills?.length > 0) ||
          (data.workHistory?.length > 0) ||
          data.enrichedBio;

        setEnrichmentData({
          discoveredProjects: (data.discoveredProjects || []).map((p: any) => ({
            ...p,
            selected: true,
          })),
          additionalSkills: (data.additionalSkills || []).map((s: string) => ({
            name: s,
            selected: true,
          })),
          workHistory: (data.workHistory || []).map((w: any) => ({
            ...w,
            selected: true,
          })),
          enrichedBio: data.enrichedBio || '',
          useBio: !profile.bio || profile.bio.length < 100,
        });

        setShowEnrichmentPreview(true);

        if (!hasData) {
          setEnrichmentMessage('No new information found automatically. You can add custom skills and projects below.');
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Enrichment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search for profile data');
    } finally {
      setIsEnriching(false);
    }
  };

  // Apply selected enrichment data to profile
  const applyEnrichment = async () => {
    if (!profile || !enrichmentData) return;

    setIsApplying(true);

    try {
      const selectedProjects = enrichmentData.discoveredProjects
        .filter(p => p.selected)
        .map(p => ({
          id: crypto.randomUUID(),
          title: p.title,
          description: `${p.description}${p.client ? ` (Client: ${p.client})` : ''}`,
          imageUrl: '',
          link: p.url || '',
        }));

      const selectedSkills = enrichmentData.additionalSkills
        .filter(s => s.selected)
        .map(s => s.name);

      const selectedWorkHistory = enrichmentData.workHistory
        .filter(w => w.selected);

      const updates: Record<string, any> = {};

      if (selectedSkills.length > 0) {
        const existingSkills = profile.skills || [];
        updates.skills = [...new Set([...existingSkills, ...selectedSkills])].slice(0, 30);
      }

      if (selectedProjects.length > 0) {
        const existingProjects = profile.projects || [];
        const existingTitles = new Set(existingProjects.map(p => p.title?.toLowerCase()));
        const newProjects = selectedProjects.filter(p => !existingTitles.has(p.title?.toLowerCase()));
        updates.projects = [...existingProjects, ...newProjects].slice(0, 10);
      }

      if (enrichmentData.useBio && enrichmentData.enrichedBio) {
        updates.bio = enrichmentData.enrichedBio.substring(0, 300);
      }

      if (selectedWorkHistory.length > 0) {
        updates.enriched_content = JSON.stringify({
          workHistory: selectedWorkHistory,
          lastEnriched: new Date().toISOString(),
        });
      }

      const response = await fetch('/api/profiles/update-enrichment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          profileId: profile.id,
          updates,
        }),
      });

      let result: any;
      try {
        result = await response.json();
      } catch {
        console.error('Failed to parse enrichment response. Status:', response.status);
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to apply enrichment');
      }

      const updatedProfile = await getProfileByUserId(user!.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // Regenerate embedding so profile appears in job matching
      try {
        await fetch(`/api/generate-embeddings?profileId=${profile.id}`, {
          method: 'POST',
        });
      } catch (embeddingErr) {
        console.error('Embedding regeneration failed:', embeddingErr);
        // Don't fail the whole operation if embedding fails
      }

      setEnrichmentSuccess(true);
      const parts = [];
      if (selectedProjects.length) parts.push(`${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}`);
      if (selectedSkills.length) parts.push(`${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''}`);
      if (selectedWorkHistory.length) parts.push(`${selectedWorkHistory.length} work experience${selectedWorkHistory.length > 1 ? 's' : ''}`);
      setEnrichmentMessage(parts.length > 0 ? `Added ${parts.join(', ')} to your profile!` : 'Profile updated!');

      setShowEnrichmentPreview(false);
      setEnrichmentData(null);

      setTimeout(() => {
        setEnrichmentSuccess(false);
        setEnrichmentMessage('');
      }, 10000);
    } catch (err) {
      console.error('Apply enrichment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setIsApplying(false);
    }
  };

  const addCustomSkill = () => {
    if (!customSkill.trim() || !enrichmentData) return;
    setEnrichmentData({
      ...enrichmentData,
      additionalSkills: [
        ...enrichmentData.additionalSkills,
        { name: customSkill.trim(), selected: true },
      ],
    });
    setCustomSkill('');
  };

  const addCustomProject = () => {
    if (!customProject.title.trim() || !enrichmentData) return;
    setEnrichmentData({
      ...enrichmentData,
      discoveredProjects: [
        ...enrichmentData.discoveredProjects,
        {
          title: customProject.title.trim(),
          description: customProject.description.trim(),
          url: customProject.url.trim(),
          selected: true,
        },
      ],
    });
    setCustomProject({ title: '', description: '', url: '' });
  };

  const getAvailabilityLabel = (status: string) => {
    return AVAILABILITY_OPTIONS.find(o => o.value === status)?.label || status;
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'open-to-work':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'open-to-collaborations':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getFocusAreaLabel = (value: string) => {
    return FOCUS_AREAS.find(f => f.value === value)?.label || value;
  };

  const getFocusAreaColor = (value: string) => {
    const colors: Record<string, string> = {
      'immersive-experiences': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      'interactive-web': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      'generative-design': 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
      'creative-automation': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'physical-computing': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'realtime-visuals': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    };
    return colors[value] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  };

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

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-zinc-800/50 backdrop-blur-sm bg-black/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/directory" className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase hover:text-zinc-300 transition-colors">
              CTC Network
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm font-medium text-white">Dashboard</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all border border-transparent hover:border-zinc-700/50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!profile ? (
          /* No Profile State - Two Step Flow */
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-8 border border-white/5">
              <User className="h-12 w-12 text-zinc-500" />
            </div>
            
            {!showNameStep ? (
              /* Initial View - Get Started */
              <>
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Create Your Profile</h1>
                <p className="text-zinc-400 mb-10 max-w-md mx-auto text-lg leading-relaxed">
                  Join the CTC Network directory and connect with the creative technology community.
                </p>
                
                <button
                  onClick={() => setShowNameStep(true)}
                  className="group px-8 py-4 bg-white text-black font-medium text-sm tracking-wide hover:bg-zinc-100 transition-all rounded-xl inline-flex items-center gap-2 shadow-lg shadow-white/10"
                >
                  Get Started
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </>
            ) : (
              /* Step 2 - Enter Name and Choose Path */
              <>
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Let's build your profile</h1>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                  Enter your name and a link to your work — we'll search the web to auto-fill your profile.
                </p>
                
                <div className="max-w-md mx-auto mb-8 space-y-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setGenerateError('');
                    }}
                    placeholder="Your full name"
                    autoFocus
                    className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white text-center text-lg placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && firstName.trim()) {
                        if (!enrichUrl.trim()) {
                          document.getElementById('enrich-url-input')?.focus();
                        }
                      }
                    }}
                  />
                  
                  {firstName.trim() && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                          id="enrich-url-input"
                          type="url"
                          value={enrichUrl}
                          onChange={(e) => setEnrichUrl(e.target.value)}
                          placeholder="LinkedIn, portfolio, or website URL"
                          className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                      </div>
                      <p className="text-zinc-600 text-xs mt-1.5 text-center">
                        Adding a URL greatly improves results — LinkedIn, portfolio site, Behance, GitHub, etc.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {generateError && (
                  <div className="max-w-md mx-auto mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {generateError}
                  </div>
                )}
                
                {/* Action Buttons - Show when name entered */}
                {firstName.trim() && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button
                      onClick={async () => {
                        if (!firstName.trim()) return;
                        setIsGenerating(true);
                        setGenerateError('');
                        
                        const url = enrichUrl.trim();
                        const isLinkedIn = url.toLowerCase().includes('linkedin.com');
                        
                        try {
                          const response = await fetch('/api/enrich-profile-search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              fullName: firstName.trim(),
                              currentSkills: [],
                              currentBio: '',
                              linkedinUrl: isLinkedIn ? url : '',
                              portfolioUrl: !isLinkedIn && url ? url : '',
                              location: '',
                              focusAreas: [],
                              existingProjects: [],
                            }),
                          });
                          
                          if (response.status === 504) {
                            throw new Error('Request timed out. Please try again.');
                          }
                          
                          const text = await response.text();
                          if (!text) {
                            throw new Error('Empty response. Please try again.');
                          }
                          
                          const data = JSON.parse(text);
                          console.log('[Dashboard Enrich] API response:', data);
                          
                          const hasData = (data.discoveredProjects?.length > 0) ||
                            (data.additionalSkills?.length > 0) ||
                            data.enrichedBio;

                          if (data.success && hasData) {
                            const enrichmentData = encodeURIComponent(JSON.stringify(data));
                            navigate(`/directory/create?name=${encodeURIComponent(firstName.trim())}&enrichment=${enrichmentData}`);
                          } else {
                            navigate(`/directory/create?name=${encodeURIComponent(firstName.trim())}&mode=generate`);
                          }
                        } catch (err) {
                          console.error('Generate error:', err);
                          setGenerateError(err instanceof Error ? err.message : 'Failed to generate. Try manual entry.');
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={isGenerating}
                      className="group px-8 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium text-sm tracking-wide transition-all rounded-xl inline-flex items-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="animate-pulse">Searching the web...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          Auto-fill with AI
                        </>
                      )}
                    </button>
                    
                    <span className="text-zinc-600 text-sm">or</span>
                    
                    <button
                      onClick={() => navigate(`/directory/create?name=${encodeURIComponent(firstName.trim())}`)}
                      disabled={isGenerating}
                      className="group px-8 py-4 bg-zinc-800/50 text-white font-medium text-sm tracking-wide hover:bg-zinc-800 transition-all rounded-xl inline-flex items-center gap-2 border border-zinc-700/50 hover:border-zinc-600 disabled:opacity-50"
                    >
                      Fill in Manually
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                )}
                
                {/* Back button */}
                <button
                  onClick={() => {
                    setShowNameStep(false);
                    setFirstName('');
                    setEnrichUrl('');
                    setGenerateError('');
                  }}
                  className="mt-8 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← Back
                </button>
                
                <p className="text-zinc-500 text-xs mt-6 max-w-md mx-auto leading-relaxed">
                  We search your portfolio, LinkedIn, and public profiles to populate your skills, bio, work history, and projects. You can review and edit everything before saving.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Profile Header Card */}
            <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Decorative gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

              <div className="relative flex flex-col lg:flex-row gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="relative group">
                    {profile.profilePictureUrl ? (
                      <img
                        src={profile.profilePictureUrl}
                        alt={profile.fullName}
                        className="w-32 h-32 rounded-2xl object-cover ring-2 ring-zinc-800 group-hover:ring-zinc-700 transition-all"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-violet-500/20">
                        {profile.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {profile.isCtcMember && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
                        <BadgeCheck className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name & Status Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{profile.fullName}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                        {profile.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-zinc-500" />
                            {profile.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-zinc-500" />
                          {profile.email}
                        </span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col items-end gap-2">
                      {profile.approved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Live in Directory
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/20">
                          <Clock className="h-3.5 w-3.5" />
                          Pending Review
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
                        getAvailabilityColor(profile.availability)
                      )}>
                        <Briefcase className="h-3.5 w-3.5" />
                        {getAvailabilityLabel(profile.availability)}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-zinc-300 leading-relaxed mb-6 max-w-2xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate('/directory/edit')}
                      className="group flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-100 transition-all shadow-lg shadow-white/5"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleEnrichProfile}
                      disabled={isEnriching}
                      className={cn(
                        "group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border overflow-hidden",
                        isEnriching
                          ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30 cursor-wait"
                          : enrichmentSuccess
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-zinc-800/50 text-white border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600"
                      )}
                    >
                      {/* Animated shimmer on loading */}
                      {isEnriching && (
                        <div className="absolute inset-0 shimmer" />
                      )}
                      <span className="relative flex items-center gap-2">
                        {isEnriching ? (
                          <>
                            <div className="relative">
                              <Search className="h-4 w-4 animate-pulse" />
                              <div className="absolute inset-0 animate-ping">
                                <Search className="h-4 w-4 text-violet-400/50" />
                              </div>
                            </div>
                            <span className="animate-gradient-text">Searching the web...</span>
                          </>
                        ) : enrichmentSuccess ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 animate-[scale-pulse_0.5s_ease-out]" />
                            Enriched!
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                            Enrich with AI
                          </>
                        )}
                      </span>
                    </button>
                    <Link
                      to={`/directory/profile/${profile.slug}`}
                      className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-800/50 text-white rounded-xl text-sm font-medium border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Public Profile
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </Link>
                    <Link
                      to="/messages"
                      className="group relative flex items-center gap-2 px-5 py-2.5 bg-pink-500/10 text-pink-400 rounded-xl text-sm font-medium border border-pink-500/20 hover:bg-pink-500/20 hover:border-pink-500/30 transition-all"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Messages
                      {unreadMessageCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                        </span>
                      )}
                    </Link>
                  </div>

                  {/* Enrichment Success Message */}
                  {enrichmentSuccess && enrichmentMessage && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <p className="text-sm text-emerald-400">{enrichmentMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Links Section */}
            {(profile.portfolioUrl || profile.linkedinUrl || (profile.otherSocialLinks && profile.otherSocialLinks.length > 0)) && (
              <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                {profile.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-sm text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all"
                  >
                    <Globe className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                    Portfolio
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-sm text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all"
                  >
                    <Linkedin className="h-4 w-4 text-zinc-500 group-hover:text-[#0A66C2] transition-colors" />
                    LinkedIn
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {profile.otherSocialLinks?.map((link, idx) => {
                  let hostname = link;
                  try {
                    hostname = new URL(link).hostname.replace('www.', '');
                  } catch {
                    hostname = link.substring(0, 30);
                  }
                  return (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-sm text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all"
                    >
                      <Link2 className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      {hostname}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Focus Areas */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              <h2 className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Focus Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.focusAreas.map((area) => (
                  <span
                    key={area}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105",
                      getFocusAreaColor(area)
                    )}
                  >
                    {getFocusAreaLabel(area)}
                  </span>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <h2 className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Skills
                <span className="text-zinc-600">({profile.skills.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-full text-sm text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <h2 className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Projects
                  <span className="text-zinc-600">({profile.projects.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.projects.map((project) => (
                    <div
                      key={project.id}
                      className="group relative p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <h3 className="relative font-medium text-white mb-2 group-hover:text-violet-200 transition-colors">{project.title}</h3>
                      <p className="relative text-sm text-zinc-400 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer Actions */}
            <div className="pt-8 border-t border-zinc-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  to="/directory"
                  className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Browse Directory
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-3">Delete Profile?</h3>
            <p className="text-zinc-400 mb-6">
              This will permanently remove your profile from the CTC Network directory. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
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

      {/* Enrichment Preview Modal */}
      {showEnrichmentPreview && enrichmentData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Search className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Enrich Your Profile</h3>
                  <p className="text-sm text-zinc-500">Select items to add to your profile</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEnrichmentPreview(false);
                  setEnrichmentData(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            {/* No Data Found Message */}
            {enrichmentData.additionalSkills.length === 0 &&
             enrichmentData.discoveredProjects.length === 0 &&
             enrichmentData.workHistory.length === 0 &&
             !enrichmentData.enrichedBio && (
              <div className="mb-6 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                <p className="text-sm text-zinc-400">
                  No information was found automatically. Add custom skills and projects below.
                </p>
              </div>
            )}

            {/* Skills Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Skills ({enrichmentData.additionalSkills.filter(s => s.selected).length} selected)
              </h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {enrichmentData.additionalSkills.map((skill, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const updated = [...enrichmentData.additionalSkills];
                      updated[idx].selected = !updated[idx].selected;
                      setEnrichmentData({ ...enrichmentData, additionalSkills: updated });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all",
                      skill.selected
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    )}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                  placeholder="Add custom skill..."
                  className="flex-1 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
                <button
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                  className="px-4 py-2.5 bg-violet-500/20 text-violet-400 rounded-xl hover:bg-violet-500/30 disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Projects Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-sky-400" />
                Projects ({enrichmentData.discoveredProjects.filter(p => p.selected).length} selected)
              </h4>
              <div className="space-y-2 mb-3">
                {enrichmentData.discoveredProjects.map((project, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const updated = [...enrichmentData.discoveredProjects];
                      updated[idx].selected = !updated[idx].selected;
                      setEnrichmentData({ ...enrichmentData, discoveredProjects: updated });
                    }}
                    className={cn(
                      "w-full p-4 rounded-xl text-left transition-all border",
                      project.selected
                        ? "bg-sky-500/10 border-sky-500/20"
                        : "bg-zinc-800/30 border-zinc-700/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                        project.selected
                          ? "bg-sky-500 border-sky-500"
                          : "border-zinc-600"
                      )}>
                        {project.selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm", project.selected ? "text-white" : "text-zinc-400")}>
                          {project.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{project.description}</p>
                        {project.client && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-zinc-700/50 text-zinc-400 text-xs rounded-md">
                            Client: {project.client}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                <p className="text-xs text-zinc-400 mb-3 font-medium">Add custom project</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customProject.title}
                    onChange={(e) => setCustomProject({ ...customProject, title: e.target.value })}
                    placeholder="Project title"
                    className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50 transition-all"
                  />
                  <input
                    type="text"
                    value={customProject.description}
                    onChange={(e) => setCustomProject({ ...customProject, description: e.target.value })}
                    placeholder="Brief description"
                    className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50 transition-all"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customProject.url}
                      onChange={(e) => setCustomProject({ ...customProject, url: e.target.value })}
                      placeholder="Project URL (optional)"
                      className="flex-1 px-4 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50 transition-all"
                    />
                    <button
                      onClick={addCustomProject}
                      disabled={!customProject.title.trim()}
                      className="px-4 py-2.5 bg-sky-500/20 text-sky-400 rounded-xl hover:bg-sky-500/30 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Work History Section */}
            {enrichmentData.workHistory.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  Work History ({enrichmentData.workHistory.filter(w => w.selected).length} selected)
                </h4>
                <div className="space-y-2">
                  {enrichmentData.workHistory.map((work, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const updated = [...enrichmentData.workHistory];
                        updated[idx].selected = !updated[idx].selected;
                        setEnrichmentData({ ...enrichmentData, workHistory: updated });
                      }}
                      className={cn(
                        "w-full p-4 rounded-xl text-left transition-all border",
                        work.selected
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-zinc-800/30 border-zinc-700/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                          work.selected
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-zinc-600"
                        )}>
                          {work.selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={cn("font-medium text-sm", work.selected ? "text-white" : "text-zinc-400")}>
                            {work.role} at {work.company}
                          </p>
                          {work.duration && (
                            <p className="text-xs text-zinc-500 mt-0.5">{work.duration}</p>
                          )}
                          {work.description && (
                            <p className="text-xs text-zinc-500 mt-1">{work.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bio Section */}
            {enrichmentData.enrichedBio && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-fuchsia-400" />
                  Suggested Bio
                </h4>
                <button
                  onClick={() => setEnrichmentData({ ...enrichmentData, useBio: !enrichmentData.useBio })}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all border",
                    enrichmentData.useBio
                      ? "bg-fuchsia-500/10 border-fuchsia-500/20"
                      : "bg-zinc-800/30 border-zinc-700/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                      enrichmentData.useBio
                        ? "bg-fuchsia-500 border-fuchsia-500"
                        : "border-zinc-600"
                    )}>
                      {enrichmentData.useBio && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <p className={cn("text-sm leading-relaxed", enrichmentData.useBio ? "text-zinc-200" : "text-zinc-500")}>
                      {enrichmentData.enrichedBio}
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-zinc-800/50">
              <button
                onClick={() => {
                  setShowEnrichmentPreview(false);
                  setEnrichmentData(null);
                }}
                className="flex-1 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyEnrichment}
                disabled={isApplying}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Apply Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkDashboardPage;
