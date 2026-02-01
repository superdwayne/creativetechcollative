import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCube from '../components/ImageCube';

interface Playground {
  id: string;
  title: string;
  description: string;
  image?: string;
  embedUrl?: string;
  videoUrl?: string;
  externalUrl?: string;
  npmUrl?: string;
  usageInstructions?: string;
  type: 'iframe' | 'image' | 'video';
}

const PlaygroundPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const playgrounds: Playground[] = [
    {
      id: 'localhost',
      title: 'Localhost Gallery',
      description: 'Manage your local dev servers with elegance. A beautiful gallery interface for discovering and organizing your localhost servers across 50+ frameworks.',
      videoUrl: '/collaborations/localhost.mov',
      externalUrl: 'https://localhost-ten-tau.vercel.app/',
      npmUrl: 'https://www.npmjs.com/package/localhost-gallery-agent',
      usageInstructions: 'npm install -g localhost-gallery-agent && localhost-gallery',
      type: 'video'
    },
    {
      id: 'igor',
      title: 'Meet Igor',
      description: 'Your AI guide into the world of Creative Technology community, want to know more about the community and how it started just ask .',
      image: '/playgrounds/igor-cover.svg',
      embedUrl: 'https://mascotte.ai/embed?data=JgQDAR4sOTIFAwAHUh9LSkc&lang=false',
      type: 'iframe'
    },
    {
      id: 'spreed',
      title: 'Spreed',
      description: 'A speed reading tool that helps you consume text faster. Paste text, enter a URL, or upload content and read at speeds from 200 to 1500 WPM.',
      image: '/playgrounds/spreed-cover.svg',
      embedUrl: 'https://spreed-sigma.vercel.app/',
      type: 'iframe'
    }
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
                {/* Left side - Embed, Video or Image */}
                <div className={`relative ${selectedPlayground.type === 'video' ? 'aspect-video' : 'aspect-square'}`}>
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
                  ) : selectedPlayground.type === 'video' && selectedPlayground.videoUrl ? (
                    <video
                      src={selectedPlayground.videoUrl}
                      className="w-full h-full object-contain bg-zinc-950"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
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
                  <p className="text-zinc-400 font-secondary text-lg leading-relaxed mb-6">
                    {selectedPlayground.description}
                  </p>

                  {/* Usage Instructions */}
                  {selectedPlayground.usageInstructions && (
                    <div className="mb-6">
                      <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase mb-2 block">
                        Quick Start
                      </span>
                      <code className="block bg-zinc-800 px-4 py-3 text-sm font-mono text-emerald-400 rounded">
                        {selectedPlayground.usageInstructions}
                      </code>
                    </div>
                  )}

                  {/* External Links */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    {selectedPlayground.externalUrl && (
                      <a
                        href={selectedPlayground.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors flex items-center gap-2"
                      >
                        Try It Live
                        <span>↗</span>
                      </a>
                    )}
                    {selectedPlayground.npmUrl && (
                      <a
                        href={selectedPlayground.npmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 hover:bg-zinc-800 transition-colors flex items-center gap-2"
                      >
                        npm Package
                        <span>↗</span>
                      </a>
                    )}
                  </div>

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
                {playground.type === 'video' && playground.videoUrl ? (
                  <video
                    src={playground.videoUrl}
                    className="w-full h-full object-contain bg-zinc-950 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : playground.image && (
                  <img 
                    src={playground.image} 
                    alt={playground.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase mb-2 block">
                    {playground.type === 'iframe' ? 'Interactive' : playground.type === 'video' ? 'Tool' : 'Experiment'}
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
    </div>
  );
};

export default PlaygroundPage;
