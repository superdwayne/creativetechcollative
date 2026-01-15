import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds.split(',').map((id) => id.trim()).filter(Boolean);
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
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
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
    const body = await req.json();
    const { companyId, verified } = body as { companyId: string; verified: boolean };

    if (!companyId || typeof verified !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'companyId and verified (boolean) are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[ADMIN-COMPANIES-VERIFY] ${verified ? 'Verifying' : 'Unverifying'} company ${companyId}`);

    // Update company verification status
    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        verified: verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('[ADMIN-COMPANIES-VERIFY] Update failed:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update company verification status',
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ADMIN-COMPANIES-VERIFY] Successfully ${verified ? 'verified' : 'unverified'} company ${companyId}`);

    return new Response(
      JSON.stringify({
        success: true,
        company: {
          id: company.id,
          companyName: company.company_name,
          verified: company.verified,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-COMPANIES-VERIFY] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update company verification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
