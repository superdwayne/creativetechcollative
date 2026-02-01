import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Mail,
  Globe,
  Linkedin,
  ExternalLink,
  ArrowLeft,
  Loader2,
  BadgeCheck,
  Briefcase,
  ArrowUpRight,
  Zap,
  Sparkles,
  FolderOpen,
  Link2,
  MessageSquare,
} from 'lucide-react';
import { NetworkProfile, FOCUS_AREAS, AVAILABILITY_OPTIONS } from '@/types/network-profile';
import { getProfileBySlug } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NetworkProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingConversation, setStartingConversation] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      try {
        const data = await getProfileBySlug(slug);
        if (data) {
          setProfile(data);
          // Check if this is the user's own profile
          if (user && data.userId === user.id) {
            setIsOwnProfile(true);
          }
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [slug, user]);

  // Start a direct conversation with this member
  const handleStartConversation = async () => {
    if (!session?.access_token || !profile?.id) {
      // Redirect to login if not authenticated
      navigate('/directory/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setStartingConversation(true);

    try {
      const response = await fetch('/api/messages/direct/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipientProfileId: profile.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to the chat page with the conversation
        navigate(`/messages?type=direct&id=${data.conversationId}`);
      } else {
        console.error('Failed to start conversation:', data.error);
        // Could show a toast error here
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setStartingConversation(false);
    }
  };

  const getAvailabilityLabel = (status: string) => {
    return AVAILABILITY_OPTIONS.find(o => o.value === status)?.label || status;
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'open-to-work':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'open-to-collaborations':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/20';
      case 'not-available':
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-white animate-spin" />
          <p className="text-zinc-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Background atmosphere */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center justify-center min-h-screen px-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-8 border border-white/5">
            <Loader2 className="h-12 w-12 text-zinc-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Profile Not Found</h1>
          <p className="text-zinc-400 mb-10 max-w-md mx-auto text-lg leading-relaxed text-center">
            {error || 'The profile you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={() => navigate('/directory')}
            className="group px-8 py-4 bg-white text-black font-medium text-sm tracking-wide hover:bg-zinc-100 transition-all rounded-xl inline-flex items-center gap-2 shadow-lg shadow-white/10"
          >
            Browse Directory
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
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
      <header className="relative border-b border-zinc-800/50 backdrop-blur-sm bg-black/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/directory" className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase hover:text-zinc-300 transition-colors">
              CTC Network
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-sm font-medium text-white truncate max-w-[200px]">{profile.fullName}</span>
          </div>
          <Link
            to="/directory"
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white text-sm transition-all hover:bg-zinc-800/50 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-12">
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
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-white tracking-tight">{profile.fullName}</h1>
                      {profile.membershipType === 'beta' && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          BETA
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                      {profile.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-zinc-500" />
                          {profile.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
                    getAvailabilityColor(profile.availability)
                  )}>
                    <Briefcase className="h-3.5 w-3.5" />
                    {getAvailabilityLabel(profile.availability)}
                  </span>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-zinc-300 leading-relaxed mb-6 max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Message Button - only show if not own profile and user is logged in */}
                  {!isOwnProfile && (
                    <button
                      onClick={handleStartConversation}
                      disabled={startingConversation}
                      className="group inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {startingConversation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      Message
                    </button>
                  )}
                  
                  {/* Email Button */}
                  <a
                    href={`mailto:${profile.email}`}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-100 transition-all shadow-lg shadow-white/5"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section */}
          {(profile.portfolioUrl || profile.linkedinUrl || (profile.otherSocialLinks && profile.otherSocialLinks.length > 0)) && (
            <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              {profile.portfolioUrl && (
                <a
                  href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`}
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
                  href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
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
                    href={link.startsWith('http') ? link : `https://${link}`}
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

                    {project.imageUrl && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800 mb-4">
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <h3 className="relative font-medium text-white mb-2 group-hover:text-violet-200 transition-colors">{project.title}</h3>
                    <p className="relative text-sm text-zinc-400 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                    {project.link && (
                      <a
                        href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
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

          {/* Footer */}
          <div className="pt-8 border-t border-zinc-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
            <Link
              to="/directory"
              className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Directory
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NetworkProfilePage;
