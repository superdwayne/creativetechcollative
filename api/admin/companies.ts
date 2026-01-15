import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Response type for company
interface CompanyResponse {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  companySize: string | null;
  industry: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Check if a user is an admin based on ADMIN_USER_IDS env var
 */
function isAdmin(userId: string): boolean {
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}

/**
 * Convert database row to response format
 */
function rowToCompany(row: Record<string, unknown>): CompanyResponse {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    companyName: row.company_name as string,
    companyWebsite: row.company_website as string | null,
    contactName: row.contact_name as string,
    contactEmail: row.contact_email as string,
    contactPhone: row.contact_phone as string | null,
    companySize: row.company_size as string | null,
    industry: row.industry as string | null,
    verified: row.verified as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
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
    console.log('[ADMIN-COMPANIES] Fetching all companies');

    // Fetch all companies, sorted by most recent first
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('[ADMIN-COMPANIES] Failed to fetch companies:', companiesError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch companies',
          details: companiesError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const companyList = (companies || []).map(rowToCompany);

    console.log(`[ADMIN-COMPANIES] Successfully fetched ${companyList.length} companies`);

    return new Response(
      JSON.stringify({
        companies: companyList,
        count: companyList.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ADMIN-COMPANIES] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch companies' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
