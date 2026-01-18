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

interface CreditsExhaustedError {
  type: 'credits_exhausted';
  message: string;
}

interface GenericError {
  type: 'generic';
  message: string;
}

type AnalysisError = CreditsExhaustedError | GenericError | null;

interface UseJobAnalysisReturn {
  analyze: (job: JobToAnalyze) => Promise<void>;
  analysis: string;
  isAnalyzing: boolean;
  error: AnalysisError;
  creditsRemaining: number | null;
  reset: () => void;
}

export function useJobAnalysis(): UseJobAnalysisReturn {
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<AnalysisError>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

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
        // Handle 402 Payment Required (credits exhausted)
        if (response.status === 402) {
          try {
            const errorData = await response.json();
            if (errorData.code === 'CREDITS_EXHAUSTED') {
              setError({
                type: 'credits_exhausted',
                message: errorData.error || 'No analysis credits remaining',
              });
              return;
            }
          } catch {
            // Fall through to generic error if JSON parsing fails
          }
        }
        throw new Error('Analysis request failed');
      }

      // Extract credits remaining from header
      const creditsHeader = response.headers.get('X-Credits-Remaining');
      if (creditsHeader !== null) {
        const credits = parseInt(creditsHeader, 10);
        if (!isNaN(credits)) {
          setCreditsRemaining(credits);
        }
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
      setError({
        type: 'generic',
        message: err instanceof Error ? err.message : 'Analysis failed',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyze,
    analysis,
    isAnalyzing,
    error,
    creditsRemaining,
    reset,
  };
}
