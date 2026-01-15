import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  ProfileFormData, 
  Project, 
  FocusArea,
  AvailabilityStatus,
  FOCUS_AREAS, 
  AVAILABILITY_OPTIONS, 
  SUGGESTED_SKILLS 
} from '@/types/network-profile';
import { createProfile, getProfileByUserId } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
  const { user, session, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/directory/auth?mode=signup');
      return;
    }

    const checkExistingProfile = async () => {
      if (user) {
        const existingProfile = await getProfileByUserId(user.id);
        if (existingProfile) {
          navigate('/directory/dashboard');
        } else {
          setCheckingProfile(false);
        }
      }
    };

    if (user) {
      checkExistingProfile();
    }
  }, [user, authLoading, navigate]);
  
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (formData.projects.length < 5) {
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

  const toggleFocusArea = (area: FocusArea) => {
    setFormData(prev => {
      const current = prev.focusAreas;
      if (current.includes(area)) {
        return { ...prev, focusAreas: current.filter(a => a !== area) };
      }
      return { ...prev, focusAreas: [...current, area] };
    });
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
      const validProjects = formData.projects.filter(p => 
        p.title.trim() && p.imageUrl.trim() && p.description.trim()
      );
      if (validProjects.length < 2) {
        newErrors.projects = 'Please complete at least 2 projects (title, image, and description required)';
      }
      formData.projects.forEach((project, index) => {
        if (project.title.trim() || project.imageUrl.trim() || project.description.trim()) {
          if (!project.title.trim()) {
            newErrors[`project_${index}_title`] = 'Title is required';
          }
          if (!project.imageUrl.trim()) {
            newErrors[`project_${index}_imageUrl`] = 'Image URL is required';
          } else if (!isValidUrl(project.imageUrl)) {
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
      const cleanedProjects = formData.projects.filter(p =>
        p.title.trim() && p.imageUrl.trim() && p.description.trim()
      );

      const result = await createProfile({
        ...formData,
        projects: cleanedProjects,
      }, user.id);

      if (result.success && result.profile) {
        setSubmitSuccess(true);
        setCreatedSlug(result.profile.slug);

        // Trigger profile enrichment in the background (graceful degradation)
        if (session?.access_token) {
          setIsEnriching(true);
          try {
            const enrichResponse = await fetch('/api/enrich-profile', {
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
              Your profile has been submitted and is pending approval. You'll receive an email once it's approved and live in the directory.
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
                <Input
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Your full name"
                  className={cn("h-12", errors.fullName && "border-red-500")}
                />
                {errors.fullName && (
                  <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                )}
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
                  Select all areas that describe your work ({formData.focusAreas.length} selected)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FOCUS_AREAS.map((area) => {
                    const isSelected = formData.focusAreas.includes(area.value);
                    
                    return (
                      <button
                        key={area.value}
                        type="button"
                        onClick={() => toggleFocusArea(area.value)}
                        className={cn(
                          "p-4 rounded-lg border text-left transition-all",
                          isSelected 
                            ? "border-pink-500 bg-pink-500/10 text-white" 
                            : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                        )}
                      >
                        <div className="font-medium text-sm">{area.label}</div>
                        <div className="text-xs text-zinc-500 mt-1">{area.description}</div>
                      </button>
                    );
                  })}
                </div>
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
            </div>
          )}

          {/* Step 3: Projects */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-primary text-white">Projects / Case Studies</h2>
                  <p className="text-zinc-400 text-sm font-secondary mt-1">
                    Add 2-5 projects to showcase your work
                  </p>
                </div>
                {formData.projects.length < 5 && (
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
