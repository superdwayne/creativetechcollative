import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup } from '../components/ui/radio-group';
import { TagInput } from '../components/ui/tag-input';
import { ImageUpload } from '../components/ui/image-upload';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  User,
  Briefcase,
  FolderOpen,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Wand2
} from 'lucide-react';
import { 
  ProfileFormData, 
  Project, 
  AvailabilityStatus,
  SUGGESTED_FOCUS_AREAS, 
  AVAILABILITY_OPTIONS, 
  SUGGESTED_SKILLS 
} from '@/types/network-profile';
import { CreativeSpectrumSlider } from '@/components/ui/creative-spectrum-slider';
import { updateProfile, getProfileByUserId } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { initializeProfileWebMCP, cleanupProfileWebMCP } from '@/lib/webmcp-profile';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Specialization', icon: Briefcase },
  { id: 3, title: 'Projects', icon: FolderOpen },
  { id: 4, title: 'Preferences', icon: Settings },
];

const createEmptyProject = (): Project => ({
  id: crypto.randomUUID(),
  title: '',
  imageUrl: '',
  description: '',
  link: '',
});

const NetworkEditProfilePage: React.FC = () => {
  const calculateCompletion = () => {
    let score = 0;
    const total = 8;

    if (formData.fullName) score++;
    if (formData.location) score++;
    if (formData.bio && formData.bio.length >= 50) score++;
    if (formData.focusAreas.length > 0) score++;
    if (formData.skills.length >= 3) score++;
    if (formData.projects.filter(p => p.title && p.description).length >= 1) score++;
    if (formData.availability) score++;
    if (formData.profilePictureUrl) score++;

    return Math.round((score / total) * 100);
  };
  const track = (event: string, payload?: Record<string, any>) => {
    // Tool-agnostic analytics hook (wire to PostHog/GA later)
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics]', event, payload || {});
    }
  };
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileSlug, setProfileSlug] = useState<string>('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState('');
  const [originalUrls, setOriginalUrls] = useState<{ portfolioUrl: string; linkedinUrl: string }>({
    portfolioUrl: '',
    linkedinUrl: '',
  });
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState('');
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [autoFillSummary, setAutoFillSummary] = useState('');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    location: '',
    email: '',
    portfolioUrl: '',
    linkedinUrl: '',
    otherSocialLinks: '',
    bio: '',
    focusAreas: [],
    skills: [],
    projects: [createEmptyProject(), createEmptyProject()],
    availability: 'open-to-collaborations',
    isCtcMember: false,
    profilePictureUrl: '',
    creativeSpectrum: 50,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const addProjectToForm = useCallback((project: Omit<Project, 'id'>) => {
    setFormData(prev => {
      const emptyIdx = prev.projects.findIndex(p => !p.title.trim());
      const newProject: Project = { ...project, id: crypto.randomUUID() };
      if (emptyIdx >= 0) {
        const updated = [...prev.projects];
        updated[emptyIdx] = newProject;
        return { ...prev, projects: updated };
      }
      if (prev.projects.length < 10) {
        return { ...prev, projects: [...prev.projects, newProject] };
      }
      return prev;
    });
  }, []);

  const handleAutoFillRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const handleAutoFill = async () => {
    if (!formData.fullName.trim()) {
      setAutoFillError('Please enter your full name first');
      return;
    }

    setIsAutoFilling(true);
    setAutoFillError('');
    setAutoFillSuccess(false);
    setAutoFillSummary('');

    try {
      const response = await fetch('/api/enrich-profile-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          currentSkills: formData.skills,
          currentBio: formData.bio,
          linkedinUrl: formData.linkedinUrl?.trim() || '',
          portfolioUrl: formData.portfolioUrl?.trim() || '',
          location: formData.location?.trim() || '',
          focusAreas: formData.focusAreas || [],
          existingProjects: formData.projects.filter(p => p.title.trim()),
        }),
      });

      if (response.status === 504) {
        throw new Error('The search took too long. Try adding your LinkedIn or portfolio URL for faster results.');
      }

      const data = await response.json();
      console.log('[Enrich] API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enrich profile');
      }

      if (data.success) {
        const projectCount = data.discoveredProjects?.length || 0;
        const skillCount = data.additionalSkills?.length || 0;
        const hasBio = !!data.enrichedBio;

        if (projectCount === 0 && skillCount === 0 && !hasBio) {
          setAutoFillError('No public information found. Try adding your LinkedIn or portfolio URL above, then click again.');
          return;
        }

        setFormData(prev => {
          const updates: Partial<ProfileFormData> = {};

          if (data.additionalSkills?.length > 0) {
            updates.skills = [...new Set([...prev.skills, ...data.additionalSkills])].slice(0, 20);
          }

          if (data.discoveredProjects?.length > 0) {
            const existingProjects = [...prev.projects];

            for (const dp of data.discoveredProjects.slice(0, 10)) {
              const newProject: Project = {
                id: crypto.randomUUID(),
                title: dp.title || '',
                description: (dp.description || '').substring(0, 500),
                imageUrl: '',
                link: dp.url || '',
              };

              const emptyIdx = existingProjects.findIndex(p => !p.title.trim());
              if (emptyIdx >= 0) {
                existingProjects[emptyIdx] = newProject;
              } else if (existingProjects.length < 10) {
                existingProjects.push(newProject);
              }
            }

            updates.projects = existingProjects;
          }

          if (data.enrichedBio) {
            updates.bio = data.enrichedBio.substring(0, 300);
          }

          return { ...prev, ...updates };
        });

        const parts: string[] = [];
        if (projectCount > 0) parts.push(`${projectCount} project${projectCount > 1 ? 's' : ''}`);
        if (skillCount > 0) parts.push(`${skillCount} skill${skillCount > 1 ? 's' : ''}`);
        if (hasBio) parts.push('bio');
        setAutoFillSummary(`Found ${parts.join(', ')}. Review below and save when ready.`);
        setAutoFillSuccess(true);
        setTimeout(() => setAutoFillSuccess(false), 10000);
      } else if (data.error) {
        setAutoFillError(data.error);
      }
    } catch (err) {
      console.error('Auto-fill error:', err);
      setAutoFillError(err instanceof Error ? err.message : 'Auto-fill failed. Please fill in manually.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  handleAutoFillRef.current = handleAutoFill;

  useEffect(() => {
    initializeProfileWebMCP({
      getFormData: () => formDataRef.current,
      updateField: (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
      },
      addProject: addProjectToForm,
      triggerEnrich: () => handleAutoFillRef.current(),
    });
    return () => cleanupProfileWebMCP();
  }, [addProjectToForm]);

useEffect(() => {
     track('profile_edit_started');
     if (!authLoading && !user) {
      navigate('/directory/auth');
      return;
    }

    const fetchProfile = async () => {
      if (user) {
        const profile = await getProfileByUserId(user.id);
        if (profile) {
          setProfileId(profile.id);
          setProfileSlug(profile.slug);
          // Track original URLs for enrichment trigger detection
          setOriginalUrls({
            portfolioUrl: profile.portfolioUrl || '',
            linkedinUrl: profile.linkedinUrl || '',
          });
          setFormData({
            fullName: profile.fullName,
            location: profile.location,
            email: profile.email,
            portfolioUrl: profile.portfolioUrl || '',
            linkedinUrl: profile.linkedinUrl || '',
            otherSocialLinks: profile.otherSocialLinks?.join('\n') || '',
            bio: profile.bio,
            focusAreas: profile.focusAreas,
            skills: profile.skills,
            projects: profile.projects.length > 0 ? profile.projects : [],
            availability: profile.availability,
            isCtcMember: profile.isCtcMember,
            profilePictureUrl: profile.profilePictureUrl || '',
            creativeSpectrum: profile.creativeSpectrum ?? 50,
          });
        } else {
          navigate('/directory/create');
        }
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const updateField = <K extends keyof ProfileFormData>(
    field: K, 
    value: ProfileFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const addProject = () => {
    if (formData.projects.length < 10) {
      setFormData(prev => ({
        ...prev,
        projects: [...prev.projects, createEmptyProject()],
      }));
    }
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
      if (formData.portfolioUrl && !isValidUrl(formData.portfolioUrl)) newErrors.portfolioUrl = 'Please enter a valid URL';
      if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) newErrors.linkedinUrl = 'Please enter a valid URL';
      if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
      else if (formData.bio.length > 300) newErrors.bio = 'Bio must be 300 characters or less';
    }

    if (step === 2) {
      if (formData.focusAreas.length === 0) newErrors.focusAreas = 'Please select at least 1 focus area';
      if (formData.skills.length < 3) newErrors.skills = 'Please add at least 3 skills/tools';
    }

    if (step === 3) {
      // No minimum project requirement - users can have 0 projects
      // But any project that has a title must also have a description
      const incompleteProjects = formData.projects.filter(p => 
        (p.title.trim() && !p.description.trim()) || (!p.title.trim() && p.description.trim())
      );
      if (incompleteProjects.length > 0) newErrors.projects = 'Projects need both a title and description, or remove them';
    }

    if (step === 4) {
      if (!formData.availability) newErrors.availability = 'Please select your availability status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleNext = () => {
     if (validateStep(currentStep)) {
       track('profile_step_completed', { step: currentStep });
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveFromAnyStep = async () => {
    track('profile_save_from_step', { step: currentStep });
    
    // Only validate essential fields (name, location, email, bio)
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
    else if (formData.bio.length > 300) newErrors.bio = 'Bio must be 300 characters or less';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Jump to step 1 where the errors are
      setCurrentStep(1);
      return;
    }

    // Also check for incomplete projects (have title but no description or vice versa)
    const incompleteProjects = formData.projects.filter(p => 
      (p.title.trim() && !p.description.trim()) || (!p.title.trim() && p.description.trim())
    );
    if (incompleteProjects.length > 0) {
      setErrors({ projects: 'Projects need both a title and description, or remove them' });
      setCurrentStep(3);
      return;
    }

    setErrors({});
    await handleSubmit();
  };

  const handleSubmit = async () => {
    track('profile_submit_attempt');
    if (!profileId) return;

    setIsSubmitting(true);
    setSubmitError('');
    setEnrichmentError('');

    try {
      // Projects need title and description - image is optional
      const cleanedProjects = formData.projects.filter(p =>
        p.title.trim() && p.description.trim()
      );

      const result = await updateProfile(profileId, {
        ...formData,
        projects: cleanedProjects,
      });

      if (result.success) {
        track('profile_saved');
        setSubmitSuccess(true);

        // Regenerate embedding so profile appears correctly in job matching
        try {
          await fetch(`/api/generate-embeddings?profileId=${profileId}`, {
            method: 'POST',
          });
        } catch (embeddingErr) {
          console.warn('Embedding regeneration failed:', embeddingErr);
        }

        // Check if portfolio or LinkedIn URLs changed - trigger re-enrichment
        const urlsChanged =
          formData.portfolioUrl !== originalUrls.portfolioUrl ||
          formData.linkedinUrl !== originalUrls.linkedinUrl;

        if (urlsChanged && session?.access_token) {
          setIsEnriching(true);
          try {
            const enrichResponse = await fetch('/api/profiles/enrich', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                profileId: profileId,
              }),
            });

            if (!enrichResponse.ok) {
              const errorData = await enrichResponse.json().catch(() => ({}));
              console.warn('Profile enrichment failed:', errorData.error || 'Unknown error');
              setEnrichmentError('AI profile update could not be completed, but your changes were saved successfully.');
            }
          } catch (enrichError) {
            console.warn('Profile enrichment error:', enrichError);
            setEnrichmentError('AI profile update could not be completed, but your changes were saved successfully.');
          } finally {
            setIsEnriching(false);
          }
        }
      } else {
        setSubmitError(result.error || 'Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="flex flex-col items-center justify-center min-h-screen px-8 md:px-16">
          <div className="max-w-lg text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-8" />
            <h1 className="text-4xl md:text-5xl font-primary font-medium leading-[0.95] tracking-tight mb-6">
              <span className="block">Profile</span>
              <span className="block text-zinc-500">updated</span>
            </h1>
            <p className="text-zinc-400 font-secondary mb-6 text-lg">
              Your changes have been saved successfully.
            </p>

            {/* AI Enrichment Status */}
            {isEnriching && (
              <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
                <span className="text-blue-400 font-secondary text-sm">
                  Updating your AI profile...
                </span>
              </div>
            )}

            {enrichmentError && !isEnriching && (
              <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 font-secondary text-sm">
                  {enrichmentError}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(`/directory/profile/${profileSlug}`)}
                className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
              >
                View Your Profile
              </button>
              <button
                onClick={() => navigate('/directory/dashboard')}
                className="px-8 py-4 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Vertical Text */}
        <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Amsterdam • London • 2026
          </span>
        </div>
        <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Creative • Technology • Collective
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-4xl mx-auto px-8 md:px-16 py-20 lg:py-24">
        {/* Small Label */}
        <div className="mb-6">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
            CTC Network
          </span>
        </div>

        <button
          onClick={() => navigate('/directory/dashboard')}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 font-secondary text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mb-6">
         <h1 className="text-3xl md:text-4xl lg:text-5xl font-primary font-medium leading-[0.95] tracking-tight">
           <span className="block">Edit your</span>
           <span className="block text-zinc-500">profile</span>
         </h1>
         <p className="mt-3 text-sm font-secondary text-zinc-400">
           Profile completeness: <span className="text-white">{calculateCompletion()}%</span>
         </p>
       </div>

         {/* Progress Steps */}
        <div className="flex items-center gap-2 md:gap-4 mb-10 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 font-secondary text-sm tracking-wide transition-all whitespace-nowrap",
                    isActive && "bg-white text-black",
                    isCompleted && "text-zinc-300 border border-zinc-700",
                    !isActive && !isCompleted && "text-zinc-500 border border-zinc-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-px w-6 md:w-10 flex-shrink-0",
                    currentStep > step.id ? "bg-zinc-500" : "bg-zinc-800"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="border border-zinc-800 p-6 md:p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-primary text-white mb-6">Basic Information</h2>
              
              {/* Profile Picture Upload */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 flex-shrink-0">
                  {formData.profilePictureUrl ? (
                    <div className="relative">
                      <img
                        src={formData.profilePictureUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border border-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => updateField('profilePictureUrl', '')}
                        className="absolute -top-2 -right-2 p-1 bg-zinc-800 hover:bg-zinc-700 rounded-full border border-zinc-600"
                      >
                        <Trash2 className="h-3 w-3 text-zinc-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-3xl font-primary text-white">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ImageUpload
                    value={formData.profilePictureUrl}
                    onChange={(url) => updateField('profilePictureUrl', url)}
                    userId={user?.id || ''}
                    type="profile"
                    label="Profile Picture"
                    aspectRatio="square"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name *</label>
                <div className="flex gap-3">
                  <Input
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Your full name"
                    className={cn("h-12 flex-1", errors.fullName && "border-red-500")}
                  />
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={isAutoFilling || !formData.fullName.trim()}
                    className={cn(
                      "px-4 py-2 flex items-center gap-2 font-secondary text-sm tracking-wide transition-all whitespace-nowrap",
                      isAutoFilling
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : autoFillSuccess
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40",
                      (!formData.fullName.trim() && !isAutoFilling) && "opacity-50 cursor-not-allowed"
                    )}
                    title="Search the web for your work, projects, and skills to enrich your profile"
                  >
                    {isAutoFilling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching the web...
                      </>
                    ) : autoFillSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Found!
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Enrich with AI
                      </>
                    )}
                  </button>
                </div>
                {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                {autoFillError && (
                  <p className="text-amber-400 text-sm mt-1">{autoFillError}</p>
                )}
                {autoFillSuccess && autoFillSummary && (
                  <p className="text-green-400 text-sm mt-1">
                    {autoFillSummary}
                  </p>
                )}
                <p className="text-zinc-500 text-xs mt-1">
                  AI searches your portfolio, LinkedIn, and public profiles to discover skills, projects, and work history
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Location *</label>
                <Input
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, Country"
                  className={cn("h-12", errors.location && "border-red-500")}
                />
                {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="your@email.com"
                  className={cn("h-12", errors.email && "border-red-500")}
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Portfolio/Website URL</label>
                <Input
                  value={formData.portfolioUrl}
                  onChange={(e) => updateField('portfolioUrl', e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className={cn("h-12", errors.portfolioUrl && "border-red-500")}
                />
                {errors.portfolioUrl && <p className="text-red-400 text-sm mt-1">{errors.portfolioUrl}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">LinkedIn URL</label>
                <Input
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={cn("h-12", errors.linkedinUrl && "border-red-500")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Other Social Links</label>
                <Textarea
                  value={formData.otherSocialLinks}
                  onChange={(e) => updateField('otherSocialLinks', e.target.value)}
                  placeholder="One URL per line"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Short Bio * <span className="text-zinc-500">({formData.bio.length}/300)</span>
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="2-3 sentences about yourself..."
                  maxLength={300}
                  rows={4}
                  className={cn(errors.bio && "border-red-500")}
                />
                {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio}</p>}
              </div>

            </div>
          )}

          {/* Step 2: Specialization */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-primary text-white mb-2">Focus Areas</h2>
                <p className="text-zinc-400 text-sm mb-4">Add at least 1 focus area (type to search or add your own)</p>
                <TagInput
                  tags={formData.focusAreas}
                  onTagsChange={(tags) => updateField('focusAreas', tags)}
                  suggestions={SUGGESTED_FOCUS_AREAS}
                  placeholder="Type a focus area and press Enter..."
                />
                {errors.focusAreas && <p className="text-red-400 text-sm mt-2">{errors.focusAreas}</p>}
              </div>

              <div>
                <h2 className="text-xl font-primary text-white mb-2">Skills & Tools</h2>
                <p className="text-zinc-400 text-sm mb-4">Add at least 3 skills</p>
                <TagInput
                  tags={formData.skills}
                  onTagsChange={(tags) => updateField('skills', tags)}
                  suggestions={SUGGESTED_SKILLS}
                  placeholder="Type a skill and press Enter..."
                />
                {errors.skills && <p className="text-red-400 text-sm mt-2">{errors.skills}</p>}
              </div>

              {/* Creative Spectrum */}
              <div className="pt-4 border-t border-zinc-800">
                <h2 className="text-xl font-primary text-white mb-2">Where do you fall on the creative tech spectrum?</h2>
                <p className="text-zinc-400 text-sm font-secondary mb-6">
                  Whether you lean more toward design or development, you're still a creative technologist. This helps others understand your strengths at a glance.
                </p>
                <CreativeSpectrumSlider
                  value={formData.creativeSpectrum}
                  onChange={(value) => updateField('creativeSpectrum', value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Projects */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-primary text-white">Projects</h2>
                  <p className="text-zinc-400 text-sm mt-1">Add up to 10 projects to showcase your work</p>
                </div>
                {formData.projects.length < 10 && (
                  <button
                    type="button"
                    onClick={addProject}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Project
                  </button>
                )}
              </div>

              {errors.projects && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{errors.projects}</p>
                </div>
              )}

              <div className="space-y-6">
                {formData.projects.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-zinc-800">
                    <FolderOpen className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 font-secondary text-sm">No projects yet. Click "Add Project" to showcase your work.</p>
                  </div>
                )}
                {formData.projects.map((project, index) => (
                  <div key={project.id} className="p-5 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-secondary tracking-wide text-zinc-400 uppercase">Project {index + 1}</h3>
                      <button type="button" onClick={() => removeProject(index)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Input value={project.title} onChange={(e) => updateProject(index, 'title', e.target.value)} placeholder="Project title" className="h-12 bg-transparent border-zinc-800" />
                    
                    {/* Project Image Upload */}
                    <ImageUpload
                      value={project.imageUrl}
                      onChange={(url) => updateProject(index, 'imageUrl', url)}
                      userId={user?.id || ''}
                      type="project"
                      label="Project Image"
                      aspectRatio="video"
                    />
                    
                    <Textarea value={project.description} onChange={(e) => updateProject(index, 'description', e.target.value)} placeholder="Brief description of the project" maxLength={500} rows={3} className="bg-transparent border-zinc-800" />
                    <Input value={project.link || ''} onChange={(e) => updateProject(index, 'link', e.target.value)} placeholder="Project link (optional)" className="h-12 bg-transparent border-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-primary text-white mb-2">Availability Status</h2>
                <RadioGroup
                  name="availability"
                  options={AVAILABILITY_OPTIONS}
                  value={formData.availability}
                  onChange={(value) => updateField('availability', value as AvailabilityStatus)}
                />
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h2 className="text-xl font-primary text-white mb-4">Community Badge</h2>
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <Checkbox
                    checked={formData.isCtcMember}
                    onChange={(e) => updateField('isCtcMember', e.target.checked)}
                    label="I am a CTC Community Member"
                    description="Display a badge on your profile"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Submit Error - visible on any step */}
          {submitError && (
            <div className="flex items-center gap-2 p-4 mt-6 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={cn(
                "flex items-center gap-2 px-6 py-3 font-secondary text-sm tracking-wide transition-colors",
                currentStep === 1 ? "text-zinc-700 cursor-not-allowed" : "border border-zinc-700 text-white hover:border-zinc-500"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {currentStep < 4 && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleSaveFromAnyStep}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
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
    </div>
  );
};

export default NetworkEditProfilePage;
