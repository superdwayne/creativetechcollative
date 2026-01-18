import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Request body type
interface GrantCreditsRequest {
  companyId: string;
  creditsAmount: number;
  note?: string;
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
  // Only allow POST requests
  if (req.method !== 'POST') {
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
    // Parse request body
    const body: GrantCreditsRequest = await req.json();
    const { companyId, creditsAmount, note } = body;

    // Validate required fields
    if (!companyId || typeof companyId !== 'string') {
      return new Response(JSON.stringify({ error: 'companyId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!creditsAmount || typeof creditsAmount !== 'number' || creditsAmount <= 0) {
      return new Response(JSON.stringify({ error: 'creditsAmount must be a positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return new Response(JSON.stringify({ error: 'Invalid companyId format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ADMIN-GRANT-CREDITS] Granting ${creditsAmount} credits to company ${companyId}`);

    // Get current credit balance
    const { data: currentCredits, error: creditsError } = await supabase
      .from('company_analysis_credits')
      .select('purchased_credits')
      .eq('company_id', companyId)
      .single();

    if (creditsError) {
      console.error('[ADMIN-GRANT-CREDITS] Failed to fetch current credits:', creditsError);
      return new Response(
        JSON.stringify({
          error: 'Company credits record not found',
          details: creditsError.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update purchased_credits
    const newPurchasedCredits = (currentCredits.purchased_credits || 0) + creditsAmount;

    const { error: updateError } = await supabase
      .from('company_analysis_credits')
      .update({
        purchased_credits: newPurchasedCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId);

    if (updateError) {
      console.error('[ADMIN-GRANT-CREDITS] Failed to update credits:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update credits',
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Log the grant in credit_purchases table with special stripe_payment_id
    const { error: logError } = await supabase.from('credit_purchases').insert({
      company_id: companyId,
      credits_amount: creditsAmount,
      price_cents: 0, // Admin grants are free
      stripe_payment_id: note ? `ADMIN_GRANT:${note}` : 'ADMIN_GRANT',
    });

    if (logError) {
      console.error('[ADMIN-GRANT-CREDITS] Failed to log grant:', logError);
      // Don't fail the request, credits were already added
    }

    // Fetch company name for response
    const { data: company } = await supabase
      .from('companies')
      .select('company_name')
      .eq('id', companyId)
      .single();

    console.log(
      `[ADMIN-GRANT-CREDITS] Successfully granted ${creditsAmount} credits to ${company?.company_name || companyId}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        companyId,
        companyName: company?.company_name || 'Unknown Company',
        creditsGranted: creditsAmount,
        newBalance: newPurchasedCredits,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-GRANT-CREDITS] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to grant credits' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
