import React, { useState, useEffect } from 'react';
import PointCloudAnimation from '../components/PointCloudAnimation';
import ImageCube from '../components/ImageCube';
import { BackgroundBeams } from '../components/ui/background-beams';
// import { SplashCursor } from '../components/ui/splash-cursor';
import { ScrollTriggeredText } from '../components/ui/scroll-triggered-text';
import { Input } from '../components/ui/input';
import { ButtonColorful } from '../components/ui/button-colorful';
import Footer from '../components/ui/footer';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { IframeMask } from '../components/ui/iframe-overlay';
import { IframeZoomWrapper } from '../components/ui/iframe-zoom-control';
import { AdvancedIframeMask, GradientIframeMask, AnimatedBorderMask } from '../components/ui/iframe-mask-advanced';
import { IframeMaskDemo } from '../components/ui/iframe-mask-demo';


const HomePage = () => {
  const [journeyStarted, setJourneyStarted] = useState(() => {
    // Only show splash if not seen in this session
    return sessionStorage.getItem('ctcSplashSeen') !== 'true' ? false : true;
  });
  // const [splashActive, setSplashActive] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  // Track if splash has been dismissed (for animation)
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);

  useEffect(() => {
    if (!journeyStarted && sessionStorage.getItem('ctcSplashSeen') === 'true') {
      setJourneyStarted(true);
    }
  }, []);





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
    
    // Capitalize the name before validation
    const capitalizedName = capitalizeName(name.trim());
    
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

    // Declare webhookUrl here so it's available in catch
    const webhookUrl = getWebhookUrl('mailinglist');
    try {
      // Check if environment variables are available
      const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
      const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;
      
      if (!webhookUrl || !username || !password) {
        console.error('Missing configuration:', { 
          hasWebhookUrl: !!webhookUrl, 
          hasUsername: !!username, 
          hasPassword: !!password 
        });
        throw new Error('Configuration missing');
      }

      console.log('Attempting to submit to:', webhookUrl);

      // Create Basic Auth header
      const basicAuth = btoa(`${username}:${password}`);

      const requestData = {
        name: capitalizedName,
        email: email.trim(),
        timestamp: new Date().toISOString(),
        source: 'homepage_signup'
      };

      console.log('Request data:', requestData);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://n8n.creativetechnologists.nl/webhook/sign-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.text().catch(() => 'Success');
        console.log('Response data:', responseData);
        setSubmitMessage('Thank you for subscribing! You\'ll receive updates soon.');
        setName('');
        setEmail('');
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Subscription error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      // More specific error handling
      if (error.name === 'AbortError') {
        setSubmitMessage('Request timed out. Please check your connection and try again.');
      } else if (error.message === 'Configuration missing') {
        setSubmitMessage('Service configuration error. Please contact support.');
      } else if (error.message.includes('Failed to fetch')) {
        // Check if it's likely a CORS issue
        if (window.location.protocol === 'https:' && webhookUrl?.startsWith('http:')) {
          setSubmitMessage('Mixed content error: Cannot make HTTP requests from HTTPS page.');
        } else {
          setSubmitMessage('Unable to connect to server. This may be due to network restrictions or CORS policy. Please try again later or contact support.');
        }
      } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
        setSubmitMessage('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('CORS')) {
        setSubmitMessage('Cross-origin request blocked. Please contact support to resolve this issue.');
      } else {
        setSubmitMessage('Something went wrong. Please try again later or contact support if the issue persists.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // When splash is dismissed, set session flag and trigger animation
  const handleSplashEnd = () => {
    sessionStorage.setItem('ctcSplashSeen', 'true');
    setSplashDismissed(true);
    setTimeout(() => setJourneyStarted(true), 1200); // Allow animation to play before showing main content
  };

  return (
    <>
      {/* Splash Cursor Effect - REMOVED */}
      {/* {splashActive && <SplashCursor />} */}
      
      {!journeyStarted && (
        <div className="fixed inset-0 -m-8 z-50">
          {/* Full screen point cloud background */}
          <PointCloudAnimation 
            imageUrl="/giphy (2).webp" 
            onJourneyStart={splashDismissed}
          />
          {/* Overlay content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl md:text-8xl font-secondary font-medium text-white mb-8">
                Creative<br />
                Technology<br />
                Collective
              </h1>
            </div>
          </div>
          {/* Dismiss splash on click */}
          <div className="absolute inset-0 cursor-pointer" onClick={handleSplashEnd} />
        </div>
      )}
      
      {/* Additional content that appears after journey starts */}
      <div className={`relative w-full overflow-y-auto bg-black z-20 transition-opacity duration-1000 delay-500 ${journeyStarted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{margin: 0, padding: 0}}>
        {/* Intro Section - Description text */}
        <section className="min-h-screen flex items-center justify-center pt-24 pb-40 overflow-hidden relative z-20">
          <ImageCube size={6.0} rotationSpeed={0.01} position={{ x: 0, y: 0, z: 0 }} forceVisible={true} />
          <div className="text-left w-full pl-4 md:pl-8 relative z-10" style={{ maxWidth: '96rem', overflow: 'visible' }}>
            {/* Title that shows on page load */}
            <div className="mb-16 relative">
              <ScrollTriggeredText 
                words="Creative Technology Collective"
                className="text-4xl md:text-5xl font-primary text-white mb-4 leading-tight"
                duration={0.8}
                filter={false}
                twoLines={true}
              />
            </div>
            <ScrollTriggeredText 
              words="Creative Technologists Collective is a community for pioneers at the intersection of creativity and technology. We experiment, prototype, and build new ways to engage audiences through emerging tech—whether it's AI, AR, interactive media, or beyond. Our goal is to connect, inspire, and push the boundaries of what's possible in digital experiences."
              className="text-zinc-400 text-xl font-medium max-w-2xl font-secondary pr-8 lg:pr-0 relative z-30"
              duration={0.6}
              delay={1.2}
              filter={false}
            />
          </div>
        </section>






        {/* Membership Section */}
        {/*
        <section id="membership-section" className="py-40 relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-end mb-16">
              <div className="max-w-xl text-left">
                <ScrollTriggeredText 
                  words="Join Our Community"
                  className="text-4xl md:text-5xl font-primary text-white mb-6"
                  duration={0.8}
                  filter={false}
                />
                <ScrollTriggeredText 
                  words="Ready to connect with Amsterdam's most innovative creative technologists? Our exclusive community brings together designers, developers, artists, and innovators who are shaping the future of digital experiences. Share knowledge, collaborate on cutting-edge projects, and be part of something extraordinary."
                  className="text-zinc-400 text-lg font-medium font-secondary mb-8 leading-relaxed"
                  duration={0.6}
                  delay={0.8}
                  filter={false}
                />
                <div className="flex justify-end">
                <ButtonColorful
                  onClick={() => window.location.href = '/membership-form'}
                  label="Join the club"
                  className="px-8 py-4 text-lg font-semibold"
                />
                </div>
              </div>
            </div>
          </div>
        </section>
        */}




        {/* Newsletter Section */}
        <section id="newsletter" className="min-h-screen flex items-center justify-center py-40 relative z-20">
          <div className="max-w-6xl mx-auto text-left md:text-center px-4 md:px-0">
            <ScrollTriggeredText 
              words="Stay Connected"
              className="text-4xl md:text-5xl font-primary text-white mb-4"
              duration={0.8}
              filter={false}
            />
            <ScrollTriggeredText 
              words="Subscribe to our newsletter for the latest resources, insights, and opportunities in creative technology. Get curated content, exclusive updates, and early access to new tools and community events."
              className="text-zinc-400 max-w-4xl md:mx-auto my-8 text-base sm:text-lg text-left md:text-center relative z-10 font-medium font-secondary"
              duration={0.6}
              delay={0.6}
              filter={false}
            />
            <form onSubmit={handleEmailSubmit} className="max-w-2xl md:mx-auto mt-8 relative z-10">
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
          <div className="absolute inset-0 w-full h-full">
            <BackgroundBeams />
          </div>
        </section>

        {/* Simple Footer */}
        <Footer />
      </div>
    </>
  );
};

export default HomePage;
