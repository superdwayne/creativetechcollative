import React, { useState } from 'react';
import { getWebhookUrl } from '../utils/webhookUtils';

const ContactPage: React.FC = () => {
  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const webhookUrl = getWebhookUrl('ctc-contact');
      const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
      const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;
      
      if (!username || !password) {
        throw new Error('Authentication credentials not configured');
      }

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
          source: 'contact_page_form'
        }),
        signal: AbortSignal.timeout(10000)
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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Single 2x2 Section - Hero + Form */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0 bg-black">
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              Get In Touch
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Let's</span>
            <span className="block text-zinc-500">connect</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            Ready to collaborate, share resources, or join our creative technology community? We'd love to connect with you.
          </p>

          <div className="flex gap-12 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">24h</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Response Time</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">100%</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Human Replies</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
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
                <label htmlFor="subject" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full bg-black border border-zinc-800 px-4 py-4 text-white focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base disabled:opacity-50 appearance-none"
                  required
                >
                  <option value="" disabled className="text-zinc-600">
                    Select a subject
                  </option>
                  <option value="collaboration" className="text-white bg-black">
                    Collaboration inquiry
                  </option>
                  <option value="workshop" className="text-white bg-black">
                    Workshop request
                  </option>
                  <option value="membership" className="text-white bg-black">
                    Join our community
                  </option>
                  <option value="general" className="text-white bg-black">
                    General inquiries
                  </option>
                  <option value="resource" className="text-white bg-black">
                    Submit a resource
                  </option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-xs font-secondary text-zinc-400 uppercase tracking-[0.2em] mb-3">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full bg-black border border-zinc-800 px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-primary text-base resize-none disabled:opacity-50"
                  placeholder="Tell us about your project, idea, or how you'd like to get involved..."
                  required
                />
              </div>
              
              {/* Submit Message */}
              {submitMessage && (
                <div className={`text-sm font-secondary p-4 ${
                  submitMessage.includes('Thank you') 
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
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Get In Touch • Collaborate • Connect
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

export default ContactPage;
