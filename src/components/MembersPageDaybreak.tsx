import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Mail, Globe, Linkedin, Github } from 'lucide-react';
import Footer from './ui/footer';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { n8nFetch } from '@/utils/n8nProxy';

interface MemberData {
  id: string;
  name: string;
  description: string;
  image: string;
  bio?: string;
  expertise?: string[];
  contact?: {
    email?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

const MembersPageDaybreak: React.FC = () => {
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

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
                image: imageUrl || '/members/default.png',
                bio: item.property_bio || "Passionate about building beautiful, functional digital experiences.",
                expertise: item.property_expertise || ["Design", "Technology", "Innovation"],
                contact: {
                  email: item.property_email || '',
                  website: item.property_website || '',
                  linkedin: item.property_linkedin || '',
                  github: item.property_github || ''
                }
              };
            })
            .filter((member: MemberData) => member.name && member.name !== 'Unknown Member');

          setMemberData(transformedMembers);
        } else {
          // Demo data for when no API data is available
          setMemberData([
            {
              id: "1",
              name: "Alex Rivera",
              description: "Creative Director",
              image: "/members/alex.jpg",
              bio: "Leading creative vision with 8+ years in digital design. Passionate about creating meaningful experiences that connect brands with people.",
              expertise: ["Creative Direction", "Brand Strategy", "UI/UX Design"],
              contact: {
                email: "alex@ctc-collective.com",
                linkedin: "alexrivera",
                website: "alexrivera.design"
              }
            },
            {
              id: "2", 
              name: "Jordan Kim",
              description: "Technical Lead",
              image: "/members/jordan.jpg",
              bio: "Full-stack engineer specializing in modern web technologies. Building scalable solutions that push the boundaries of what's possible.",
              expertise: ["Full-Stack Development", "Cloud Architecture", "DevOps"],
              contact: {
                email: "jordan@ctc-collective.com",
                github: "jordankim",
                website: "jordankim.dev"
              }
            },
            {
              id: "3",
              name: "Sam Chen",
              description: "Strategy Director", 
              image: "/members/sam.jpg",
              bio: "Strategic thinker with expertise in digital transformation. Bridging the gap between business objectives and technical innovation.",
              expertise: ["Business Strategy", "Digital Transformation", "Product Management"],
              contact: {
                email: "sam@ctc-collective.com",
                linkedin: "samchen",
                website: "samchen.co"
              }
            }
          ]);
        }
      } catch (err: any) {
        console.error('Error fetching members:', err);
        setError(err.message || 'Failed to load members. Please try again later.');
        setMemberData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const MemberCard = ({ member, index }: { member: MemberData; index: number }) => (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="group cursor-pointer"
      onClick={() => setSelectedMember(member)}
    >
      <div className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl transition-all duration-700 group-hover:bg-white/10 group-hover:border-white/20 group-hover:scale-[1.02]">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=400&h=600&fit=crop&crop=face`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div 
            className="flex items-center space-x-2 mb-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-12 h-px bg-white/60" />
            <span className="text-white/80 text-sm uppercase tracking-wider font-light">
              {String(index + 1).padStart(2, '0')}
            </span>
          </motion.div>
          
          <h3 className="text-white text-2xl font-light mb-1 transition-all duration-300 group-hover:text-white">
            {member.name}
          </h3>
          
          <p className="text-white/70 text-sm uppercase tracking-wide font-light mb-4">
            {member.description}
          </p>
          
          <motion.div 
            className="flex items-center text-white/60 transition-all duration-300 group-hover:text-white group-hover:translate-x-1"
            whileHover={{ x: 4 }}
          >
            <span className="text-sm font-light">Learn more</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  const MemberModal = ({ member, onClose }: { member: MemberData; onClose: () => void }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <img
                src={member.image}
                alt={member.name}
                className="w-full aspect-square object-cover rounded-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=400&h=400&fit=crop&crop=face`;
                }}
              />
            </div>
            
            <div className="md:w-2/3 space-y-6">
              <div>
                <h2 className="text-white text-3xl font-light mb-2">{member.name}</h2>
                <p className="text-white/70 text-lg uppercase tracking-wide font-light">
                  {member.description}
                </p>
              </div>
              
              <div>
                <h3 className="text-white/90 text-sm uppercase tracking-wider mb-3 font-light">Biography</h3>
                <p className="text-white/80 leading-relaxed font-light">
                  {member.bio}
                </p>
              </div>
              
              {member.expertise && member.expertise.length > 0 && (
                <div>
                  <h3 className="text-white/90 text-sm uppercase tracking-wider mb-3 font-light">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-light"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-4 pt-4">
                {member.contact?.email && (
                  <a
                    href={`mailto:${member.contact.email}`}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <Mail className="w-5 h-5 text-white" />
                  </a>
                )}
                {member.contact?.website && (
                  <a
                    href={member.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <Globe className="w-5 h-5 text-white" />
                  </a>
                )}
                {member.contact?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${member.contact.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <Linkedin className="w-5 h-5 text-white" />
                  </a>
                )}
                {member.contact?.github && (
                  <a
                    href={`https://github.com/${member.contact.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <Github className="w-5 h-5 text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

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
        <div className="text-center text-white">
          <h2 className="text-2xl font-light mb-4">Something went wrong</h2>
          <p className="text-white/70 font-light">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale }}
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
            className="text-6xl md:text-8xl lg:text-9xl font-light leading-none mb-8"
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

      {/* Team Grid */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-light mb-6">Meet the team</h2>
            <p className="text-white/70 text-lg font-light max-w-2xl mx-auto">
              Each bringing unique perspectives and expertise to create meaningful digital experiences.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {memberData.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Member Modal */}
      {selectedMember && (
        <MemberModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MembersPageDaybreak;