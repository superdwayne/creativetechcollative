import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { Loader2, ArrowRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const BetaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loading: betaLoading, isApproved, isPending, betaApplication } = useBetaAccess();

  // Beta testing form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    interests: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Form handlers
  const capitalizeName = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const capitalizedName = capitalizeName(formData.name.trim());
    
    if (!capitalizedName) {
      setSubmitMessage('Please enter your name');
      return;
    }

    if (!formData.email.trim()) {
      setSubmitMessage('Please enter an email address');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setSubmitMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: capitalizedName,
          email: formData.email.trim(),
          interests: formData.interests,
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        setSubmitMessage('Application submitted! We\'ll review it and get back to you soon.');
        setFormData({
          name: '',
          email: '',
          interests: []
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Something went wrong');
      }
    } catch (error: any) {
      console.error('Beta signup form error:', error);
      
      if (error.name === 'TimeoutError') {
        setSubmitMessage('Request timed out. Please check your connection and try again.');
      } else if (error.message.includes('Failed to fetch')) {
        setSubmitMessage('Unable to connect to server. Please try again later.');
      } else {
        setSubmitMessage('Something went wrong. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const betaInterestOptions = [
    { id: 'ai-matching', label: 'AI Job Matching' },
    { id: 'profile-enrichment', label: 'Profile Enrichment' },
    { id: 'network-features', label: 'Network Features' },
    { id: 'messaging', label: 'Direct Messaging' },
    { id: 'analytics', label: 'Analytics Dashboard' }
  ];

  // Show loading state while checking auth and beta status
  if (authLoading || (user && betaLoading)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Show approved state for logged-in approved beta members
  if (user && isApproved && betaApplication) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-primary font-medium mb-4">You're Already In!</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            Welcome back, {betaApplication.name.split(' ')[0]}! Your beta access is active. 
            Head to the Beta Hub to explore all available features.
          </p>
          <button
            onClick={() => navigate('/beta/hub')}
            className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-100 transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Go to Beta Hub
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Show pending state for logged-in users with pending applications
  if (user && isPending && betaApplication) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-primary font-medium mb-4">Application Pending</h1>
          <p className="text-zinc-400 font-secondary mb-4">
            Hi {betaApplication.name}, your beta application is currently under review.
          </p>
          <p className="text-zinc-500 font-secondary text-sm mb-8">
            We'll notify you at {betaApplication.email} once your application has been approved.
          </p>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800">
            <p className="text-xs font-secondary text-zinc-500 uppercase tracking-wider mb-2">
              Applied on
            </p>
            <p className="text-zinc-300 font-secondary">
              {new Date(betaApplication.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Beta Testing Sign-up Section */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Beta Info */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0 bg-black">
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              Early Access
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Join the</span>
            <span className="block text-zinc-500">beta</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            Be among the first to test new features and shape the future of our creative technology platform. Get early access to experimental tools before they launch.
          </p>

          <div className="flex gap-12 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">Early</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Access</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">Direct</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Feedback</span>
            </div>
          </div>
        </div>

        {/* Right Side - Beta Form */}
        <div className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0 bg-zinc-900/30">
          <div className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              <div>
                <label htmlFor="name" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeName(e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      name: capitalizedValue
                    }));
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-black border border-zinc-800 px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full bg-black border border-zinc-800 px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-4">
                  What features interest you?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {betaInterestOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleInterestToggle(option.id)}
                      disabled={isSubmitting}
                      className={`px-4 py-3 text-left text-sm font-secondary border transition-all duration-200 disabled:opacity-50 ${
                        formData.interests.includes(option.id)
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                          formData.interests.includes(option.id)
                            ? 'bg-black border-black'
                            : 'border-zinc-600'
                        }`}>
                          {formData.interests.includes(option.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div className={`text-sm font-secondary p-4 ${
                  submitMessage.includes('submitted') || submitMessage.includes('already') 
                    ? 'text-green-400 bg-green-400/10 border border-green-400/20' 
                    : 'text-red-400 bg-red-400/10 border border-red-400/20'
                }`}>
                  {submitMessage}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing Up...' : 'Join Beta Program'}
                </button>
              </div>

              <p className="text-xs text-zinc-600 font-secondary text-center pt-2">
                By signing up, you agree to receive updates about beta features and testing opportunities.
              </p>

              <div className="pt-6 border-t border-zinc-800 mt-6">
                <p className="text-sm text-zinc-500 font-secondary text-center">
                  Already have beta access?{' '}
                  <Link 
                    to="/beta/auth" 
                    className="text-white hover:text-zinc-300 transition-colors underline underline-offset-2"
                  >
                    Sign in to Beta Hub
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Beta Program • Early Access • Shape the Future
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative • Technology • Collective
        </span>
      </div>
    </div>
  );
};

export default BetaPage;
