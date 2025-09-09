import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Instagram, Twitter, Linkedin, Github, Palette } from 'lucide-react';
import Footer from '../components/ui/footer';
import MembersGallery from '../components/MembersGallery';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  social: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    behance?: string;
  };
  featured?: boolean;
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Dwayne Paisley-Marshall',
    role: 'Founder & Creative Director',
    image: '/members/Dwayne.png',
    bio: 'Creative technologist and digital artist pushing the boundaries of interactive experiences.',
    social: {
      instagram: 'https://instagram.com/dwaynepm',
      twitter: 'https://twitter.com/dwaynepm',
      linkedin: 'https://linkedin.com/in/dwaynepm',
      github: 'https://github.com/dwaynepm',
      website: 'https://dwaynepm.com'
    },
    featured: true
  },
  {
    id: '2',
    name: 'Adina',
    role: 'Lead Designer',
    image: '/members/Adina.png',
    bio: 'Visual storyteller crafting immersive digital experiences with a focus on user-centered design.',
    social: {
      instagram: 'https://instagram.com/adina',
      linkedin: 'https://linkedin.com/in/adina'
    }
  },
  {
    id: '3',
    name: 'Deniz',
    role: 'Technical Lead',
    image: '/members/Deniz.png',
    bio: 'Full-stack developer specializing in cutting-edge web technologies and scalable architectures.',
    social: {
      github: 'https://github.com/deniz',
      linkedin: 'https://linkedin.com/in/deniz'
    }
  },
  {
    id: '4',
    name: 'Erin',
    role: 'UX Researcher',
    image: '/members/erin.png',
    bio: 'Human-centered design advocate exploring the intersection of technology and human behavior.',
    social: {
      linkedin: 'https://linkedin.com/in/erin',
      twitter: 'https://twitter.com/erin'
    }
  },
  {
    id: '5',
    name: 'Florido',
    role: 'Motion Designer',
    image: '/members/Florido.png',
    bio: 'Animation specialist bringing static designs to life with fluid motion and dynamic interactions.',
    social: {
      instagram: 'https://instagram.com/florido',
      behance: 'https://behance.net/florido'
    }
  },
  {
    id: '6',
    name: 'James',
    role: 'Frontend Developer',
    image: '/members/James.png',
    bio: 'React specialist crafting responsive interfaces with attention to performance and accessibility.',
    social: {
      github: 'https://github.com/james',
      linkedin: 'https://linkedin.com/in/james'
    }
  },
  {
    id: '7',
    name: 'Jennifer',
    role: 'Product Manager',
    image: '/members/Jennifer.png',
    bio: 'Strategic thinker bridging user needs with technical capabilities to deliver exceptional products.',
    social: {
      linkedin: 'https://linkedin.com/in/jennifer',
      twitter: 'https://twitter.com/jennifer'
    }
  },
  {
    id: '8',
    name: 'Joshua',
    role: 'Backend Developer',
    image: '/members/Joshua.png',
    bio: 'Systems architect building robust APIs and scalable infrastructure for modern applications.',
    social: {
      github: 'https://github.com/joshua',
      linkedin: 'https://linkedin.com/in/joshua'
    }
  },
  {
    id: '9',
    name: 'Karolina',
    role: 'Brand Strategist',
    image: '/members/Karolina.png',
    bio: 'Creative strategist developing compelling brand narratives and visual identities.',
    social: {
      instagram: 'https://instagram.com/karolina',
      linkedin: 'https://linkedin.com/in/karolina'
    }
  },
  {
    id: '10',
    name: 'Koen',
    role: 'AI Engineer',
    image: '/members/Koen.png',
    bio: 'Machine learning specialist exploring the frontiers of artificial intelligence and automation.',
    social: {
      github: 'https://github.com/koen',
      linkedin: 'https://linkedin.com/in/koen'
    }
  },
  {
    id: '11',
    name: 'Martin',
    role: 'DevOps Engineer',
    image: '/members/Martin.png',
    bio: 'Infrastructure expert ensuring reliable deployment and optimal performance at scale.',
    social: {
      github: 'https://github.com/martin',
      linkedin: 'https://linkedin.com/in/martin'
    }
  },
  {
    id: '12',
    name: 'Pax',
    role: 'Content Strategist',
    image: '/members/Pax.png',
    bio: 'Storyteller crafting compelling narratives that connect brands with their audiences.',
    social: {
      twitter: 'https://twitter.com/pax',
      linkedin: 'https://linkedin.com/in/pax'
    }
  },
  {
    id: '13',
    name: 'Rui',
    role: 'UI Designer',
    image: '/members/Rui.png',
    bio: 'Visual designer creating intuitive interfaces that delight users and drive engagement.',
    social: {
      instagram: 'https://instagram.com/rui',
      behance: 'https://behance.net/rui'
    }
  },
  {
    id: '14',
    name: 'John',
    role: 'Technologist',
    image: '/members/john.png',
    bio: 'Visual designer creating intuitive interfaces that delight users and drive engagement.',
    social: {
      instagram: 'https://instagram.com/rui',
      behance: 'https://behance.net/rui'
    }
  }
];

const TeamMemberCard: React.FC<{ member: TeamMember; index: number }> = ({ member, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="opacity-0 transform translate-y-8 transition-all duration-700 ease-out"
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/400/1f2937/9ca3af?text=${encodeURIComponent(member.name.charAt(0))}`;
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Social links overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              {member.social.instagram && (
                <a
                  href={member.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/95 text-gray-800 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {member.social.twitter && (
                <a
                  href={member.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/95 text-gray-800 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {member.social.linkedin && (
                <a
                  href={member.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/95 text-gray-800 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {member.social.github && (
                <a
                  href={member.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/95 text-gray-800 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {member.social.website && (
                <a
                  href={member.social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/95 text-gray-800 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
              {member.social.behance && (
                <a
                  href={member.social.behance}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/95 text-gray-800 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <Palette className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300">
            {member.name}
          </h3>
          <p className="text-gray-600 mb-4 group-hover:text-gray-500 transition-colors duration-300">
            {member.role}
          </p>
          <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600 transition-colors duration-300">
            {member.bio}
          </p>
        </div>
      </div>
    </div>
  );
};

const TeamPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'featured'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = teamMembers.filter(member => {
    const matchesFilter = filter === 'all' || (filter === 'featured' && member.featured);
    const matchesSearch = !searchQuery || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Simplified hero */}
      <div className="py-16 text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Our Team</h1>
        <p className="text-gray-600 text-lg md:text-xl">A diverse collective of creative technologists and designers.</p>
      </div>

      {/* Members gallery (uses the same gallery component) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <MembersGallery memberData={filteredMembers.map((m) => ({ id: m.id, name: m.name, description: m.role, image: m.image }))} />
      </div>

      <Footer />
    </div>
  );
};

export default TeamPage; 