import React, { useState, useRef } from 'react';
import { Instagram, Twitter, Linkedin, Github, ExternalLink, Palette } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio?: string;
  social?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    behance?: string;
  };
}

interface TeamMasonryGridProps {
  members: TeamMember[];
}

const TeamMasonryGrid: React.FC<TeamMasonryGridProps> = ({ members }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Predefined layout patterns for masonry effect (inspired by 100 Lost Species)
  const getLayoutClass = (index: number): string => {
    const patterns = [
      'col-span-1 row-span-1',
      'col-span-1 row-span-2',
      'col-span-1 row-span-1',
      'col-span-2 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-2',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-2 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-2',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
    ];
    return patterns[index % patterns.length];
  };

  // Staggered animation delays
  const getAnimationDelay = (index: number): string => {
    return `${index * 0.08}s`;
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Masonry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[250px]">
        {members.map((member, index) => (
          <div
            key={member.id}
            className={`${getLayoutClass(index)} relative group overflow-hidden rounded-sm cursor-pointer transform transition-all duration-700 ease-out opacity-0 translate-y-8 animate-fade-in-up`}
            style={{
              animationDelay: getAnimationDelay(index),
              animationFillMode: 'forwards',
            }}
            onMouseEnter={() => setHoveredId(member.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Image */}
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/400x500/1a1a1a/666666?text=${encodeURIComponent(member.name.charAt(0))}`;
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Content Overlay */}
            <div
              className={`absolute inset-0 flex flex-col justify-end p-4 md:p-6 transition-all duration-500 ${
                hoveredId === member.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {/* Name with elegant serif font */}
              <h3 className="font-serif text-xl md:text-2xl text-white mb-1 tracking-wide">
                {member.name}
              </h3>
              
              {/* Role */}
              <p className="text-white/70 text-sm md:text-base font-light tracking-wider uppercase mb-3">
                {member.role}
              </p>

              {/* Social Links */}
              {member.social && (
                <div className="flex gap-2 mt-2">
                  {member.social.instagram && (
                    <a
                      href={member.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Instagram className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {member.social.twitter && (
                    <a
                      href={member.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Twitter className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {member.social.linkedin && (
                    <a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Linkedin className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {member.social.github && (
                    <a
                      href={member.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Github className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {member.social.website && (
                    <a
                      href={member.social.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {member.social.behance && (
                    <a
                      href={member.social.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Palette className="w-4 h-4 text-white" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Subtle border on hover */}
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/20 transition-colors duration-500 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMasonryGrid;
