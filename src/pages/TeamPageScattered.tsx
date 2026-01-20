import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

// Team members with placeholder images
const teamMembers: TeamMember[] = [
  { id: '1', name: 'Dwayne Paisley-Marshall', role: 'Founder & Creative Director', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
  { id: '2', name: 'Adina', role: 'Lead Designer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop' },
  { id: '3', name: 'Deniz', role: 'Technical Lead', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop' },
  { id: '4', name: 'Erin', role: 'UX Researcher', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop' },
  { id: '5', name: 'Florido', role: 'Motion Designer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop' },
  { id: '6', name: 'James', role: 'Frontend Developer', image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=500&fit=crop' },
  { id: '7', name: 'Jennifer', role: 'Product Manager', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop' },
  { id: '8', name: 'Joshua', role: 'Backend Developer', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop' },
  { id: '9', name: 'Karolina', role: 'Brand Strategist', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop' },
  { id: '10', name: 'Koen', role: 'AI Engineer', image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=500&fit=crop' },
  { id: '11', name: 'Martin', role: 'DevOps Engineer', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop' },
  { id: '12', name: 'Pax', role: 'Content Strategist', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop' },
];

// Organic scattered positions for each member
const scatteredPositions = [
  { x: 15, y: 5, rotation: -3, scale: 1.1 },
  { x: 55, y: 2, rotation: 2, scale: 1 },
  { x: 80, y: 8, rotation: -2, scale: 0.9 },
  { x: 5, y: 35, rotation: 4, scale: 0.95 },
  { x: 40, y: 30, rotation: -1, scale: 1.05 },
  { x: 70, y: 38, rotation: 3, scale: 1 },
  { x: 20, y: 60, rotation: -2, scale: 1 },
  { x: 50, y: 55, rotation: 1, scale: 0.95 },
  { x: 85, y: 62, rotation: -3, scale: 1.1 },
  { x: 10, y: 85, rotation: 2, scale: 0.9 },
  { x: 45, y: 82, rotation: -1, scale: 1 },
  { x: 75, y: 88, rotation: 3, scale: 1.05 },
];

// Diamond decoration component
const Diamond: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 12 }) => (
  <div 
    className={`absolute ${className}`}
    style={{
      width: size,
      height: size,
      background: 'linear-gradient(135deg, #a8d5ba 0%, #7fb99b 100%)',
      transform: 'rotate(45deg)',
      opacity: 0.6,
    }}
  />
);

// Individual member card with parallax
const MemberCard: React.FC<{
  member: TeamMember;
  position: typeof scatteredPositions[0];
  index: number;
}> = ({ member, position, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={cardRef}
      className="absolute cursor-pointer"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        y,
        opacity,
        zIndex: isHovered ? 50 : index,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: position.scale }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Diamond decoration */}
      <Diamond className="-top-3 -left-3" size={10} />
      <Diamond className="-bottom-2 -right-2" size={8} />
      
      <motion.div
        className="relative overflow-hidden rounded-sm shadow-2xl"
        style={{
          width: 'clamp(180px, 20vw, 280px)',
          height: 'clamp(220px, 25vw, 350px)',
          rotate: position.rotation,
        }}
        whileHover={{ 
          scale: 1.08, 
          rotate: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Image */}
        <img
          src={member.image}
          alt={member.name}
          className="w-full h-full object-cover"
          style={{
            filter: isHovered ? 'none' : 'sepia(20%) saturate(80%)',
            transition: 'filter 0.4s ease',
          }}
        />
        
        {/* Overlay gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Content */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-serif text-lg text-white mb-1">{member.name}</h3>
          <p className="text-white/70 text-xs uppercase tracking-widest">{member.role}</p>
        </motion.div>
        
        {/* Subtle border */}
        <div 
          className="absolute inset-0 border border-white/10 rounded-sm pointer-events-none"
          style={{ 
            borderColor: isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            transition: 'border-color 0.3s ease',
          }}
        />
      </motion.div>
    </motion.div>
  );
};

const TeamPageScattered: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-[300vh] bg-[#f5f3ef] text-[#1a1a1a] relative overflow-hidden"
    >
      {/* Floating diamond decorations */}
      <Diamond className="top-[10%] left-[8%]" size={16} />
      <Diamond className="top-[25%] right-[12%]" size={12} />
      <Diamond className="top-[45%] left-[3%]" size={14} />
      <Diamond className="top-[60%] right-[5%]" size={10} />
      <Diamond className="top-[75%] left-[15%]" size={12} />
      <Diamond className="top-[85%] right-[20%]" size={16} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -20 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-light tracking-widest uppercase text-[#1a1a1a]/60">
            CTC Collective
          </span>
        </motion.div>
        
        <motion.div
          className="text-sm text-[#1a1a1a]/50 tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Scroll to explore
        </motion.div>
        
        <motion.a
          href="/"
          className="text-sm font-light tracking-widest uppercase text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6 }}
        >
          Back
        </motion.a>
      </header>

      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative">
        <motion.div
          className="text-center px-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 40 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[#1a1a1a] leading-tight tracking-wide mb-6">
            Our Team
          </h1>
          <p className="text-[#1a1a1a]/50 text-lg md:text-xl max-w-xl mx-auto font-light tracking-wide">
            A diverse collective of creative minds pushing the boundaries of technology and design.
          </p>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-[#1a1a1a]/30 rounded-full flex justify-center"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div className="w-1 h-2 bg-[#1a1a1a]/40 rounded-full mt-2" />
          </motion.div>
        </motion.div>
      </section>

      {/* Scattered Grid Section */}
      <section className="relative min-h-[200vh] px-4 md:px-8">
        {teamMembers.map((member, index) => (
          <MemberCard
            key={member.id}
            member={member}
            position={scatteredPositions[index % scatteredPositions.length]}
            index={index}
          />
        ))}
      </section>

      {/* Bottom info */}
      <section className="h-screen flex items-center justify-center relative">
        <motion.div
          className="text-center px-6"
          style={{
            opacity: useTransform(scrollYProgress, [0.8, 0.95], [0, 1]),
          }}
        >
          <p className="text-[#1a1a1a]/40 text-sm tracking-widest uppercase mb-4">
            {teamMembers.length} Creative Minds
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a]/80 mb-8">
            Ready to collaborate?
          </h2>
          <a
            href="/contact"
            className="inline-block px-8 py-3 border border-[#1a1a1a]/30 text-[#1a1a1a]/70 text-sm uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-all duration-300"
          >
            Get in Touch
          </a>
        </motion.div>
      </section>

      {/* Counter */}
      <motion.div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="bg-[#1a1a1a] text-white px-4 py-2 text-sm font-mono tracking-wider">
          {String(Math.round(scrollYProgress.get() * teamMembers.length) || 1).padStart(2, '0')} : {String(teamMembers.length).padStart(2, '0')}
        </div>
        <button className="w-8 h-8 bg-[#7fb99b] flex items-center justify-center text-white text-xs">
          i
        </button>
      </motion.div>

      {/* Custom styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
      `}</style>
    </div>
  );
};

export default TeamPageScattered;
