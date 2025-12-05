import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCube from '../components/ImageCube';
import { ButtonColorful } from '../components/ui/button-colorful';
import { getWebhookUrl } from '../utils/webhookUtils';

interface Playground {
  id: string;
  title: string;
  description: string;
  image?: string;
  embedUrl?: string;
  type: 'iframe' | 'image' | 'video';
}

const PlaygroundPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
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
          source: 'playground_contact_form'
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

  const playgrounds: Playground[] = [
    {
      id: 'igor',
      title: 'Meet Igor',
      description: 'Your AI guide into the world of Creative Technology—a community of pioneers at the intersection of creativity, storytelling, and emerging tools. Ask about community initiatives, prototypes, or where to get started.',
      embedUrl: 'https://mascotte.ai/embed?data=JgQDAR4sOTIFAwAHUh9LSkc&lang=false',
      type: 'iframe'
    },
    {
      id: '8thwall-mcp',
      title: '8th Wall MCP Prototype',
      description: 'An experimental integration combining 8th Wall WebAR with Model Context Protocol (MCP). Explore how AI-powered tools can enhance augmented reality experiences in the browser.',
      embedUrl: 'https://www.dwaynep-marshall.co.uk/project/eighthwall-mcp-prototype',
      type: 'iframe'
    },
    {
      id: 'generative',
      title: 'Generative Art',
      description: 'Explore our experiments with generative algorithms, creative coding, and procedural design. From particle systems to algorithmic compositions.',
      image: '/giphy (2).webp',
      type: 'image'
    },
    {
      id: 'immersive',
      title: 'Immersive Experiences',
      description: 'Step into our world of AR, VR, and spatial computing experiments. We push the boundaries of what\'s possible in immersive storytelling.',
      image: '/members/Dwayne.png',
      type: 'image'
    },
    {
      id: 'ai-tools',
      title: 'AI Tools',
      description: 'Discover our collection of AI-powered creative tools. From image generation to conversational interfaces, we experiment with the cutting edge.',
      image: '/sponsors/Leonardo-AI.png',
      type: 'image'
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0">
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              Experiments & Prototypes
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Our</span>
            <span className="block text-zinc-500">Playground</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            A space for experimentation, prototyping, and pushing the boundaries of creative technology. Explore our latest experiments and tools.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
            >
              Collaborate With Us
            </button>
          </div>

          <div className="flex gap-12 mt-20 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">{playgrounds.length}</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Experiments</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">∞</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Ideas</span>
            </div>
          </div>
        </div>

        {/* Right Side - Cube */}
        <div className="flex-1 relative flex items-center justify-center min-h-[50vh] lg:min-h-screen">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-black" />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <ImageCube 
              size={5.5} 
              rotationSpeed={0.008} 
              position={{ x: 0, y: 0, z: 0 }} 
              forceVisible={true} 
            />
          </div>
        </div>
      </div>

      {/* Playgrounds Grid Section */}
      <section className="py-32 bg-black px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4 block">
                Explore
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium text-white">
                Experiments
              </h2>
            </div>
          </div>

          {/* Selected Playground - Full Width 2x2 */}
          {selectedPlayground && (
            <div className="w-full mb-8 bg-zinc-900 overflow-hidden transition-all duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left side - Embed or Image */}
                <div className="aspect-square relative">
                  {selectedPlayground.type === 'iframe' && selectedPlayground.embedUrl ? (
                    <>
                      <iframe
                        src={selectedPlayground.embedUrl}
                        className="w-full h-full border-none"
                        allow="microphone; camera"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        title={selectedPlayground.title}
                        onLoad={() => setIframeLoaded(true)}
                      />
                      {!iframeLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-zinc-400 text-sm uppercase tracking-[0.5em]">
                          Loading...
                        </div>
                      )}
                    </>
                  ) : (
                    <img 
                      src={selectedPlayground.image} 
                      alt={selectedPlayground.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Right side - Content */}
                <div className="flex flex-col justify-center p-8 md:p-12 relative">
                  <button
                    onClick={() => {
                      setSelectedPlayground(null);
                      setIframeLoaded(false);
                    }}
                    className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>

                  <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4">
                    Experiment
                  </span>
                  <h3 className="text-4xl md:text-5xl font-primary font-medium text-white mb-6">
                    {selectedPlayground.title}
                  </h3>
                  <p className="text-zinc-400 font-secondary text-lg leading-relaxed mb-8">
                    {selectedPlayground.description}
                  </p>
                  <button
                    onClick={() => navigate('/contact')}
                    className="self-start text-sm font-secondary text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Want to collaborate?
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Playgrounds Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${selectedPlayground ? 'opacity-30' : ''}`}>
            {playgrounds.map((playground) => (
              <div 
                key={playground.id}
                className="group relative aspect-video overflow-hidden bg-zinc-900 cursor-pointer"
                onClick={() => {
                  setSelectedPlayground(playground);
                  setIframeLoaded(false);
                }}
              >
                {playground.image && (
                  <img 
                    src={playground.image} 
                    alt={playground.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase mb-2 block">
                    {playground.type === 'iframe' ? 'Interactive' : 'Experiment'}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-primary font-medium text-white mb-2">
                    {playground.title}
                  </h3>
                  <p className="text-zinc-400 font-secondary text-sm line-clamp-2">
                    {playground.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Experiments • Prototypes • Tools
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative • Technology • Collective
        </span>
      </div>

      {/* Contact Section */}
      <section className="py-32 bg-black px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
              <span className="block">Let's</span>
              <span className="block text-zinc-500">connect</span>
            </h2>
            
            <p className="text-zinc-400 text-lg md:text-xl font-secondary leading-relaxed">
              Want to collaborate on an experiment or share your creative tech project? We'd love to hear from you.
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8">
            <h3 className="text-2xl md:text-3xl font-primary text-white mb-6">Send us a message</h3>
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
                  placeholder="Tell us about your project, idea, or how you'd like to collaborate on experiments..."
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
      </section>
    </div>
  );
};

export default PlaygroundPage;
