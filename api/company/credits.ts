import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

interface CreditBalance {
  freeAnalysesRemaining: number;
  purchasedCredits: number;
  totalCredits: number;
}

interface UsageLogEntry {
  id: string;
  jobTitle: string;
  creditType: 'free' | 'purchased';
  createdAt: string;
}

interface CreditsResponse {
  success: true;
  credits: CreditBalance;
  totalAnalysesUsed: number;
  recentUsage: UsageLogEntry[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ success: false, error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get company_id from query params
  const url = new URL(req.url);
  const companyId = url.searchParams.get('company_id');

  if (!companyId) {
    return new Response(JSON.stringify({ success: false, error: 'company_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid company_id format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch credit balance
    const { data: credits, error: creditsError } = await supabase
      .from('company_analysis_credits')
      .select('free_analyses_remaining, purchased_credits')
      .eq('company_id', companyId)
      .single();

    if (creditsError) {
      // If no record found, return zeros
      if (creditsError.code === 'PGRST116') {
        const response: CreditsResponse = {
          success: true,
          credits: {
            freeAnalysesRemaining: 0,
            purchasedCredits: 0,
            totalCredits: 0,
          },
          totalAnalysesUsed: 0,
          recentUsage: [],
        };
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('[COMPANY-CREDITS] Error fetching credits:', creditsError);
      throw creditsError;
    }

    // Fetch total analyses used (count of usage logs)
    const { count: totalUsed, error: countError } = await supabase
      .from('analysis_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (countError) {
      console.error('[COMPANY-CREDITS] Error counting usage:', countError);
      throw countError;
    }

    // Fetch last 5 analyses
    const { data: recentLogs, error: logsError } = await supabase
      .from('analysis_usage_logs')
      .select('id, job_title, credit_type, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('[COMPANY-CREDITS] Error fetching usage logs:', logsError);
      throw logsError;
    }

    const freeRemaining = credits?.free_analyses_remaining || 0;
    const purchased = credits?.purchased_credits || 0;

    const response: CreditsResponse = {
      success: true,
      credits: {
        freeAnalysesRemaining: freeRemaining,
        purchasedCredits: purchased,
        totalCredits: freeRemaining + purchased,
      },
      totalAnalysesUsed: totalUsed || 0,
      recentUsage: (recentLogs || []).map((log) => ({
        id: log.id,
        jobTitle: log.job_title,
        creditType: log.credit_type as 'free' | 'purchased',
        createdAt: log.created_at,
      })),
    };

    console.log(`[COMPANY-CREDITS] Fetched credits for company ${companyId}: free=${freeRemaining}, purchased=${purchased}, used=${totalUsed}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[COMPANY-CREDITS] Error:', err);
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Failed to fetch credits',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
