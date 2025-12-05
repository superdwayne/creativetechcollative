import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Loader2 } from 'lucide-react';
import { MorphingText } from './morphing-text';
import { ButtonColorful } from './button-colorful';
import { getWebhookUrl } from '@/utils/webhookUtils';

interface Contact2Props {
  title: string;
  description: string;
  email: string;
  web: {
    label: string;
    url: string;
  };
}

export const Contact2: React.FC<Contact2Props> = ({
  title,
  description,
  email,
  web
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Function to capitalize first letter of each word
  const capitalizeName = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const morphingTexts = [
    "Get In Touch",
    "Let's Connect",
    "Start a Project",
    "Share Ideas",
    "Collaborate",
    "Get In Touch"
  ];

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Capitalize the name before validation
    const capitalizedName = capitalizeName(formData.name.trim());
    
    // Validation
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

    if (!formData.subject.trim()) {
      setSubmitMessage('Please select a subject');
      return;
    }

    if (!formData.message.trim()) {
      setSubmitMessage('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Get credentials from environment variables
      const webhookUrl = getWebhookUrl('ctc-contact');
      const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
      const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;
      
      if (!username || !password) {
        throw new Error('Authentication credentials not configured');
      }

      // Create Basic Auth header
      const basicAuth = btoa(`${username}:${password}`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          name: capitalizedName,
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          timestamp: new Date().toISOString(),
          source: 'contact_form'
        }),
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        setSubmitMessage('Thank you for your message! We\'ll get back to you soon.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Contact form error:', error);
      
      if (error.name === 'TimeoutError') {
        setSubmitMessage('Request timed out. Please check your connection and try again.');
      } else if (error.message === 'Authentication credentials not configured') {
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
    <div className="min-h-screen bg-black text-white py-8 md:py-16 w-full">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 pt-16 md:pt-8">
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-primary text-white leading-tight mb-6 md:mb-8">
            Let's connect
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-medium font-secondary max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-zinc-900/30 border-0 md:border border-zinc-800 md:rounded-xl p-4 md:p-8 w-full">
          <h2 className="text-2xl md:text-3xl font-primary text-white mb-4 md:mb-6">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={(e) => {
                    // Capitalize on blur (when user finishes typing)
                    const capitalizedValue = capitalizeName(e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      name: capitalizedValue
                    }));
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500 transition-colors font-primary text-sm md:text-base disabled:opacity-50"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500 transition-colors font-primary text-sm md:text-base disabled:opacity-50"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 pr-10 text-white focus:outline-none focus:border-pink-500 transition-colors font-primary text-sm md:text-base disabled:opacity-50"
                required
              >
                <option value="" disabled className="text-zinc-400">
                  Select a subject
                </option>
                <option value="collaboration" className="text-white">
                  Collaboration inquiry
                </option>
                <option value="workshop" className="text-white">
                  Workshop request
                </option>
                <option value="membership" className="text-white">
                  Join our community
                </option>
                <option value="general" className="text-white">
                  General inquiries
                </option>
                <option value="resource" className="text-white">
                  Submit a resource
                </option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-2 font-secondary">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-3 text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500 transition-colors font-primary resize-none text-sm md:text-base min-h-[120px] disabled:opacity-50"
                placeholder="Tell us about your project, idea, or how you'd like to get involved with our community..."
                required
              />
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

            <div className="flex justify-center md:justify-end pt-4">
              <ButtonColorful
                type="submit"
                disabled={isSubmitting}
                label={isSubmitting ? 'Sending...' : 'Send Message'}
                className="w-full md:w-auto min-h-[48px] px-8 text-base font-semibold disabled:opacity-50"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};