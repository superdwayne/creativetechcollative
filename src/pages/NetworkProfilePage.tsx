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
  ArrowRight
} from 'lucide-react';
import { NetworkProfile, FOCUS_AREAS, AVAILABILITY_OPTIONS } from '@/types/network-profile';
import { getProfileBySlug } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NetworkProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [slug]);

  const getAvailabilityLabel = (status: string) => {
    return AVAILABILITY_OPTIONS.find(o => o.value === status)?.label || status;
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'open-to-work':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'open-to-collaborations':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'not-available':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getFocusAreaLabel = (value: string) => {
    return FOCUS_AREAS.find(f => f.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="flex flex-col items-center justify-center min-h-screen px-8 md:px-16">
          <div className="max-w-lg text-center">
            <h1 className="text-4xl md:text-5xl font-primary font-medium leading-[0.95] tracking-tight mb-6">
              <span className="block">Profile</span>
              <span className="block text-zinc-500">not found</span>
            </h1>
            <p className="text-zinc-400 font-secondary mb-10 text-lg">
              {error || 'The profile you\'re looking for doesn\'t exist.'}
            </p>
            <button
              onClick={() => navigate('/directory')}
              className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors flex items-center gap-2 mx-auto"
            >
              Browse Directory
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Profile Info */}
        <div className="lg:w-[450px] xl:w-[500px] flex-shrink-0 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-20 lg:py-0 lg:sticky lg:top-0 lg:h-screen">
          {/* Small Label */}
          <div className="mb-6">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              CTC Network
            </span>
          </div>

          {/* Back Link */}
          <Link
            to="/directory"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 font-secondary text-sm w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Link>

          {/* Profile Picture & Name */}
          <div className="flex items-center gap-5 mb-6">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.fullName}
                className="w-20 h-20 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-2xl font-primary text-white flex-shrink-0">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-primary font-medium leading-tight tracking-tight">
                {profile.fullName}
              </h1>
              <div className="flex items-center gap-2 text-zinc-500 font-secondary mt-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {profile.isCtcMember && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-300 text-xs font-secondary">
                <BadgeCheck className="h-3.5 w-3.5" />
                CTC Member
              </span>
            )}
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-secondary",
              getAvailabilityColor(profile.availability)
            )}>
              <Briefcase className="h-3 w-3" />
              {getAvailabilityLabel(profile.availability)}
            </span>
          </div>

          {/* Bio */}
          <p className="text-zinc-400 text-lg font-secondary leading-relaxed mb-8 max-w-md">
            {profile.bio}
          </p>

          {/* Contact Links */}
          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact
            </a>
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-colors"
              >
                <Globe className="h-4 w-4" />
                Portfolio
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
          </div>

          {/* Other Links */}
          {profile.otherSocialLinks && profile.otherSocialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.otherSocialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white font-secondary text-sm transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {link.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Focus Areas, Skills & Projects */}
        <div className="flex-1 px-8 md:px-12 py-12 lg:py-24 border-l border-zinc-900">
          {/* Focus Areas */}
          <div className="mb-12">
            <h2 className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4">
              Focus Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.focusAreas.map((area) => (
                <span
                  key={area}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 text-sm font-secondary"
                >
                  {getFocusAreaLabel(area)}
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="mb-12">
            <h2 className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4">
              Skills & Tools
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-zinc-900 text-zinc-400 text-sm font-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-6">
              Projects
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {profile.projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-zinc-800 overflow-hidden group"
                >
                  <div className="aspect-video relative overflow-hidden bg-zinc-900">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 font-secondary">
                        Project Image
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-primary text-white mb-2">{project.title}</h3>
                    <p className="text-zinc-500 text-sm font-secondary mb-4 line-clamp-2">{project.description}</p>
                    {project.link && (
                      <a
                        href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-white hover:text-zinc-300 text-sm font-secondary transition-colors"
                      >
                        View Project
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

export default NetworkProfilePage;
