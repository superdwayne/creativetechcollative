/**
 * Create a test company account for development.
 *
 * Usage:
 *   npx tsx scripts/create-test-company.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars from .env.local then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = 'testcompany@ctc-test.com';
const TEST_PASSWORD = 'TestCompany2026!';

async function main() {
  console.log('Creating test company account...\n');

  // Step 1: Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL);

  let userId: string;

  if (existing) {
    console.log(`User already exists: ${existing.id}`);
    userId = existing.id;

    // Update password in case it changed
    await supabase.auth.admin.updateUserById(userId, {
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    console.log('Password updated.');
  } else {
    // Step 2: Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    if (createError || !newUser.user) {
      console.error('Failed to create user:', createError?.message);
      process.exit(1);
    }

    userId = newUser.user.id;
    console.log(`Created auth user: ${userId}`);
  }

  // Step 3: Check if company already exists
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id, verified')
    .eq('user_id', userId)
    .single();

  if (existingCompany) {
    console.log(`Company already exists: ${existingCompany.id}`);

    // Ensure it's verified
    if (!existingCompany.verified) {
      await supabase
        .from('companies')
        .update({ verified: true })
        .eq('id', existingCompany.id);
      console.log('Company marked as verified.');
    } else {
      console.log('Company is already verified.');
    }
  } else {
    // Step 4: Create the company record
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        user_id: userId,
        company_name: 'Test Agency Co',
        company_website: 'https://testagency.example.com',
        contact_name: 'Test User',
        contact_email: TEST_EMAIL,
        contact_phone: '+44 20 7123 4567',
        company_size: 'medium',
        industry: 'Creative Agency',
        verified: true,
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error('Failed to create company:', companyError?.message);
      process.exit(1);
    }

    console.log(`Created company: ${company.id} (${company.company_name})`);

    // Step 5: Initialize analysis credits
    await supabase
      .from('company_analysis_credits')
      .insert({
        company_id: company.id,
        free_analyses_remaining: 10,
        purchased_credits: 0,
      });

    console.log('Analysis credits initialized.');
  }

  console.log('\n========================================');
  console.log('  TEST COMPANY ACCOUNT READY');
  console.log('========================================');
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  Login at: http://localhost:5173/company/auth`);
  console.log('========================================\n');
}

main().catch(console.error);
