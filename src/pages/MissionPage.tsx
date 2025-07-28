import React from 'react';
import { ScrollTriggeredText } from '../components/ui/scroll-triggered-text';
import { BackgroundBeams } from '../components/ui/background-beams';
import { ButtonColorful } from '../components/ui/button-colorful';
import Footer from '../components/ui/footer';
import WorldMap from '../components/WorldMap';

const MissionPage: React.FC = () => {
  const handleJoinClick = () => {
    // Navigate to membership form or scroll to contact section
    window.location.href = '/contact';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-40 overflow-hidden">
        <BackgroundBeams />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center">
            <ScrollTriggeredText
              words="Our Mission"
              className="text-5xl md:text-7xl font-primary font-medium text-white mb-8"
              duration={0.8}
              filter={false}
            />
            <ScrollTriggeredText
              words="We're on a mission to make Creative Technology open to all—breaking down barriers, spreading knowledge, and putting powerful tools into the hands of anyone ready to build what's next."
              className="text-zinc-300 text-xl md:text-2xl font-secondary font-medium leading-relaxed max-w-4xl mx-auto mb-12"
              duration={0.6}
              delay={0.8}
              filter={false}
            />
           
          </div>
        </div>
      </section>

      {/* Global Community Section */}
      <section className="pt-20 relative z-20 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <ScrollTriggeredText
              words="Our Global Vision"
              className="text-4xl md:text-5xl font-primary text-white mb-6"
              duration={0.8}
              filter={false}
            />
            <ScrollTriggeredText
              words="To build a globally-connected yet locally-anchored collective of creative technologists that champions the craft, accelerates innovation, and fosters shared learning across cultures, industries, and disciplines."
              className="text-zinc-400 text-lg font-medium max-w-3xl mx-auto font-secondary"
              duration={0.6}
              delay={0.6}
              filter={false}
            />
          </div>
        </div>
        <div className="w-full">
          <WorldMap />
        </div>
      </section>

{/*       
      <section className="py-20 relative z-20 bg-gradient-to-t from-black to-zinc-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollTriggeredText
            words="Ready to Join Us?"
            className="text-4xl md:text-5xl font-primary font-medium text-white mb-6"
            duration={0.6}
            filter={false}
          />
          <ScrollTriggeredText
            words="Whether you're a seasoned creative technologist or just starting your journey, there's a place for you in our collective. Let's build the future together."
            className="text-zinc-300 text-xl font-secondary mb-8 leading-relaxed"
            duration={0.6}
            delay={0.3}
            filter={false}
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonColorful
              onClick={handleJoinClick}
              className="px-8 py-4 text-lg font-medium"
            >
              Become a Member
            </ButtonColorful>
            <button
              onClick={() => window.location.href = '/resources'}
              className="px-8 py-4 text-lg font-medium bg-transparent border-2 border-zinc-600 text-white rounded-xl hover:border-emerald-500 hover:text-emerald-400 transition-all duration-300"
            >
              Explore Resources
            </button>
          </div>
        </div>
      </section> */}

      <Footer />
    </div>
  );
};

export default MissionPage; 