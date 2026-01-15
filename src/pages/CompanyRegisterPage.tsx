import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import {
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyByUserId } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { COMPANY_SIZES, CompanySize } from '@/types/job-matching';

interface FormData {
  companyName: string;
  companyWebsite: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companySize: CompanySize | '';
  industry: string;
}

const INDUSTRIES = [
  'Advertising & Marketing',
  'Architecture & Design',
  'Art & Culture',
  'Automotive',
  'Consumer Goods',
  'Education',
  'Entertainment & Media',
  'Fashion & Luxury',
  'Finance & Banking',
  'Gaming',
  'Healthcare',
  'Hospitality & Travel',
  'Real Estate',
  'Retail & E-commerce',
  'Sports',
  'Technology',
  'Telecommunications',
  'Other',
];

const CompanyRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companyWebsite: '',
    contactName: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    companySize: '',
    industry: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/company/auth?mode=signup');
      return;
    }

    const checkExistingCompany = async () => {
      if (user) {
        const existingCompany = await getCompanyByUserId(user.id);
        if (existingCompany) {
          navigate('/company/dashboard');
        } else {
          setCheckingCompany(false);
          // Pre-fill email from user
          setFormData((prev) => ({
            ...prev,
            contactEmail: user.email || '',
          }));
        }
      }
    };

    if (user) {
      checkExistingCompany();
    }
  }, [user, authLoading, navigate]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!isValidEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (formData.companyWebsite && !isValidUrl(formData.companyWebsite)) {
      newErrors.companyWebsite = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !session) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/register-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          companyWebsite: formData.companyWebsite.trim() || undefined,
          contactName: formData.contactName.trim(),
          contactEmail: formData.contactEmail.trim(),
          contactPhone: formData.contactPhone.trim() || undefined,
          companySize: formData.companySize || undefined,
          industry: formData.industry || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // User already has a company
          navigate('/company/dashboard');
          return;
        }
        throw new Error(data.error || 'Failed to register company');
      }

      setSubmitSuccess(true);
    } catch (error: unknown) {
      console.error('Submit error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || checkingCompany) {
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
              <span className="block">Company</span>
              <span className="block text-zinc-500">registered</span>
            </h1>
            <p className="text-zinc-400 font-secondary mb-10 text-lg">
              Your company has been registered and is pending verification. You can now submit job
              specifications to find creative technologists for your projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/company/dashboard')}
                className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
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
            Amsterdam London 2026
          </span>
        </div>
        <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Creative Technology Collective
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-2xl mx-auto px-8 md:px-16 py-20 lg:py-24">
        {/* Small Label */}
        <div className="mb-6">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
            CTC Company Portal
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-primary font-medium leading-[0.95] tracking-tight mb-4">
          <span className="block">Register your</span>
          <span className="block text-zinc-500">company</span>
        </h1>
        <p className="text-zinc-400 text-lg font-secondary leading-relaxed mb-10 max-w-xl">
          Tell us about your company to get started. Once registered, you can submit job specs and
          we'll match you with our network of creative technologists.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-zinc-800 p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-primary text-white mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-zinc-500" />
              Company Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                Company Name *
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Your company name"
                className={cn('h-12', errors.companyName && 'border-red-500')}
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm mt-1">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                Company Website
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  value={formData.companyWebsite}
                  onChange={(e) => updateField('companyWebsite', e.target.value)}
                  placeholder="https://yourcompany.com"
                  className={cn('h-12 pl-12', errors.companyWebsite && 'border-red-500')}
                />
              </div>
              {errors.companyWebsite && (
                <p className="text-red-400 text-sm mt-1">{errors.companyWebsite}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => updateField('companySize', e.target.value as CompanySize | '')}
                  className="w-full h-12 px-4 bg-transparent border border-zinc-800 text-white font-secondary focus:border-zinc-600 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-900">
                    Select size
                  </option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size.value} value={size.value} className="bg-zinc-900">
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="w-full h-12 px-4 bg-transparent border border-zinc-800 text-white font-secondary focus:border-zinc-600 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-900">
                    Select industry
                  </option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry} className="bg-zinc-900">
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-primary text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-zinc-500" />
              Contact Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                Contact Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  value={formData.contactName}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  placeholder="Your full name"
                  className={cn('h-12 pl-12', errors.contactName && 'border-red-500')}
                />
              </div>
              {errors.contactName && (
                <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                Contact Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="your@email.com"
                  className={cn('h-12 pl-12', errors.contactEmail && 'border-red-500')}
                />
              </div>
              {errors.contactEmail && (
                <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="h-12 pl-12"
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Briefcase className="h-5 w-5" />
                Register Company
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6 font-secondary tracking-wide uppercase">
          * Required fields
        </p>

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

export default CompanyRegisterPage;
