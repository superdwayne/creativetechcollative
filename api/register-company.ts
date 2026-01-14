import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const config = {
  runtime: 'edge',
};

// Request schema for company registration
const RegisterCompanyRequest = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255),
  companyWebsite: z.string().url('Invalid URL format').optional().or(z.literal('')),
  contactName: z.string().min(1, 'Contact name is required').max(255),
  contactEmail: z.string().email('Invalid email format').max(255),
  contactPhone: z.string().max(50).optional(),
  companySize: z
    .enum(['startup', 'small', 'medium', 'large', 'enterprise'])
    .optional(),
  industry: z.string().max(255).optional(),
});

// Response type for company registration
interface CompanyResponse {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  companySize?: string | null;
  industry?: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the webhook URL based on environment
 * Uses test endpoint in test mode, production endpoint otherwise
 */
function getWebhookUrl(): string {
  const isTest = process.env.VITE_TEST === 'TRUE';
  const baseUrl = isTest
    ? 'https://n8n.creativetechnologists.nl/webhook-test'
    : 'https://n8n.creativetechnologists.nl/webhook';
  return `${baseUrl}/company-registration`;
}

/**
 * Send company registration notification to admin via webhook
 */
async function sendCompanyRegistrationNotification(
  company: CompanyResponse
): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl();
    const username = process.env.VITE_N8N_BASIC_AUTH_USERNAME;
    const password = process.env.VITE_N8N_BASIC_AUTH_PASSWORD;

    if (!username || !password) {
      console.warn(
        '[REGISTER-COMPANY] Webhook credentials not configured. Admin notification not sent.'
      );
      return;
    }

    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        type: 'company_registration',
        company: {
          id: company.id,
          companyName: company.companyName,
          companyWebsite: company.companyWebsite,
          contactName: company.contactName,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          companySize: company.companySize,
          industry: company.industry,
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`[REGISTER-COMPANY] Webhook returned status ${response.status}`);
    } else {
      console.log('[REGISTER-COMPANY] Admin notification sent successfully');
    }
  } catch (error) {
    console.error('[REGISTER-COMPANY] Failed to send admin notification:', error);
    // Don't throw - company registration should succeed even if notification fails
  }
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

  // Create Supabase client with service role key for operations
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

  try {
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const validatedData = RegisterCompanyRequest.parse(body);

    console.log(`[REGISTER-COMPANY] Processing registration for user: ${user.id}`);

    // Check if user already has a company
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single();

    if (existingCompany) {
      return new Response(
        JSON.stringify({
          error: 'User already has a registered company',
          existingCompany: {
            id: existingCompany.id,
            companyName: existingCompany.company_name,
          },
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // checkError with code 'PGRST116' means no rows found, which is expected
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[REGISTER-COMPANY] Error checking existing company:', checkError);
      return new Response(
        JSON.stringify({
          error: 'Failed to check for existing company',
          details: checkError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create the company record with verified=false
    const { data: createdCompany, error: insertError } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        company_name: validatedData.companyName,
        company_website: validatedData.companyWebsite || null,
        contact_name: validatedData.contactName,
        contact_email: validatedData.contactEmail,
        contact_phone: validatedData.contactPhone || null,
        company_size: validatedData.companySize || null,
        industry: validatedData.industry || null,
        verified: false,
      })
      .select()
      .single();

    if (insertError || !createdCompany) {
      console.error('[REGISTER-COMPANY] Database insert error:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create company',
          details: insertError?.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const companyResponse = rowToCompany(createdCompany);

    console.log(`[REGISTER-COMPANY] Company created successfully: ${companyResponse.id}`);

    // Send notification to admin for verification (non-blocking)
    await sendCompanyRegistrationNotification(companyResponse);

    return new Response(
      JSON.stringify({
        success: true,
        company: companyResponse,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[REGISTER-COMPANY] Error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Company registration failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
