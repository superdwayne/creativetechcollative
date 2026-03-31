import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { n8nFetch } from '@/utils/n8nProxy';
import { useNavigate } from 'react-router-dom';

interface MemberData {
  id: string;
  name: string;
  description: string;
  image: string;
}

const MembersPageSimple: React.FC = () => {
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Fetch member data
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setError(null);
        const webhookUrl = getWebhookUrl('members');
        const response = await n8nFetch(webhookUrl, 'GET');

        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const transformedMembers: MemberData[] = data
            .map((item: any, index: number) => {
              let imageUrl = '';
              if (item.property_image) {
                if (Array.isArray(item.property_image) && item.property_image.length > 0) {
                  imageUrl = item.property_image[0];
                } else if (typeof item.property_image === 'string') {
                  imageUrl = item.property_image;
                }
              }

              return {
                id: item.id || `member-${index}`,
                name: item.property_title || item.name || 'Unknown Member',
                description: item.property_description || 'Team Member',
                image: imageUrl || '/members/default.png'
              };
            })
            .filter((member: MemberData) => member.name && member.name !== 'Unknown Member');

          setMemberData(transformedMembers);
        } else {
          // Demo data for when no API data is available
          setMemberData([
            {
              id: "1",
              name: "Dwayne Paisley-Marshall",
              description: "Creative Director",
              image: "/members/Dwayne.png"
            },
            {
              id: "2", 
              name: "James Wilson",
              description: "Technical Lead",
              image: "/members/James.png"
            },
            {
              id: "3",
              name: "Jennifer Chen",
              description: "Strategy Director", 
              image: "/members/Jennifer.png"
            },
            {
              id: "4",
              name: "Joshua Kim",
              description: "Product Designer", 
              image: "/members/Joshua.png"
            },
            {
              id: "5",
              name: "Karolina Smith",
              description: "Brand Designer", 
              image: "/members/Karolina.png"
            }
          ]);
        }
      } catch (err: any) {
        console.error('Error fetching members:', err);
        setError(err.message || 'Failed to load members');
        setMemberData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const nextMember = () => {
    setCurrentIndex((prev) => (prev + 1) % memberData.length);
  };

  const prevMember = () => {
    setCurrentIndex((prev) => (prev - 1 + memberData.length) % memberData.length);
  };

  const goToMember = (index: number) => {
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
        <div className="mt-8 flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
          <span className="text-white text-lg font-light">Loading our team...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4 text-white">Something went wrong</h2>
          <p className="text-white/70 font-light">{error}</p>
        </div>
      </div>
    );
  }

  const currentMember = memberData[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <motion.section 
        style={{ opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center px-4"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-12 h-px bg-white/60" />
              <span className="text-white/80 text-sm uppercase tracking-wider font-light">Our Team</span>
              <div className="w-12 h-px bg-white/60" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-9xl font-light leading-none mb-8 font-mono"
          >
            Craftspeople
            <br />
            & Optimists
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-white/80 font-light max-w-3xl mx-auto leading-relaxed"
          >
            We're a team of craftspeople and optimists who are eternally curious about new tools, 
            big ideas, and what more we can achieve with technology.
          </motion.p>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-sm font-light mb-4 uppercase tracking-wider">Scroll to explore</span>
            <div className="w-px h-16 bg-white/30 relative">
              <motion.div
                className="w-px h-4 bg-white absolute top-0"
                animate={{ y: [0, 48, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Team Carousel Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-6xl mx-auto px-4">
          {currentMember && (
            <div className="relative">
              {/* Main Image */}
              <div className="relative aspect-[4/3] lg:aspect-[16/9] overflow-hidden">
                <motion.img
                  key={currentMember.id}
                  src={currentMember.image}
                  alt={currentMember.name}
                  className="w-full h-full object-cover filter blur-sm opacity-30"
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.3 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=800&h=600&fit=crop&crop=face`;
                  }}
                />
                
                {/* Centered Member Image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    key={`${currentMember.id}-center`}
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="relative"
                  >
                    <img
                      src={currentMember.image}
                      alt={currentMember.name}
                      className="w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-full shadow-2xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=400&h=400&fit=crop&crop=face`;
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Member Info */}
              <motion.div
                key={`${currentMember.id}-info`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl"
              >
                <h3 className="text-2xl font-light mb-1 text-gray-800">{currentMember.name}</h3>
                <p className="text-gray-600 font-light">{currentMember.description}</p>
              </motion.div>

              {/* Navigation Arrows */}
              <button
                onClick={prevMember}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              
              <button
                onClick={nextMember}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
              >
                <ArrowRight className="w-6 h-6 text-gray-600" />
              </button>

              {/* Dot Navigation */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {memberData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToMember(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex ? 'bg-gray-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Back to Home */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-white/60 hover:text-white transition-colors duration-200 text-sm font-light"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default MembersPageSimple;