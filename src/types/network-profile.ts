// Focus areas are now customizable strings - users can add their own
export type FocusArea = string;

export type AvailabilityStatus = 
  | 'open-to-work'
  | 'open-to-collaborations'
  | 'not-available';

export type MembershipType = 'beta' | 'full';

export interface Project {
  id: string;
  title: string;
  imageUrl?: string;  // Optional - enriched projects may not have images
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
  // Creative Tech Spectrum: 0=design-focused, 50=hybrid, 100=dev-focused (all within creative technology)
  creativeSpectrum: number;
  // Membership type: 'beta' for approved beta members, 'full' for upgraded/direct members
  membershipType?: MembershipType;
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
  // Creative Tech Spectrum: 0=design-focused, 50=hybrid, 100=dev-focused (all within creative technology)
  creativeSpectrum: number;
}

/**
 * Get a human-readable label for a creative tech spectrum value (0-100).
 * Both ends are creative technologists — this indicates whether they lean
 * more toward design or development in their creative practice.
 */
export function getSpectrumLabel(value: number): string {
  if (value <= 15) return 'Design-Focused';
  if (value <= 35) return 'Design-Leaning';
  if (value <= 64) return 'Hybrid Creative';
  if (value <= 84) return 'Dev-Leaning';
  return 'Dev-Focused';
}

/**
 * Get the gradient color for a spectrum position.
 * Violet (design-focused) → neutral (hybrid) → cyan (dev-focused)
 */
export function getSpectrumColor(value: number): string {
  if (value <= 20) return 'rgb(139, 92, 246)'; // violet-500
  if (value <= 40) return 'rgb(167, 139, 250)'; // violet-400
  if (value <= 60) return 'rgb(161, 161, 170)'; // zinc-400
  if (value <= 80) return 'rgb(103, 232, 249)'; // cyan-300
  return 'rgb(6, 182, 212)'; // cyan-500
}

// Suggested focus areas - users can select from these or add their own
export const SUGGESTED_FOCUS_AREAS = [
  'Immersive Experiences (AR/VR/XR)',
  'Interactive Web Development',
  'Creative Coding',
  'Generative Art',
  'Algorithmic Design',
  'AI & Machine Learning',
  'Creative Automation',
  'Physical Computing',
  'IoT & Hardware',
  'Real-time Visuals',
  'Live Performance',
  'Motion Design',
  'Data Visualization',
  '3D Design & Animation',
  'Game Development',
  'Audio & Sound Design',
  'Projection Mapping',
  'Spatial Computing',
  'Digital Installations',
  'Brand Experience',
  'Product Design',
  'UX/UI Design',
  'Creative Direction',
  'Technical Direction',
  'Experiential Marketing',
  'Interactive Installations',
];

// Legacy mapping for backwards compatibility with old focus area values
export const LEGACY_FOCUS_AREA_MAP: Record<string, string> = {
  'immersive-experiences': 'Immersive Experiences (AR/VR/XR)',
  'interactive-web': 'Interactive Web Development',
  'generative-design': 'Generative Art',
  'creative-automation': 'AI & Machine Learning',
  'physical-computing': 'Physical Computing',
  'realtime-visuals': 'Real-time Visuals',
};

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

// Alias for backwards compatibility
export const FOCUS_AREAS = SUGGESTED_FOCUS_AREAS;
