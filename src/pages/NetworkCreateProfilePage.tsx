import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Search,
  Wand2,
  Linkedin,
  Globe,
  Zap
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
import { createProfile, getProfileByUserId } from '@/lib/supabase';
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

const NetworkCreateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, loading: authLoading, isCompanyUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState('');
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [autoFillSummary, setAutoFillSummary] = useState('');
  
  // Generate mode state
  const isGenerateMode = searchParams.get('mode') === 'generate';
  const [showGenerateModal, setShowGenerateModal] = useState(isGenerateMode);
  const [generateName, setGenerateName] = useState('');
  const [generateLinkedIn, setGenerateLinkedIn] = useState('');
  const [generatePortfolio, setGeneratePortfolio] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/directory/auth?mode=signup');
      return;
    }

    if (!authLoading && isCompanyUser) {
      navigate('/company/dashboard');
      return;
    }

    const checkExistingProfile = async () => {
      if (user) {
        const existingProfile = await getProfileByUserId(user.id);
        if (existingProfile) {
          navigate('/directory/dashboard');
        } else {
          setCheckingProfile(false);
          
          // Pre-fill name from URL param
          const nameParam = searchParams.get('name');
          if (nameParam) {
            setFormData(prev => ({ ...prev, fullName: nameParam, email: user.email || '' }));
          }
          
          // Apply enrichment data if passed from dashboard
          const enrichmentParam = searchParams.get('enrichment');
          if (enrichmentParam) {
            try {
              const data = JSON.parse(decodeURIComponent(enrichmentParam));
              console.log('[Create] Enrichment data from URL:', data);

              const hasProjects = data.discoveredProjects?.length > 0;
              const hasSkills = data.additionalSkills?.length > 0;
              const hasBio = !!data.enrichedBio;

              if (hasProjects || hasSkills || hasBio) {
                setFormData(prev => {
                  const updates: Partial<ProfileFormData> = {};

                  if (hasSkills) {
                    updates.skills = data.additionalSkills.slice(0, 15);
                  }

                  if (hasBio) {
                    updates.bio = data.enrichedBio.substring(0, 300);
                  }

                  if (hasProjects) {
                    const projects = data.discoveredProjects.slice(0, 10).map((p: any) => ({
                      id: crypto.randomUUID(),
                      title: p.title || 'Untitled Project',
                      description: (p.description || '').substring(0, 500),
                      link: p.url || '',
                      imageUrl: '',
                    }));
                    while (projects.length < 2) {
                      projects.push(createEmptyProject());
                    }
                    updates.projects = projects;
                  }

                  return { ...prev, ...updates };
                });

                const parts: string[] = [];
                if (hasProjects) parts.push(`${data.discoveredProjects.length} project${data.discoveredProjects.length > 1 ? 's' : ''}`);
                if (hasSkills) parts.push(`${data.additionalSkills.length} skill${data.additionalSkills.length > 1 ? 's' : ''}`);
                if (hasBio) parts.push('bio');
                setAutoFillSummary(`Found ${parts.join(', ')}. Review below and on the next steps.`);
                setAutoFillSuccess(true);
                setTimeout(() => setAutoFillSuccess(false), 10000);
              }
            } catch (e) {
              console.error('Failed to parse enrichment data:', e);
            }
          }
        }
      }
    };

    if (user) {
      checkExistingProfile();
    }
  }, [user, authLoading, navigate, searchParams]);
  
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

  // Keep a ref so WebMCP callbacks always read the latest form state
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

  // Ref to the auto-fill handler so WebMCP can call it without stale closures
  const handleAutoFillRef = useRef<() => Promise<void>>(() => Promise.resolve());

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
    if (formData.projects.length > 2) {
      setFormData(prev => ({
        ...prev,
        projects: prev.projects.filter((_, i) => i !== index),
      }));
    }
  };


  // Auto-fill profile from web search
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
        throw new Error(data.error || 'Failed to auto-fill profile');
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
        setAutoFillSummary(`Found ${parts.join(', ')}. Review below and on the next steps.`);
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

  // Keep the ref in sync so WebMCP can call the latest version
  handleAutoFillRef.current = handleAutoFill;

  // Generate profile from LinkedIn/Portfolio URL
  const handleGenerateProfile = async () => {
    if (!generateName.trim()) {
      setGenerateError('Please enter your full name');
      return;
    }

    if (!generateLinkedIn.trim() && !generatePortfolio.trim()) {
      setGenerateError('Please enter at least your LinkedIn URL or portfolio URL');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');

    try {
      // Use the comprehensive search endpoint for better profile generation
      const response = await fetch('/api/enrich-profile-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: generateName.trim(),
          linkedinUrl: generateLinkedIn.trim(),
          portfolioUrl: generatePortfolio.trim(),
          currentSkills: [],
          currentBio: '',
          location: '',
          focusAreas: [],
          existingProjects: [],
        }),
      });

      // Handle timeout/network errors
      if (response.status === 504) {
        throw new Error('The request took too long. Please try with just your name, or fill in manually.');
      }

      if (response.status >= 500) {
        throw new Error('Server error. Please try again or fill in manually.');
      }

      // Safely parse JSON
      let data;
      try {
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from server. Please try again or fill in manually.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate profile');
      }

      if (data.success) {
        // Pre-fill the form with generated data
        const updates: Partial<ProfileFormData> = {
          fullName: generateName.trim(),
          linkedinUrl: generateLinkedIn.trim(),
          portfolioUrl: generatePortfolio.trim(),
          email: user?.email || '',
        };

        // Add discovered skills
        if (data.additionalSkills && data.additionalSkills.length > 0) {
          updates.skills = data.additionalSkills.slice(0, 15);
        }

        // Add enriched bio
        if (data.enrichedBio) {
          updates.bio = data.enrichedBio.substring(0, 300);
        }

        // Add location if found
        if (data.location) {
          updates.location = data.location;
        }

        // Add discovered projects
        if (data.discoveredProjects && data.discoveredProjects.length > 0) {
          const projects = data.discoveredProjects.slice(0, 10).map((p: any) => ({
            id: crypto.randomUUID(),
            title: p.title || 'Untitled Project',
            description: p.description || '',
            link: p.url || '',
            imageUrl: '',
          }));
          // Pad with empty projects if less than 2
          while (projects.length < 2) {
            projects.push(createEmptyProject());
          }
          updates.projects = projects;
        }

        setFormData(prev => ({ ...prev, ...updates }));
        setShowGenerateModal(false);
        setAutoFillSuccess(true);
        setTimeout(() => setAutoFillSuccess(false), 5000);
      } else if (data.error) {
        setGenerateError(data.error);
      }
    } catch (err) {
      console.error('Generate profile error:', err);
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate profile. Please try manually.');
    } finally {
      setIsGenerating(false);
    }
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
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (formData.portfolioUrl && !isValidUrl(formData.portfolioUrl)) {
        newErrors.portfolioUrl = 'Please enter a valid URL';
      }
      if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
        newErrors.linkedinUrl = 'Please enter a valid URL';
      }
      if (!formData.bio.trim()) {
        newErrors.bio = 'Bio is required';
      } else if (formData.bio.length > 300) {
        newErrors.bio = 'Bio must be 300 characters or less';
      }
    }

    if (step === 2) {
      if (formData.focusAreas.length === 0) {
        newErrors.focusAreas = 'Please select at least 1 focus area';
      }
      if (formData.skills.length < 3) {
        newErrors.skills = 'Please add at least 3 skills/tools';
      }
    }

    if (step === 3) {
      // Projects need title and description - image is optional
      const validProjects = formData.projects.filter(p =>
        p.title.trim() && p.description.trim()
      );
      if (validProjects.length < 2) {
        newErrors.projects = 'Please complete at least 2 projects with title and description';
      }
      formData.projects.forEach((project, index) => {
        // Only validate if project has some content
        if (project.title.trim() || project.description.trim()) {
          if (!project.title.trim()) {
            newErrors[`project_${index}_title`] = 'Title is required';
          }
          // Image URL is optional, but validate format if provided
          if (project.imageUrl.trim() && !isValidUrl(project.imageUrl)) {
            newErrors[`project_${index}_imageUrl`] = 'Please enter a valid URL';
          }
          if (!project.description.trim()) {
            newErrors[`project_${index}_description`] = 'Description is required';
          } else if (project.description.length > 500) {
            newErrors[`project_${index}_description`] = 'Description must be 500 characters or less';
          }
          if (project.link && !isValidUrl(project.link)) {
            newErrors[`project_${index}_link`] = 'Please enter a valid URL';
          }
        }
      });
    }

    if (step === 4) {
      if (!formData.availability) {
        newErrors.availability = 'Please select your availability status';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !user) return;

    setIsSubmitting(true);
    setSubmitError('');
    setEnrichmentError('');

    try {
      // Projects need title and description - image is optional
      const cleanedProjects = formData.projects.filter(p =>
        p.title.trim() && p.description.trim()
      );

      const result = await createProfile(
        {
          ...formData,
          projects: cleanedProjects,
        }, 
        user.id,
        session?.access_token
      );

      if (result.success && result.profile) {
        setSubmitSuccess(true);
        setCreatedSlug(result.profile.slug);

        // Generate embedding so profile appears in job matching
        try {
          await fetch(`/api/generate-embeddings?profileId=${result.profile.id}`, {
            method: 'POST',
          });
        } catch (embeddingErr) {
          console.warn('Embedding generation failed:', embeddingErr);
        }

        // Trigger profile enrichment in the background (graceful degradation)
        if (session?.access_token) {
          setIsEnriching(true);
          try {
            const enrichResponse = await fetch('/api/profiles/enrich', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                profileId: result.profile.id,
              }),
            });

            if (!enrichResponse.ok) {
              const errorData = await enrichResponse.json().catch(() => ({}));
              console.warn('Profile enrichment failed:', errorData.error || 'Unknown error');
              setEnrichmentError('AI enhancement could not be completed, but your profile was created successfully.');
            }
          } catch (enrichError) {
            console.warn('Profile enrichment error:', enrichError);
            setEnrichmentError('AI enhancement could not be completed, but your profile was created successfully.');
          } finally {
            setIsEnriching(false);
          }
        }
      } else {
        setSubmitError(result.error || 'Failed to create profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || checkingProfile) {
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
              <span className="block text-zinc-500">created</span>
            </h1>
            <p className="text-zinc-400 font-secondary mb-6 text-lg">
              {user?.user_metadata?.beta_member
                ? 'Your profile is live in the directory! As a beta member, your profile has been automatically approved.'
                : "Your profile has been submitted and is pending approval. You'll receive an email once it's approved and live in the directory."}
            </p>

            {/* AI Enrichment Status */}
            {isEnriching && (
              <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
                <span className="text-blue-400 font-secondary text-sm">
                  Enhancing your profile with AI...
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
                onClick={() => navigate(`/directory/profile/${createdSlug}`)}
                className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                View Your Profile
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/directory')}
                className="px-8 py-4 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 transition-colors"
              >
                Browse Directory
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
      {/* Generate Profile Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                <Zap className="h-7 w-7 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Generate Profile</h2>
                <p className="text-sm text-zinc-400">Let AI build your profile from the web</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 p-4 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20">
              <p className="text-sm text-zinc-300 leading-relaxed">
                We'll search the web for your professional information, projects, and skills using your LinkedIn or portfolio. You can review and edit everything before publishing.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={generateName}
                    onChange={(e) => setGenerateName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  LinkedIn Profile URL
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="url"
                    value={generateLinkedIn}
                    onChange={(e) => setGenerateLinkedIn(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Portfolio / Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="url"
                    value={generatePortfolio}
                    onChange={(e) => setGeneratePortfolio(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {generateError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {generateError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  // Clear the mode param from URL
                  navigate('/directory/create', { replace: true });
                }}
                disabled={isGenerating}
                className="flex-1 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
              >
                Fill Manually
              </button>
              <button
                onClick={handleGenerateProfile}
                disabled={isGenerating || !generateName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="animate-pulse">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Profile
                  </>
                )}
              </button>
            </div>

            {/* Privacy Note */}
            <p className="text-xs text-zinc-500 text-center mt-4">
              We only search publicly available information
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-8 md:px-16 py-20 lg:py-24">
        {/* Small Label */}
        <div className="mb-6">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
            CTC Network
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-primary font-medium leading-[0.95] tracking-tight mb-4">
          <span className="block">Join the</span>
          <span className="block text-zinc-500">network</span>
        </h1>
        <p className="text-zinc-400 text-lg font-secondary leading-relaxed mb-10 max-w-xl">
          Create your profile to connect with fellow creative technologists and showcase your work.
        </p>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 md:gap-4 mb-10 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    if (isCompleted || (step.id < currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={step.id > currentStep}
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
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Full Name *
                </label>
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
                    title="AI searches your portfolio, LinkedIn, and public profiles to auto-fill your skills, bio, and projects"
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
                        Auto-fill with AI
                      </>
                    )}
                  </button>
                </div>
                {errors.fullName && (
                  <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                )}
                {autoFillError && (
                  <p className="text-amber-400 text-sm mt-1">{autoFillError}</p>
                )}
                {autoFillSuccess && autoFillSummary && (
                  <p className="text-green-400 text-sm mt-1">
                    {autoFillSummary}
                  </p>
                )}
                <p className="text-zinc-500 text-xs mt-1">
                  AI searches your portfolio, LinkedIn, and public profiles to populate your skills, bio, work history, and projects
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Location *
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, Country"
                  className={cn("h-12", errors.location && "border-red-500")}
                />
                {errors.location && (
                  <p className="text-red-400 text-sm mt-1">{errors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="your@email.com"
                  className={cn("h-12", errors.email && "border-red-500")}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Portfolio/Website URL
                </label>
                <Input
                  value={formData.portfolioUrl}
                  onChange={(e) => updateField('portfolioUrl', e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className={cn("h-12", errors.portfolioUrl && "border-red-500")}
                />
                {errors.portfolioUrl && (
                  <p className="text-red-400 text-sm mt-1">{errors.portfolioUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  LinkedIn URL
                </label>
                <Input
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={cn("h-12", errors.linkedinUrl && "border-red-500")}
                />
                {errors.linkedinUrl && (
                  <p className="text-red-400 text-sm mt-1">{errors.linkedinUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Other Social Links
                </label>
                <Textarea
                  value={formData.otherSocialLinks}
                  onChange={(e) => updateField('otherSocialLinks', e.target.value)}
                  placeholder="One URL per line (Twitter, GitHub, Behance, etc.)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Short Bio * <span className="text-zinc-500">({formData.bio.length}/300)</span>
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="2-3 sentences about yourself and your work..."
                  maxLength={300}
                  rows={4}
                  className={cn(errors.bio && "border-red-500")}
                />
                {errors.bio && (
                  <p className="text-red-400 text-sm mt-1">{errors.bio}</p>
                )}
              </div>

            </div>
          )}

          {/* Step 2: Specialization */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-primary text-white mb-2">Focus Areas</h2>
                <p className="text-zinc-400 text-sm font-secondary mb-4">
                  Add at least 1 focus area that describes your work (type to search or add your own)
                </p>
                <TagInput
                  tags={formData.focusAreas}
                  onTagsChange={(tags) => updateField('focusAreas', tags)}
                  suggestions={SUGGESTED_FOCUS_AREAS}
                  placeholder="Type a focus area and press Enter..."
                  className={cn(errors.focusAreas && "border-red-500")}
                />
                {errors.focusAreas && (
                  <p className="text-red-400 text-sm mt-2">{errors.focusAreas}</p>
                )}
              </div>

              <div>
                <h2 className="text-xl font-primary text-white mb-2">Skills & Tools</h2>
                <p className="text-zinc-400 text-sm font-secondary mb-4">
                  Add at least 3 skills or tools you work with (type to search or add custom)
                </p>
                <TagInput
                  tags={formData.skills}
                  onTagsChange={(tags) => updateField('skills', tags)}
                  suggestions={SUGGESTED_SKILLS}
                  placeholder="Type a skill and press Enter..."
                  className={cn(errors.skills && "border-red-500")}
                />
                {errors.skills && (
                  <p className="text-red-400 text-sm mt-2">{errors.skills}</p>
                )}
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
                  <h2 className="text-xl font-primary text-white">Projects / Case Studies</h2>
                  <p className="text-zinc-400 text-sm font-secondary mt-1">
                    Add up to 10 projects to showcase your work
                  </p>
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
                {formData.projects.map((project, index) => (
                  <div 
                    key={project.id} 
                    className="p-5 border border-zinc-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-secondary tracking-wide text-zinc-400 uppercase">
                        Project {index + 1} {index < 2 && <span className="text-white">*</span>}
                      </h3>
                      {formData.projects.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeProject(index)}
                          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <Input
                        value={project.title}
                        onChange={(e) => updateProject(index, 'title', e.target.value)}
                        placeholder="Project title"
                        className={cn("h-12 bg-transparent border-zinc-800", errors[`project_${index}_title`] && "border-red-500")}
                      />
                      {errors[`project_${index}_title`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`project_${index}_title`]}</p>
                      )}
                    </div>

                    {/* Project Image Upload */}
                    <ImageUpload
                      value={project.imageUrl}
                      onChange={(url) => updateProject(index, 'imageUrl', url)}
                      userId={user?.id || ''}
                      type="project"
                      label="Project Image"
                      aspectRatio="video"
                    />

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Description * <span className="text-zinc-500">({project.description.length}/500)</span>
                      </label>
                      <Textarea
                        value={project.description}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        placeholder="Brief description of the project..."
                        maxLength={500}
                        rows={3}
                        className={cn(errors[`project_${index}_description`] && "border-red-500")}
                      />
                      {errors[`project_${index}_description`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`project_${index}_description`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Project Link (optional)
                      </label>
                      <Input
                        value={project.link}
                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                        placeholder="https://project-url.com"
                        className={cn("h-10", errors[`project_${index}_link`] && "border-red-500")}
                      />
                      {errors[`project_${index}_link`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`project_${index}_link`]}</p>
                      )}
                    </div>
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
                <p className="text-zinc-400 text-sm font-secondary mb-4">
                  Let others know if you're available for work or collaborations
                </p>
                <RadioGroup
                  name="availability"
                  options={AVAILABILITY_OPTIONS}
                  value={formData.availability}
                  onChange={(value) => updateField('availability', value as AvailabilityStatus)}
                />
                {errors.availability && (
                  <p className="text-red-400 text-sm mt-2">{errors.availability}</p>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h2 className="text-xl font-primary text-white mb-4">Community Badge</h2>
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <Checkbox
                    checked={formData.isCtcMember}
                    onChange={(e) => updateField('isCtcMember', e.target.checked)}
                    label="I am a CTC Community Member"
                    description="Display a badge on your profile indicating you're part of the Creative Technology Collective community"
                  />
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{submitError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={cn(
                "flex items-center gap-2 px-6 py-3 font-secondary text-sm tracking-wide transition-colors",
                currentStep === 1 
                  ? "text-zinc-700 cursor-not-allowed" 
                  : "border border-zinc-700 text-white hover:border-zinc-500"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  'Create Profile'
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6 font-secondary tracking-wide uppercase">
          * Required fields
        </p>

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

export default NetworkCreateProfilePage;
