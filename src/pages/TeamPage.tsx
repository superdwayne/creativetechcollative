import React, { useState, useEffect, useRef } from 'react';
import { Grid, List, Filter } from 'lucide-react';
import Footer from '../components/ui/footer';
import FloatingShapes from '../components/FloatingShapes';
import TeamMasonryGrid from '../components/TeamMasonryGrid';

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

// Group members by role category for the credits table
const roleCategories = [
  {
    category: 'Leadership',
    members: teamMembers.filter(m => m.role.toLowerCase().includes('founder') || m.role.toLowerCase().includes('director') || m.role.toLowerCase().includes('lead'))
  },
  {
    category: 'Design',
    members: teamMembers.filter(m => m.role.toLowerCase().includes('design') || m.role.toLowerCase().includes('ux') || m.role.toLowerCase().includes('ui') || m.role.toLowerCase().includes('brand'))
  },
  {
    category: 'Development',
    members: teamMembers.filter(m => m.role.toLowerCase().includes('developer') || m.role.toLowerCase().includes('engineer') || m.role.toLowerCase().includes('devops') || m.role.toLowerCase().includes('technical'))
  },
  {
    category: 'Strategy & Content',
    members: teamMembers.filter(m => m.role.toLowerCase().includes('manager') || m.role.toLowerCase().includes('strategist') || m.role.toLowerCase().includes('content') || m.role.toLowerCase().includes('researcher'))
  },
];

type ViewMode = 'grid' | 'list' | 'credits';
type FilterMode = 'all' | 'leadership' | 'design' | 'development' | 'strategy';

const TeamPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    if (filterMode === 'all') return true;
    if (filterMode === 'leadership') return member.role.toLowerCase().includes('founder') || member.role.toLowerCase().includes('director') || member.role.toLowerCase().includes('lead');
    if (filterMode === 'design') return member.role.toLowerCase().includes('design') || member.role.toLowerCase().includes('ux') || member.role.toLowerCase().includes('ui') || member.role.toLowerCase().includes('brand');
    if (filterMode === 'development') return member.role.toLowerCase().includes('developer') || member.role.toLowerCase().includes('engineer') || member.role.toLowerCase().includes('devops') || member.role.toLowerCase().includes('technical');
    if (filterMode === 'strategy') return member.role.toLowerCase().includes('manager') || member.role.toLowerCase().includes('strategist') || member.role.toLowerCase().includes('content') || member.role.toLowerCase().includes('researcher');
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Floating Shapes Background */}
      <FloatingShapes count={25} />

      {/* Hero Section - 100 Lost Species Style */}
      <div 
        ref={heroRef}
        className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 md:px-12"
      >
        {/* Large Serif Heading */}
        <div className={`text-center transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-tight tracking-wide mb-8">
            A diverse collective
            <br />
            <span className="text-white/80">of creative minds</span>
            <br />
            <span className="text-white/60">pushing boundaries.</span>
          </h1>
          
          <p className={`text-white/50 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Creative technologists, designers, and innovators united by a passion for exceptional digital experiences.
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-sm tracking-widest uppercase transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          Scroll to explore
        </div>
      </div>

      {/* Filter Tabs - 100 Lost Species Style */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline">By Visuals</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">By Names</span>
              </button>
              <button
                onClick={() => setViewMode('credits')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                  viewMode === 'credits'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">By Role</span>
              </button>
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                className="bg-white/10 text-white/70 px-4 py-2 rounded-full text-sm border border-white/10 focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="leadership">Leadership</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="strategy">Strategy & Content</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16">
        {/* Grid View - Masonry Style */}
        {viewMode === 'grid' && (
          <TeamMasonryGrid members={filteredMembers} />
        )}

        {/* List View - Names with hover images */}
        {viewMode === 'list' && (
          <div className="space-y-1">
            {filteredMembers.map((member, index) => (
              <ListMemberItem key={member.id} member={member} index={index} />
            ))}
          </div>
        )}

        {/* Credits View - Table Style like 100 Lost Species */}
        {viewMode === 'credits' && (
          <div className="max-w-4xl mx-auto">
            <table className="w-full">
              <tbody>
                {roleCategories.map((category, catIndex) => (
                  category.members.length > 0 && (
                    <tr 
                      key={category.category}
                      className="border-b border-white/10 group"
                      style={{ animationDelay: `${catIndex * 0.1}s` }}
                    >
                      <td className="py-6 pr-8 align-top">
                        <span className="text-white/50 text-sm uppercase tracking-widest font-light">
                          {category.category}
                        </span>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {category.members.map((member) => (
                            <span 
                              key={member.id}
                              className="text-white text-lg md:text-xl font-light hover:text-white/70 transition-colors cursor-default"
                            >
                              {member.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Count */}
      <div className="relative z-10 text-center py-12 border-t border-white/10">
        <p className="text-white/40 text-sm tracking-widest uppercase">
          {filteredMembers.length} Creative Minds
        </p>
      </div>

      <Footer />

      {/* Custom Styles */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        /* Elegant serif font fallback */
        .font-serif {
          font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #000;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
};

// List Member Item Component with hover image preview
const ListMemberItem: React.FC<{ member: TeamMember; index: number }> = ({ member, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="group relative py-4 border-b border-white/5 cursor-pointer opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-white/30 text-sm font-mono w-8">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-white group-hover:text-white/70 transition-colors duration-300">
            {member.name}
          </h3>
        </div>
        <span className="text-white/40 text-sm uppercase tracking-widest hidden md:block">
          {member.role}
        </span>
      </div>

      {/* Floating Image Preview */}
      {isHovered && (
        <div
          className="fixed pointer-events-none z-50 transition-opacity duration-200"
          style={{
            left: mousePos.x + 20,
            top: mousePos.y - 100,
          }}
        >
          <img
            src={member.image}
            alt={member.name}
            className="w-48 h-64 object-cover rounded-sm shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TeamPage; 