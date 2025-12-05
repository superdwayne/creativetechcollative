import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import ImageCube from '../components/ImageCube';
import EmailSignup from '../components/EmailSignup';
import Footer from '../components/ui/footer';
import { getWebhookUrl } from '@/utils/webhookUtils';

interface Member {
  name: string;
  image: string;
  role?: string;
  bio?: string;
}

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
}

// Image Carousel Component for Case Studies
const ImageCarousel: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  return (
    <div className="relative group overflow-hidden bg-zinc-900 aspect-[4/3]">
      <img 
        src={images[currentImageIndex]} 
        alt={`${title} - Image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `https://via.placeholder.com/800x600/1f2937/9ca3af?text=${encodeURIComponent(title)}`;
        }}
      />
      {images.length > 1 && (
        <>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={prevImage} className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/75 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextImage} className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/75 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute bottom-3 left-3 flex space-x-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Static collaborations data
const staticCollaborations: CaseStudy[] = [
  {
    id: 'tbwa-neboko',
    title: 'Innovation Revolution NebokoLabs',
    description: 'We had in-depth discussions about the future of Creative Technology and its evolving role within the creative industry—particularly as we navigate the impact of AI.\n\n💡 Creative Technology Is Central to What\'s Next\nAs innovation accelerates, creative technology is becoming a vital part of the creative process—shaping not only how ideas are formed but how experiences are brought to life.\n\n💡 The Field Is Broad, and Needs Clarity\nCreative technology includes a wide range of roles and specializations. Defining these more clearly can help the field mature and improve how we work together across disciplines.',
    client: 'TBWA\\NEBOKO',
    category: 'Event',
    tags: ['Innovation', 'AI', 'Creative Technology'],
    date: '2025-02-13',
    images: [
      '/collaborations/tbwa/tbwa-1.jpeg',
      '/collaborations/tbwa/tbwa-2.jpeg',
      '/collaborations/tbwa/tbwa-3.jpeg',
      '/collaborations/tbwa/tbwa-4.jpeg',
      '/collaborations/tbwa/tbwa-5.jpeg'
    ],
    url: undefined
  },
  {
    id: 'solaya-snap',
    title: 'SOLAYA Snap Lens',
    description: 'Together with Solaya, we\'re proud to unveil a groundbreaking virtual try-on solution that redefines the future of e-commerce. Leveraging cutting-edge Gaussian splatting technology, our collaborative innovation brings products to life with unprecedented realism, transforming the way consumers interact with your brand.',
    client: 'SOLAYA',
    category: 'AR/VR',
    tags: ['Snap', 'Innovation', 'Gaussian Splatting'],
    date: '2025-01-11',
    images: ['/collaborations/solaya/solaya-1.png'],
    url: undefined
  },
  {
    id: 'beyond-studio-ar',
    title: 'Future of AR: Beyond Studio',
    description: 'Together with Beyond Studio, we held an evening of discussion around the Future of AR. As a Creative Technology Collective we share our predictions on the AR landscape and provided tips and advice on how you can future proof yourself in the world of AR.',
    client: 'Beyond Studio',
    category: 'Presentation',
    tags: ['AR', 'Future', 'Presentation'],
    date: '2024-06-14',
    images: [
      '/collaborations/beyond-studio/beyond-1.jpg',
      '/collaborations/beyond-studio/beyond-2.jpg',
      '/collaborations/beyond-studio/beyond-3.png'
    ],
    url: undefined
  }
];

const HeroPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(staticCollaborations);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  // Fetch case studies from webhook
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setCasesLoading(true);
        const webhookUrl = getWebhookUrl('cases');
        const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
        const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;

        if (!username || !password) {
          setCasesLoading(false);
          return;
        }

        const basicAuth = btoa(`${username}:${password}`);
        const response = await fetch(webhookUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          setCasesLoading(false);
          return;
        }

        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('HeroPage - Raw webhook data:', data);
          console.log('HeroPage - First item:', data[0]);
          
          const transformedCases: CaseStudy[] = data
            .map((item: any, index: number) => {
              const isVisible = item.property_visible === true || item.property_visible === 'true' || item.property_visible === 'Yes' || item.property_visible === undefined || item.property_visible === null;
              if (!isVisible) return null;

              // Collect all image URLs from image1 to image5
              const images: string[] = [];
              for (let i = 1; i <= 5; i++) {
                const imageField = item[`property_image${i}`];
                console.log(`HeroPage - Item ${index} property_image${i}:`, imageField);
                
                if (imageField) {
                  // Handle array format (from Notion files)
                  if (Array.isArray(imageField) && imageField.length > 0) {
                    const imageUrl = imageField[0];
                    if (typeof imageUrl === 'string' && imageUrl.trim()) {
                      images.push(imageUrl.trim());
                    }
                  }
                  // Handle direct string URL
                  else if (typeof imageField === 'string' && imageField.trim()) {
                    images.push(imageField.trim());
                  }
                  // Handle object with url property
                  else if (typeof imageField === 'object' && imageField.url) {
                    images.push(imageField.url);
                  }
                }
              }
              
              console.log(`HeroPage - Item ${index} collected images:`, images);

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

              const title = item.property_title || item.name || 'Untitled Case Study';
              const description = item.property_description || 'No description available';
              const client = item.property_client && typeof item.property_client === 'string' && item.property_client.trim() ? item.property_client.trim() : undefined;
              
              let tags: string[] = [];
              if (item.property_tags) {
                if (typeof item.property_tags === 'string') {
                  tags = item.property_tags.split(/[,;|]/).map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
                } else if (Array.isArray(item.property_tags)) {
                  tags = item.property_tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0);
                }
              }

              const category = item.property_category && typeof item.property_category === 'string' && item.property_category.trim() ? item.property_category.trim() : 'Creative Technology';

              return {
                id: item.id || `case-${index}`,
                title,
                description,
                client,
                category,
                tags: tags.length > 0 ? tags : undefined,
                date: dateString,
                images,
                url: item.property_url && typeof item.property_url === 'string' && item.property_url.trim() ? item.property_url.trim() : undefined
              };
            })
            .filter((caseStudy: CaseStudy | null): caseStudy is CaseStudy => {
              if (!caseStudy) return false;
              const hasTitle = caseStudy.title && caseStudy.title.trim() !== '' && caseStudy.title !== 'Untitled Case Study';
              return hasTitle;
            });

          // Merge webhook data with static data, sort by date
          const allCases = [...transformedCases, ...staticCollaborations];
          allCases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setCaseStudies(allCases);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
      } finally {
        setCasesLoading(false);
      }
    };

    fetchCases();
  }, []);

  const members: Member[] = [
    { name: 'Dwayne', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0cc5d6-ffad-6620-98ef-eaff95ce3d9d/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Lead Creative Technologist', bio: 'Passionate about bridging the gap between creativity and technology. Specializes in interactive experiences and emerging tech.' },
    { name: 'Adina', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0844-6761-6690-972f-7328f1f796b2/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Expert in digital experiences and interactive installations. Loves pushing the boundaries of what\'s possible.' },
    { name: 'Deniz', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0842-6982-6110-a569-25e91729e045/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Focused on AI and machine learning applications in creative contexts.' },
    { name: 'Florido', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0851-85de-65c0-b989-86760e8ff604/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Specializes in immersive experiences and spatial computing.' },
    { name: 'Karoline', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0cc5f0-c164-61b0-b158-fd3192a0b178/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Brings creativity and innovation to digital experiences.' },
    { name: 'Pax', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0cc978-88a5-6320-924a-e78626bf0fa7/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Passionate about pushing creative boundaries through technology.' },
    { name: 'Joshua', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0846-659b-6160-a7f3-9ebe7914d494/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Innovating at the intersection of creativity and technology.' },
    { name: 'Jennifer', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0847-3695-69f0-bc11-ee26cb3ec314/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Passionate about creating impactful digital experiences.' },
    { name: 'Koen', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d084a-6fb8-6f90-b541-ce33d6476d8f/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Expert in emerging technologies and creative solutions.' },
    { name: 'John', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0861-a190-6dd0-9325-6f2380bd7a6b/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Bringing creative vision to life through technology.' },
    { name: 'Martin', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0862-1d8b-6250-917a-d52f548bd1d6/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Focused on innovative digital solutions and experiences.' },
    { name: 'Rui', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0862-7e80-6ec0-b1e7-fc362c7ab00a/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Passionate about creative coding and interactive design.' },
    { name: 'Olivia', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0863-5e28-6c80-95e4-c59212235f6b/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Specializes in user experience and creative storytelling.' },
    { name: 'Edwin', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0868-b294-6c60-945a-f3b9e8457fbc/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Expert in real-time graphics and immersive media.' },
    { name: 'Rohit', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0869-165d-6350-9de3-5837c81f848c/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Innovating at the intersection of art and technology.' },
    { name: 'Scy', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0869-8b32-6e00-8f79-79dffa4149bd/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Pushing boundaries in creative technology and design.' },
    { name: 'Tom', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0869-f72c-67a0-8c84-8bb2da4e14f2/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Dedicated to crafting memorable digital experiences.' },
    { name: 'Fernando', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0873-b3b2-66a0-a4e8-554462dbf234/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Passionate about innovative digital experiences.' },
    { name: 'Christos', image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0874-2828-6de0-8cf9-86dd7b3665ce/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg', role: 'Creative Technologist', bio: 'Expert in creative technology and digital innovation.' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0">
          {/* Small Label */}
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
              Creative Technology Collective
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Your extended</span>
            <span className="block text-zinc-500">innovation team</span>
          </h1>

          {/* Description */}
          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            A community for pioneers at the intersection of creativity and technology. We experiment, prototype, and build new ways to engage audiences through emerging tech.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/playground')}
              className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
            >
              Our Playground
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('partners');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-8 py-4 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 hover:bg-white/5 transition-all"
            >
              View Partners
            </button>
          </div>

          {/* Bottom Stats/Info */}
          <div className="flex gap-12 mt-20 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">24</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Members</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">∞</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Possibilities</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">24/7</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Community</span>
            </div>
          </div>
        </div>

        {/* Right Side - Cube */}
        <div className="flex-1 relative flex items-center justify-center min-h-[50vh] lg:min-h-screen">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-black" />
          
          {/* Cube Container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <ImageCube 
              size={5.5} 
              rotationSpeed={0.008} 
              position={{ x: 0, y: 0, z: 0 }} 
              forceVisible={true} 
            />
          </div>

          {/* Decorative Elements */}
          
        </div>
      </div>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Amsterdam • London • 2024
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative • Technology • Collective
        </span>
      </div>

      {/* Mission Section */}
      <section id="mission" className="min-h-screen bg-black flex items-center justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl text-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-8 block">
            Our Mission
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-primary font-medium leading-tight text-white mb-8">
            "To establish Creative Technology as a pioneering discipline through partnerships, experimentation, and demonstration—empowering practitioners to shape what's next."
          </h2>
          <button
            onClick={() => navigate('/mission')}
            className="mt-8 px-8 py-4 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 hover:bg-white/5 transition-all"
          >
            Read More About Us
          </button>
        </div>
      </section>

      {/* Members Section */}
      <section id="members" className={`py-32 bg-black px-8 md:px-16 lg:px-24 relative transition-all duration-500 ${selectedMember ? 'z-50' : 'z-10'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4 block">
                Our Members
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium text-white">
                The Collective
              </h2>
            </div>
           
          </div>

          {/* Selected Member - Full Width 2x2 */}
          {selectedMember && (
            <div className="w-full mb-8 bg-zinc-900 overflow-hidden transition-all duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image - Left side */}
                <div className="aspect-square">
                  <img 
                    src={selectedMember.image} 
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content - Right side */}
                <div className="flex flex-col justify-center p-8 md:p-12 relative">
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-8 h-8" />
                  </button>

                  <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4">
                    {selectedMember.role}
                  </span>
                  <h3 className="text-4xl md:text-5xl font-primary font-medium text-white mb-6">
                    {selectedMember.name}
                  </h3>
                  <p className="text-zinc-400 font-secondary text-lg leading-relaxed mb-8">
                    {selectedMember.bio}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      navigate('/members');
                    }}
                    className="self-start text-sm font-secondary text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    View Full Profile
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Members Grid */}
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 transition-all duration-500 ${selectedMember ? 'opacity-30' : ''}`}>
            {members.map((member) => (
              <div 
                key={member.name}
                className="group relative aspect-square overflow-hidden bg-zinc-900 cursor-pointer"
                onClick={() => setSelectedMember(member)}
              >
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white font-secondary text-sm">{member.name}</span>
                </div>
              </div>
            ))}
          </div>

         
        </div>
      </section>

    

      {/* Partners Section */}
      <section id="partners" className="py-32 bg-black px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4 block">
                Our Partners
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium text-white">
                Trusted By
              </h2>
            </div>
           
          </div>

          {/* Partners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {[
              { name: 'Leonardo AI', image: '/sponsors/Leonardo-AI.png' },
              { name: 'Luma Labs', image: '/sponsors/Lumalabs.png' },
              { name: 'Universe Studio', image: 'https://media.licdn.com/dms/image/v2/D4E0BAQEZsLFh44YUmg/company-logo_200_200/company-logo_200_200/0/1737543260484/universestudio_logo?e=2147483647&v=beta&t=pRjz_r3U2hi7cC6yR4xp8YgW3TWrjqtc1hCC_i_zxDc' },
              { name: 'Solaya', image: '/sponsors/instagram-logo.jpg' },
            ].map((partner) => (
              <div 
                key={partner.name}
                className="group flex items-center justify-center p-6 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all duration-300 aspect-[3/2]"
              >
                <img 
                  src={partner.image} 
                  alt={partner.name}
                  className="max-h-12 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300 filter grayscale group-hover:grayscale-0"
                />
              </div>
            ))}
          </div>

          {/* Partner CTA */}
          <div className="mt-16 text-center">
            <p className="text-zinc-500 font-secondary mb-6">
              Interested in partnering with us?
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 hover:bg-white/5 transition-all"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>

      {/* Collaborations Section */}
      <section id="collaborations" className={`py-32 bg-black px-8 md:px-16 lg:px-24 relative transition-all duration-500 ${selectedCase ? 'z-50' : 'z-20'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4 block">
                Our Work
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium text-white">
                Collaborations
              </h2>
            </div>
           
          </div>

          {/* Loading State */}
          {casesLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
          )}

          {/* Selected Case - Full Width Expanded View (Playground Style) */}
          {selectedCase && (
            <div className="w-full mb-8 bg-zinc-900 overflow-hidden transition-all duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left side - Image Carousel */}
                <div className="aspect-square relative">
                  {selectedCase.images.length > 0 ? (
                    <ImageCarousel images={selectedCase.images} title={selectedCase.title} />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-zinc-500 font-secondary">No images available</span>
                    </div>
                  )}
                </div>

                {/* Right side - Content */}
                <div className="flex flex-col justify-center p-8 md:p-12 relative">
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>

                  <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-4">
                    {selectedCase.client || 'Case Study'}
                  </span>
                  <h3 className="text-4xl md:text-5xl font-primary font-medium text-white mb-6">
                    {selectedCase.title}
                  </h3>
                  <p className="text-zinc-400 font-secondary text-lg leading-relaxed mb-8">
                    {selectedCase.description}
                  </p>

                  {/* Tags */}
                  {selectedCase.tags && selectedCase.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {selectedCase.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedCase.url ? (
                    <a
                      href={selectedCase.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start text-sm font-secondary text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                      View Project
                      <span>→</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => navigate('/contact')}
                      className="self-start text-sm font-secondary text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                      Want to collaborate?
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cases Grid - Playground Style */}
          {!casesLoading && caseStudies.length > 0 && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${selectedCase ? 'opacity-30' : ''}`}>
              {caseStudies.slice(0, 4).map((caseStudy) => (
                <div 
                  key={caseStudy.id}
                  className="group relative aspect-video overflow-hidden bg-zinc-900 cursor-pointer"
                  onClick={() => setSelectedCase(caseStudy)}
                >
                  {caseStudy.images.length > 0 && (
                    <img 
                      src={caseStudy.images[0]} 
                      alt={caseStudy.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase mb-2 block">
                      {caseStudy.client || 'Case Study'}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-primary font-medium text-white mb-2">
                      {caseStudy.title}
                    </h3>
                    <p className="text-zinc-400 font-secondary text-sm line-clamp-2">
                      {caseStudy.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!casesLoading && caseStudies.length === 0 && (
            <div className="text-center py-20">
              <p className="text-zinc-500 font-secondary">No collaborations available at the moment.</p>
            </div>
          )}

          {/* View All CTA */}
          {caseStudies.length > 4 && (
            <div className="mt-16 text-center">
              <button
                onClick={() => navigate('/collaborations')}
                className="px-8 py-4 border border-zinc-700 text-white font-secondary text-sm tracking-wide hover:border-zinc-500 hover:bg-white/5 transition-all"
              >
                View All {caseStudies.length} Projects
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Join Us CTA Section */}
      <section id="newsletter" className="py-32 bg-black px-8 md:px-16 lg:px-24 relative">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-6 block">
            Sign up to our newsletter
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium text-white mb-8 leading-tight">
            Stay in the loop
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl font-secondary leading-relaxed mb-12 max-w-2xl mx-auto">
           Get exclusive insights into our latest experiments, behind-the-scenes updates on emerging tech projects, and early access to community events. Join our newsletter to stay at the forefront of creative technology innovation.
          </p>
          
          {/* Email Signup Form */}
          <EmailSignup minimal={true} />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HeroPage;
