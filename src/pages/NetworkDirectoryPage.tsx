import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  BadgeCheck,
  Users,
  Loader2,
  Filter,
  X,
  ArrowRight
} from 'lucide-react';
import { NetworkProfile, FOCUS_AREAS, FocusArea, AvailabilityStatus, AVAILABILITY_OPTIONS } from '@/types/network-profile';
import { getAllProfiles } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NetworkDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('q') || '');
  // Multi-select focus areas - parse comma-separated values from URL
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<FocusArea[]>(() => {
    const param = searchParams.get('focus');
    if (!param) return [];
    return param.split(',').filter(v => FOCUS_AREAS.some(f => f.value === v)) as FocusArea[];
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

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'open-to-work':
        return 'bg-green-500/20 text-green-400';
      case 'open-to-collaborations':
        return 'bg-blue-500/20 text-blue-400';
      case 'not-available':
        return 'bg-zinc-500/20 text-zinc-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const getAvailabilityLabel = (status: string) => {
    return AVAILABILITY_OPTIONS.find(o => o.value === status)?.label || status;
  };

  const getFocusAreaLabel = (value: string) => {
    return FOCUS_AREAS.find(f => f.value === value)?.label || value;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Header & Info */}
        <div className="lg:w-[400px] xl:w-[450px] flex-shrink-0 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-20 lg:py-0 lg:sticky lg:top-0 lg:h-screen">
          {/* Small Label */}
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              CTC Network
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium leading-[0.95] tracking-tight mb-6">
            <span className="block">Find your</span>
            <span className="block text-zinc-500">collaborators</span>
          </h1>

          {/* Description */}
          <p className="text-zinc-400 text-lg font-secondary leading-relaxed mb-10 max-w-sm">
            Discover creative technologists from around the world. Connect, collaborate, and create together.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/directory/auth?mode=signup')}
            className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors w-fit flex items-center gap-2"
          >
            Create Your Profile
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Stats */}
          <div className="flex gap-12 mt-16 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">{profiles.length}</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Profiles</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">∞</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Possibilities</span>
            </div>
          </div>
        </div>

        {/* Right Side - Directory */}
        <div className="flex-1 px-8 md:px-12 py-8 lg:py-24 border-l border-zinc-900">
          {/* Search & Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, location, or skill..."
                  className="pl-12 pr-12 h-14 bg-transparent border-zinc-800 focus:border-zinc-600 font-secondary"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 hover:text-white transition-colors"
                    title="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 font-secondary text-sm tracking-wide transition-all",
                  showFilters 
                    ? "bg-white text-black" 
                    : "border border-zinc-700 text-white hover:border-zinc-500"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && !showFilters && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="pt-6 border-t border-zinc-800">
                <div className="space-y-6">
                  {/* Focus Areas - Multi-select */}
                  <div>
                    <label className="block text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-3">
                      Focus Areas
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FOCUS_AREAS.map(area => (
                        <button
                          key={area.value}
                          type="button"
                          onClick={() => toggleFocusArea(area.value)}
                          className={cn(
                            "px-3 py-1.5 text-sm font-secondary transition-all",
                            selectedFocusAreas.includes(area.value)
                              ? "bg-white text-black"
                              : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                          )}
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability - Single-select dropdown */}
                  <div>
                    <label className="block text-xs font-secondary tracking-wide text-zinc-500 uppercase mb-2">
                      Availability
                    </label>
                    <select
                      value={selectedAvailability}
                      onChange={(e) => setSelectedAvailability(e.target.value as AvailabilityStatus | '')}
                      className="w-full md:w-64 h-12 border border-zinc-800 bg-transparent px-4 text-sm text-white font-secondary focus:outline-none focus:border-zinc-600"
                    >
                      <option value="">All</option>
                      <option value="open-to-work">Open to Work</option>
                      <option value="open-to-collaborations">Open to Collaborations</option>
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-6 flex items-center gap-2 text-sm font-secondary text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center gap-2 text-zinc-500 mb-8">
            <Users className="h-4 w-4" />
            <span className="text-xs font-secondary tracking-wide uppercase">
              {loading ? 'Loading...' : `Showing ${filteredProfiles.length} creative technologist${filteredProfiles.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Profiles Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-20">
              <Users className="h-16 w-16 text-zinc-700 mb-6" />
              <h2 className="text-2xl font-primary text-white mb-3">No profiles found</h2>
              <p className="text-zinc-400 font-secondary mb-8 max-w-md">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search query.' 
                  : 'Be the first to create a profile!'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 border border-zinc-700 text-white font-secondary text-sm hover:border-zinc-500 transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => navigate('/directory/auth?mode=signup')}
                  className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
                >
                  Create Your Profile
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/directory/profile/${profile.slug}`}
                  className="group block border border-zinc-800 p-6 hover:border-zinc-600 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-lg font-primary text-white flex-shrink-0">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-primary text-white truncate group-hover:text-zinc-300 transition-colors">
                          {profile.fullName}
                        </h3>
                        {profile.isCtcMember && (
                          <BadgeCheck className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500 text-sm font-secondary">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{profile.location}</span>
                      </div>
                    </div>
                  </div>

                  {profile.portfolioUrl && (
                    <p className="text-zinc-500 text-sm font-secondary mb-4 truncate">
                      {profile.portfolioUrl}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.focusAreas.slice(0, 2).map((area) => (
                      <span
                        key={area}
                        className="px-2 py-1 text-xs font-secondary border border-zinc-700 text-zinc-300"
                      >
                        {getFocusAreaLabel(area)}
                      </span>
                    ))}
                    {profile.focusAreas.length > 2 && (
                      <span className="px-2 py-1 text-xs font-secondary border border-zinc-800 text-zinc-500">
                        +{profile.focusAreas.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-secondary bg-zinc-900 text-zinc-400"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 3 && (
                      <span className="px-2 py-1 text-xs font-secondary bg-zinc-900 text-zinc-500">
                        +{profile.skills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-secondary",
                      getAvailabilityColor(profile.availability)
                    )}>
                      <Briefcase className="h-3 w-3" />
                      {getAvailabilityLabel(profile.availability)}
                    </span>
                    <span className="text-xs font-secondary text-zinc-600">
                      {profile.projects.length} project{profile.projects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
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

export default NetworkDirectoryPage;
