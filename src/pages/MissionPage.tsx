import React from 'react';
import { ScrollTriggeredText } from '../components/ui/scroll-triggered-text';

const MissionPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center px-8 py-40 bg-black">
    <div className="max-w-3xl mx-auto text-center">
      <ScrollTriggeredText
        words="Our Mission"
        className="text-5xl md:text-7xl font-primary font-medium text-white mb-8"
        duration={0.8}
        filter={false}
      />
      <ScrollTriggeredText
        words="We're on a mission to make Creative Technology open to all—breaking down barriers, spreading knowledge, and putting powerful tools into the hands of anyone ready to build what's next."
        className="text-zinc-300 text-xl font-secondary font-medium leading-relaxed"
        duration={0.6}
        delay={0.8}
        filter={false}
      />
    </div>
  </div>
);

export default MissionPage; 