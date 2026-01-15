import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCube from '../components/ImageCube';
import { ExternalLink } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  image?: string;
}

const ResourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const resources: Resource[] = [
    {
      id: 'leonardo-ai',
      title: 'Leonardo AI',
      description: 'Create production-quality visual assets for your projects with unprecedented quality, speed and style-consistency.',
      url: 'https://leonardo.ai',
      category: 'AI Tools',
      image: '/sponsors/Leonardo-AI.png'
    },
    {
      id: 'luma-labs',
      title: 'Luma Labs',
      description: 'Capture and create lifelike 3D with your iPhone. Unmatched photorealism, reflections, and details.',
      url: 'https://lumalabs.ai',
      category: 'AI Tools',
      image: '/sponsors/Lumalabs.png'
    },
    {
      id: 'kiri-engine',
      title: 'Kiri Engine',
      description: '3D scanning and photogrammetry tools for creating high-quality 3D models from photos.',
      url: 'https://www.kiriengine.app/',
      category: 'AI Tools',
      image: '/sponsors/logo.png'
    },
    {
      id: 'runway',
      title: 'Runway',
      description: 'AI-powered creative tools for video editing, image generation, and more.',
      url: 'https://runwayml.com',
      category: 'AI Tools'
    },
    {
      id: 'midjourney',
      title: 'Midjourney',
      description: 'An independent research lab exploring new mediums of thought and expanding the imaginative powers of the human species.',
      url: 'https://www.midjourney.com',
      category: 'AI Tools'
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
              Curated Tools & Resources
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Creative</span>
            <span className="block text-zinc-500">Resources</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            Discover the tools and platforms that power our creative technology community. From AI to 3D, find resources to bring your ideas to life.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
            >
              Submit a Resource
            </button>
          </div>

          <div className="flex gap-12 mt-20 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">{resources.length}+</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Resources</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">∞</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Possibilities</span>
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

      {/* Resources Grid Section */}
      <section className="py-32 bg-black px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4 block">
                Explore
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium text-white">
                Tools & Platforms
              </h2>
            </div>
          </div>

          {/* Selected Resource - Full Width 2x2 */}
          {selectedResource && (
            <div className="w-full mb-8 bg-zinc-900 overflow-hidden transition-all duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left side - Image */}
                <div className="aspect-square relative bg-black flex items-center justify-center">
                  {selectedResource.image ? (
                    <img 
                      src={selectedResource.image} 
                      alt={selectedResource.title}
                      className="max-w-full max-h-full object-contain p-12"
                    />
                  ) : (
                    <div className="text-zinc-600 text-6xl">🔖</div>
                  )}
                </div>

                {/* Right side - Content */}
                <div className="flex flex-col justify-center p-8 md:p-12 relative">
                  <button
                    onClick={() => setSelectedResource(null)}
                    className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>

                  <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4">
                    {selectedResource.category}
                  </span>
                  <h3 className="text-4xl md:text-5xl font-primary font-medium text-white mb-6">
                    {selectedResource.title}
                  </h3>
                  <p className="text-zinc-400 font-secondary text-lg leading-relaxed mb-8">
                    {selectedResource.description}
                  </p>
                  <a
                    href={selectedResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start text-sm font-secondary text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Resources Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${selectedResource ? 'opacity-30' : ''}`}>
            {resources.map((resource) => (
              <div 
                key={resource.id}
                className="group relative aspect-video overflow-hidden bg-zinc-900 cursor-pointer"
                onClick={() => setSelectedResource(resource)}
              >
                {resource.image ? (
                  <div className="w-full h-full flex items-center justify-center bg-black p-8">
                    <img 
                      src={resource.image} 
                      alt={resource.title}
                      className="max-w-full max-h-full object-contain opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <span className="text-6xl opacity-60 group-hover:opacity-100 transition-opacity">🔖</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase mb-2 block">
                    {resource.category}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-primary font-medium text-white mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-zinc-400 font-secondary text-sm line-clamp-2">
                    {resource.description}
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
          Tools • Resources • Community
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

export default ResourcesPage;
