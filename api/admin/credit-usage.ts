import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Response types
interface CreditUsageCompany {
  companyId: string;
  companyName: string;
  freeUsed: number;
  purchasedRemaining: number;
  totalAnalyses: number;
  totalRevenue: number; // in cents
}

interface CreditUsageResponse {
  companies: CreditUsageCompany[];
  totals: {
    totalAnalyses: number;
    totalRevenue: number;
  };
}

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}

export default async function handler(req: Request) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Supabase client with service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  // Verify the token and get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if user is admin
  if (!isAdmin(user.id)) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[ADMIN-CREDIT-USAGE] Fetching credit usage for all companies');

    // Fetch all companies with their credit balances
    const { data: credits, error: creditsError } = await supabase
      .from('company_analysis_credits')
      .select('company_id, free_analyses_remaining, purchased_credits');

    if (creditsError) {
      console.error('[ADMIN-CREDIT-USAGE] Failed to fetch credits:', creditsError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch credit data',
          details: creditsError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all companies for names
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name');

    if (companiesError) {
      console.error('[ADMIN-CREDIT-USAGE] Failed to fetch companies:', companiesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch company data',
          details: companiesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all usage logs to count analyses per company
    const { data: usageLogs, error: usageError } = await supabase
      .from('analysis_usage_logs')
      .select('company_id');

    if (usageError) {
      console.error('[ADMIN-CREDIT-USAGE] Failed to fetch usage logs:', usageError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch usage data',
          details: usageError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all purchases to calculate revenue per company
    const { data: purchases, error: purchasesError } = await supabase
      .from('credit_purchases')
      .select('company_id, price_cents');

    if (purchasesError) {
      console.error('[ADMIN-CREDIT-USAGE] Failed to fetch purchases:', purchasesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch purchase data',
          details: purchasesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create lookup maps
    const companyNameMap = new Map<string, string>();
    for (const company of companies || []) {
      companyNameMap.set(company.id, company.company_name);
    }

    // Count analyses per company
    const analysisCountMap = new Map<string, number>();
    for (const log of usageLogs || []) {
      const count = analysisCountMap.get(log.company_id) || 0;
      analysisCountMap.set(log.company_id, count + 1);
    }

    // Calculate revenue per company
    const revenueMap = new Map<string, number>();
    for (const purchase of purchases || []) {
      const revenue = revenueMap.get(purchase.company_id) || 0;
      revenueMap.set(purchase.company_id, revenue + purchase.price_cents);
    }

    // Build the response - only include companies with credit records
    const companiesWithUsage: CreditUsageCompany[] = (credits || []).map((credit) => {
      const companyId = credit.company_id;
      // Free used = 5 (initial free credits) - remaining free credits
      const freeUsed = Math.max(0, 5 - (credit.free_analyses_remaining || 0));
      const purchasedRemaining = credit.purchased_credits || 0;
      const totalAnalyses = analysisCountMap.get(companyId) || 0;
      const totalRevenue = revenueMap.get(companyId) || 0;

      return {
        companyId,
        companyName: companyNameMap.get(companyId) || 'Unknown Company',
        freeUsed,
        purchasedRemaining,
        totalAnalyses,
        totalRevenue,
      };
    });

    // Sort by total analyses (most active first)
    companiesWithUsage.sort((a, b) => b.totalAnalyses - a.totalAnalyses);

    // Calculate totals
    const totals = {
      totalAnalyses: companiesWithUsage.reduce((sum, c) => sum + c.totalAnalyses, 0),
      totalRevenue: companiesWithUsage.reduce((sum, c) => sum + c.totalRevenue, 0),
    };

    console.log(
      `[ADMIN-CREDIT-USAGE] Successfully fetched usage for ${companiesWithUsage.length} companies`
    );

    const response: CreditUsageResponse = {
      companies: companiesWithUsage,
      totals,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ADMIN-CREDIT-USAGE] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch credit usage' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
