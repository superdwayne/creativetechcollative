import React from 'react';
import { ButtonColorful } from '../components/ui/button-colorful';
import { BackgroundPaths } from '../components/ui/background-paths';
import { AlertTriangle, Shield, Users, Wrench, Share2, Coffee } from 'lucide-react';

const N8nOnboardingPage: React.FC = () => {
  const handleProceed = () => {
    window.open('https://n8n.creativetechnologists.nl', '_blank');
  };

  const rules = [
    {
      icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
      title: "Keep It Clean",
      description: "No spam, no unsolicited emails, no sketchy automation. Let's keep our server healthy and our reputation intact. Think of it as good digital citizenship."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Your Stuff Stays Private",
      description: "Your workflows and credentials are yours alone. Other community members can't peek at your automations or steal your API keys."
    },
    {
      icon: <Shield className="w-8 h-8 text-yellow-400" />,
      title: "Admin Transparency",
      description: "Heads up: Dwayne and Florido have admin access and could technically use your credentials in workflows. We're trustworthy folks, but only connect services you're comfortable sharing within our tight-knit community."
    },
    {
      icon: <Coffee className="w-8 h-8 text-orange-400" />,
      title: "Play Nice with APIs",
      description: "Respect rate limits and terms of service for any platforms you connect. Nobody wants to get banned from their favorite tools because someone went overboard."
    },
    {
      icon: <Wrench className="w-8 h-8 text-green-400" />,
      title: "Need Something Custom?",
      description: "Want a specific plugin or integration? Just ask! Drop Florido or Dwayne a message and we'll see what we can do to make your automation dreams come true."
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: "Share the Love",
      description: "Built something awesome? We'd love to see it! Our N8N server is all about learning from each other and pushing the boundaries of what's possible with automation. Share your workflows, templates, or case studies with the community — we can even feature them in our exclusive whitepaper collection behind an email wall to help grow our collective knowledge base."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
      {/* Background Paths Animation */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <BackgroundPaths />
      </div>
      
      <div className="max-w-5xl mx-auto w-full relative z-10 pt-16 md:pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary text-white leading-tight mb-6 md:mb-8">
            Welcome to Our N8N Server
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-medium font-secondary max-w-2xl mx-auto">
            Ready to automate like a pro? Here are a few friendly guidelines to keep our shared automation playground running smoothly for everyone.
          </p>
        </div>

        <div className="bg-zinc-900/30 border-0 md:border border-zinc-800 md:rounded-xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl md:text-3xl font-primary text-white mb-4 md:mb-6">
            Community Guidelines
          </h2>
          
          <div className="space-y-6">
            {rules.map((rule, index) => (
              <div key={index} className="flex gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                <div className="flex-shrink-0">
                  {rule.icon}
                </div>
                <div>
                  <h3 className="text-lg font-primary text-white mb-2 font-semibold">
                    {rule.title}
                  </h3>
                  <p className="text-zinc-300 font-secondary leading-relaxed text-sm md:text-base">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="bg-zinc-900/30 border-0 md:border border-zinc-800 md:rounded-xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-primary text-white mb-4 md:mb-6">
              Ready to Automate?
            </h3>
            <p className="text-zinc-400 font-secondary mb-6 md:mb-8 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              By clicking below, you're agreeing to follow these guidelines.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonColorful
                onClick={handleProceed}
                label="Access N8N Server"
                className="w-full sm:w-auto min-h-[48px] px-8 text-base font-semibold"
              />
              <button
                onClick={() => window.history.back()}
                className="w-full sm:w-auto min-h-[48px] px-8 text-base font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nOnboardingPage;