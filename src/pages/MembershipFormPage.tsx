import React, { useState } from 'react';
import { BackgroundPaths } from '../components/ui/background-paths';
import { ButtonColorful } from '../components/ui/button-colorful';
import { Input } from '../components/ui/input';
import { Loader2 } from 'lucide-react';
import { getWebhookUrl } from '@/utils/webhookUtils';

const MembershipFormPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    location: '',
    jobTitle: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Function to capitalize first letter of each word
  const capitalizeName = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Email validation function
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

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'firstName' || name === 'lastName') {
      const capitalizedValue = capitalizeName(value);
      setFormData(prev => ({
        ...prev,
        [name]: capitalizedValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim()) {
      setSubmitMessage('Please enter your first name');
      return;
    }

    if (!formData.lastName.trim()) {
      setSubmitMessage('Please enter your last name');
      return;
    }

    if (!formData.location.trim()) {
      setSubmitMessage('Please enter your location');
      return;
    }

    if (!formData.jobTitle.trim()) {
      setSubmitMessage('Please enter your job title');
      return;
    }

    if (!formData.email.trim()) {
      setSubmitMessage('Please enter your email address');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setSubmitMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const webhookUrl = getWebhookUrl('membership-form');
      const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
      const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;
      
      if (!webhookUrl || !username || !password) {
        throw new Error('Configuration missing');
      }

      const basicAuth = btoa(`${username}:${password}`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          location: formData.location.trim(),
          jobTitle: formData.jobTitle.trim(),
          email: formData.email.trim(),
          timestamp: new Date().toISOString(),
          source: 'membership_application'
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        setSubmitMessage('Thank you for your application! We\'ll review it and get back to you soon.');
        setIsSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          location: '',
          jobTitle: '',
          email: ''
        });
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Membership application error:', error);
      
      if (error.name === 'TimeoutError') {
        setSubmitMessage('Request timed out. Please check your connection and try again.');
      } else if (error.message === 'Configuration missing') {
        setSubmitMessage('Service configuration error. Please contact support.');
      } else if (error.message.includes('Failed to fetch')) {
        setSubmitMessage('Unable to connect to server. Please try again later.');
      } else {
        setSubmitMessage('Something went wrong. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
      {/* Background Paths Animation */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <BackgroundPaths />
      </div>
      
      <div className="max-w-2xl mx-auto w-full relative z-10 pt-16 md:pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary text-white leading-tight mb-6 md:mb-8">
            Membership<br />
            Application Form
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-medium font-secondary max-w-3xl mx-auto">
            We welcome all creatives and people who believe in creative excellence to join our community.
          </p>
        </div>

        <div className="bg-zinc-900/30 border-0 md:border border-zinc-800 md:rounded-xl p-6 md:p-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  First name *
                </label>
                <Input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleNameBlur}
                  disabled={isSubmitting}
                  className="w-full focus-visible:ring-pink-500 h-12"
                  placeholder="Your first name"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Last name *
                </label>
                <Input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleNameBlur}
                  disabled={isSubmitting}
                  className="w-full focus-visible:ring-pink-500 h-12"
                  placeholder="Your last name"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Location *
                </label>
                <Input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full focus-visible:ring-pink-500 h-12"
                  placeholder="City, Country"
                  required
                />
              </div>

              {/* Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Job title *
                </label>
                <Input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full focus-visible:ring-pink-500 h-12"
                  placeholder="Your job title"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Email address *
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full focus-visible:ring-pink-500 h-12"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Required Fields Note */}
              <div className="text-sm text-zinc-500 font-secondary">
                * Indicates required question
              </div>
              
              {/* Submit Message */}
              {submitMessage && (
                <div className={`text-sm text-center font-secondary p-3 rounded-lg ${
                  submitMessage.includes('Thank you') 
                    ? 'text-green-400 bg-green-400/10 border border-green-400/20' 
                    : 'text-red-400 bg-red-400/10 border border-red-400/20'
                }`}>
                  {submitMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <ButtonColorful
                  type="submit"
                  disabled={isSubmitting}
                  label={isSubmitting ? 'Submitting Application...' : 'Join the Community'}
                  className="w-full sm:w-auto min-h-[48px] px-8 text-base font-semibold disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto min-h-[48px] px-8 text-base font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-primary"
                  disabled={isSubmitting}
                >
                  Go Back
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-2xl md:text-3xl font-primary text-white mb-4">
                Application Submitted Successfully!
              </h2>
              <p className="text-zinc-400 font-secondary mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                Thank you for your interest in joining the Creative Technology Collective. We've received your application and will review it carefully. You'll hear back from us within 5-7 business days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ButtonColorful
                  onClick={() => window.location.href = '/'}
                  label="Return Home"
                  className="w-full sm:w-auto px-8 py-3"
                />
                <button
                  onClick={() => window.location.href = '/resources'}
                  className="w-full sm:w-auto px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-primary"
                >
                  Explore Resources
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipFormPage;