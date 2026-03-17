export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  category: string;
  tags: string[];
  coverImage?: string;
  publishedAt: string;
  readingTime: number;
  featured?: boolean;
}

export const articles: Article[] = [
  {
    id: '6',
    slug: 'from-tools-to-systems-the-missing-layer-of-ai-innovation',
    title: 'From Tools to Systems: The Missing Layer of AI Innovation',
    subtitle: 'We are adopting advanced tools faster than we are learning how to integrate them into reasonable systems',
    excerpt: 'As an AI program leader I have observed a recurring pattern: we are adopting advanced tools faster than we are learning how to integrate them into reasonable systems.',
    content: `
As an AI program leader I have observed a recurring pattern: we are adopting advanced tools faster than we are learning how to integrate them into reasonable systems.

## The Race Between Creation and Decision-Making

Today's technology opportunities are extraordinary thanks to AI. One big win is in the Creative industry, where velocity has exploded. Now, we can generate virtual environments in minutes, prototype instantly, and produce infinite variations with instant feedback improvements. Creation is no longer limited. Decision-making is.

Like the Road Runner and Wile E. Coyote, technology sprints forward while organizational systems are left chasing it. Projects still depend on human validation, governance processes, countless leadership escalations, and executive alignment. These systems move slowly by design, while generative technologies move at unprecedented speed.

When creation becomes faster than decision, organizations accumulate creative overflow. Many great ideas, prototypes, and experiences never see the light of day, not because they lack quality, but because they cannot be absorbed and escale.

## Innovation Without Integration

In this 'Age of AI Omnipresence', another big elephant in the room no one is talking about, is lack of integration. We have powerful AI tools for coding, UX design, image and video generation, real-time 3D, world-building, and simulation. Whatever you imagine, someone is already building it. However, most tools are developed in isolation, each optimized for its own roadmap, metrics, and business model.

Very few tech solutions are designed to work seamlessly with others, even within the same industry. While exploring real-time 3D and animation workflows, I was amazed by how many talented creators spend more time connecting the dots, understanding each tool, rather than using them. Forums and documentation pages are filled with workarounds rather than long-term escalable solutions.

This issue is also visible across industries. In some autonomous vehicle development, AI is used to simulate camera viewpoints and reconstruct 360-degree environments, while generative world models and real-time 3D technologies advance separately in creative industries.

We are missing the opportunity to integrate these systems, and start delivering meaningful and unimaginable remarkable components, as a whole.

## Beyond Technical Performance

The industry remains focused on technical metrics: resolution, latency, speed, and scale. These matter, off-course, but what about: how tools interact, how decisions are made, how people manage complexity and ambiguity, and how systems are sustained over time. Many workflows depend on invisible human effort to compensate for fragile integrations and fragmented architectures.

The next phase of innovation will be defined not by what we can generate, but by what we can sustain.
    `,
    author: {
      name: 'Fabiola Campos',
      avatar: 'https://bjosgymtikxiliknfjvu.supabase.co/storage/v1/object/public/profile-images/e56966b0-38cb-452f-951c-3cb69ef7e8a3/profile-1768666815672.png',
      role: 'AI Program Leader'
    },
    category: 'Industry Insights',
    tags: ['AI', 'Innovation', 'Systems Thinking', 'Integration', 'Creative Technology'],
    coverImage: '/email-images/tools-to-systems.jpg',
    publishedAt: '2026-03-05',
    readingTime: 5,
    featured: false
  },
  {
    id: '5',
    slug: 'the-power-of-the-possible',
    title: 'The Power of the Possible',
    subtitle: 'Getting to places you couldn\'t previously reach',
    excerpt: 'As Creative Technologists, we often live in the gap between the What If and the How To. Thanks to Generative AI, that barrier to entry has collapsed. Now all it requires is the seed of an idea and a way to communicate it.',
    content: `
As Creative Technologists, we often live in the gap between the What If and the How To. For a long time, bridging that gap required a specific, deep technical fluency.

But my experience as a non-technical technologist has revealed a new alternative. Thanks to Generative AI, that barrier to entry has collapsed. Now all it requires is the seed of an idea and a way to communicate it. It allows us to harness the power of the possible, and get us to places that were previously out of reach.

I want to share a methodology we've developed for creative production at SAMY, to support in navigating this shift, and a few examples of how it's changing our conversation with clients.

## The Production Triangle

When deciding if AI is the right tool for creative production, we use a framework called The Production Triangle. It assesses projects against three core constraints: Time, Budget, and Feasibility.

![The Production Triangle](/email-images/production-triangle.jpeg "The Production Triangle - Developed by SAMY")

In a perfect world where all three resources are abundant, traditional production is the answer. However, when you remove one pillar, Generative Production becomes a strong candidate:

- **If you need delivery in days, or high-volume ad variations?** AI allows for Rapid Iteration.
- **If the vision exceeds the funds (e.g., travel logistics are too high)?** AI allows you to create Brand Visuals with virtual photoshoots.
- **If the concept is physically impossible or fantastical?** AI helps visualise Impossible Concepts.

This triangle helps move the conversation from *Can we use AI?* to *Should we use AI to solve this specific constraint?*

It's not just creative production where this can help though, rapid prototyping became truly rapid.

## From Graphic to Logic

Identifying the need is step one. Building the solution is step two. I recently needed to present some ideas for a quote estimator to a client. In the past, I would have mocked up a static UI in Figma, maybe even animated it. It would look pretty, but it would be rigid.

Using Google AI Studio, I was able to build a quick web app with simple back-end logic and a user-friendly interface. Instead of showing the client a picture of a calculator, I sent them a link to the calculator.

![Quote Estimator UI](/email-images/quote-estimator.jpeg "A working prototype built with Google AI Studio")

This changed the trajectory of the meeting. We weren't debating the layout; we were testing the logic - can we add on fixed costs for London travel? Can we include contracted trade? It got us to a further stage in the conversation instantly because the client could interact with the value proposition, not just look at it.

## Connecting the Dots

This extends beyond simple web apps. AI has allowed me to interact with APIs and connect software that were previously reserved for those who could write complex scripts.

I can now take a workflow that exists only in my head—connecting Tool A to Tool B to trigger Action C—and use AI to write the glue that binds them. I can build a working prototype that tests whether a concept works before ever bothering an engineer.

Does this replace their team? Absolutely not. But it allows me to hand them a working model rather than a vague brief. It turns *I have an idea* into *Here is how it works, now let's make it scalable*.

## The Power of the Possible

Ultimately, this is what harnessing the power of the possible means. It is the ability to take the connected dots living in your head and turn them into real, interactive experiences.

It bridges the gap between abstraction and reality. Now, the people that I constantly badger with new ideas (my friends, my colleagues, my girlfriend) can finally see what I'm describing, and the client can actually buy it.
    `,
    author: {
      name: 'Joshua J. M. Smith',
      avatar: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0d0846-659b-6160-a7f3-9ebe7914d494/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
      role: 'Creative Technologist'
    },
    category: 'Creative Technology',
    tags: ['Generative AI', 'Creative Production', 'Prototyping', 'Innovation', 'Methodology'],
    coverImage: '/email-images/power-of-possible.jpeg',
    publishedAt: '2026-01-29',
    readingTime: 5,
    featured: true
  },
  {
    id: '4',
    slug: 'tech-washing-when-innovation-is-just-a-slide-in-the-deck',
    title: 'Tech-Washing: When Innovation is Just a Slide in the Deck',
    excerpt: 'Over the past few years, I\'ve noticed a recurring pattern in how organizations talk about innovation. I\'ve started calling it Tech-Washing.',
    content: `
Over the past few years, I've noticed a recurring pattern in how organizations talk about innovation. I've started calling it Tech-Washing.

We live in an era dominated by buzzwords: digital transformation, blockchain, online-to-offline and more recently AI, machine learning, and agentic systems. These terms are used confidently and repeatedly, often by people who may not fully grasp the operational reality behind them.

## Innovation as a Signal

This ambition usually originates from the top. Innovation becomes a signal, a reassurance to boards, shareholders, and the market that the organization is future-proof. That signal travels downward, moving from the C-suite to middle management, into objectives and KPIs, and eventually into briefs for creative agencies. By that time, innovation is no longer a question. It's a mandate.

## The Agency Response

Agencies respond the only way they can. Wanting to be relevant and forward-thinking, they translate aspiration into proposals. Technology gets layered in as platforms, systems, interactive experiences, machine learning, or AI solutions. The deck looks strong. Everyone is aligned. Leadership is excited. Middle management feels validated because the "innovation" box has been checked.

## Then, Reality Hits

Budgets tighten. Timelines shrink. Scope is reviewed. One by one, the "innovative" features are gradually removed. The system becomes a concept. The AI becomes pre-packaged content. Immersive experiences turn into a flat execution. What remains is a simplified version of the original vision, often stripped of the very elements that were meant to make it transformative.

## A Repeating Pattern

This cycle repeats itself again and again. Agencies end up stuck in the middle: expected to think innovatively, while knowing that much of that work will never make it to production. This creates unnecessary strain on teams, resources, and client relationships. Over time, it creates something more corrosive: innovation fatigue. The term 'innovation' itself starts to lose meaning.

## A Shared Responsibility

Agencies don't control leadership mandates, but they do control how honestly those mandates are translated. Sometimes the most innovative choice is having the confidence to leave technology out, when it doesn't serve us. Because if innovation only exists before the budget conversation starts, it was never a priority to begin with.

## Moving Beyond the Pitch Deck

Tech-washing isn't due to lack of ambition, but a lack of follow-through. Real innovation requires structural change, realistic budgeting, and clarity about what specific technology is actually meant to achieve. Without that, technology becomes just another layer of branding—a signal, a checkbox, a slide in the deck.
    `,
    author: {
      name: 'Pax',
      avatar: 'https://cdn.leonardo.ai/users/0bf3594c-4370-4dd3-bfe3-6ab88b8bee22/generations/1f0cc978-88a5-6320-924a-e78626bf0fa7/gemini-image-2_Transform_the_person_from_the_attached_photo_into_a_smooth_stylized_3D_cartoon_c-0.jpg',
      role: 'Creative Technologist'
    },
    category: 'Industry Insights',
    tags: ['Innovation', 'Agency Life', 'Tech Industry', 'Strategy'],
    coverImage: '/email-images/techwashing.jpeg',
    publishedAt: '2026-01-08',
    readingTime: 5,
    featured: false
  }
];

export const getArticleBySlug = (slug: string): Article | undefined => {
  return articles.find(article => article.slug === slug);
};

export const getFeaturedArticles = (): Article[] => {
  return articles.filter(article => article.featured);
};

export const getArticlesByCategory = (category: string): Article[] => {
  return articles.filter(article => article.category === category);
};

export const getCategories = (): string[] => {
  return [...new Set(articles.map(article => article.category))];
};
