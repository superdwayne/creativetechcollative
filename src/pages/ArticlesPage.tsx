import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { articles, getCategories, Article } from '../data/articles';
import Footer from '../components/ui/footer';

const ArticlesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = getCategories();

  const filteredArticles = selectedCategory
    ? articles.filter(a => a.category === selectedCategory)
    : articles;

  const featuredArticle = articles.find(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured || selectedCategory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        
        <div className="relative z-10 w-full px-8 md:px-16 lg:px-24 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
                Insights & Perspectives
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
              <span className="block">Articles</span>
              <span className="block text-zinc-500">&amp; Insights</span>
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl max-w-xl font-secondary leading-relaxed">
              Thoughts, tutorials, and perspectives from the Creative Technologist Collective on the future of creative technology.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <section className="px-8 md:px-16 lg:px-24 py-8 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm font-secondary tracking-wide transition-all ${
                !selectedCategory
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-secondary tracking-wide transition-all ${
                  selectedCategory === category
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && !selectedCategory && (
        <section className="px-8 md:px-16 lg:px-24 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
                Featured
              </span>
            </div>
            
            <div
              onClick={() => navigate(`/articles/${featuredArticle.slug}`)}
              className="group grid grid-cols-1 lg:grid-cols-2 gap-8 bg-zinc-900/50 cursor-pointer overflow-hidden"
            >
              {/* Image */}
              <div className="aspect-[16/10] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
                {featuredArticle.coverImage ? (
                  <img
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="text-8xl opacity-20">📝</div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center p-8 lg:p-12">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase">
                    {featuredArticle.category}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-xs font-secondary text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {featuredArticle.readingTime} min read
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-primary font-medium text-white mb-4 group-hover:text-zinc-300 transition-colors">
                  {featuredArticle.title}
                </h2>

                {featuredArticle.subtitle && (
                  <p className="text-xl text-zinc-400 font-secondary mb-6">
                    {featuredArticle.subtitle}
                  </p>
                )}

                <p className="text-zinc-500 font-secondary leading-relaxed mb-8">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {featuredArticle.author.avatar && (
                      <img
                        src={featuredArticle.author.avatar}
                        alt={featuredArticle.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <span className="block text-sm font-secondary text-white">
                        {featuredArticle.author.name}
                      </span>
                      <span className="block text-xs font-secondary text-zinc-500">
                        {formatDate(featuredArticle.publishedAt)}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-secondary text-zinc-400 group-hover:text-white transition-colors flex items-center gap-2">
                    Read Article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="px-8 md:px-16 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto">
          {!selectedCategory && (
            <div className="mb-12">
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
                Latest Articles
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => navigate(`/articles/${article.slug}`)}
              />
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-zinc-500 font-secondary">
                No articles found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 md:px-16 lg:px-24 py-24 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-primary font-medium text-white mb-6">
            Want to contribute?
          </h2>
          <p className="text-zinc-400 font-secondary max-w-md mx-auto mb-8">
            We're always looking for new perspectives from creative technologists.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
          >
            Get in Touch
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-zinc-900 mb-6 overflow-hidden">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-5xl opacity-30">📝</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-secondary tracking-[0.2em] text-zinc-500 uppercase">
          {article.category}
        </span>
        <span className="text-zinc-700">•</span>
        <span className="text-xs font-secondary text-zinc-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {article.readingTime} min
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl md:text-2xl font-primary font-medium text-white mb-3 group-hover:text-zinc-300 transition-colors leading-tight">
        {article.title}
      </h3>

      {/* Excerpt */}
      <p className="text-zinc-500 font-secondary text-sm leading-relaxed mb-4 line-clamp-2">
        {article.excerpt}
      </p>

      {/* Author & Date */}
      <div className="flex items-center gap-3">
        {article.author.avatar && (
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <div>
          <span className="block text-sm font-secondary text-zinc-400">
            {article.author.name}
          </span>
          <span className="block text-xs font-secondary text-zinc-600">
            {formatDate(article.publishedAt)}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ArticlesPage;
