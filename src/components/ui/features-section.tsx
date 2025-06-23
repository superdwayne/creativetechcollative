import React from 'react';
import { cn } from "@/lib/utils";
import { 
  Presentation, 
  Wrench, 
  Rocket, 
  Users, 
  Code, 
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const features: Feature[] = [
  {
    title: "Workshops",
    description: "We start by gaining a deep understanding of your business goals.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: "Presentations",
    description: "Next, our team of experts develops tailored solutions.",
    icon: <Presentation className="w-6 h-6" />,
  },
  {
    title: "MVP",
    description: "We leverage cutting-edge technology to implement seamlessly.",
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    title: "Consulting",
    description: "Strategic guidance for your creative technology initiatives.",
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    title: "Prototyping",
    description: "Rapid prototyping with Arduino, Raspberry Pi, and modern code frameworks.",
    icon: <Code className="w-6 h-6" />,
  },
  {
    title: "Innovation Labs",
    description: "Experimental projects pushing the boundaries of what's possible.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: "Strategy",
    description: "Long-term planning for digital transformation and growth.",
    icon: <Target className="w-6 h-6" />,
  },
  {
    title: "AI & Automation",
    description: "Intelligent automation solutions and AI-powered creative workflows.",
    icon: <Wrench className="w-6 h-6" />,
  },
];

export function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-zinc-800",
        (index === 0 || index === 4) && "lg:border-l border-zinc-800",
        index < 4 && "lg:border-b border-zinc-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-zinc-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-zinc-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-zinc-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-zinc-700 group-hover/feature:bg-purple-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white font-primary text-lg">
          {title}
        </span>
      </div>
      <p className="text-sm text-zinc-300 max-w-xs relative z-10 px-10 font-medium font-secondary">
        {description}
      </p>
    </div>
  );
};