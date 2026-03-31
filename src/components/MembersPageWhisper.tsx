import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Github, Linkedin, Mail, Globe } from 'lucide-react';
import { getWebhookUrl } from '@/utils/webhookUtils';
import { n8nFetch } from '@/utils/n8nProxy';
import { useNavigate } from 'react-router-dom';

interface MemberData {
  id: string;
  name: string;
  description: string;
  image: string;
  bio?: string;
  contact?: {
    email?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

const MembersPageWhisper: React.FC = () => {
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
                bio: item.property_bio || 'Passionate about technology and innovation.',
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
              name: "Dwayne Paisley-Marshall",
              description: "Creative Director",
              image: "/members/Dwayne.png",
              bio: "Leading creative vision with expertise in digital design and brand strategy.",
              contact: {
                email: "dwayne@ctc-collective.com",
                linkedin: "dwaynepaisley",
                github: "dwaynepm"
              }
            },
            {
              id: "2", 
              name: "James Wilson",
              description: "Technical Lead",
              image: "/members/James.png",
              bio: "Full-stack engineer specializing in modern web technologies and scalable solutions.",
              contact: {
                email: "james@ctc-collective.com",
                github: "jameswilson",
                website: "jameswilson.dev"
              }
            },
            {
              id: "3",
              name: "Jennifer Chen",
              description: "Strategy Director", 
              image: "/members/Jennifer.png",
              bio: "Strategic thinker with expertise in digital transformation and product management.",
              contact: {
                email: "jennifer@ctc-collective.com",
                linkedin: "jenniferchen",
                website: "jenniferchen.co"
              }
            },
            {
              id: "4",
              name: "Joshua Kim",
              description: "Product Designer", 
              image: "/members/Joshua.png",
              bio: "UX/UI designer passionate about creating intuitive user experiences.",
              contact: {
                email: "joshua@ctc-collective.com",
                linkedin: "joshuakim"
              }
            },
            {
              id: "5",
              name: "Karolina Smith",
              description: "Brand Designer", 
              image: "/members/Karolina.png",
              bio: "Brand specialist focused on visual identity and creative communications.",
              contact: {
                email: "karolina@ctc-collective.com",
                linkedin: "karolinasmith"
              }
            },
            {
              id: "6",
              name: "Martin Rodriguez",
              description: "Developer", 
              image: "/members/Martin.png",
              bio: "Frontend developer with a passion for modern JavaScript frameworks.",
              contact: {
                email: "martin@ctc-collective.com",
                github: "martinrod"
              }
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
        <div className="mt-8 flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600 text-lg">Loading our team...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            Meet Our Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            We're a diverse group of creators, innovators, and problem-solvers working together 
            to build the future of creative technology.
          </motion.p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {memberData.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=400&h=400&fit=crop&crop=face`;
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-gray-600 text-sm font-medium mb-3">
                      {member.description}
                    </p>
                    {member.bio && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">
                        {member.bio}
                      </p>
                    )}
                    
                    {/* Social Links */}
                    <div className="flex space-x-3">
                      {member.contact?.email && (
                        <a
                          href={`mailto:${member.contact.email}`}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {member.contact?.website && (
                        <a
                          href={member.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                          title="Website"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {member.contact?.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${member.contact.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {member.contact?.github && (
                        <a
                          href={`https://github.com/${member.contact.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                          title="GitHub"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
          >
            Want to join our team?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 mb-8 leading-relaxed"
          >
            We're always looking for talented individuals who share our passion for 
            innovation and creative technology.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-300"
            >
              Get in touch
            </button>
          </motion.div>
        </div>
      </section>

      {/* Back to Home */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default MembersPageWhisper;