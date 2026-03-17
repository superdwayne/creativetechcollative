import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfill() {
  const { data: companies, error: fetchErr } = await supabase
    .from('companies')
    .select('id, company_name');

  if (fetchErr) {
    console.error('Failed to fetch companies:', fetchErr);
    process.exit(1);
  }

  console.log(`Found ${companies?.length ?? 0} companies`);

  for (const company of companies ?? []) {
    const { data: existing } = await supabase
      .from('company_message_credits')
      .select('id')
      .eq('company_id', company.id)
      .single();

    if (existing) {
      console.log(`  ✓ ${company.company_name} — already has credits`);
      continue;
    }

    const { error } = await supabase
      .from('company_message_credits')
      .insert({
        company_id: company.id,
        free_messages_remaining: 25,
        purchased_credits: 0,
      });

    if (error) {
      console.error(`  ✗ ${company.company_name} — ${error.message}`);
    } else {
      console.log(`  + ${company.company_name} — credited 25 free messages`);
    }
  }

  console.log('Done.');
}

backfill();
