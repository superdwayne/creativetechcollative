import React from 'react';
import { ScrollTriggeredText } from '../components/ui/scroll-triggered-text';
import { BackgroundBeams } from '../components/ui/background-beams';
import { ButtonColorful } from '../components/ui/button-colorful';
import Footer from '../components/ui/footer';
import WorldMap from '../components/WorldMap';
import ImageCube from '../components/ImageCube';

const MissionPage: React.FC = () => {
  const handleJoinClick = () => {
    // Navigate to membership form or scroll to contact section
    window.location.href = '/contact';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-24 pb-40 overflow-hidden relative z-20">
        <ImageCube size={6.0} rotationSpeed={0.01} position={{ x: 0, y: 0, z: 0 }} forceVisible={true} />
        <BackgroundBeams />
        <div className="text-left w-full pl-4 md:pl-8 relative z-10" style={{ maxWidth: '96rem', overflow: 'visible' }}>
          {/* Title */}
          <div className="mb-16 relative">
            <ScrollTriggeredText
              words="Our Mission"
              className="text-4xl md:text-5xl font-primary text-white mb-4 leading-tight"
              duration={0.8}
              filter={false}
              twoLines={true}
            />
          </div>
          <ScrollTriggeredText
            words="To establish Creative Technology as a visible and influential discipline—one that pioneers new ground through partnerships, experimentation, and demonstrations that empower practitioners to shape the future."
            className="text-zinc-400 text-xl font-medium max-w-2xl font-secondary pr-8 lg:pr-0 relative z-30"
            duration={0.6}
            delay={1.2}
            filter={false}
          />
        </div>
      </section>

      {/* New Div Section */}
      <section className="min-h-screen flex items-center justify-center pt-24 pb-40 overflow-hidden relative z-20">
        <div className="text-left w-full pl-4 md:pl-8 relative z-10" style={{ maxWidth: '96rem', overflow: 'visible' }}>
          {/* Title */}
          <div className="mb-16 relative">
            <ScrollTriggeredText 
              words="Thriving in community"
              className="text-4xl md:text-5xl font-primary text-white mb-4 leading-tight"
              duration={0.8}
              filter={false}
              twoLines={true}
            />
          </div>
          <ScrollTriggeredText 
            words="Every month, we gather to share knowledge and push boundaries. In between, we partner with forward-thinking companies to unlock the transformative potential of Creative Technology—turning ideas into reality and innovation into impact."
            className="text-zinc-400 text-xl font-medium max-w-2xl font-secondary pr-8 lg:pr-0 relative z-30"
            duration={0.6}
            delay={1.2}
            filter={false}
          />
          <div className="mt-8">
            <ButtonColorful
              onClick={() => window.location.href = '/contact'}
              label="Partner with us"
              className="px-8 py-4 text-lg font-semibold"
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
              className="text-zinc-400 text-lg font-medium max-w-3xl mx-auto font-secondary mb-8"
              duration={0.6}
              delay={0.6}
              filter={false}
            />
            <div className="flex justify-center">
              <ButtonColorful
                onClick={() => window.location.href = '/membership-form'}
                label="Become a Global Member"
                className="px-8 py-4 text-lg font-medium"
              />
            </div>
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