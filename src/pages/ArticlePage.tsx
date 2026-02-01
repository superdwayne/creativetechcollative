import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, Share2, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react';
import { getArticleBySlug, articles, Article } from '../data/articles';
import Footer from '../components/ui/footer';

const parseMarkdown = (content: string): string => {
  const lines = content.trim().split('\n');
  let html = '';
  let inList = false;
  let listType = '';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines but close lists
    if (line.trim() === '') {
      if (inList) {
        html += listType === 'ul' ? '</ul>' : '</ol>';
        inList = false;
      }
      continue;
    }
    
    // Headers
    if (line.startsWith('## ')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      html += `<h2>${line.slice(3)}</h2>`;
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      html += `<h3>${line.slice(4)}</h3>`;
      continue;
    }
    
    // Blockquotes
    if (line.startsWith('> ')) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      html += `<blockquote>${line.slice(2)}</blockquote>`;
      continue;
    }
    
    // Unordered list
    if (line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        if (inList) html += '</ol>';
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      let listContent = line.slice(2);
      listContent = listContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += `<li>${listContent}</li>`;
      continue;
    }
    
    // Ordered list
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) html += '</ul>';
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      let listContent = orderedMatch[1];
      listContent = listContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += `<li>${listContent}</li>`;
      continue;
    }
    
    // Images - ![alt](url) or ![alt](url "caption")
    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)$/);
    if (imageMatch) {
      if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      const alt = imageMatch[1];
      const src = imageMatch[2];
      const caption = imageMatch[3];
      html += `<figure class="article-image"><img src="${src}" alt="${alt}" />${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
      continue;
    }
    
    // Regular paragraph
    if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    line = line.replace(/'([^']+)'/g, '\u2018$1\u2019');
    html += `<p>${line}</p>`;
  }
  
  if (inList) {
    html += listType === 'ul' ? '</ul>' : '</ol>';
  }
  
  return html;
};

const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = slug ? getArticleBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!article) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-primary font-medium mb-4">Article not found</h1>
          <p className="text-zinc-400 font-secondary mb-8">
            The article you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/articles')}
            className="px-6 py-3 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'copy') => {
    const url = window.location.href;
    const title = article.title;

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
  };

  const relatedArticles = articles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <div className="fixed top-24 left-8 z-40 hidden lg:block">
        <button
          onClick={() => navigate('/articles')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-secondary text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </button>
      </div>

      {/* Article Header */}
      <header className="pt-16 pb-12 px-8 md:px-16 lg:px-24">
        <div className="max-w-3xl mx-auto">
          {/* Mobile Back Button */}
          <button
            onClick={() => navigate('/articles')}
            className="lg:hidden flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-secondary text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </button>

          {/* Category & Reading Time */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase">
              {article.category}
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-xs font-secondary text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime} min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary font-medium leading-[1.1] tracking-tight mb-6">
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p className="text-xl md:text-2xl text-zinc-400 font-secondary leading-relaxed mb-8">
              {article.subtitle}
            </p>
          )}

          {/* Author & Date */}
          <div className="flex items-center justify-between py-6 border-t border-b border-zinc-800">
            <div className="flex items-center gap-4">
              {article.author.avatar && (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <span className="block text-sm font-secondary text-white">
                  {article.author.name}
                </span>
                {article.author.role && (
                  <span className="block text-xs font-secondary text-zinc-500">
                    {article.author.role}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="block text-sm font-secondary text-zinc-400">
                {formatDate(article.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="px-8 md:px-16 lg:px-24 mb-16">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-[21/9] bg-zinc-900 overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="px-8 md:px-16 lg:px-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="article-content">
            <div 
              dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }} 
              className="
                [&>h2]:text-2xl [&>h2]:md:text-3xl [&>h2]:font-primary [&>h2]:font-medium [&>h2]:tracking-tight [&>h2]:mt-12 [&>h2]:mb-6 [&>h2]:text-white
                [&>h3]:text-xl [&>h3]:font-primary [&>h3]:font-medium [&>h3]:mt-8 [&>h3]:mb-4 [&>h3]:text-white
                [&>p]:font-secondary [&>p]:text-zinc-300 [&>p]:leading-[1.8] [&>p]:text-lg [&>p]:mb-6
                [&>blockquote]:border-l-2 [&>blockquote]:border-zinc-600 [&>blockquote]:pl-6 [&>blockquote]:my-8 [&>blockquote]:text-zinc-400 [&>blockquote]:font-secondary [&>blockquote]:italic [&>blockquote]:text-xl
                [&>ul]:font-secondary [&>ul]:text-zinc-300 [&>ul]:my-6 [&>ul]:ml-6 [&>ul]:list-disc [&>ul]:space-y-3
                [&>ol]:font-secondary [&>ol]:text-zinc-300 [&>ol]:my-6 [&>ol]:ml-6 [&>ol]:list-decimal [&>ol]:space-y-3
                [&_li]:text-lg [&_li]:leading-relaxed
                [&_strong]:text-white [&_strong]:font-medium
                [&_em]:text-zinc-200
                [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-zinc-300
                [&>figure]:my-10 [&>figure]:mx-0
                [&>figure>img]:w-full [&>figure>img]:rounded-lg [&>figure>img]:border [&>figure>img]:border-zinc-800
                [&>figure>figcaption]:text-center [&>figure>figcaption]:text-sm [&>figure>figcaption]:text-zinc-500 [&>figure>figcaption]:font-secondary [&>figure>figcaption]:mt-3 [&>figure>figcaption]:italic
              "
            />
          </div>

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <div className="flex items-center gap-3 flex-wrap">
              <Tag className="w-4 h-4 text-zinc-500" />
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-zinc-900 text-zinc-400 text-sm font-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-secondary text-zinc-500 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share this article
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                  aria-label="Copy link"
                >
                  <LinkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="px-8 md:px-16 lg:px-24 py-16 border-t border-zinc-900">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-primary font-medium mb-8">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedArticles.map(related => (
                <RelatedArticleCard
                  key={related.id}
                  article={related}
                  onClick={() => navigate(`/articles/${related.slug}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Author Bio */}
      <section className="px-8 md:px-16 lg:px-24 py-16 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900/50 p-8 flex flex-col md:flex-row items-start gap-6">
            {article.author.avatar && (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <span className="block text-lg font-primary font-medium text-white mb-1">
                {article.author.name}
              </span>
              {article.author.role && (
                <span className="block text-sm font-secondary text-zinc-500 mb-4">
                  {article.author.role}
                </span>
              )}
              <p className="text-zinc-400 font-secondary text-sm leading-relaxed">
                A member of the Creative Technologist Collective, bridging the gap between creativity and technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

interface RelatedArticleCardProps {
  article: Article;
  onClick: () => void;
}

const RelatedArticleCard: React.FC<RelatedArticleCardProps> = ({ article, onClick }) => {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer flex gap-6"
    >
      <div className="w-32 h-24 flex-shrink-0 bg-zinc-900 overflow-hidden">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-2xl opacity-30">📝</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase block mb-2">
          {article.category}
        </span>
        <h3 className="text-lg font-primary font-medium text-white group-hover:text-zinc-300 transition-colors leading-tight">
          {article.title}
        </h3>
      </div>
    </article>
  );
};

export default ArticlePage;
