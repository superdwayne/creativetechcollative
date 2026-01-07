import React, { useState } from 'react';
import { ScrollTriggeredText } from './ui/scroll-triggered-text';
import { Input } from './ui/input';
import { ButtonColorful } from './ui/button-colorful';
import { getWebhookUrl } from '@/utils/webhookUtils';

interface EmailSignupProps {
  hideIntro?: boolean;
  minimal?: boolean;
}

const EmailSignup: React.FC<EmailSignupProps> = ({ hideIntro = false, minimal = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Capitalize name on submit as well
    const capitalizedName = capitalizeName(name);
    
    if (!capitalizedName) {
      setSubmitMessage('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setSubmitMessage('Please enter an email address');
      return;
    }

    if (!isValidEmail(email)) {
      setSubmitMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const requestData = {
        name: capitalizedName,
        email: email.trim(),
        timestamp: new Date().toISOString(),
        source: 'partners_signup'
      };

      console.log('Request data:', requestData);

      const response = await fetch(getWebhookUrl('sign-ups'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      console.log('Success response:', result);
      
      setSubmitMessage(`Thank you, ${capitalizedName}! You've been added to our newsletter.`);
      setName('');
      setEmail('');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMessage('Sorry, there was an error signing you up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Minimal style for embedding in other sections
  if (minimal) {
    return (
      <form onSubmit={handleEmailSubmit} className="max-w-xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={(e) => setName(capitalizeName(e.target.value))}
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            disabled={isSubmitting}
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 font-secondary text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Signing up...' : 'Subscribe'}
          </button>
        </div>
        {submitMessage && (
          <p className={`text-sm text-center font-secondary ${
            submitMessage.includes('Thank you') ? 'text-green-400' : 'text-red-400'
          }`}>
            {submitMessage}
          </p>
        )}
      </form>
    );
  }

  return (
    <section className="py-20 text-left md:text-center px-4 md:px-0">
      <div className="max-w-4xl md:mx-auto">
        {!hideIntro && (
          <>
            <ScrollTriggeredText 
              words="Stay Connected"
              className="text-3xl sm:text-4xl md:text-5xl font-primary text-white mb-6"
              duration={0.8}
              filter={false}
            />
            <ScrollTriggeredText 
              words="Subscribe to our newsletter for the latest resources, insights, and opportunities in creative technology. Get curated content, exclusive updates, and early access to new tools and community events."
              className="text-zinc-400 max-w-3xl mx-auto mb-8 text-base sm:text-lg font-secondary leading-relaxed"
              duration={0.6}
              delay={0.4}
              filter={false}
            />
          </>
        )}
        
        <form onSubmit={handleEmailSubmit} className="max-w-2xl md:mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 mb-4">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                const inputValue = e.target.value;
                setName(inputValue);
              }}
              onBlur={(e) => {
                // Capitalize on blur (when user finishes typing)
                const capitalizedValue = capitalizeName(e.target.value);
                setName(capitalizedValue);
              }}
              className="w-full sm:w-48 focus-visible:ring-pink-500 h-12 sm:rounded-r-none sm:border-r-0"
              disabled={isSubmitting}
            />
            <Input
              type="email"
              placeholder="Enter your email for updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:flex-1 focus-visible:ring-pink-500 h-12 sm:rounded-l-none"
              disabled={isSubmitting}
            />
            <ButtonColorful
              type="submit"
              disabled={isSubmitting}
              label={isSubmitting ? 'Signing up...' : 'Sign up'}
              className="min-w-[120px] h-12 sm:ml-2 disabled:opacity-50 px-8 w-full sm:w-auto"
            />
          </div>
          {submitMessage && (
            <p className={`text-sm text-center font-secondary ${
              submitMessage.includes('Thank you') ? 'text-green-400' : 'text-red-400'
            }`}>
              {submitMessage}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default EmailSignup;
