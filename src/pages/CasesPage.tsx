import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Tag, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getWebhookUrl } from '@/utils/webhookUtils';

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  client?: string;
  category?: string;
  tags?: string[];
  date: string;
  images: string[];
  url?: string;
  visible?: boolean;
}

interface ImageCarouselProps {
  images: string[];
  title: string;
  caseId: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title, caseId }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <div className="relative group overflow-hidden bg-zinc-900" 
         style={{ 
           height: 'calc((100vw * 3) / 4)',
           maxHeight: '85vh',
           width: '100%'
         }}>
      
      {/* Main Image */}
      <div className="relative w-full h-full overflow-hidden">
        <img 
          src={images[currentImageIndex]} 
          alt={`${title} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/800x600/1f2937/9ca3af?text=${encodeURIComponent(title)}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={prevImage}
            className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/75 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/75 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Dots Indicator - left aligned and always visible if more than 1 image */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-4 flex space-x-2 transition-opacity duration-300">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter - only show if more than 1 image */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm font-secondary">
          {currentImageIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

const CasesPage: React.FC = () => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cases from webhook
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get credentials from environment variables
        const webhookUrl = getWebhookUrl('cases');
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
          throw new Error(`Failed to fetch cases: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('Raw webhook data:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('First item structure:', data[0]);
          
          // Transform the webhook data to match our CaseStudy interface
          const transformedCases: CaseStudy[] = data
            .map((item: any, index: number) => {
              console.log(`Processing item ${index}:`, item);
              
              // Check visibility first - only process visible items
              const isVisible = item.property_visible === true || item.property_visible === 'true' || item.property_visible === 'Yes' || item.property_visible === undefined || item.property_visible === null;
              if (!isVisible) {
                console.log(`Skipping item ${index} - not visible:`, item.property_visible);
                return null;
              }

              // Collect all image URLs from image1 to image5
              const images: string[] = [];
              for (let i = 1; i <= 5; i++) {
                const imageField = item[`property_image${i}`];
                if (imageField && Array.isArray(imageField) && imageField.length > 0) {
                  // Take the first URL from the array
                  const imageUrl = imageField[0];
                  if (typeof imageUrl === 'string' && imageUrl.trim()) {
                    images.push(imageUrl.trim());
                  }
                }
              }

              console.log(`Item ${index} images:`, images);

              // Handle the date field
              let dateString = '';
              if (item.property_date) {
                if (typeof item.property_date === 'string') {
                  dateString = item.property_date;
                } else if (item.property_date.start) {
                  dateString = item.property_date.start;
                } else {
                  dateString = new Date().toISOString().slice(0, 7);
                }
              } else {
                dateString = new Date().toISOString().slice(0, 7);
              }

              // Get title and description
              const title = item.property_title || item.name || 'Untitled Case Study';
              const description = item.property_description || 'No description available';

              console.log(`Item ${index} - Title: "${title}", Description length: ${description.length}, Images: ${images.length}`);

              // Get client from webhook data
              const client = item.property_client && typeof item.property_client === 'string' && item.property_client.trim() 
                ? item.property_client.trim() 
                : undefined;

              // Get tags from webhook data
              let tags: string[] = [];
              if (item.property_tags) {
                if (typeof item.property_tags === 'string') {
                  // Split by comma, semicolon, or pipe and clean up
                  tags = item.property_tags
                    .split(/[,;|]/)
                    .map((tag: string) => tag.trim())
                    .filter((tag: string) => tag.length > 0);
                } else if (Array.isArray(item.property_tags)) {
                  tags = item.property_tags
                    .map((tag: any) => String(tag).trim())
                    .filter((tag: string) => tag.length > 0);
                }
              }

              // Get category from webhook data or use default
              const category = item.property_category && typeof item.property_category === 'string' && item.property_category.trim()
                ? item.property_category.trim()
                : 'Creative Technology';

              const transformedCase = {
                id: item.id || `case-${index}`,
                title: title,
                description: description,
                client: client || undefined,
                category: category,
                tags: tags.length > 0 ? tags : undefined,
                date: dateString,
                images: images,
                url: item.property_url && typeof item.property_url === 'string' && item.property_url.trim() ? item.property_url.trim() : undefined,
                visible: isVisible
              };

              console.log(`Transformed case ${index}:`, transformedCase);
              return transformedCase;
            })
            .filter((caseStudy: CaseStudy | null): caseStudy is CaseStudy => {
              if (!caseStudy) return false;
              
              // More lenient filtering - only require title, allow cases without images for now
              const hasTitle = caseStudy.title && caseStudy.title.trim() !== '' && caseStudy.title !== 'Untitled Case Study';
              
              console.log(`Filtering case "${caseStudy.title}": hasTitle=${hasTitle}, images=${caseStudy.images.length}, visible=${caseStudy.visible}`);
              
              return hasTitle;
            });

          console.log(`Final transformed cases count: ${transformedCases.length}`);

          // Sort by date (newest first)
          transformedCases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setCaseStudies(transformedCases);
        } else {
          console.log('No data received or data is not an array:', data);
          setCaseStudies([]);
        }
      } catch (err: any) {
        console.error('Error fetching cases:', err);
        
        if (err.name === 'TimeoutError') {
          setError('Request timed out. Please try again.');
        } else if (err.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please check your connection.');
        } else {
          setError(err.message || 'Failed to load case studies. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white py-8 md:py-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium font-secondary">Loading collaborations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white py-8 md:py-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <ExternalLink className="w-8 h-8 mx-auto mb-2" />
          </div>
          <h3 className="text-xl font-primary text-white mb-2">Unable to Load Collaborations</h3>
          <p className="text-zinc-400 font-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="relative overflow-hidden bg-zinc-900 text-white px-6 py-2 rounded-lg transition-all duration-200 group font-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-40 group-hover:opacity-80 blur transition-opacity duration-500" />
            <span className="relative">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // No cases state
  if (caseStudies.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white py-8 md:py-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 font-medium font-secondary">No collaborations available at the moment.</p>
          <p className="text-zinc-500 font-secondary text-sm mt-2">Check back soon for new collaborations!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative w-full">
      {/* Case Studies */}
      <div className="space-y-0">
        {caseStudies.map((caseStudy, index) => (
          <div key={caseStudy.id}>
            {/* Full viewport width dividing line above each case (except first) */}
            {index > 0 && (
              <div 
                className="h-px bg-white/20"
                style={{
                  position: 'relative',
                  left: '50%',
                  right: '50%',
                  marginLeft: '-50vw',
                  marginRight: '-50vw',
                  width: '100vw'
                }}
              />
            )}
            
            {/* Full width row with proper columns */}
            <div 
              className="w-full flex flex-col lg:flex-row"
              style={{
                position: 'relative',
                left: '50%',
                right: '50%',
                marginLeft: '-50vw',
                marginRight: '-50vw',
                width: '100vw'
              }}
            >
              {/* Text Content - 1/3 width with padding on desktop, full width on mobile */}
              <div className="w-full lg:w-1/3 flex items-center" style={{ padding: '4vw' }}>
                <div className="w-full space-y-4">
                  {/* Title */}
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-primary text-white leading-tight">
                    {caseStudy.title}
                  </h2>

                  {/* Client and Date */}
                  <div className="flex flex-wrap items-center gap-3">
                    {caseStudy.client && (
                      <div className="text-pink-400 font-secondary text-sm uppercase tracking-wider font-medium">
                        {caseStudy.client}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-zinc-400 font-secondary text-sm">
                      <Calendar className="w-4 h-4" />
                      {caseStudy.date}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-zinc-300 text-xs md:text-sm leading-relaxed font-secondary">
                    {caseStudy.description.split('\n').map((line, index) => {
                      // Process line to make text between <> bold
                      const processedLine = line.replace(/<([^>]+)>/g, '<strong>$1</strong>');
                      
                      return (
                      <React.Fragment key={index}>
                        <span dangerouslySetInnerHTML={{ __html: processedLine }} />
                        {index < caseStudy.description.split('\n').length - 1 && <br />}
                      </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Tags */}
                  {caseStudy.tags && caseStudy.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {caseStudy.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium font-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* URL Link */}
                  {caseStudy.url && (
                    <div className="pt-2">
                      <a
                        href={caseStudy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors font-secondary text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Project
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Image - 2/3 width on desktop, full width on mobile, no padding so it touches the lines */}
              <div className="w-full lg:w-2/3">
                {caseStudy.images.length > 0 ? (
                  <ImageCarousel 
                    images={caseStudy.images} 
                    title={caseStudy.title}
                    caseId={caseStudy.id}
                  />
                ) : (
                  <div className="relative overflow-hidden bg-zinc-900 flex items-center justify-center" 
                       style={{ 
                         height: 'calc((100vw * 3) / 4)',
                         maxHeight: '85vh',
                         width: '100%'
                       }}>
                    <div className="text-zinc-500 font-secondary">No images available</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Final dividing line */}
        <div 
          className="h-px bg-white/20"
          style={{
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            width: '100vw'
          }}
        />
      </div>
    </div>
  );
};

export default CasesPage;