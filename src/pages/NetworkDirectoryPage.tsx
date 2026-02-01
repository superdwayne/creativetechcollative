import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/input';
import {
  Search,
  MapPin,
  BadgeCheck,
  Users,
  Loader2,
  Filter,
  X,
  ArrowRight,
  Quote,
  ExternalLink,
  LayoutGrid,
  Globe,
  Lock,
  Sparkles
} from 'lucide-react';
import { NetworkProfile, SUGGESTED_FOCUS_AREAS, FocusArea, AvailabilityStatus, AVAILABILITY_OPTIONS } from '@/types/network-profile';
import { getAllProfiles } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ArchiveGrid from '@/components/ArchiveGrid';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'feed' | 'explore';

const NetworkDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  
  // Beta access state
  const [betaAccessChecked, setBetaAccessChecked] = useState(false);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);

  // Check beta access on load
  useEffect(() => {
    const checkBetaAccess = async () => {
      if (authLoading) return;
      
      // If user is not logged in, they don't have beta access
      if (!user || !session) {
        setBetaAccessChecked(true);
        setHasBetaAccess(false);
        return;
      }

      try {
        const response = await fetch('/api/beta/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // User has beta access if:
          // 1. They are an admin, OR
          // 2. They have an approved beta application, OR
          // 3. They have an approved profile (existing CTC members)
          const hasAccess = data.isAdmin === true ||
                           data.betaApplication?.status === 'approved' || 
                           data.profileStatus === 'approved';
          setHasBetaAccess(hasAccess);
        } else {
          setHasBetaAccess(false);
        }
      } catch (err) {
        console.error('[Directory] Beta check error:', err);
        setHasBetaAccess(false);
      } finally {
        setBetaAccessChecked(true);
      }
    };

    checkBetaAccess();
  }, [user, session, authLoading]);

  // Initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('q') || '');
  // Multi-select focus areas - parse comma-separated values from URL
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<FocusArea[]>(() => {
    const param = searchParams.get('focus');
    if (!param) return [];
    return param.split(',').filter(v => SUGGESTED_FOCUS_AREAS.includes(v)) as FocusArea[];
  });
  // Single-select availability - parse from URL
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityStatus | ''>(() => {
    const param = searchParams.get('availability');
    if (!param) return '';
    return AVAILABILITY_OPTIONS.some(o => o.value === param) ? param as AvailabilityStatus : '';
  });
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);

    // Search query
    if (debouncedSearchQuery) {
      newParams.set('q', debouncedSearchQuery);
    } else {
      newParams.delete('q');
    }

    // Focus areas (multi-select, comma-separated)
    if (selectedFocusAreas.length > 0) {
      newParams.set('focus', selectedFocusAreas.join(','));
    } else {
      newParams.delete('focus');
    }

    // Availability (single-select)
    if (selectedAvailability) {
      newParams.set('availability', selectedAvailability);
    } else {
      newParams.delete('availability');
    }

    // Only update if params actually changed
    if (newParams.toString() !== searchParams.toString()) {
      setSearchParams(newParams, { replace: true });
    }
  }, [debouncedSearchQuery, selectedFocusAreas, selectedAvailability, searchParams, setSearchParams]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await getAllProfiles();
        setProfiles(data);
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = !debouncedSearchQuery ||
        profile.fullName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        profile.location.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        profile.skills.some(skill => skill.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
        profile.bio.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      // Multi-select focus areas: profile must have ALL selected areas (AND logic)
      const matchesFocusAreas = selectedFocusAreas.length === 0 ||
        selectedFocusAreas.every(area => profile.focusAreas.includes(area));

      const matchesAvailability = !selectedAvailability ||
        profile.availability === selectedAvailability;

      return matchesSearch && matchesFocusAreas && matchesAvailability;
    });
  }, [profiles, debouncedSearchQuery, selectedFocusAreas, selectedAvailability]);

  // Compute unique locations (extract city/country)
  const uniqueLocations = useMemo(() => {
    const locations = new Set(
      profiles.map(p => {
        // Extract first part of location (usually city or country)
        const parts = p.location.split(',');
        return parts[parts.length - 1]?.trim() || p.location;
      })
    );
    return locations.size;
  }, [profiles]);

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedFocusAreas([]);
    setSelectedAvailability('');
  };

  const hasActiveFilters = searchQuery || selectedFocusAreas.length > 0 || selectedAvailability;

  // Toggle focus area selection (multi-select)
  const toggleFocusArea = (area: FocusArea) => {
    setSelectedFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const getAvailabilityLabel = (status: string) => {
    return AVAILABILITY_OPTIONS.find(o => o.value === status)?.label || status;
  };

  // Get a short quote from bio (first sentence or first 100 chars)
  const getQuote = (bio: string) => {
    if (!bio) return null;
    const firstSentence = bio.split(/[.!?]/)[0];
    if (firstSentence.length > 120) {
      return firstSentence.slice(0, 117) + '...';
    }
    return firstSentence;
  };

  // Split profiles into editorial sections
  const featuredProfiles = useMemo(() => {
    // Featured = has profile picture OR has projects with images
    return filteredProfiles.filter(p =>
      p.profilePictureUrl || (p.projects && p.projects.some(proj => proj.imageUrl))
    ).slice(0, 2);
  }, [filteredProfiles]);

  const profilesWithProjects = useMemo(() => {
    return filteredProfiles.filter(p =>
      p.projects && p.projects.length > 0 && !featuredProfiles.includes(p)
    );
  }, [filteredProfiles, featuredProfiles]);

  const remainingProfiles = useMemo(() => {
    return filteredProfiles.filter(p =>
      !featuredProfiles.includes(p) && !profilesWithProjects.includes(p)
    );
  }, [filteredProfiles, featuredProfiles, profilesWithProjects]);

  const getFocusAreaLabel = (value: string) => {
    // Focus areas are now human-readable strings, so value === label
    return value;
  };

  // Show loading while checking auth and beta access
  if (authLoading || !betaAccessChecked) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-zinc-400 font-secondary">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-beta users
  if (!hasBetaAccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-primary font-medium mb-4">Beta Access Required</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            The CTC Directory is currently in beta and available exclusively to approved beta members. 
            Join our beta program to get early access to this feature.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/beta')}
              className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Apply for Beta
            </button>
            {user ? (
              <button
                onClick={() => navigate('/beta/hub')}
                className="px-8 py-4 bg-zinc-900 text-white font-secondary text-sm tracking-wide hover:bg-zinc-800 transition-all inline-flex items-center justify-center gap-2 border border-zinc-800"
              >
                Go to BetaHub
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/beta/auth')}
                className="px-8 py-4 bg-zinc-900 text-white font-secondary text-sm tracking-wide hover:bg-zinc-800 transition-all inline-flex items-center justify-center gap-2 border border-zinc-800"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-zinc-600 font-secondary text-sm mt-8">
            Already a beta member?{' '}
            <button
              onClick={() => navigate('/beta/auth')}
              className="text-purple-400 hover:text-purple-300"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-black text-white",
      viewMode === 'explore' ? "h-screen overflow-hidden" : "overflow-x-hidden"
    )}>
      {/* Editorial Header - always visible */}
      <header className="relative border-b border-white/[0.06] flex-shrink-0 z-50 bg-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-[10px] font-secondary tracking-[0.4em] text-zinc-600 uppercase mb-4 block">
                The Creative Technology Collective
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium leading-[0.95] tracking-tight">
                <span className="text-white">Discover</span>
                <br />
                <span className="text-zinc-500">Creative Technologists</span>
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/directory/auth?mode=signup')}
                className="px-6 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Join the Directory
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats Bar + View Toggle */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04]">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-zinc-500">
                <Users className="h-4 w-4" />
                <span className="text-sm font-secondary">{profiles.length} creatives</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-secondary">{uniqueLocations} locations</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06]">
              <button
                onClick={() => setViewMode('feed')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-secondary transition-all",
                  viewMode === 'feed'
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-white"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Feed</span>
              </button>
              <button
                onClick={() => setViewMode('explore')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-secondary transition-all",
                  viewMode === 'explore'
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-white"
                )}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Explore</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Explore View - Archive Grid (full page takeover) */}
      {viewMode === 'explore' && (
        <ArchiveGrid
          profiles={profiles}
          onClose={() => setViewMode('feed')}
          isLoading={loading}
        />
      )}

      {/* Feed View */}
      {viewMode === 'feed' && (
        <>
          {/* Search Bar - Sticky */}
          <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/[0.04]">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, skill, or location..."
                    className="pl-11 pr-11 h-11 bg-white/[0.03] border-white/[0.06] font-secondary text-sm placeholder:text-zinc-600 focus:border-white/[0.15] focus:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setDebouncedSearchQuery(''); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 h-11 font-secondary text-sm transition-all",
                    showFilters ? "bg-white text-black" : "bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && !showFilters && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="pt-4 mt-4 border-t border-white/[0.04]">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SUGGESTED_FOCUS_AREAS.slice(0, 12).map(area => (
                      <button
                        key={area}
                        onClick={() => toggleFocusArea(area)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-secondary transition-all",
                          selectedFocusAreas.includes(area) ? "bg-white text-black" : "bg-white/[0.04] text-zinc-500 hover:text-white"
                        )}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs font-secondary text-zinc-500 hover:text-white flex items-center gap-1">
                      <X className="h-3 w-3" /> Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Editorial Feed */}
          <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-32">
            <h2 className="text-2xl font-primary text-zinc-300 mb-4">No profiles found</h2>
            <p className="text-zinc-500 font-secondary mb-8">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="px-6 py-3 bg-white text-black font-secondary text-sm">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-24">

            {/* Featured Section - Hero Cards */}
            {featuredProfiles.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[10px] font-secondary tracking-[0.3em] text-zinc-600 uppercase">Featured</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredProfiles.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/directory/profile/${profile.slug}`}
                      className="group relative block overflow-hidden bg-zinc-900/50 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                        {/* Image Side */}
                        <div className="relative bg-zinc-800 overflow-hidden">
                          {profile.profilePictureUrl ? (
                            <img
                              src={profile.profilePictureUrl}
                              alt={profile.fullName}
                              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            />
                          ) : profile.projects?.[0]?.imageUrl ? (
                            <img
                              src={profile.projects[0].imageUrl}
                              alt={profile.projects[0].title}
                              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10rem] font-primary font-bold text-white/[0.05]">
                                {profile.fullName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/90" />
                        </div>

                        {/* Content Side */}
                        <div className="relative p-8 md:p-10 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-secondary mb-4">
                              <MapPin className="h-3 w-3" />
                              <span>{profile.location}</span>
                              {profile.isCtcMember && <BadgeCheck className="h-3.5 w-3.5 text-purple-400/60 ml-2" />}
                              {profile.membershipType === 'beta' && (
                                <span className="px-1.5 py-0.5 text-[9px] font-secondary bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded ml-1">
                                  BETA
                                </span>
                              )}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-primary font-medium text-white mb-4 group-hover:translate-x-1 transition-transform duration-300">
                              {profile.fullName}
                            </h2>
                            <p className="text-zinc-400 font-secondary leading-relaxed line-clamp-3 mb-6">
                              {profile.bio}
                            </p>
                            {profile.focusAreas && profile.focusAreas.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-6">
                                {profile.focusAreas.slice(0, 2).map((area, i) => (
                                  <span key={i} className="px-3 py-1 text-[10px] font-secondary text-zinc-400 bg-white/[0.04] uppercase tracking-wider">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
                            <span className={cn(
                              "text-xs font-secondary uppercase tracking-wider",
                              profile.availability === 'open-to-work' ? 'text-emerald-400' : 'text-zinc-500'
                            )}>
                              {getAvailabilityLabel(profile.availability)}
                            </span>
                            <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-white group-hover:translate-x-2 transition-all duration-300" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Makers Section - People with Projects */}
            {profilesWithProjects.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[10px] font-secondary tracking-[0.3em] text-zinc-600 uppercase">Makers</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs font-secondary text-zinc-600">{profilesWithProjects.length} creatives</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profilesWithProjects.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/directory/profile/${profile.slug}`}
                      className="group block"
                    >
                      {/* Project Preview */}
                      {profile.projects?.[0] && (
                        <div className="relative aspect-[4/3] mb-4 overflow-hidden bg-zinc-900 border border-white/[0.04] group-hover:border-white/[0.1] transition-all">
                          {profile.projects[0].imageUrl ? (
                            <img
                              src={profile.projects[0].imageUrl}
                              alt={profile.projects[0].title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                              <span className="text-xs font-secondary text-zinc-600 uppercase tracking-wider">{profile.projects[0].title}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-[10px] font-secondary text-white/60 uppercase tracking-wider">Latest Work</span>
                            <p className="text-sm font-secondary text-white truncate">{profile.projects[0].title}</p>
                          </div>
                        </div>
                      )}
                      {/* Profile Info */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-primary text-white group-hover:text-zinc-300 transition-colors">{profile.fullName}</h3>
                            {profile.membershipType === 'beta' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-secondary bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                                BETA
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-secondary text-zinc-500">{profile.location}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
                      </div>
                      {/* Skills */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {profile.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-[10px] font-secondary text-zinc-600">{skill}{i < Math.min(profile.skills.length - 1, 2) ? ' •' : ''}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Directory Section - Remaining Profiles */}
            {remainingProfiles.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[10px] font-secondary tracking-[0.3em] text-zinc-600 uppercase">Directory</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs font-secondary text-zinc-600">{remainingProfiles.length} creatives</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {remainingProfiles.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/directory/profile/${profile.slug}`}
                      className="group block p-5 border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-primary text-zinc-400">
                          {profile.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-primary text-white truncate group-hover:text-zinc-300 transition-colors">{profile.fullName}</h3>
                            {profile.membershipType === 'beta' && (
                              <span className="px-1 py-0.5 text-[8px] font-secondary bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded flex-shrink-0">
                                BETA
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-secondary text-zinc-600 truncate">{profile.location}</p>
                        </div>
                      </div>
                      {profile.bio && (
                        <p className="text-xs font-secondary text-zinc-500 line-clamp-2 mb-3">{profile.bio}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[10px] font-secondary uppercase tracking-wider",
                          profile.availability === 'open-to-work' ? 'text-emerald-400/70' :
                          profile.availability === 'open-to-collaborations' ? 'text-purple-400/70' : 'text-zinc-600'
                        )}>
                          {getAvailabilityLabel(profile.availability)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Quote Section - Pull quote from a random profile */}
            {filteredProfiles.length > 3 && filteredProfiles[2]?.bio && (
              <section className="py-16 border-y border-white/[0.04]">
                <div className="max-w-4xl mx-auto text-center">
                  <Quote className="h-8 w-8 text-zinc-700 mx-auto mb-6" />
                  <blockquote className="text-2xl md:text-3xl font-primary text-zinc-300 leading-relaxed mb-6">
                    "{getQuote(filteredProfiles[2].bio)}"
                  </blockquote>
                  <Link
                    to={`/directory/profile/${filteredProfiles[2].slug}`}
                    className="inline-flex items-center gap-2 text-sm font-secondary text-zinc-500 hover:text-white transition-colors"
                  >
                    — {filteredProfiles[2].fullName}, {filteredProfiles[2].location}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>
            )}

          </div>
        )}
          </main>

          {/* Footer CTA */}
          <footer className="border-t border-white/[0.04] py-16">
            <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
              <h2 className="text-2xl md:text-3xl font-primary text-white mb-4">Join the collective</h2>
              <p className="text-zinc-500 font-secondary mb-8 max-w-md mx-auto">
                Add your profile to be discovered by teams and collaborators worldwide.
              </p>
              <button
                onClick={() => navigate('/directory/auth?mode=signup')}
                className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all inline-flex items-center gap-2"
              >
                Create Your Profile
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default NetworkDirectoryPage;
