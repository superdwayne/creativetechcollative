import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { BackgroundPaths } from '../components/ui/background-paths';
import { ButtonColorful } from '../components/ui/button-colorful';
import { Input } from '../components/ui/input';
import { Loader2 } from 'lucide-react';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { n8nFetch } from '@/utils/n8nProxy';

interface WhitepaperData {
  id: string;
  route: string;
  title: string;
  description: string;
  file: string;
  active: boolean;
}

const WhitepaperPage: React.FC = () => {
  const location = useLocation();
  const [whitepaperData, setWhitepaperData] = useState<WhitepaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showTextEffect, setShowTextEffect] = useState(false);
  const [showTitleEffect, setShowTitleEffect] = useState(false);

  // Function to capitalize first letter of each word
  const capitalizeName = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Extract route from URL path
  const getRouteFromPath = () => {
    const path = location.pathname;
    console.log('Current path:', path);
    
    if (path === '/whitepaper') {
      return 'default';
    }
    // Extract everything after '/whitepaper-'
    if (path.startsWith('/whitepaper-')) {
      const route = path.substring('/whitepaper-'.length);
      console.log('Extracted route from /whitepaper-:', route);
      return route;
    }
    // Extract everything after '/whitepaper/'
    if (path.startsWith('/whitepaper/')) {
      const route = path.substring('/whitepaper/'.length);
      console.log('Extracted route from /whitepaper/:', route);
      return route;
    }
    return 'default';
  };

  const route = getRouteFromPath();
  console.log('Final route:', route);

  // Fetch whitepaper data from webhook
  useEffect(() => {
    const fetchWhitepaperData = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        console.log('Fetching whitepaper data for route:', route);

        const webhookUrl = getWebhookUrl('whitepaper-pages');
        const response = await n8nFetch(webhookUrl, 'GET');

        if (!response.ok) {
          throw new Error(`Failed to fetch whitepaper data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw whitepaper data:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Transform the webhook data
          const whitepapers: WhitepaperData[] = data
            .map((item: any) => {
              console.log('Processing whitepaper item:', item);
              
              // Handle the file field - it might be an array
              let fileUrl = '';
              if (item.property_file) {
                if (Array.isArray(item.property_file) && item.property_file.length > 0) {
                  fileUrl = item.property_file[0];
                } else if (typeof item.property_file === 'string') {
                  fileUrl = item.property_file;
                }
              }
              
              const transformed = {
                id: item.id || '',
                route: item.property_route || '',
                title: item.property_title || 'Untitled Whitepaper',
                description: item.property_description || 'No description available',
                file: fileUrl,
                active: item.property_active === true || item.property_active === 'true' || item.property_active === 'Yes'
              };
              
              console.log('Transformed whitepaper:', transformed);
              return transformed;
            })
            .filter((wp: WhitepaperData) => wp.active && wp.route);

          console.log('Filtered whitepapers:', whitepapers);
          console.log('Available routes:', whitepapers.map(wp => wp.route));

          // Find the specific whitepaper for this route
          const targetRoute = route;
          const foundWhitepaper = whitepapers.find(wp => wp.route === targetRoute);
          
          console.log('Looking for route:', targetRoute);
          console.log('Found whitepaper:', foundWhitepaper);
          
          if (foundWhitepaper) {
            setWhitepaperData(foundWhitepaper);
            console.log('Set whitepaper data:', foundWhitepaper);
          } else {
            // No whitepaper found for this route - this is a 404
            console.log('No whitepaper found for route:', targetRoute);
            setNotFound(true);
            setWhitepaperData(null);
          }
        } else {
          console.log('No data received or data is not an array:', data);
          // If no data at all, treat as 404
          setNotFound(true);
          setWhitepaperData(null);
        }
      } catch (err: any) {
        console.error('Error fetching whitepaper data:', err);
        setError(err.message || 'Failed to load whitepaper data');
        setWhitepaperData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWhitepaperData();
  }, [route, location.pathname]);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      const webhookUrl = getWebhookUrl('whitepaper');

      if (!webhookUrl) {
        throw new Error('Configuration missing');
      }

      const response = await n8nFetch(webhookUrl, 'POST', {
        name: capitalizedName,
        email: email.trim(),
        whitepaper_route: route,
        whitepaper_id: whitepaperData?.id || 'default',
        whitepaper_title: whitepaperData?.title || 'Unknown Whitepaper',
        file_url: whitepaperData?.file || '',
        timestamp: new Date().toISOString(),
        source: 'whitepaper_signup'
      });

      if (response.ok) {
        setSubmitMessage('Success! Content unlocked.');
        setIsUnlocked(true);
        setName('');
        setEmail('');
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
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

  // Start text effect after component mounts and data is loaded
  useEffect(() => {
    if (whitepaperData && !loading) {
      console.log('Starting text effects for:', whitepaperData);
      const titleTimer = setTimeout(() => {
        setShowTitleEffect(true);
      }, 300);
      
      const timer = setTimeout(() => {
        setShowTextEffect(true);
      }, 1200);
      
      return () => {
        clearTimeout(titleTimer);
        clearTimeout(timer);
      };
    }
  }, [whitepaperData, loading]);

  // Debug: Log current state
  useEffect(() => {
    console.log('Current state:', {
      loading,
      error,
      notFound,
      whitepaperData,
      route,
      pathname: location.pathname
    });
  }, [loading, error, notFound, whitepaperData, route, location.pathname]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium font-secondary">Loading whitepaper...</p>
          <p className="text-zinc-600 font-secondary text-sm mt-2">Route: {route}</p>
        </div>
      </div>
    );
  }

  // 404 Not Found state
  if (notFound || (!whitepaperData && !error)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
        {/* Background Paths Animation */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <BackgroundPaths />
        </div>
        
        <div className="text-center max-w-md relative z-10">
          <h1 className="text-6xl md:text-8xl font-primary text-white mb-4 font-black">404</h1>
          <h2 className="text-2xl md:text-3xl font-primary text-white mb-4">Whitepaper Not Found</h2>
          <p className="text-zinc-400 font-secondary mb-6">
            The whitepaper route "<span className="text-pink-400 font-mono">{route}</span>" does not exist or is not active.
          </p>
          <ButtonColorful
            onClick={() => window.location.href = '/'}
            label="Go Home"
            className="px-8 py-3"
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !whitepaperData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
        {/* Background Paths Animation */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <BackgroundPaths />
        </div>
        
        <div className="text-center max-w-md relative z-10">
          <h3 className="text-xl font-primary text-white mb-2">Unable to Load Whitepaper</h3>
          <p className="text-zinc-400 font-secondary mb-4">{error}</p>
          <p className="text-zinc-600 font-secondary text-sm mb-4">Route: {route}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white px-6 py-2 rounded-lg transition-colors font-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // This should not happen, but just in case
  if (!whitepaperData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 font-medium font-secondary">No whitepaper data available</p>
          <p className="text-zinc-600 font-secondary text-sm mt-2">Route: {route}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
      {/* Background Paths Animation */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <BackgroundPaths />
      </div>
      
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left relative z-10">
            <div>
              {showTitleEffect ? (
                <TextGenerateEffect 
                  duration={1.5} 
                  filter={false} 
                  words={whitepaperData.title}
                  className="font-primary text-4xl md:text-5xl lg:text-6xl leading-tight font-black mb-8 text-white"
                />
              ) : (
                <div className="opacity-0 text-4xl md:text-5xl lg:text-6xl font-black mb-8 text-white">
                  {whitepaperData.title}
                </div>
              )}
            </div>
            <div className="text-lg md:text-xl text-zinc-300 font-secondary min-h-[120px]">
              {showTextEffect ? (
                <TextGenerateEffect 
                  duration={1} 
                  filter={false} 
                  words={whitepaperData.description}
                  className="text-zinc-300"
                />
              ) : (
                <div className="opacity-0 text-zinc-300">{whitepaperData.description}</div>
              )}
            </div>
          </div>

          {/* Right Column - Signup Form */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 md:p-8 relative z-10">
            {!isUnlocked ? (
              <>
                <h2 className="text-2xl md:text-3xl font-primary text-white mb-4">
                  Unlock Content
                </h2>
                <p className="text-zinc-400 text-base font-secondary mb-6">
                  Leave your email and name and we'll send you our exclusive content by email.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={(e) => {
                        // Capitalize on blur (when user finishes typing)
                        const capitalizedValue = capitalizeName(e.target.value);
                        setName(capitalizedValue);
                      }}
                      className="w-full focus-visible:ring-pink-500 h-12"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full focus-visible:ring-pink-500 h-12"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {submitMessage && (
                    <p className={`text-sm font-secondary ${
                      submitMessage.includes('Success') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {submitMessage}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <ButtonColorful
                      type="submit"
                      disabled={isSubmitting}
                      label={isSubmitting ? 'Unlocking...' : 'Unlock'}
                      className="w-auto px-8 h-12 text-base font-semibold disabled:opacity-50"
                    />
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center space-y-6">
                <h2 className="text-2xl md:text-3xl font-primary text-white mb-4">
                  Content Unlocked!
                </h2>
                {whitepaperData.file ? (
                  <ButtonColorful
                    onClick={() => {
                      // Force download without leaving the page
                      const downloadFile = async () => {
                        try {
                          const response = await fetch(whitepaperData.file);
                          if (!response.ok) throw new Error('Download failed');
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${whitepaperData.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.pdf`;
                          link.style.display = 'none';
                          
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          // Clean up the blob URL
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Download failed:', error);
                          // Fallback: open in new tab if download fails
                          window.open(whitepaperData.file, '_blank');
                        }
                      };
                      
                      downloadFile();
                    }}
                    label="Download"
                    className="w-full h-12 text-base"
                  />
                ) : (
                  <div className="text-zinc-400 font-secondary">
                    Download will be sent to your email shortly.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperPage;