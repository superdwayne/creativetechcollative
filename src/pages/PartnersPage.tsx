import React from 'react';
import EmailSignup from '../components/EmailSignup';

const PartnersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16 pt-16">
          <h1 className="text-3xl md:text-5xl text-white font-primary leading-relaxed max-w-4xl mx-auto" style={{ fontFamily: 'var(--font-primary)' }}>
            A big shout out to all the partners who support our mission.
          </h1>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-0 mt-20 border-[0.5px] border-white max-w-6xl mx-auto">
          {/* Row 1 */}
          <div className="border-r-[0.5px] border-b-[0.5px] border-white p-6 md:p-12 flex items-center justify-center h-32 md:h-48 bg-black">
            <img 
              src="/sponsors/Leonardo-AI.png" 
              alt="Leonardo AI" 
              className="max-h-12 md:max-h-20 max-w-full object-contain"
            />
          </div>
          
          <div className="border-b-[0.5px] md:border-r-[0.5px] border-white p-6 md:p-12 flex items-center justify-center h-32 md:h-48 bg-black">
            <img 
              src="/sponsors/SAMA.png" 
              alt="SAMA" 
              className="max-h-12 md:max-h-20 max-w-full object-contain"
            />
          </div>
          
          <a href="https://www.kiriengine.app/" target="_blank" rel="noopener noreferrer" className="border-r-[0.5px] border-b-[0.5px] border-white p-6 md:p-12 flex items-center justify-center h-32 md:h-48 bg-black hover:bg-zinc-900 transition-colors">
            <img 
              src="/sponsors/KIRI.png" 
              alt="KIRI" 
              className="max-h-12 md:max-h-20 max-w-full object-contain"
            />
          </a>

          {/* Row 2 */}
          <div className="border-b-[0.5px] md:border-r-[0.5px] border-white p-6 md:p-12 flex items-center justify-center h-32 md:h-48 bg-black">
            <img 
              src="/sponsors/Lumalabs.png" 
              alt="Luma Labs" 
              className="max-h-12 md:max-h-20 max-w-full object-contain"
            />
          </div>
          
          <div className="border-r-[0.5px] border-b-[0.5px] border-white p-6 md:p-12 flex items-center justify-center h-32 md:h-48 bg-black">
            <img 
              src="/sponsors/newamsterdam.png" 
              alt="New Amsterdam" 
              className="max-h-12 md:max-h-20 max-w-full object-contain"
            />
          </div>
          
          <a href="https://www.solaya.ai/" target="_blank" rel="noopener noreferrer" className="border-b-[0.5px] border-white p-6 md:p-12 flex items-center justify-center h-32 md:h-48 bg-black hover:bg-zinc-900 transition-colors">
            <img 
              src="/sponsors/instagram-logo.jpg" 
              alt="Solaya" 
              className="max-h-12 md:max-h-20 max-w-full object-contain rounded-full"
            />
          </a>
        </div>

        {/* Email Signup Section */}
        <div className="mt-20 pt-16">
          <EmailSignup hideIntro={true} />
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;
