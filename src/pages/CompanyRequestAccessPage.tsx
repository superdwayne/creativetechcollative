import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import {
  Loader2,
  AlertCircle,
  Building2,
  Mail,
  CheckCircle2,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  companyName: string;
  contactEmail: string;
}

const CompanyRequestAccessPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactEmail: '',
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Work email is required';
    } else if (!isValidEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/company/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          contactEmail: formData.contactEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Request error:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="flex flex-col items-center justify-center min-h-screen px-8 md:px-16">
          <div className="max-w-lg text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-primary font-medium leading-[0.95] tracking-tight mb-6">
              <span className="block">Request</span>
              <span className="block text-zinc-500">submitted</span>
            </h1>
            <p className="text-zinc-400 font-secondary mb-4 text-lg">
              Thank you for your interest in CTC Talent Matching.
            </p>
            <p className="text-zinc-500 font-secondary mb-8">
              Our team will review your request and get back to you within 1-2 business days. Once approved, you'll receive an email with instructions to set up your account.
            </p>

            <div className="flex items-center justify-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-8">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-secondary">Check your inbox for updates</span>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-secondary text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to homepage
            </Link>
          </div>
        </div>

        {/* Vertical Text */}
        <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Amsterdam . London . 2026
          </span>
        </div>
        <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Creative . Technology . Collective
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-2xl mx-auto px-8 md:px-16 py-20 lg:py-24">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-secondary text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>

        {/* Small Label */}
        <div className="mb-6">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
            CTC Talent Matching
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-primary font-medium leading-[0.95] tracking-tight mb-4">
          <span className="block">Request</span>
          <span className="block text-zinc-500">access</span>
        </h1>
        <p className="text-zinc-400 text-lg font-secondary leading-relaxed mb-8 max-w-xl">
          Get access to our creative tech talent network. We'll review your request and send you an invite to create your account.
        </p>

        {error && (
          <div className="mb-6 p-4 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm font-secondary">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border border-zinc-800 p-6 md:p-8 space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
              Company Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <Input
                value={formData.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Your company name"
                className={cn("pl-12 h-12", errors.companyName && "border-red-500")}
              />
            </div>
            {errors.companyName && (
              <p className="text-red-400 text-sm mt-1">{errors.companyName}</p>
            )}
          </div>

          {/* Work Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateField('contactEmail', e.target.value)}
                placeholder="you@yourcompany.com"
                className={cn("pl-12 h-12", errors.contactEmail && "border-red-500")}
              />
            </div>
            {errors.contactEmail && (
              <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Request Access'
            )}
          </button>
        </form>

        {/* Already have an account link */}
        <p className="text-center text-zinc-500 text-sm mt-8 font-secondary">
          Already have an account?{' '}
          <Link to="/company/auth" className="text-white hover:underline">
            Log in
          </Link>
        </p>

        {/* Vertical Text on Left Edge */}
        <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Amsterdam . London . 2026
          </span>
        </div>

        {/* Vertical Text on Right Edge */}
        <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
            Creative . Technology . Collective
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompanyRequestAccessPage;
