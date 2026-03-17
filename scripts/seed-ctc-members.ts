import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CTC Members data from HeroPage
const ctcMembers = [
  {
    name: 'Dwayne',
    fullName: 'Dwayne Paisley-Marshall',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0cc5d6-ffad-6620-98ef-eaff95ce3d9d/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Lead Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Passionate about bridging the gap between creativity and technology. Specializes in interactive experiences and emerging tech.',
    focusAreas: ['immersive-experiences', 'creative-automation', 'interactive-web'],
    skills: ['8th Wall', 'Three.js', 'React', 'Next.js', 'TouchDesigner', 'n8n', 'Python']
  },
  {
    name: 'Adina',
    fullName: 'Adina',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0844-6761-6690-972f-7328f1f796b2/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'London, UK',
    bio: 'Creative Technologist with a background in fashion, working at the intersection of digital storytelling and computational design. I explore emerging tools and workflows across 3D, hardware, and code, transforming concepts into functional prototypes.',
    focusAreas: ['generative-design', 'physical-computing', 'interactive-web'],
    skills: ['Blender', 'Processing', 'Arduino', 'Python', 'TouchDesigner']
  },
  {
    name: 'Deniz',
    fullName: 'Deniz',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0842-6982-6110-a569-25e91729e045/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Rotterdam, NL',
    bio: 'Rotterdam-based creative technologist and interdisciplinary media artist, shaping future-facing experiences. Her work investigates how emerging technologies and data shape human and ecological systems, using algorithmic tools to explore themes like nature, speculative futures, and biomimicry.',
    focusAreas: ['generative-design', 'realtime-visuals', 'creative-automation'],
    skills: ['TouchDesigner', 'Processing', 'GLSL', 'Max/MSP', 'Python']
  },
  {
    name: 'Florido',
    fullName: 'Florido',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0851-85de-65c0-b989-86760e8ff604/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Creative technologist at TBWA, working at the intersection of brand, design, and automation. I help turn strategic ideas into systems that scale, combining brand thinking with hands-on execution across AI workflows, automation, APIs, and custom tooling.',
    focusAreas: ['creative-automation', 'interactive-web'],
    skills: ['n8n', 'Python', 'React', 'Next.js', 'Figma']
  },
  {
    name: 'Karoline',
    fullName: 'Karoline Winzer',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0cc5f0-c164-61b0-b158-fd3192a0b178/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'London, UK',
    bio: 'Creative technologist working at the intersection of physical and digital spaces. Inspired by interconnected systems in nature, music, and biology, she blends real-time software, physical computing, and interactive technologies to build experiences that connect people.',
    focusAreas: ['physical-computing', 'realtime-visuals', 'immersive-experiences'],
    skills: ['TouchDesigner', 'Arduino', 'Processing', 'Max/MSP', 'Resolume']
  },
  {
    name: 'Pax',
    fullName: 'Pax',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0cc978-88a5-6320-924a-e78626bf0fa7/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'As a creative, I use technology as my medium to shape innovative solutions across multiple design disciplines. I see technology & innovation as core values that enable brands to express themselves.',
    focusAreas: ['interactive-web', 'immersive-experiences', 'creative-automation'],
    skills: ['Three.js', 'WebGL', 'React', 'GSAP', 'Figma']
  },
  {
    name: 'Joshua',
    fullName: 'Joshua',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0846-659b-6160-a7f3-9ebe7914d494/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'London, UK',
    bio: 'Creative Technologist focused on finding innovative ways to deliver brand and advertising at scale. He combines hands-on research with design expertise to build workflows that help creatives work confidently with Generative AI.',
    focusAreas: ['creative-automation', 'generative-design'],
    skills: ['Stable Diffusion', 'Midjourney', 'ComfyUI', 'Python', 'Runway']
  },
  {
    name: 'Jennifer',
    fullName: 'Jennifer',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0847-3695-69f0-bc11-ee26cb3ec314/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Passionate about creating impactful digital experiences that push the boundaries of creativity and technology.',
    focusAreas: ['interactive-web', 'creative-automation'],
    skills: ['React', 'Three.js', 'GSAP', 'Figma']
  },
  {
    name: 'Koen',
    fullName: 'Koen',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d084a-6fb8-6f90-b541-ce33d6476d8f/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Creative technologist focused on developing impactful, innovative solutions that blend technology, design, and functionality. With over a decade of experience rapidly prototyping and exploring emerging technologies for web, mobile, AR/VR, and custom hardware.',
    focusAreas: ['immersive-experiences', 'interactive-web', 'physical-computing'],
    skills: ['Unity', 'Unreal Engine', '8th Wall', 'Three.js', 'Arduino', 'React']
  },
  {
    name: 'John',
    fullName: 'John Nussey',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0861-a190-6dd0-9325-6f2380bd7a6b/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'London, UK',
    bio: 'Designer, technologist, and entrepreneur whose work lies at the intersection of electronics, materials, and human experience. Co-founder and director of ONN Studio, leading projects combining physical computing, sensor systems, and crafted interfaces.',
    focusAreas: ['physical-computing', 'interactive-web'],
    skills: ['Arduino', 'Raspberry Pi', 'ESP32', 'Processing', 'React']
  },
  {
    name: 'Martin',
    fullName: 'Martin',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0862-1d8b-6250-917a-d52f548bd1d6/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Inventive and passionate creative technologist whose work sits at the exciting crossroads of art, design, and technology. With curiosity and a multidisciplinary mindset, Martin blends creativity with technical precision to craft compelling digital experiences and interactive installations.',
    focusAreas: ['interactive-web', 'realtime-visuals', 'generative-design'],
    skills: ['Three.js', 'WebGL', 'GLSL', 'TouchDesigner', 'Processing']
  },
  {
    name: 'Rui',
    fullName: 'Rui',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0862-7e80-6ec0-b1e7-fc362c7ab00a/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Lisbon, PT',
    bio: 'Compulsive researcher and creative technologist with background in copywriting, strategy and academic research. Currently leads a team of AI generalists finding new ways of expressing creativity through technology. Systems thinker, always in beta.',
    focusAreas: ['creative-automation', 'generative-design'],
    skills: ['Python', 'Stable Diffusion', 'ComfyUI', 'n8n', 'Runway']
  },
  {
    name: 'Olivia',
    fullName: 'Olivia',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0863-5e28-6c80-95e4-c59212235f6b/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'London, UK',
    bio: 'Creative technologist, digital artist and educator working at the intersection of emerging tech and culture. Her work is rooted in the multi-sensory, using real-time reactive technologies to shape and create immersive spaces.',
    focusAreas: ['realtime-visuals', 'immersive-experiences', 'physical-computing'],
    skills: ['TouchDesigner', 'Resolume', 'Max/MSP', 'Processing', 'Arduino']
  },
  {
    name: 'Edwin',
    fullName: 'Edwin Nikkels',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0868-b294-6c60-945a-f3b9e8457fbc/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Operates at the intersection of storytelling, design, and emerging technology. With over twenty years of experience across film, television, games, interactive media, and advertising. Focuses on making complex technologies—especially generative AI and immersive media—accessible, playful, and meaningful.',
    focusAreas: ['creative-automation', 'immersive-experiences', 'generative-design'],
    skills: ['Unreal Engine', 'Unity', 'Stable Diffusion', 'Midjourney', 'After Effects']
  },
  {
    name: 'Rohit',
    fullName: 'Rohit Gupta',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0869-165d-6350-9de3-5837c81f848c/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Barcelona, ES',
    bio: 'Engineer, designer, and researcher whose work lies at the intersection of strategy, emerging technologies, and prototyping. Runs Studio-021, helping clients bring ideas to life in domains like innovation, art, AI, marketing, and fabrication.',
    focusAreas: ['physical-computing', 'creative-automation', 'interactive-web'],
    skills: ['Arduino', 'Python', 'React', 'Blender', 'Processing']
  },
  {
    name: 'Scy',
    fullName: 'Scy',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0869-8b32-6e00-8f79-79dffa4149bd/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Passionate creative technologist with expertise in interactive design, web development, and digital experiences.',
    focusAreas: ['interactive-web', 'creative-automation'],
    skills: ['React', 'Three.js', 'GSAP', 'Next.js', 'WebGL']
  },
  {
    name: 'Tom',
    fullName: 'Tom',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d8f40-f643-6290-a707-37753de6301e/gemini-image-2_a_stunning_illustration_of_Transform_the_person_from_the_attached_photo_into_a_s-0.jpg',
    role: 'Creative Technologist',
    location: 'Hamburg, DE',
    bio: 'Hamburg-based Creative Technologist who sees himself as half creative, half nerd, right at home where design, technology, and innovation meet. Started designing graphical user interfaces but spent the past ten years exploring the technical side of human–machine interaction.',
    focusAreas: ['interactive-web', 'physical-computing', 'immersive-experiences'],
    skills: ['React', 'Three.js', 'Unity', 'Arduino', 'Figma']
  },
  {
    name: 'Fernando',
    fullName: 'Fernando',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0873-b3b2-66a0-a4e8-554462dbf234/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Passionate about innovative digital experiences that combine creativity with cutting-edge technology.',
    focusAreas: ['interactive-web', 'immersive-experiences'],
    skills: ['Three.js', 'React', 'WebGL', 'GSAP']
  },
  {
    name: 'Christos',
    fullName: 'Christos',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0874-2828-6de0-8cf9-86dd7b3665ce/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: "As a Creative Technologist, I've gone from playing EDM festivals to creating art installations, from building custom hardware to designing the next generation of AI apps. I just love this field, man.",
    focusAreas: ['physical-computing', 'realtime-visuals', 'creative-automation'],
    skills: ['TouchDesigner', 'Arduino', 'Max/MSP', 'Python', 'Resolume']
  },
  {
    name: 'Erin',
    fullName: 'Erin',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d4312-5225-6b60-893a-23e509e0935d/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
    role: 'Creative Technologist',
    location: 'London, UK',
    bio: 'Leading AI innovation within creative agencies, helping brands reshape workflows and ideas through rapid prototyping. Showing teams that technology is not a barrier but the future of their best work, turning half formed concepts into playful interactive demos.',
    focusAreas: ['creative-automation', 'interactive-web'],
    skills: ['Python', 'React', 'Stable Diffusion', 'ComfyUI', 'n8n']
  },
  {
    name: 'Robin Hunter',
    fullName: 'Robin Hunter',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d5cb6-3452-6a80-9d3a-27ff6b84bf07/gemini-image-2_A_cinematic_portrait_photograph_of_Transform_the_person_from_the_attached_photo_-0.jpg',
    role: 'Creative Technologist',
    location: 'London, UK',
    bio: 'Studied Creative Computing at Goldsmiths and has been working as a Creative Technologist for the last decade. He has built all kinds of things from esoteric trend websites to eye controlled keyboards for people with MND. Currently works at Burberry exploring how new technologies can bring a heritage brand to life.',
    focusAreas: ['interactive-web', 'creative-automation', 'physical-computing'],
    skills: ['React', 'Three.js', 'Python', 'Arduino', 'Processing']
  },
  {
    name: 'Job',
    fullName: 'Job',
    image: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d8d86-69da-6b70-a7de-33cbf308cd24/gemini-image-2_a_stunning_illustration_of_Transform_the_person_from_the_attached_photo_into_a_s-0.jpg',
    role: 'Creative Technologist',
    location: 'Amsterdam, NL',
    bio: 'Creative Technologist, elevating brand and loyalty concepts through intelligent tools and creative workflows.',
    focusAreas: ['creative-automation', 'interactive-web'],
    skills: ['React', 'Python', 'n8n', 'Next.js', 'Figma']
  },
];

function generateSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from('network_profiles')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (!data) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function seedMembers() {
  console.log('Starting to seed CTC members...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const member of ctcMembers) {
    try {
      // Check if member already exists by name
      const { data: existing } = await supabase
        .from('network_profiles')
        .select('id, full_name')
        .eq('full_name', member.fullName)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping ${member.fullName} - already exists`);
        skipped++;
        continue;
      }

      const baseSlug = generateSlug(member.fullName);
      const slug = await getUniqueSlug(baseSlug);

      const profileData = {
        full_name: member.fullName,
        location: member.location,
        email: `${member.name.toLowerCase()}@creativetechnologists.nl`, // placeholder email
        portfolio_url: null,
        linkedin_url: null,
        other_social_links: null,
        bio: member.bio,
        focus_areas: member.focusAreas,
        skills: member.skills,
        projects: [],
        availability: 'open-to-collaborations',
        is_ctc_member: true,
        profile_picture_url: member.image,
        slug,
        approved: true,
        approved_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('network_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${member.fullName}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Created profile for ${member.fullName} (${slug})`);
        created++;
      }
    } catch (err: any) {
      console.error(`❌ Error processing ${member.fullName}:`, err.message);
      errors++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total: ${ctcMembers.length}`);
}

seedMembers()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
