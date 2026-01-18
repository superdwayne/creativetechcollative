import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Briefcase, Globe, ChevronRight, X, ExternalLink, Building2, Sparkles, Loader2 } from 'lucide-react';
import { jobs, getDepartments, getJobTypes, Job } from '../data/jobs';
import { useJobAnalysis } from '../hooks/useJobAnalysis';
import Footer from '../components/ui/footer';

const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const departments = getDepartments();
  const jobTypes = getJobTypes();

  const filteredJobs = jobs.filter(job => {
    if (filterDepartment && job.department !== filterDepartment) return false;
    if (filterType && job.type !== filterType) return false;
    return true;
  });

  const formatSalary = (job: Job) => {
    if (!job.salary) return 'Competitive';
    if (job.salary.range) return `${job.salary.range}${job.salary.period ? ` / ${job.salary.period}` : ''}`;
    return 'Competitive';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative min-h-[50vh] flex items-center border-b border-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/30 via-black to-black" />
        
        <div className="relative z-10 w-full px-8 md:px-16 lg:px-24 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
                Creative Tech Jobs
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
              <span className="block">CT Job</span>
              <span className="block text-zinc-500">Board</span>
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl max-w-xl font-secondary leading-relaxed">
              Curated Creative Technologist roles from top studios, agencies, and tech companies worldwide. Find your next opportunity.
            </p>

            <div className="flex gap-8 mt-12 pt-8 border-t border-zinc-800">
              <div>
                <span className="block text-3xl font-primary font-medium">{jobs.length}</span>
                <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Open Roles</span>
              </div>
              <div>
                <span className="block text-3xl font-primary font-medium">Global</span>
                <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Companies</span>
              </div>
              <div>
                <span className="block text-3xl font-primary font-medium">Weekly</span>
                <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="px-8 md:px-16 lg:px-24 py-8 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-secondary text-zinc-500 uppercase tracking-wide mr-4">Filter:</span>
            
            {/* Department Filter */}
            <button
              onClick={() => setFilterDepartment(null)}
              className={`px-4 py-2 text-sm font-secondary tracking-wide transition-all ${
                !filterDepartment
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              All Departments
            </button>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setFilterDepartment(dept)}
                className={`px-4 py-2 text-sm font-secondary tracking-wide transition-all ${
                  filterDepartment === dept
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {dept}
              </button>
            ))}

            <span className="w-px h-6 bg-zinc-800 mx-2" />

            {/* Type Filter */}
            <button
              onClick={() => setFilterType(null)}
              className={`px-4 py-2 text-sm font-secondary tracking-wide transition-all ${
                !filterType
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            {jobTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 text-sm font-secondary tracking-wide transition-all ${
                  filterType === type
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="px-8 md:px-16 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 font-secondary text-lg">
                No positions match your filters. Try adjusting your criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onClick={() => setSelectedJob(job)}
                  formatSalary={formatSalary}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* No Matching Role CTA */}
      <section className="px-8 md:px-16 lg:px-24 py-24 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-primary font-medium text-white mb-6">
            Know of a CT role we should list?
          </h2>
          <p className="text-zinc-400 font-secondary max-w-md mx-auto mb-8">
            Help us grow this job board. Submit a Creative Technologist role and we'll review it for listing.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-4 bg-white text-black font-secondary text-sm tracking-wide hover:bg-zinc-200 transition-colors"
          >
            Submit a Job
          </button>
        </div>
      </section>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)}
          formatSalary={formatSalary}
          formatDate={formatDate}
        />
      )}

      <Footer />
    </div>
  );
};

interface JobCardProps {
  job: Job;
  onClick: () => void;
  formatSalary: (job: Job) => string;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick, formatSalary }) => {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 transition-all duration-300 p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {job.featured && (
              <span className="px-2 py-1 bg-white text-black text-xs font-secondary uppercase tracking-wide">
                Featured
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm font-secondary text-zinc-400">
              <Building2 className="w-3.5 h-3.5" />
              {job.company.name}
            </span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-primary font-medium text-white group-hover:text-zinc-300 transition-colors mb-2">
            {job.title}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-sm font-secondary text-zinc-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              {job.type}
            </span>
            {job.remote && (
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                Remote OK
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <span className="block text-sm font-secondary text-white">
              {formatSalary(job)}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </article>
  );
};

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  formatSalary: (job: Job) => string;
  formatDate: (date: string) => string;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, formatSalary, formatDate }) => {
  const { analyze, analysis, isAnalyzing, error, reset } = useJobAnalysis();

  const handleAnalyze = () => {
    analyze({
      title: job.title,
      company: job.company.name,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      salary: formatSalary(job),
      remote: job.remote,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-zinc-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-secondary text-zinc-400">
                {job.company.name}
              </span>
              {job.source && (
                <span className="text-xs font-secondary text-zinc-600">• via {job.source}</span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-primary font-medium text-white">
              {job.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 pb-6 border-b border-zinc-800">
            <span className="flex items-center gap-2 text-sm font-secondary text-zinc-400">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-2 text-sm font-secondary text-zinc-400">
              <Briefcase className="w-4 h-4" />
              {job.type}
            </span>
            {job.remote && (
              <span className="flex items-center gap-2 text-sm font-secondary text-zinc-400">
                <Globe className="w-4 h-4" />
                Remote OK
              </span>
            )}
            <span className="flex items-center gap-2 text-sm font-secondary text-zinc-400">
              <Clock className="w-4 h-4" />
              Posted {formatDate(job.postedAt)}
            </span>
          </div>

          {/* Salary */}
          {job.salary && (
            <div className="bg-zinc-800/50 p-4">
              <span className="text-xs font-secondary text-zinc-500 uppercase tracking-wide block mb-1">
                Salary Range
              </span>
              <span className="text-lg font-primary text-white">
                {formatSalary(job)}
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-primary font-medium text-white mb-4">About the Role</h3>
            <p className="text-zinc-400 font-secondary leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-primary font-medium text-white mb-4">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-zinc-400 font-secondary">
                    <span className="text-white mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Info */}
          {job.company.website && (
            <div className="bg-zinc-800/50 p-4">
              <span className="text-xs font-secondary text-zinc-500 uppercase tracking-wide block mb-2">
                About {job.company.name}
              </span>
              <a 
                href={job.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-secondary text-sky-400 hover:text-sky-300 flex items-center gap-2"
              >
                Visit company website
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* AI Analysis Section */}
          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-primary font-medium text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                CT Analysis
              </h3>
              {!analysis && !isAnalyzing && (
                <button
                  onClick={handleAnalyze}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-secondary tracking-wide transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze for CT Fit
                </button>
              )}
              {analysis && (
                <button
                  onClick={reset}
                  className="px-3 py-1 text-xs font-secondary text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-3 text-zinc-400 font-secondary">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                Analyzing job from a Creative Technologist perspective...
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-secondary">
                {error.message}
              </div>
            )}

            {analysis && (
              <div className="bg-zinc-800/50 p-4 rounded">
                <div className="prose prose-invert prose-sm max-w-none font-secondary text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {analysis}
                </div>
              </div>
            )}

            {!analysis && !isAnalyzing && !error && (
              <p className="text-zinc-500 text-sm font-secondary">
                Get an AI-powered analysis of this role from a Creative Technologist perspective. 
                We'll evaluate tech stack, creative freedom, company innovation, and growth potential.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-6">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white text-black font-secondary text-sm uppercase tracking-[0.2em] py-4 px-8 hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            Apply on {job.company.name}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
