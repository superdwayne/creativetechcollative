import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Sparkles, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';

const MembersDemo: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      title: "Original Design",
      description: "Interactive Three.js gallery with immersive 3D effects and dynamic distortion",
      path: "/members",
      icon: <Sparkles className="w-8 h-8" />,
      features: ["3D Gallery", "Particle Effects", "Distortion Animation", "Interactive Controls"]
    },
    {
      title: "Daybreak Style (Complex)",
      description: "Modern design with detailed modals and comprehensive team information",
      path: "/members-daybreak", 
      icon: <Users className="w-8 h-8" />,
      features: ["Modal Details", "Contact Links", "Expertise Tags", "Professional Bios"]
    },
    {
      title: "Daybreak Style (Simple)",
      description: "Clean carousel design exactly like Daybreak Studio's aesthetic",
      path: "/members-simple", 
      icon: <Users className="w-8 h-8" />,
      features: ["Minimal Design", "Carousel View", "Blurred Backgrounds", "Simple Navigation"]
    },
    {
      title: "WhisperNode Style",
      description: "Professional grid layout inspired by WhisperNode's clean team page",
      path: "/members-whisper", 
      icon: <Grid3X3 className="w-8 h-8" />,
      features: ["Grid Layout", "Clean Cards", "Social Links", "Professional Design"]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-light mb-4">Choose Your Experience</h1>
          <p className="text-white/70 text-lg">Four different approaches to showcasing our team</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {options.map((option, index) => (
            <motion.div
              key={option.path}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group cursor-pointer"
              onClick={() => navigate(option.path)}
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/20 group-hover:scale-105">
                <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-6 group-hover:bg-white/20 transition-colors duration-300">
                  {option.icon}
                </div>
                
                <h3 className="text-2xl font-light mb-4">{option.title}</h3>
                <p className="text-white/70 mb-6 leading-relaxed">{option.description}</p>
                
                <div className="space-y-2 mb-8">
                  {option.features.map((feature, i) => (
                    <div key={i} className="flex items-center justify-center text-sm text-white/60">
                      <div className="w-1 h-1 bg-white/40 rounded-full mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-center text-white/80 group-hover:text-white transition-colors duration-300">
                  <span className="mr-2">Explore</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12"
        >
          <button
            onClick={() => navigate('/')}
            className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default MembersDemo;