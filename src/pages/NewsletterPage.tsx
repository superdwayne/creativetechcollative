import React from 'react';
import EmailSignup from '../components/EmailSignup';
import Footer from '../components/ui/footer';

const NewsletterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Newsletter Section */}
      <section className="min-h-[80vh] flex items-center justify-center py-32 px-8 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase mb-6 block">
            Creative Technology Collective
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium text-white mb-8 leading-tight">
            Stay in the loop
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-secondary leading-relaxed mb-12 max-w-2xl mx-auto">
            Get exclusive insights into our latest experiments, behind-the-scenes updates on emerging tech projects, and early access to community events. Join our newsletter to stay at the forefront of creative technology innovation.
          </p>
          
          {/* Email Signup Form */}
          <EmailSignup hideIntro={true} />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NewsletterPage;
