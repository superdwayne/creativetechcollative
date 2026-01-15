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
    featured: true
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
