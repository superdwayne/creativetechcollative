export interface Job {
  id: string;
  slug: string;
  title: string;
  company: {
    name: string;
    logo?: string;
    website?: string;
  };
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  remote: boolean;
  description: string;
  requirements?: string[];
  salary?: {
    min?: number;
    max?: number;
    range?: string;
    currency?: string;
    period?: 'year' | 'month' | 'day' | 'hour';
  };
  applyUrl: string;
  source?: string;
  postedAt: string;
  closingDate?: string;
  featured?: boolean;
}

export const jobs: Job[] = [
  {
    id: '1',
    slug: 'creative-technologist-media-monks',
    title: 'Senior Creative Technologist',
    company: {
      name: 'Media.Monks',
      logo: '/companies/mediamonks.png',
      website: 'https://media.monks.com'
    },
    department: 'Technology',
    location: 'Amsterdam, NL',
    type: 'Full-time',
    remote: true,
    description: 'Media.Monks is looking for a Senior Creative Technologist to join their team. You\'ll work on innovative projects blending creativity with cutting-edge technology for global brands.',
    requirements: [
      '5+ years experience in creative technology',
      'Strong portfolio of digital experiences',
      'Proficiency in React, Three.js, WebGL'
    ],
    salary: {
      range: '€75K - €95K',
      period: 'year'
    },
    applyUrl: 'https://media.monks.com/careers',
    source: 'Company Website',
    postedAt: '2026-01-05',
    featured: true
  },
  {
    id: '2',
    slug: 'creative-developer-active-theory',
    title: 'Creative Developer',
    company: {
      name: 'Active Theory',
      logo: '/companies/activetheory.png',
      website: 'https://activetheory.net'
    },
    department: 'Development',
    location: 'Los Angeles, US',
    type: 'Full-time',
    remote: true,
    description: 'Active Theory is seeking a Creative Developer passionate about pushing the boundaries of web experiences. Join a team known for award-winning interactive work.',
    requirements: [
      'Expert JavaScript/WebGL skills',
      'Experience with 3D and motion',
      'Portfolio of creative web projects'
    ],
    salary: {
      range: '$120K - $160K',
      period: 'year'
    },
    applyUrl: 'https://activetheory.net/careers',
    source: 'LinkedIn',
    postedAt: '2026-01-07'
  },
  {
    id: '3',
    slug: 'experience-designer-unity',
    title: 'XR Experience Designer',
    company: {
      name: 'Unity Technologies',
      logo: '/companies/unity.png',
      website: 'https://unity.com'
    },
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    remote: true,
    description: 'Unity is hiring an XR Experience Designer to shape the future of immersive experiences. Work on next-gen tools and platforms used by creators worldwide.',
    requirements: [
      '3+ years XR design experience',
      'Unity or Unreal proficiency',
      'Strong UX background'
    ],
    applyUrl: 'https://careers.unity.com',
    source: 'Company Website',
    postedAt: '2026-01-06'
  },
  {
    id: '4',
    slug: 'freelance-creative-technologist-dept',
    title: 'Freelance Creative Technologist',
    company: {
      name: 'DEPT®',
      logo: '/companies/dept.png',
      website: 'https://dept.com'
    },
    department: 'Technology',
    location: 'Amsterdam, NL',
    type: 'Freelance',
    remote: true,
    description: 'DEPT® is looking for freelance Creative Technologists for upcoming projects. Ideal for those who love experimental work and pushing creative boundaries.',
    salary: {
      range: '€500 - €800',
      period: 'day'
    },
    applyUrl: 'https://dept.com/careers',
    source: 'CTC Network',
    postedAt: '2026-01-08'
  },
  {
    id: '5',
    slug: 'creative-coder-resn',
    title: 'Creative Coder',
    company: {
      name: 'Resn',
      logo: '/companies/resn.png',
      website: 'https://resn.co.nz'
    },
    department: 'Development',
    location: 'Wellington, NZ',
    type: 'Full-time',
    remote: false,
    description: 'Resn is hiring a Creative Coder to join their award-winning studio. Work on playful, boundary-pushing digital experiences for global clients.',
    requirements: [
      'Strong creative coding portfolio',
      'JavaScript/TypeScript expertise',
      'Love for experimental work'
    ],
    applyUrl: 'https://resn.co.nz/jobs',
    source: 'Company Website',
    postedAt: '2026-01-03'
  }
];

export const getJobBySlug = (slug: string): Job | undefined => {
  return jobs.find(job => job.slug === slug);
};

export const getFeaturedJobs = (): Job[] => {
  return jobs.filter(job => job.featured);
};

export const getJobsByDepartment = (department: string): Job[] => {
  return jobs.filter(job => job.department === department);
};

export const getDepartments = (): string[] => {
  return [...new Set(jobs.map(job => job.department))];
};

export const getJobTypes = (): string[] => {
  return [...new Set(jobs.map(job => job.type))];
};
