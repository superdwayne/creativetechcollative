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
                words="Amsterdam's First Creative Tech Community"
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

        {/* Mascotte.AI Digital Human Section */}
        <section className="relative z-20 flex justify-center items-center py-12 bg-black">
          <div className="w-full max-w-7xl h-[70vh] min-h-[500px] mx-auto">
            <iframe
              name="Mascotte.AI Digital Human"
              src="https://mascotte.ai/embed?data=Dw0QEkU5PSwFAwAHUR9LSkc"
              style={{ width: '100%', height: '100%', minHeight: '500px', border: 'none', display: 'block' }}
              allow="fullscreen"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title="Mascotte.AI Digital Human"
            />
          </div>
        </section>

        {/* Scroll cue/button to scroll past the iframe */}
        <div className="flex justify-center items-center pb-8">
          <button
            onClick={() => {
              const membershipSection = document.getElementById('membership-section');
              if (membershipSection) {
                membershipSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group flex flex-col items-center text-zinc-400 hover:text-pink-400 transition-colors focus:outline-none"
            aria-label="Scroll to next section"
          >
            <span className="mb-1">Scroll down</span>
            <svg className="animate-bounce" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Our Mission Section (replaces What is a Creative Technologist) */}
        <section className="py-40 relative z-20 bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-start mb-16">
              <div className="max-w-2xl text-left">
                <ScrollTriggeredText
                  words="Our Mission"
                  className="text-4xl md:text-5xl font-primary text-white mb-6"
                  duration={0.8}
                  filter={false}
                />
                <ScrollTriggeredText
                  words="We're on a mission to make Creative Technology open to all—breaking down barriers, spreading knowledge, and putting powerful tools into the hands of anyone ready to build what's next."
                  className="text-zinc-300 text-lg font-secondary font-medium leading-relaxed mb-8"
                  duration={0.6}
                  delay={0.8}
                  filter={false}
                />
              </div>
            </div>
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

        {/* Our Sponsors Section */}
        <section className="py-40 relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <ScrollTriggeredText 
                words="Our Supporters"
                className="text-4xl md:text-5xl font-primary text-white mb-4"
                duration={0.8}
                filter={false}
              />
              <ScrollTriggeredText 
                words="Proudly supported by innovative companies pushing the boundaries of creative technology"
                className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto font-secondary"
                duration={0.6}
                delay={0.6}
                filter={false}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 relative z-10 max-w-4xl mx-auto">
              <div className="flex flex-col border border-zinc-800 md:border-r md:border-l md:border-b md:border-t-0 py-10 relative group/supporter">
                <div className="opacity-0 group-hover/supporter:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-zinc-800 to-transparent pointer-events-none" />
                <div className="mb-4 relative z-10 px-10 flex justify-center items-center h-20 md:h-24">
                  <img 
                    src="/sponsors/Leonardo-AI.png" 
                    alt="Leonardo AI" 
                    className="max-h-16 md:max-h-20 max-w-full object-contain opacity-90 group-hover/supporter:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="text-center relative z-10 px-10">
                  <span className="group-hover/supporter:translate-y-1 transition duration-200 inline-block text-white font-secondary text-lg font-medium">
                    
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col border border-zinc-800 md:border-r md:border-b md:border-l-0 md:border-t-0 py-10 relative group/supporter">
                <div className="opacity-0 group-hover/supporter:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-zinc-800 to-transparent pointer-events-none" />
                <div className="mb-4 relative z-10 px-10 flex justify-center items-center h-20 md:h-24">
                  <img 
                    src="/sponsors/newamsterdam.jpg" 
                    alt="Luma Labs" 
                    className="max-h-16 md:max-h-20 max-w-full object-contain opacity-90 group-hover/supporter:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="text-center relative z-10 px-10">
                  <span className="group-hover/supporter:translate-y-1 transition duration-200 inline-block text-white font-secondary text-lg font-medium">
                    
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col border border-zinc-800 md:border-r md:border-b md:border-l-0 md:border-t-0 py-10 relative group/supporter">
                <div className="opacity-0 group-hover/supporter:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-zinc-800 to-transparent pointer-events-none" />
                <div className="mb-4 relative z-10 px-10 flex justify-center items-center h-20 md:h-24">
                  <img 
                    src="/sponsors/SAMA.png" 
                    alt="Sama Street art" 
                    className="max-h-16 md:max-h-20 max-w-full object-contain opacity-90 group-hover/supporter:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="text-center relative z-10 px-10">
                  <span className="group-hover/supporter:translate-y-1 transition duration-200 inline-block text-white font-secondary text-lg font-medium">
                
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center py-40 relative z-20">
          <div className="max-w-6xl mx-auto text-center">
            <ScrollTriggeredText 
              words="Stay Connected"
              className="text-4xl md:text-5xl font-primary text-white mb-4"
              duration={0.8}
              filter={false}
            />
            <ScrollTriggeredText 
              words="Subscribe to our newsletter for the latest resources, insights, and opportunities in creative technology. Get curated content, exclusive updates, and early access to new tools and community events."
              className="text-zinc-400 max-w-4xl mx-auto my-8 text-lg text-center relative z-10 font-medium font-secondary"
              duration={0.6}
              delay={0.6}
              filter={false}
            />
            <form onSubmit={handleEmailSubmit} className="max-w-2xl mx-auto mt-8 relative z-10">
              <div className="flex mb-4">
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
                  className="w-48 focus-visible:ring-pink-500 h-12 rounded-r-none border-r-0"
                  disabled={isSubmitting}
                />
                <Input
                  type="email"
                  placeholder="Enter your email for updates"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 focus-visible:ring-pink-500 h-12 rounded-l-none"
                  disabled={isSubmitting}
                />
                <ButtonColorful
                  type="submit"
                  disabled={isSubmitting}
                  label={isSubmitting ? 'Signing up...' : 'Sign up'}
                  className="min-w-[120px] h-12 ml-2 disabled:opacity-50 px-8"
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