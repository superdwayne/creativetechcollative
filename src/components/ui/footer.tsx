import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-6 md:py-8 px-8 w-full">
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6 text-center md:text-left">
        <div className="flex items-center gap-1 text-sm font-secondary justify-center md:justify-start order-2 md:order-1">
          Creative Technologist Collective 2025. All Rights Reserved
        </div>
        <div className="flex flex-wrap gap-4 md:gap-6 text-sm justify-center md:justify-end leading-tight order-1 md:order-2">
          <a href="/faq" className="hover:text-sky-400 font-secondary" onClick={(e) => { e.preventDefault(); window.location.href = '/faq'; }}>FAQ</a>
          <a href="/n8n-onboarding" className="hover:text-sky-400 font-secondary">N8N</a>
          <a href="https://www.linkedin.com/company/creativetechnologycollective" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 font-secondary">LinkedIn</a>
          <div className="w-full md:w-auto flex flex-wrap gap-4 md:gap-6 justify-center md:justify-end">
            <a href="/terms-and-conditions" className="hover:text-sky-400 font-secondary">Terms & Conditions</a>
            <a href="/privacy-policy" className="hover:text-sky-400 font-secondary">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;