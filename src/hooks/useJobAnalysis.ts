import { useState, useCallback } from 'react';

interface JobToAnalyze {
  title: string;
  company: string;
  description: string;
  requirements?: string[];
  location?: string;
  salary?: string;
  remote?: boolean;
}

interface UseJobAnalysisReturn {
  analyze: (job: JobToAnalyze) => Promise<void>;
  analysis: string;
  isAnalyzing: boolean;
  error: string | null;
  reset: () => void;
}

export function useJobAnalysis(): UseJobAnalysisReturn {
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setAnalysis('');
    setError(null);
  }, []);

  const analyze = useCallback(async (job: JobToAnalyze) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis('');

    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        setAnalysis(prev => prev + chunk);
      }
    } catch (err) {
      console.error('Job analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyze,
    analysis,
    isAnalyzing,
    error,
    reset,
  };
}
