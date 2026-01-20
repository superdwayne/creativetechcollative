import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { useNavigate } from 'react-router-dom';

interface MemberData {
  id: string;
  name: string;
  description: string;
  image: string;
  bio?: string;
}

const MembersPageWhisperActual: React.FC = () => {
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();

  const nextMember = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % memberData.length);
  }, [memberData.length]);

  const prevMember = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + memberData.length) % memberData.length);
  }, [memberData.length]);

  const goToMember = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Get the next member for preview
  const getNextMember = () => {
    if (memberData.length === 0) return null;
    return memberData[(currentIndex + 1) % memberData.length];
  };

  // Fetch member data
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setError(null);
        const webhookUrl = getWebhookUrl('members');
        const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
        const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;

        if (!username || !password) {
          throw new Error('Authentication credentials not configured');
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
                image: imageUrl || '/members/default.png',
                bio: item.property_bio || 'Expert team member bringing valuable skills and experience to our collective.'
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
              image: "/members/Dwayne.png",
              bio: "Dwayne is a seasoned creative professional with 10+ years of experience in digital design and brand strategy. Currently leading creative initiatives at CTC Collective, he specializes in transforming complex ideas into compelling visual narratives that resonate with diverse audiences."
            },
            {
              id: "2", 
              name: "James Wilson",
              description: "Technical Lead",
              image: "/members/James.png",
              bio: "James Wilson is a full-stack engineer with extensive experience in modern web technologies and scalable architecture. With a passion for clean code and innovative solutions, he leads our technical team in building robust platforms that power the future of creative technology."
            },
            {
              id: "3",
              name: "Jennifer Chen",
              description: "Strategy Director", 
              image: "/members/Jennifer.png",
              bio: "Jennifer Chen brings strategic vision and business acumen to our collective. With her background in digital transformation and product management, she helps align our creative endeavors with market opportunities and sustainable growth strategies."
            },
            {
              id: "4",
              name: "Joshua Kim",
              description: "Product Designer", 
              image: "/members/Joshua.png",
              bio: "Joshua Kim is a UX/UI designer passionate about creating intuitive user experiences. His design philosophy centers on human-centered design principles, ensuring that every digital interaction feels natural and meaningful for users."
            },
            {
              id: "5",
              name: "Karolina Smith",
              description: "Brand Designer", 
              image: "/members/Karolina.png",
              bio: "Karolina Smith specializes in visual identity and creative communications. Her expertise in brand development helps organizations tell their stories through compelling visual languages that connect with their audiences on an emotional level."
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
  const nextMemberPreview = getNextMember();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-tight font-mono">
              <span className="text-white">
                Meet Our Team
              </span>
              <br />
              <span className="text-white">
                of Experts
              </span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Team Carousel */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Left Arrow */}
            <button
              onClick={prevMember}
              className="p-4 border border-white/20 rounded-lg hover:border-white/40 transition-all duration-300 hover:bg-white/10 z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white/70" />
            </button>

            {/* Main Content */}
            {currentMember && (
              <div className="flex-1 max-w-5xl mx-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  {/* Avatar/Image Section with Preview */}
                  <div className="flex justify-center items-end space-x-4">
                    {/* Main Avatar Container */}
                    <div className="relative">
                      <div className="w-80 h-80 md:w-96 md:h-96 bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-1">
                        <div className="w-full h-full bg-black/50 rounded-3xl flex items-center justify-center overflow-hidden">
                          <motion.img
                            key={`main-${currentMember.id}`}
                            src={currentMember.image}
                            alt={currentMember.name}
                            className="w-full h-full object-cover"
                            initial={{ x: direction > 0 ? 30 : -30 }}
                            animate={{ x: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.avatar-placeholder')) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'avatar-placeholder w-full h-full flex items-center justify-center';
                                placeholder.innerHTML = `
                                  <div class="text-center">
                                    <div class="w-32 h-32 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                      <div class="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center">
                                        <div class="w-12 h-12 bg-white/40 rounded-full"></div>
                                      </div>
                                    </div>
                                    <div class="w-24 h-4 bg-white/20 rounded mx-auto mb-2"></div>
                                    <div class="w-16 h-4 bg-white/20 rounded mx-auto"></div>
                                  </div>
                                `;
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Small indicator boxes at bottom */}
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-white/40 rounded"></div>
                          <div className="w-3 h-3 bg-white/40 rounded"></div>
                          <div className="w-3 h-3 bg-white/40 rounded"></div>
                          <div className="w-3 h-3 bg-white/40 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Preview Thumbnail - Next Member */}
                    {nextMemberPreview && (
                      <div
                        className="cursor-pointer group"
                        onClick={nextMember}
                      >
                        <div className="w-24 h-32 md:w-28 md:h-36 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1 hover:border-white/40 transition-all duration-300 group-hover:scale-105">
                          <div className="w-full h-full bg-black/30 rounded-lg flex items-center justify-center overflow-hidden">
                            <motion.img
                              key={`preview-${nextMemberPreview.id}`}
                              src={nextMemberPreview.image}
                              alt={nextMemberPreview.name}
                              className="w-full h-full object-cover"
                              initial={{ x: 10 }}
                              animate={{ x: 0 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.preview-placeholder')) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'preview-placeholder w-full h-full flex items-center justify-center';
                                  placeholder.innerHTML = `
                                    <div class="w-8 h-8 bg-white/30 rounded-full"></div>
                                  `;
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          </div>
                        </div>
                        {/* Small preview indicator */}
                        <div className="mt-2 text-center">
                          <div className="text-white/40 text-xs font-light">Next</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="space-y-6">
                    <motion.h2
                      key={`name-${currentMember.id}`}
                      initial={{ x: direction > 0 ? 20 : -20 }}
                      animate={{ x: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-4xl md:text-5xl font-light text-white font-primary"
                    >
                      {currentMember.name}
                    </motion.h2>
                    
                    <motion.h3
                      key={`role-${currentMember.id}`}
                      initial={{ x: direction > 0 ? 20 : -20 }}
                      animate={{ x: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
                      className="text-2xl md:text-3xl font-light text-white/80 font-secondary"
                    >
                      {currentMember.description}
                    </motion.h3>
                    
                    <motion.p
                      key={`bio-${currentMember.id}`}
                      initial={{ x: direction > 0 ? 20 : -20 }}
                      animate={{ x: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
                      className="text-white/70 text-lg leading-relaxed font-light"
                    >
                      {currentMember.bio}
                    </motion.p>
                  </div>
                </div>
              </div>
            )}

            {/* Right Arrow */}
            <button
              onClick={nextMember}
              className="p-4 border border-white/20 rounded-lg hover:border-white/40 transition-all duration-300 hover:bg-white/10 z-10"
            >
              <ChevronRight className="w-6 h-6 text-white/70" />
            </button>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-white/60 hover:text-white transition-colors duration-300 text-sm font-light"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default MembersPageWhisperActual;