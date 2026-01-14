export type FocusArea = 
  | 'immersive-experiences'
  | 'interactive-web'
  | 'generative-design'
  | 'creative-automation'
  | 'physical-computing'
  | 'realtime-visuals';

export type AvailabilityStatus = 
  | 'open-to-work'
  | 'open-to-collaborations'
  | 'not-available';

export interface Project {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  link?: string;
}

export interface NetworkProfile {
  id: string;
  userId?: string;
  fullName: string;
  location: string;
  email: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  otherSocialLinks?: string[];
  bio: string;
  focusAreas: FocusArea[];
  skills: string[];
  projects: Project[];
  availability: AvailabilityStatus;
  isCtcMember: boolean;
  profilePictureUrl?: string;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  // Embedding fields for AI-powered job matching
  embedding?: number[] | null;
  embeddingUpdatedAt?: string | null;
  enrichedContent?: string | null;
}

export interface ProfileFormData {
  fullName: string;
  location: string;
  email: string;
  portfolioUrl: string;
  linkedinUrl: string;
  otherSocialLinks: string;
  bio: string;
  focusAreas: FocusArea[];
  skills: string[];
  projects: Project[];
  availability: AvailabilityStatus;
  isCtcMember: boolean;
  profilePictureUrl: string;
}

export const FOCUS_AREAS: { value: FocusArea; label: string; description: string }[] = [
  { 
    value: 'immersive-experiences', 
    label: 'Immersive Experiences', 
    description: 'AR/VR/XR' 
  },
  { 
    value: 'interactive-web', 
    label: 'Interactive Web/Creative Development', 
    description: 'WebGL, Creative Coding' 
  },
  { 
    value: 'generative-design', 
    label: 'Generative/Algorithmic Design', 
    description: 'Procedural Art' 
  },
  { 
    value: 'creative-automation', 
    label: 'Creative Automation/AI', 
    description: 'AI Tools, Automation' 
  },
  { 
    value: 'physical-computing', 
    label: 'Physical Computing', 
    description: 'Hardware, IoT' 
  },
  { 
    value: 'realtime-visuals', 
    label: 'Real-time/Live Visuals', 
    description: 'VJing, Live Performance' 
  },
];

export const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: 'open-to-work', label: 'Open to work' },
  { value: 'open-to-collaborations', label: 'Open to collaborations' },
  { value: 'not-available', label: 'Not available' },
];

export const SUGGESTED_SKILLS = [
  '8th Wall',
  'Three.js',
  'TouchDesigner',
  'Unity',
  'Unreal Engine',
  'Blender',
  'n8n',
  'WebGL',
  'p5.js',
  'Max/MSP',
  'Arduino',
  'Runway',
  'Stable Diffusion',
  'Midjourney',
  'GLSL',
  'React',
  'Next.js',
  'GSAP',
  'Framer Motion',
  'After Effects',
  'Cinema 4D',
  'Houdini',
  'Figma',
  'Spark AR',
  'Lens Studio',
  'Processing',
  'OpenFrameworks',
  'Cables.gl',
  'ComfyUI',
  'Python',
  'TensorFlow',
  'PyTorch',
  'Raspberry Pi',
  'ESP32',
  'Resolume',
  'Notch',
  'VVVV',
];
