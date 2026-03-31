import React, { useState, useMemo, useEffect } from 'react';
import { Star, ExternalLink, Tag, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/ui/footer';
import ImageCube from '../components/ImageCube';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { n8nFetch } from '@/utils/n8nProxy';
import { useFeatureFlags } from '@/utils/featureFlags';
import FeatureFlagAdmin from '../components/FeatureFlagAdmin';
import EmailSignup from '../components/EmailSignup';
import './ResourcesPage.css';

interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  category: string;
  tags: string[];
  featured?: boolean;
  date: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

// Helper function to get appropriate icon for category/tag
const getCategoryIcon = (name: string): string => {
  const iconMap: { [key: string]: string } = {
    // Categories
    'design': '🎨',
    'dev': '⚡',
    'learning': '📚',
    'media': '🎬',
    'tools': '🛠️',
    
    // Common tags
    'ai': '🤖',
    'audio': '🔊',
    '3d': '📦',
    'cloud': '☁️',
    'api': '🔌',
    'templates': '📋',
    'video': '🎬',
    'animation': '🎭',
    'web': '🌐',
    'mobile': '📱',
    'vr': '🥽',
    'ar': '👓',
    'ml': '🧠',
    'data': '📊',
    'code': '💻',
    'framework': '🏗️',
    'library': '📚',
    'tutorial': '🎓',
    'inspiration': '💡',
    'productivity': '⚡',
    'collaboration': '🤝',
    'prototyping': '🔧',
    'testing': '🧪',
    'deployment': '🚀',
    'monitoring': '📈',
    'security': '🔒',
    'performance': '⚡',
    'accessibility': '♿',
    'ux': '👤',
    'ui': '🎨',
    'research': '🔬',
    'analytics': '📊',
    'marketing': '📢',
    'social': '👥',
    'gaming': '🎮',
    'music': '🎵',
    'art': '🎨',
    'photography': '📸',
    'writing': '✍️',
    'business': '💼',
    'finance': '💰',
    'education': '🎓',
    'health': '🏥',
    'fitness': '💪',
    'travel': '✈️',
    'food': '🍕',
    'lifestyle': '🌟',
    'news': '📰',
    'entertainment': '🎪',
    'sports': '⚽',
    'science': '🔬',
    'technology': '💻',
    'innovation': '💡',
    'startup': '🚀',
    'opensource': '🔓',
    'community': '👥',
    'event': '📅',
    'conference': '🎤',
    'workshop': '🛠️',
    'course': '📚',
    'certification': '🏆',
    'job': '💼',
    'career': '📈',
    'freelance': '💼',
    'remote': '🏠',
    'saas': '☁️',
    'platform': '🏗️',
    'service': '🔧',
    'plugin': '🔌',
    'extension': '🧩',
    'addon': '➕',
    'integration': '🔗',
    'automation': '🤖',
    'workflow': '🔄',
    'process': '⚙️',
    'methodology': '📋',
    'best-practices': '⭐',
    'tips': '💡',
    'tricks': '🎩',
    'hacks': '🔧',
    'resources': '📦',
    'collection': '📚',
    'curated': '✨',
    'free': '🆓',
    'paid': '💰',
    'premium': '👑',
    'beta': '🧪',
    'new': '🆕',
    'trending': '📈',
    'popular': '🔥',
    'featured': '⭐',
    'recommended': '👍'
  };
  
  return iconMap[name.toLowerCase()] || '🔖';
};

interface LinkCardProps {
  link: LinkItem;
  featured?: boolean;
  columnIndex?: number;
  isHighlighted?: boolean;
  compact?: boolean;
  highlightConfig?: {
    backgroundColor?: string;
    borderColor?: string;
    title?: string;
    description?: string;
  };
}

function LinkCard({ link, featured = false, columnIndex, isHighlighted = false, compact = false, highlightConfig }: LinkCardProps) {
  const baseClasses = compact 
    ? "group rounded-xl overflow-hidden border transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-lg"
    : "group rounded-2xl overflow-hidden border transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl mb-6";
  const highlightClasses = isHighlighted 
    ? `${highlightConfig?.backgroundColor || 'bg-gradient-to-r from-pink-500/10 to-purple-500/10'} ${highlightConfig?.borderColor || 'border-pink-500/50'} border-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-glow-pulse`
    : "bg-zinc-900/80 backdrop-blur-sm border-zinc-800/50 hover:border-zinc-700/70 hover:bg-zinc-900/90";
  
  return (
    <div 
      className={`${baseClasses} ${highlightClasses}`}
      style={{ 
        breakInside: 'avoid',
        pageBreakInside: 'avoid'
      }}
    >
      {/* Consistent Image Container */}
      <div className={compact ? "aspect-[4/3] bg-zinc-800/50 overflow-hidden relative" : "aspect-[4/3] bg-zinc-800/50 overflow-hidden relative"}>
        <img 
          src={link.image} 
          alt={link.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/400x300/18181b/71717a?text=${encodeURIComponent(link.title)}`;
          }}
        />
        {/* Overlay for better text readability on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Consistent Content Container */}
      <div className={compact ? "p-3" : "p-5"}>
        {/* Header Section */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-semibold text-white group-hover:text-pink-400 transition-colors duration-300 font-primary leading-tight line-clamp-2 ${
            compact ? 'text-sm' : 'text-base'
          }`}>
            {isHighlighted && highlightConfig?.title ? highlightConfig.title : link.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isHighlighted && (
              <Sparkles className={compact ? "w-3 h-3 text-pink-400" : "w-4 h-4 text-pink-400"} />
            )}
            {featured && (
              <Star className={compact ? "w-3 h-3 text-yellow-400" : "w-4 h-4 text-yellow-400"} />
            )}
          </div>
        </div>
        
        {/* Date */}
        <div className={`text-zinc-500 mb-2 font-secondary font-medium uppercase tracking-wider ${
          compact ? 'text-xs' : 'text-xs'
        }`}>
          {new Date(link.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short'
          })}
        </div>
        
        {/* Description */}
        <p className={`text-zinc-400 mb-3 leading-relaxed font-secondary line-clamp-2 ${
          compact ? 'text-xs' : 'text-sm'
        }`}>
          {isHighlighted && highlightConfig?.description ? highlightConfig.description : link.description}
        </p>
        
        {/* Footer Section */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
          <div className="flex flex-wrap gap-1">
            {link.tags.slice(0, compact ? 1 : 2).map((tag) => (
              <span 
                key={tag}
                className={`px-2 py-0.5 bg-zinc-800/80 text-zinc-300 rounded-full font-medium font-secondary border border-zinc-700/50 hover:bg-zinc-700/80 transition-colors ${
                  compact ? 'text-xs' : 'text-xs'
                }`}
              >
                {tag}
              </span>
            ))}
            {link.tags.length > (compact ? 1 : 2) && (
              <span className="text-xs text-zinc-500 font-secondary">+{link.tags.length - (compact ? 1 : 2)}</span>
            )}
          </div>
          
          <button
            onClick={() => window.open(link.url, '_blank')}
            className={`text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-all duration-300 hover:scale-110 border border-transparent hover:border-zinc-700/50 ${
              compact ? 'p-1.5' : 'p-2.5'
            }`}
            aria-label={`Open ${link.title}`}
          >
            <ExternalLink className={compact ? "w-3 h-3" : "w-4 h-4"} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResourcesPageProps {
  activeCategory?: string;
  setActiveCategory?: (category: string) => void;
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ 
  activeCategory: externalActiveCategory,
  setActiveCategory: externalSetActiveCategory
}) => {
  const [internalActiveCategory, setInternalActiveCategory] = useState<string>('');
  const [resources, setResources] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const featureFlags = useFeatureFlags();

  // Use external activeCategory if provided, otherwise use internal state
  const activeCategory = externalActiveCategory !== undefined ? externalActiveCategory : internalActiveCategory;
  const setActiveCategory = externalSetActiveCategory || setInternalActiveCategory;

  // Fetch resources from webhook
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);

        const webhookUrl = getWebhookUrl('resources');

        console.log('Webhook URL:', webhookUrl);
        console.log('Attempting to fetch from:', webhookUrl);

        const response = await n8nFetch(webhookUrl, 'GET');

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Server error response:', errorText);
          throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Response data received:', data);
        
        // Transform the data to match our LinkItem interface
        console.log('Raw webhook data:', data);
        if (Array.isArray(data) && data.length > 0) {
          console.log('First item structure:', data[0]);
          // Transform the webhook data to match our LinkItem interface
          const transformedResources: LinkItem[] = data.map((item: any, index: number) => {
            // Handle the property_image array - take the first image URL
            const imageUrl = Array.isArray(item.property_image) && item.property_image.length > 0 
              ? item.property_image[0] 
              : `/thumbnails/default.png`;
            
            // Handle the property_date object
            const dateString = item.property_date?.start || new Date().toISOString().slice(0, 7);
            
            // Handle tags - support multiple formats
            let tagsArray: string[] = [];
            if (item.property_tags) {
              if (typeof item.property_tags === 'string') {
                // Split by comma, semicolon, or pipe and clean up
                tagsArray = item.property_tags
                  .split(/[,;|]/)
                  .map((tag: string) => tag.trim().toLowerCase())
                  .filter((tag: string) => tag.length > 0);
              } else if (Array.isArray(item.property_tags)) {
                tagsArray = item.property_tags
                  .map((tag: any) => String(tag).trim().toLowerCase())
                  .filter((tag: string) => tag.length > 0);
              }
            }
            
            // Ensure we have at least one tag
            if (tagsArray.length === 0) {
              tagsArray = [item.property_category?.toLowerCase() || 'tools'];
            }

            return {
              id: item.id || `resource-${index}`,
              title: item.property_title || item.name || 'Untitled Resource',
              description: item.property_description || 'No description available',
              url: item.property_url || '#',
              image: imageUrl,
              category: item.property_category?.toLowerCase() || 'tools',
              tags: tagsArray,
              featured: item.featured || false,
              date: dateString
            };
          }).filter((resource: LinkItem) => resource.title && resource.url);

          // Sort by date (newest first)
          transformedResources.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setResources(transformedResources);
        }
              } catch (err: any) {
        console.error('Error fetching resources:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          cause: err.cause
        });
        
        if (err.name === 'TimeoutError') {
          setError('Request timed out. Please try again.');
        } else if (err.message.includes('Failed to fetch')) {
          // Check if it's likely a CORS issue
          const webhookUrl = getWebhookUrl('resources');
          if (window.location.protocol === 'https:' && webhookUrl?.startsWith('http:')) {
            setError('Mixed content error: Cannot make HTTP requests from HTTPS page.');
          } else {
            setError('Unable to connect to the server. This may be due to network restrictions or CORS policy. Please try again later or contact support.');
          }
        } else if (err.message.includes('NetworkError') || err.message.includes('network')) {
          setError('Network error. Please check your internet connection and try again.');
        } else if (err.message.includes('CORS')) {
          setError('Cross-origin request blocked. Please contact support to resolve this issue.');
        } else {
          setError(err.message || 'Something went wrong. Please try again later or contact support if the issue persists.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Generate and group categories from all tags in the resources
  const categoryGroups = useMemo(() => {
    const tagCounts = new Map<string, number>();
    
    console.log('Generating categories from resources:', resources.length);
    
    // Count occurrences of each tag and category
    resources.forEach(resource => {
      // Count the main category
      if (resource.category) {
        const existing = tagCounts.get(resource.category) || 0;
        tagCounts.set(resource.category, existing + 1);
      }
      
      // Count all tags
      resource.tags.forEach(tag => {
        const existing = tagCounts.get(tag) || 0;
        tagCounts.set(tag, existing + 1);
      });
    });
    
    console.log('Tag counts:', Array.from(tagCounts.entries()));
    
    // Convert to array and sort by count
    const allCategories = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        id: tag,
        name: tag,
        icon: getCategoryIcon(tag),
        count
      }))
      .sort((a, b) => b.count - a.count);
    
    // Group categories by theme - showing ALL categories
    const aiKeywords = ['ai', 'ml', 'machine-learning', 'automation', 'chatbot', 'nlp', 'computer-vision'];
    const graphicsKeywords = ['3d', 'graphics', 'rendering', 'animation', 'modeling', 'blender', 'unity', 'unreal'];
    const devKeywords = ['dev', 'code', 'api', 'framework', 'library', 'tools', 'github', 'deployment'];
    const designKeywords = ['design', 'ui', 'ux', 'art', 'creative', 'photoshop', 'figma', 'sketch'];
    const mediaKeywords = ['audio', 'video', 'music', 'sound', 'podcast', 'streaming', 'editing', 'media'];
    
    const allUsedKeywords = [...aiKeywords, ...graphicsKeywords, ...devKeywords, ...designKeywords, ...mediaKeywords];
    
    const groups = {
      'AI & Machine Learning': allCategories.filter(cat => 
        aiKeywords.includes(cat.id.toLowerCase())
      ),
      '3D & Graphics': allCategories.filter(cat => 
        graphicsKeywords.includes(cat.id.toLowerCase())
      ),
      'Development Tools': allCategories.filter(cat => 
        devKeywords.includes(cat.id.toLowerCase())
      ),
      'Design & Creative': allCategories.filter(cat => 
        designKeywords.includes(cat.id.toLowerCase())
      ),
      'Audio & Video': allCategories.filter(cat => 
        mediaKeywords.includes(cat.id.toLowerCase())
      ),
      'Other Categories': allCategories.filter(cat => 
        !allUsedKeywords.includes(cat.id.toLowerCase())
      )
    };
    
    // Categories are now managed internally
    
    return groups;
  }, [resources]);
  
  // Flatten categories for backward compatibility
  const categories = useMemo(() => {
    return Object.values(categoryGroups).flat();
  }, [categoryGroups]);
  
  const filteredLinks = useMemo(() => {
    const filtered = resources.filter(resource => {
      const matchesCategory = !activeCategory || 
        resource.category === activeCategory || 
        resource.tags.includes(activeCategory);
      
      return matchesCategory;
    });
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeCategory, resources]);

  // Organize resources into sections based on their categories/tags
  const resourceSections = useMemo(() => {
    const aiKeywords = ['ai', 'ml', 'machine-learning', 'automation', 'chatbot', 'nlp', 'computer-vision'];
    const graphicsKeywords = ['3d', 'graphics', 'rendering', 'animation', 'modeling', 'blender', 'unity', 'unreal'];
    const devKeywords = ['dev', 'code', 'api', 'framework', 'library', 'tools', 'github', 'deployment'];
    const designKeywords = ['design', 'ui', 'ux', 'art', 'creative', 'photoshop', 'figma', 'sketch'];
    const mediaKeywords = ['audio', 'video', 'music', 'sound', 'podcast', 'streaming', 'editing', 'media'];
    
    // Helper function to get section name for a category
    const getSectionForCategory = (category: string) => {
      const cat = category.toLowerCase();
      if (aiKeywords.includes(cat)) return 'AI & Machine Learning';
      if (graphicsKeywords.includes(cat)) return '3D & Graphics';
      if (devKeywords.includes(cat)) return 'Development Tools';
      if (designKeywords.includes(cat)) return 'Design & Creative';
      if (mediaKeywords.includes(cat)) return 'Audio & Video';
      return 'Other Categories';
    };

    // If filtering by specific category, determine which section it belongs to
    if (activeCategory) {
      const sectionName = getSectionForCategory(activeCategory);
      return { [sectionName]: filteredLinks };
    }
    
    const sections: { [key: string]: LinkItem[] } = {
      'AI & Machine Learning': [],
      '3D & Graphics': [],
      'Development Tools': [],
      'Design & Creative': [],
      'Audio & Video': [],
      'Other Categories': []
    };

    filteredLinks.forEach(resource => {
      let placed = false;
      
      // Check AI & ML
      if (!placed && (aiKeywords.includes(resource.category?.toLowerCase()) || 
          resource.tags.some(tag => aiKeywords.includes(tag.toLowerCase())))) {
        sections['AI & Machine Learning'].push(resource);
        placed = true;
      }
      
      // Check 3D & Graphics
      if (!placed && (graphicsKeywords.includes(resource.category?.toLowerCase()) || 
          resource.tags.some(tag => graphicsKeywords.includes(tag.toLowerCase())))) {
        sections['3D & Graphics'].push(resource);
        placed = true;
      }
      
      // Check Development
      if (!placed && (devKeywords.includes(resource.category?.toLowerCase()) || 
          resource.tags.some(tag => devKeywords.includes(tag.toLowerCase())))) {
        sections['Development Tools'].push(resource);
        placed = true;
      }
      
      // Check Design
      if (!placed && (designKeywords.includes(resource.category?.toLowerCase()) || 
          resource.tags.some(tag => designKeywords.includes(tag.toLowerCase())))) {
        sections['Design & Creative'].push(resource);
        placed = true;
      }
      
      // Check Media
      if (!placed && (mediaKeywords.includes(resource.category?.toLowerCase()) || 
          resource.tags.some(tag => mediaKeywords.includes(tag.toLowerCase())))) {
        sections['Audio & Video'].push(resource);
        placed = true;
      }
      
      // If not placed in any specific section, add to Other
      if (!placed) {
        sections['Other Categories'].push(resource);
      }
    });

    // Remove empty sections
    Object.keys(sections).forEach(key => {
      if (sections[key].length === 0) {
        delete sections[key];
      }
    });

    return sections;
  }, [filteredLinks, activeCategory]);

  // Organize filtered links into columns with better distribution
  const organizedColumns = useMemo(() => {
    // Responsive column count
    const getColumnCount = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1280) return 4; // xl
        if (window.innerWidth >= 1024) return 3; // lg  
        if (window.innerWidth >= 768) return 2;  // md
        return 1; // sm
      }
      return 4; // default for SSR
    };
    
    const numColumns = getColumnCount();
    const columns: LinkItem[][] = Array.from({ length: numColumns }, () => []);
    
    // Distribute items more evenly by considering content length
    filteredLinks.forEach((link, index) => {
      // Use round-robin distribution for more even columns
      const columnIndex = index % numColumns;
      columns[columnIndex].push(link);
    });
    
    return columns;
  }, [filteredLinks]);

  // Force re-render of grid when filtered content changes
  const [gridKey, setGridKey] = useState(0);
  
  useEffect(() => {
    setGridKey(prev => prev + 1);
    // Add a small delay to ensure smooth transitions
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, [filteredLinks.length, activeCategory]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-6" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-pink-500/20 rounded-full mx-auto animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-white font-primary mb-2">Loading Resources</h3>
          <p className="text-zinc-400 font-secondary">Fetching the latest tools and resources...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-2xl font-semibold font-primary text-white mb-3">Unable to Load Resources</h3>
          <p className="text-zinc-400 font-secondary mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-zinc-900/80 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-300 hover:bg-zinc-800/80 hover:scale-105 font-secondary font-medium border border-zinc-700/50 hover:border-zinc-600/50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();

  return (
    <div className="resources-root relative w-full overflow-y-auto overflow-x-hidden bg-black">
      {/* Hero Section - Matching Playground Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0">
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              Curated Collection
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Resources</span>
            <span className="block text-zinc-500">& Tools</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            Discover cutting-edge tools, platforms, and resources handpicked by creative technologists. Stay ahead in AI, AR, interactive media, and emerging technologies.
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
              <span className="block text-3xl font-primary font-medium">{resources.length}</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Resources</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">{categories.length}</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Categories</span>
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

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Resources • Tools • 2025
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative • Technology • Collective
        </span>
      </div>

      {/* Resources Section */}
      <section className="relative bg-black py-12">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
          {/* Mobile Categories Filter - moved to top on mobile */}
          <div className="md:hidden mb-8 mt-2">
            <h3 className="text-lg font-semibold text-white font-primary mb-4">Filter by Category</h3>
            <div className="flex gap-2.5 mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4 whitespace-nowrap">
              <button
                onClick={() => setActiveCategory('')}
                className={`px-4 py-2.5 rounded-xl text-sm transition-all duration-300 font-medium font-secondary flex-shrink-0 border ${
                  !activeCategory 
                    ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-lg shadow-pink-500/20' 
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-700/50 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-600/50'
                }`}
              >
                All Resources
              </button>
              {categories.slice(0, 12).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 font-medium font-secondary flex-shrink-0 border ${
                    activeCategory === category.id 
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-lg shadow-pink-500/20' 
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-700/50 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-600/50'
                  }`}
                >
                  <span className="text-sm">{category.icon}</span>
                  <span className="capitalize">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

      {/* Category Sections - All Tags Separated by Borders */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-white font-primary flex-shrink-0">Browse Resources</h2>
          <span className="text-sm text-zinc-500 font-secondary">Curated tools and resources from our community</span>
        </div>
        

        {/* Category Groups with Embedded Resource Cards */}
        <div className="space-y-8">
          {Object.entries(categoryGroups).map(([groupName, groupCategories]) => {
            if (groupCategories.length === 0) return null;
            
            // Get resources for this section
            let sectionResources = resourceSections[groupName] || [];
            
            // When not filtering, make sure we show all resources that belong to this section
            if (!activeCategory) {
              const aiKeywords = ['ai', 'ml', 'machine-learning', 'automation', 'chatbot', 'nlp', 'computer-vision'];
              const graphicsKeywords = ['3d', 'graphics', 'rendering', 'animation', 'modeling', 'blender', 'unity', 'unreal'];
              const devKeywords = ['dev', 'code', 'api', 'framework', 'library', 'tools', 'github', 'deployment'];
              const designKeywords = ['design', 'ui', 'ux', 'art', 'creative', 'photoshop', 'figma', 'sketch'];
              const mediaKeywords = ['audio', 'video', 'music', 'sound', 'podcast', 'streaming', 'editing', 'media'];
              
              // Get all resources that should belong to this section
              sectionResources = resources.filter(resource => {
                if (groupName === 'AI & Machine Learning') {
                  return aiKeywords.some(keyword => 
                    resource.category?.toLowerCase().includes(keyword) || 
                    resource.tags.some(tag => tag.toLowerCase().includes(keyword))
                  );
                }
                if (groupName === '3D & Graphics') {
                  return graphicsKeywords.some(keyword => 
                    resource.category?.toLowerCase().includes(keyword) || 
                    resource.tags.some(tag => tag.toLowerCase().includes(keyword))
                  );
                }
                if (groupName === 'Development Tools') {
                  return devKeywords.some(keyword => 
                    resource.category?.toLowerCase().includes(keyword) || 
                    resource.tags.some(tag => tag.toLowerCase().includes(keyword))
                  );
                }
                if (groupName === 'Design & Creative') {
                  return designKeywords.some(keyword => 
                    resource.category?.toLowerCase().includes(keyword) || 
                    resource.tags.some(tag => tag.toLowerCase().includes(keyword))
                  );
                }
                if (groupName === 'Audio & Video') {
                  return mediaKeywords.some(keyword => 
                    resource.category?.toLowerCase().includes(keyword) || 
                    resource.tags.some(tag => tag.toLowerCase().includes(keyword))
                  );
                }
                if (groupName === 'Other Categories') {
                  const allUsedKeywords = [...aiKeywords, ...graphicsKeywords, ...devKeywords, ...designKeywords, ...mediaKeywords];
                  return !allUsedKeywords.some(keyword => 
                    resource.category?.toLowerCase().includes(keyword) || 
                    resource.tags.some(tag => tag.toLowerCase().includes(keyword))
                  );
                }
                return false;
              });
            }
            
            // If filtering by category and this section has no resources, hide it completely
            if (activeCategory && sectionResources.length === 0) return null;
            
            // If no resources in this section at all, hide it
            if (sectionResources.length === 0) return null;
            
            return (
              <div key={groupName} className={`resources-section p-4 md:p-6 rounded-xl border backdrop-blur-sm ${
                activeCategory ? 'bg-pink-500/10 border-pink-500/30' : 'bg-zinc-900/20 border-zinc-800/50'
              }`}>
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-semibold text-white font-primary">
                      {groupName}
                      {activeCategory && (
                        <span className="ml-2 text-sm text-pink-400 font-secondary">
                          (filtered by: {activeCategory})
                        </span>
                      )}
                    </h4>
                    <span className="hidden sm:inline text-xs text-zinc-500 font-secondary">
                      {groupCategories.length} categories
                    </span>
                    {sectionResources.length > 0 && (
                      <span className="hidden sm:inline-block px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-secondary">
                        {sectionResources.length} resources
                      </span>
                    )}
                  </div>
                  
                  {/* Clear filter button when filtering */}
                  {activeCategory && (
                    <button
                      onClick={() => setActiveCategory('')}
                      className="text-xs text-zinc-400 hover:text-white transition-colors font-secondary px-2 py-1 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                
                {/* Category Filter Tags */}
                <div className="resources-tags flex gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-2 px-2 md:flex-wrap md:overflow-visible">
                  {groupCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 font-medium font-secondary flex-shrink-0 border whitespace-nowrap ${
                        activeCategory === category.id 
                          ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-lg shadow-pink-500/20' 
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-700/50 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-600/50'
                      }`}
                    >
                      <span className="text-sm">{category.icon}</span>
                      <span className="capitalize">{category.name}</span>
                      <span className="text-xs opacity-60">({category.count})</span>
                    </button>
                  ))}
                </div>

                {/* Resource Cards for This Section - Always Show */}
                <div className="space-y-4">
                  {/* Horizontal Scrolling Cards for All Screen Sizes */}
                  <div className="relative">
                    {/* Scroll hint for desktop */}
                    <div className="hidden md:flex justify-between items-center mb-3">
                      <span className="text-xs text-zinc-500 font-secondary">
                        {sectionResources.length} {sectionResources.length === 1 ? 'resource' : 'resources'}
                        {sectionResources.length > 1 && ' • Scroll horizontally →'}
                      </span>
                    </div>
                    
                    <div className={`resources-card-rail flex gap-3 pb-4 scrollbar-hide snap-x snap-mandatory ${
                      sectionResources.length > 1 ? 'overflow-x-auto' : 'justify-start'
                    }`}>
                      {sectionResources.map((link) => {
                        const isHighlighted = link.featured === false;
                        
                        return (
                          <div key={link.id} className="resources-card flex-shrink-0 w-56 sm:w-64 snap-start">
                            <LinkCard 
                              link={link} 
                              isHighlighted={isHighlighted}
                              highlightConfig={featureFlags.highlightedResource}
                              compact={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Scroll indicators - only show if multiple items */}
                    {sectionResources.length > 1 && (
                      <>
                        <div className="hidden md:block absolute top-1/2 left-0 w-8 h-32 bg-gradient-to-r from-zinc-900/50 to-transparent pointer-events-none"></div>
                        <div className="hidden md:block absolute top-1/2 right-0 w-8 h-32 bg-gradient-to-l from-zinc-900/50 to-transparent pointer-events-none"></div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Resources content is now handled above */}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Categories Filter moved to top */}

      {/* Header */}
      <div className="mb-8">
        {/* Active Category Display */}
        {activeCategory && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50">
            <Tag className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-semibold text-white font-primary capitalize">
              Showing: {categories.find(c => c.id === activeCategory)?.name}
            </h2>
            <button
              onClick={() => setActiveCategory('')}
              className="ml-auto text-zinc-400 hover:text-white transition-colors text-sm font-secondary"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

        </div>
      </section>

      {/* Empty State */}
      {resources.length === 0 && !loading && (
        <section className="text-center py-20 bg-black">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Tag className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-xl font-semibold text-white font-primary mb-3">
            No Resources Available
          </h3>
          <p className="text-zinc-400 font-secondary mb-6 max-w-md mx-auto">
            Check back soon for new tools and resources from the collective.
          </p>
        </section>
      )}

      {/* Email Signup Section */}
      <section className="relative bg-black py-20 border-t border-zinc-800/30">
        <div className="w-full max-w-4xl md:mx-auto px-4 md:px-8 text-left md:text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-primary text-white mb-6 leading-tight">
            Want the Latest Innovation Insights in Your Inbox?
          </h2>
          <div className="text-zinc-400 text-base md:text-lg font-secondary mb-12 max-w-none md:max-w-2xl md:mx-auto">
            Get curated updates on cutting-edge tools, emerging technologies, and innovation trends delivered directly to you. Stay ahead of the curve with handpicked resources from creative technologists.
          </div>
          <EmailSignup hideIntro={true} />
        </div>
      </section>
      
      <Footer />
      <FeatureFlagAdmin />
    </div>
  );
};

export default ResourcesPage;