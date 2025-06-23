import React, { useState, useMemo, useEffect } from 'react';
import { Search, Star, ExternalLink, Tag, Loader2 } from 'lucide-react';
import Footer from '../components/ui/footer';
import { getWebhookUrl } from '@/utils/webhookUtils';

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
}

function LinkCard({ link, featured = false, columnIndex }: LinkCardProps) {
  return (
    <div 
      className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:transform hover:scale-[1.02] mb-4 md:mb-6"
      style={{ 
        breakInside: 'avoid',
        pageBreakInside: 'avoid'
      }}
    >
      <div className="h-40 md:h-48 bg-zinc-800 overflow-hidden">
        <img 
          src={link.image} 
          alt={link.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/400x300/1f2937/9ca3af?text=${encodeURIComponent(link.title)}`;
          }}
        />
      </div>
      
      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm md:text-base text-white group-hover:text-pink-400 transition-colors font-primary">
            {link.title}
          </h3>
          {featured && (
            <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )}
        </div>
        
        <div className="text-xs text-zinc-500 mb-2 font-secondary">
          {link.date}
        </div>
        
        <p className="text-xs md:text-sm text-zinc-400 mb-3 md:mb-4 leading-relaxed font-normal font-secondary">
          {link.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {link.tags.slice(0, 2).map((tag) => (
              <span 
                key={tag}
                className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md font-medium font-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <button
            onClick={() => window.open(link.url, '_blank')}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResourcesPageProps {
  activeCategory?: string;
  setActiveCategory?: (category: string) => void;
  setCategories?: (categories: Category[]) => void;
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ 
  activeCategory: externalActiveCategory,
  setActiveCategory: externalSetActiveCategory,
  setCategories 
}) => {
  const [internalActiveCategory, setInternalActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use external activeCategory if provided, otherwise use internal state
  const activeCategory = externalActiveCategory !== undefined ? externalActiveCategory : internalActiveCategory;
  const setActiveCategory = externalSetActiveCategory || setInternalActiveCategory;

  // Fetch resources from webhook
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get credentials from environment variables
        const webhookUrl = getWebhookUrl('resources');
        const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
        const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;

        if (!username || !password) {
          throw new Error('Authentication credentials not configured');
        }

        // Create Basic Auth header
        const basicAuth = btoa(`${username}:${password}`);

        const response = await fetch(webhookUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
          },
          // Add timeout
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
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
        console.error('Error fetching resources:', err);
        
        if (err.name === 'TimeoutError') {
          setError('Request timed out. Please try again.');
        } else if (err.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please check your connection.');
        } else {
          setError(err.message || 'Failed to load resources. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Generate categories dynamically from all tags in the resources
  const categories: Category[] = useMemo(() => {
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
    
    // Convert to array and sort by count (most used first)
    const generatedCategories = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        id: tag,
        name: tag,
        icon: getCategoryIcon(tag),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Limit to top 50 tags to avoid overwhelming the UI
    
    // Update the parent component's categories
    if (setCategories) {
      setCategories(generatedCategories);
    }
    
    return generatedCategories;
  }, [resources]);
  
  const filteredLinks = useMemo(() => {
    const filtered = resources.filter(resource => {
      const matchesCategory = !activeCategory || 
        resource.category === activeCategory || 
        resource.tags.includes(activeCategory);
      const matchesSearch = !searchQuery || 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeCategory, searchQuery, resources]);

  // Organize filtered links into columns sequentially
  const organizedColumns = useMemo(() => {
    const numColumns = 4; // lg:columns-4
    const columns: LinkItem[][] = Array.from({ length: numColumns }, () => []);
    
    // Distribute items sequentially across columns
    filteredLinks.forEach((link, index) => {
      const columnIndex = index % numColumns;
      columns[columnIndex].push(link);
    });
    
    return columns;
  }, [filteredLinks]);

  // Force re-render of masonry grid when filtered content changes
  const [gridKey, setGridKey] = useState(0);
  
  useEffect(() => {
    setGridKey(prev => prev + 1);
  }, [filteredLinks.length, activeCategory, organizedColumns]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium font-secondary">Loading resources...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <ExternalLink className="w-8 h-8 mx-auto mb-2" />
          </div>
          <h3 className="text-xl font-primary text-white mb-2">Unable to Load Resources</h3>
          <p className="text-zinc-400 font-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="relative overflow-hidden bg-zinc-900 text-white px-6 py-2 rounded-lg transition-all duration-200 group font-primary"
          >
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Categories Filter - only show when nav is hidden */}
      <div className="md:hidden mb-6 mt-4">
        <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium font-primary flex-shrink-0 ${
              !activeCategory 
                ? 'bg-zinc-800 text-white' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            all
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 font-medium font-primary flex-shrink-0 ${
                activeCategory === category.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-xs">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search all resources"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500 transition-colors font-medium font-secondary text-sm md:text-base"
          />
        </div>

        {activeCategory && (
          <div className="flex items-center gap-2 mb-6">
            <Tag className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xl md:text-2xl font-primary">
              {categories.find(c => c.id === activeCategory)?.name}
            </h2>
          </div>
        )}
      </div>

      {/* Resources Grid */}
      <div key={gridKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {organizedColumns.map((column, columnIndex) => (
          <div key={`column-${columnIndex}`} className="flex flex-col">
            {column.map((link) => (
              <LinkCard 
                key={link.id} 
                link={link} 
                columnIndex={columnIndex}
              />
            ))}
          </div>
        ))}
      </div>

      {filteredLinks.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-zinc-400 font-medium font-secondary">
            {resources.length === 0 
              ? 'No resources available at the moment.' 
              : 'No resources found matching your criteria.'
            }
          </p>
        </div>
      )}
      
      <Footer />
    </>
  );
};

export default ResourcesPage;