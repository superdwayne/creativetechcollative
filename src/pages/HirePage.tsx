import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  User,
  Link as LinkIcon,
  ArrowLeft,
  Trophy,
  Target,
  Briefcase,
  Clock,
  Zap,
  ArrowUpRight,
  Search,
  Brain,
  Users,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_AREAS } from '@/types/network-profile';
import { AnalysisCreditsCard } from '@/components/AnalysisCreditsCard';

// Analysis phases for the loading animation
const ANALYSIS_PHASES = [
  { icon: FileText, label: 'Parsing job requirements', duration: 2000 },
  { icon: Brain, label: 'Understanding role needs', duration: 2500 },
  { icon: Search, label: 'Scanning talent profiles', duration: 3000 },
  { icon: Users, label: 'Matching candidates', duration: 2500 },
  { icon: BarChart3, label: 'Ranking best fits', duration: 2000 },
];

// Types for API response
interface SkillMatch {
  skill: string;
  relevance: string;
  fromProfile: boolean;
  fromPortfolio: boolean;
}

interface CandidateMatch {
  profileId: string;
  slug: string;
  fullName: string;
  bio: string | null;
  skills: string[];
  focusAreas: string[];
  location: string | null;
  portfolioUrl: string | null;
  profilePictureUrl: string | null;
  matchScore: number;
  matchReasoning: string;
  skillMatches: SkillMatch[];
  vectorSimilarity: number;
  enrichedFromWeb: boolean;
  webSearchSummary?: string;
}

interface ParsedJob {
  title: string;
  description: string;
  requirements?: string;
  preferredSkills?: string[];
  focusAreas?: string[];
  budgetRange?: string;
  projectType?: string;
  remotePreference?: string;
  location?: string;
  timeline?: string;
}

interface RejectedCandidate {
  profileId: string;
  slug: string;
  fullName: string;
  location: string | null;
  profilePictureUrl: string | null;
  reason: string;
  vectorSimilarity: number;
}

interface AnalyseResult {
  success: boolean;
  parsedJob?: ParsedJob;
  matches?: CandidateMatch[];
  rejectedCandidates?: RejectedCandidate[];
  error?: string;
  stats?: {
    totalProfilesScanned: number;
    profilesEnriched: number;
    processingTimeMs: number;
  };
  overallAnalysis?: string;
}

// Get color for focus area badge
const getFocusAreaColor = (value: string): string => {
  const focusArea = FOCUS_AREAS.find(f => f.value === value);
  return focusArea?.color || 'bg-zinc-700 text-zinc-300';
};

// Get label for focus area
const getFocusAreaLabel = (value: string): string => {
  const focusArea = FOCUS_AREAS.find(f => f.value === value);
  return focusArea?.label || value.replace(/-/g, ' ');
};

// Match score color with gradient support
const getScoreStyles = (score: number) => {
  if (score >= 85) return {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20'
  };
  if (score >= 70) return {
    bg: 'bg-green-500/15',
    border: 'border-green-500/30',
    text: 'text-green-400',
    glow: 'shadow-green-500/20'
  };
  if (score >= 55) return {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20'
  };
  return {
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20'
  };
};

// Rank badge styles
const getRankStyles = (index: number) => {
  if (index === 0) return {
    bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    text: 'text-black',
    shadow: 'shadow-lg shadow-amber-500/30',
    icon: Trophy
  };
  if (index === 1) return {
    bg: 'bg-gradient-to-br from-zinc-300 to-zinc-500',
    text: 'text-black',
    shadow: 'shadow-lg shadow-zinc-400/20',
    icon: null
  };
  if (index === 2) return {
    bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    text: 'text-black',
    shadow: 'shadow-lg shadow-orange-500/20',
    icon: null
  };
  return {
    bg: 'bg-zinc-800',
    text: 'text-zinc-400',
    shadow: '',
    icon: null
  };
};

const HirePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [jobText, setJobText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [result, setResult] = useState<AnalyseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get company_id from URL params (for authenticated company sessions)
  const companyId = searchParams.get('company_id');

  // Scroll to top when results are displayed
  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result]);

  // Cycle through analysis phases during loading
  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisPhase(0);
      return;
    }

    const interval = setInterval(() => {
      setAnalysisPhase(prev => (prev + 1) % ANALYSIS_PHASES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF, TXT, DOC, or DOCX file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB.');
        return;
      }
      setSelectedFile(file);
      setJobText('');
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF, TXT, DOC, or DOCX file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB.');
        return;
      }
      setSelectedFile(file);
      setJobText('');
      setJobUrl('');
      setError(null);
    }
  };

  const handleLoadFromUrl = async () => {
    if (!jobUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    let url: URL;
    try {
      url = new URL(jobUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      setError('Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    setIsLoadingUrl(true);
    setError(null);

    try {
      const response = await fetch('/api/parse-job-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.toString() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch job spec from URL');
      }

      setJobText(data.content || '');
      setSelectedFile(null);
      setJobUrl('');
    } catch (err) {
      console.error('URL fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content from URL');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobText.trim() && !selectedFile) {
      setError('Please paste a job description or upload a file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (jobText.trim()) {
        formData.append('text', jobText.trim());
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      let response: Response;
      try {
        response = await fetch('/api/analyse-job', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timed out. The analysis is taking longer than expected. Please try with a shorter job description.');
          }
          if (fetchError.message === 'fetch failed' || fetchError.message.includes('fetch')) {
            throw new Error('Could not connect to the server. If running locally, make sure to use "vercel dev" instead of "vite".');
          }
        }
        throw fetchError;
      }

      const responseText = await response.text();

      if (!responseText || responseText.trim() === '') {
        if (response.status === 404) {
          throw new Error('API endpoint not found. If running locally, use "vercel dev" instead of "vite".');
        }
        throw new Error('Server returned an empty response. The request may have timed out. Please try again.');
      }

      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('API endpoint not configured. If running locally, use "vercel dev" instead of "vite".');
      }

      let data: AnalyseResult;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse response:', responseText.substring(0, 500));
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCard = (profileId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  };

  const resetForm = () => {
    setJobText('');
    setSelectedFile(null);
    setJobUrl('');
    setResult(null);
    setError(null);
    setExpandedCards(new Set());
  };

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-3xl" />
      </div>

      {/* Analysis Credits Card - Show when company_id is available */}
      {companyId && !result && !isAnalyzing && (
        <div className="relative mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AnalysisCreditsCard companyId={companyId} />
        </div>
      )}

      {/* Header - Only show on input page */}
      {!result && !isAnalyzing && (
        <div className="relative mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Matching
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Find Creative<br />Technologists
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
            Upload your job specification and our AI will match you with the best creative technologists from our network.
          </p>
        </div>
      )}

      {/* Analyzing Animation */}
      {isAnalyzing && (
        <div className="relative flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
          {/* Subtle background pulse */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full bg-violet-500/5 animate-pulse" />
          </div>

          {/* Center icon */}
          <div className="relative z-10 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
              {React.createElement(ANALYSIS_PHASES[analysisPhase].icon, {
                className: "w-10 h-10 text-white transition-all duration-500"
              })}
            </div>
          </div>

          {/* Phase text */}
          <div className="relative z-10 text-center">
            <h2 className="text-xl font-semibold text-white mb-2" key={analysisPhase}>
              {ANALYSIS_PHASES[analysisPhase].label}
            </h2>
            <p className="text-zinc-500 text-sm">
              Finding the best matches for your role...
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2 mt-6">
            {ANALYSIS_PHASES.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  idx === analysisPhase
                    ? "bg-violet-400 scale-110"
                    : idx < analysisPhase
                    ? "bg-violet-500/50"
                    : "bg-zinc-700"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!result && !isAnalyzing && (
        <div className="relative max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="space-y-8">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Paste Job Description
              </label>
              <textarea
                value={jobText}
                onChange={(e) => {
                  setJobText(e.target.value);
                  if (e.target.value.trim() && selectedFile) {
                    setSelectedFile(null);
                  }
                }}
                placeholder="Paste your job description, requirements, or project brief here..."
                className="w-full h-56 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none transition-all"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-800/50" />
              <span className="text-zinc-600 text-xs font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-zinc-800/50" />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Upload Job Spec File
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                  selectedFile
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="text-white font-medium">{selectedFile.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="ml-2 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-6 h-6 text-zinc-500" />
                    </div>
                    <p className="text-zinc-300">
                      Drop your file here or <span className="text-violet-400 font-medium">browse</span>
                    </p>
                    <p className="text-zinc-500 text-sm mt-2">
                      Supports PDF, TXT, DOC, DOCX (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-800/50" />
              <span className="text-zinc-600 text-xs font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-zinc-800/50" />
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Load from URL
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => {
                      setJobUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://example.com/job-posting"
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                </div>
                <button
                  onClick={handleLoadFromUrl}
                  disabled={isLoadingUrl || !jobUrl.trim()}
                  className={cn(
                    "px-5 py-3.5 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap",
                    isLoadingUrl || !jobUrl.trim()
                      ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
                  )}
                >
                  {isLoadingUrl ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load'
                  )}
                </button>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                Paste a link to a job posting page and we'll extract the content
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!jobText.trim() && !selectedFile)}
              className={cn(
                "w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-3 transition-all",
                isAnalyzing || (!jobText.trim() && !selectedFile)
                  ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/20"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing job spec and finding matches...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Find Matching Talent
                </>
              )}
            </button>

            {/* Info Text */}
            <p className="text-zinc-500 text-sm text-center">
              Our AI analyzes your job requirements and matches them against skills, experience, and portfolios of our network members.
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div ref={resultsRef} className="relative space-y-8">
          {/* Back Navigation */}
          <button
            onClick={resetForm}
            className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors animate-in fade-in duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">New Search</span>
          </button>

          {/* Results Header */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              Talent Matches
            </h1>
            <p className="text-zinc-400">
              AI-powered candidate recommendations for your role
            </p>
          </div>

          {/* Job Summary Card */}
          <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

            <div className="relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                    {result.parsedJob?.title || 'Job Matches'}
                  </h2>
                  {result.stats && (
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Target className="w-4 h-4" />
                        {result.stats.totalProfilesScanned} profiles analyzed
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {(result.stats.processingTimeMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Requirements Pills */}
              {result.parsedJob && (
                <div className="flex flex-wrap gap-2">
                  {result.parsedJob.projectType && (
                    <span className="px-3 py-1.5 bg-zinc-800/80 rounded-lg text-xs text-zinc-300 capitalize font-medium">
                      {result.parsedJob.projectType}
                    </span>
                  )}
                  {result.parsedJob.remotePreference && (
                    <span className="px-3 py-1.5 bg-zinc-800/80 rounded-lg text-xs text-zinc-300 capitalize font-medium">
                      {result.parsedJob.remotePreference}
                    </span>
                  )}
                  {result.parsedJob.location && (
                    <span className="px-3 py-1.5 bg-zinc-800/80 rounded-lg text-xs text-zinc-300 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {result.parsedJob.location}
                    </span>
                  )}
                  {result.parsedJob.preferredSkills?.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-violet-500/20 rounded-lg text-xs text-violet-300 font-medium">
                      {skill}
                    </span>
                  ))}
                  {result.parsedJob.preferredSkills && result.parsedJob.preferredSkills.length > 5 && (
                    <span className="px-3 py-1.5 bg-zinc-800/50 rounded-lg text-xs text-zinc-500 font-medium">
                      +{result.parsedJob.preferredSkills.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis Summary */}
          {result.overallAnalysis && (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-300 text-sm leading-relaxed">{result.overallAnalysis}</p>
              </div>
            </div>
          )}

          {/* Match Results */}
          {result.matches && result.matches.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Top Matches
                </h3>
                <span className="text-sm text-zinc-500">
                  {result.matches.length} candidate{result.matches.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {result.matches.map((match, index) => {
                  const isExpanded = expandedCards.has(match.profileId);
                  const scoreStyles = getScoreStyles(match.matchScore);
                  const rankStyles = getRankStyles(index);

                  return (
                    <div
                      key={match.profileId}
                      className={cn(
                        "group relative bg-zinc-900/30 border rounded-2xl overflow-hidden transition-all duration-300",
                        isExpanded ? "border-violet-500/40 bg-zinc-900/50" : "border-zinc-800/50 hover:border-zinc-700/50"
                      )}
                    >
                      {/* Card Content */}
                      <div className="relative p-5 md:p-6">
                        <div className="flex items-start gap-4">
                          {/* Rank Badge */}
                          <div className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                            rankStyles.bg,
                            rankStyles.text,
                            rankStyles.shadow
                          )}>
                            {rankStyles.icon ? <rankStyles.icon className="w-5 h-5" /> : index + 1}
                          </div>

                          {/* Profile Picture */}
                          <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-zinc-800 ring-2 ring-zinc-700/50">
                            {match.profilePictureUrl ? (
                              <img
                                src={match.profilePictureUrl}
                                alt={match.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                                <User className="w-8 h-8 text-zinc-500" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <h4 className="text-lg font-semibold text-white">
                                  {match.fullName}
                                </h4>
                                {match.location && (
                                  <div className="flex items-center gap-1.5 text-zinc-400 text-sm mt-0.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{match.location}</span>
                                  </div>
                                )}
                              </div>

                              {/* Score Badge */}
                              <div className={cn(
                                "px-4 py-2 rounded-xl font-bold text-xl border",
                                scoreStyles.bg,
                                scoreStyles.border,
                                scoreStyles.text
                              )}>
                                {match.matchScore}%
                              </div>
                            </div>

                            {/* Focus Areas & Skills Preview */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {match.focusAreas?.slice(0, 2).map((area) => (
                                <span
                                  key={area}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-medium",
                                    getFocusAreaColor(area)
                                  )}
                                >
                                  {getFocusAreaLabel(area)}
                                </span>
                              ))}
                              {match.skills?.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800/80 text-zinc-400"
                                >
                                  {skill}
                                </span>
                              ))}
                              {((match.focusAreas?.length || 0) + (match.skills?.length || 0)) > 5 && (
                                <span className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800/50 text-zinc-500">
                                  +{(match.focusAreas?.length || 0) + (match.skills?.length || 0) - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-between mt-5 pt-5 border-t border-zinc-800/50">
                          <button
                            onClick={() => toggleCard(match.profileId)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Why they match
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-3">
                            {match.portfolioUrl && (
                              <a
                                href={match.portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
                              >
                                Portfolio
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Link
                              to={`/directory/profile/${match.slug}`}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-xl text-white text-sm font-medium transition-colors"
                            >
                              View Profile
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-5 md:px-6 pb-6 space-y-5">
                          {/* Match Analysis */}
                          <div className="bg-gradient-to-br from-emerald-500/10 to-zinc-900/50 border border-emerald-500/20 rounded-xl p-5">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-1">
                                  Why {match.fullName.split(' ')[0]} is a Great Match
                                </h4>
                                <p className="text-zinc-300 text-sm leading-relaxed">{match.matchReasoning}</p>
                              </div>
                            </div>

                            {/* Skill Matches */}
                            {match.skillMatches && match.skillMatches.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-emerald-500/10">
                                <h5 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
                                  Key Matching Skills
                                </h5>
                                <div className="grid gap-2">
                                  {match.skillMatches.slice(0, 6).map((sm, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                      <span className="text-emerald-400 mt-0.5">✓</span>
                                      <div>
                                        <span className="text-white font-medium">{sm.skill}</span>
                                        {sm.relevance && (
                                          <span className="text-zinc-400 ml-1">— {sm.relevance}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {match.skillMatches.length > 6 && (
                                    <p className="text-zinc-500 text-xs mt-1">
                                      +{match.skillMatches.length - 6} more matching skills
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bio */}
                          {match.bio && (
                            <div className="bg-zinc-800/30 rounded-xl p-5">
                              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Background & Experience
                              </h4>
                              <p className="text-zinc-300 text-sm leading-relaxed">{match.bio}</p>
                            </div>
                          )}

                          {/* All Skills */}
                          {match.skills && match.skills.length > 0 && (
                            <div className="bg-zinc-800/30 rounded-xl p-5">
                              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Full Skillset
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {match.skills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 bg-zinc-700/50 rounded-lg text-xs text-zinc-300"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
                We couldn't find candidates matching your requirements. Try broadening your criteria or adjusting the job description.
              </p>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-xl text-white font-medium transition-all shadow-lg shadow-violet-500/20"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Rejected Candidates */}
          {result.rejectedCandidates && result.rejectedCandidates.length > 0 && (
            <details className="group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <summary className="flex items-center gap-2 cursor-pointer list-none text-zinc-500 hover:text-zinc-400 transition-colors">
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                <span className="text-sm">
                  {result.rejectedCandidates.length} other candidates considered
                </span>
              </summary>

              <div className="mt-4 space-y-2">
                {result.rejectedCandidates.map((candidate) => (
                  <div
                    key={candidate.profileId}
                    className="flex items-center gap-3 p-3 bg-zinc-900/20 border border-zinc-800/30 rounded-xl hover:bg-zinc-900/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-zinc-800">
                      {candidate.profilePictureUrl ? (
                        <img
                          src={candidate.profilePictureUrl}
                          alt={candidate.fullName}
                          className="w-full h-full object-cover opacity-50"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-700" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-zinc-400 text-sm font-medium">{candidate.fullName}</span>
                      <p className="text-zinc-600 text-xs truncate">{candidate.reason}</p>
                    </div>
                    <Link
                      to={`/directory/profile/${candidate.slug}`}
                      className="flex-shrink-0 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default HirePage;
