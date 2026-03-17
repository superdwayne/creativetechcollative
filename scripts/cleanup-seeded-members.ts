import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The names from the original seeding script
const SEEDED_MEMBER_NAMES = [
  'Dwayne Paisley-Marshall',
  'Adina',
  'Deniz',
  'Florido',
  'Karoline Winzer',
  'Pax',
  'Joshua',
  'Jennifer',
  'Koen',
  'John Nussey',
  'Martin',
  'Rui',
  'Olivia',
  'Edwin Nikkels',
  'Rohit Gupta',
  'Scy',
  'Tom',
  'Fernando',
  'Christos',
  'Erin',
  'Robin Hunter',
  'Job',
];

async function analyzeProfiles() {
  console.log('🔍 Analyzing network profiles...\n');

  // Get all profiles
  const { data: allProfiles, error } = await supabase
    .from('network_profiles')
    .select('id, full_name, email, user_id, is_ctc_member, approved, created_at, slug')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`📊 Total profiles in database: ${allProfiles?.length || 0}\n`);

  // Categorize profiles
  const seededProfiles: typeof allProfiles = [];
  const organicProfiles: typeof allProfiles = [];
  const ambiguousProfiles: typeof allProfiles = [];

  for (const profile of allProfiles || []) {
    const hasUserId = profile.user_id !== null;
    const hasPlaceholderEmail = profile.email?.includes('@creativetechnologists.nl');
    const isKnownSeededName = SEEDED_MEMBER_NAMES.includes(profile.full_name);

    // Seeded = no user_id AND (placeholder email OR known seeded name)
    if (!hasUserId && (hasPlaceholderEmail || isKnownSeededName)) {
      seededProfiles.push(profile);
    } 
    // Organic = has user_id (real authenticated user)
    else if (hasUserId) {
      organicProfiles.push(profile);
    }
    // Ambiguous = no user_id but doesn't match seeding patterns
    else {
      ambiguousProfiles.push(profile);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 SEEDED PROFILES (to be deleted):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (seededProfiles.length === 0) {
    console.log('  (none found)');
  } else {
    for (const p of seededProfiles) {
      console.log(`  - ${p.full_name}`);
      console.log(`    Email: ${p.email}`);
      console.log(`    Slug: ${p.slug}`);
      console.log(`    Created: ${new Date(p.created_at).toLocaleDateString()}`);
      console.log(`    ID: ${p.id}`);
      console.log('');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ORGANIC SIGNUPS (will be kept):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (organicProfiles.length === 0) {
    console.log('  (none found)');
  } else {
    for (const p of organicProfiles) {
      console.log(`  - ${p.full_name}`);
      console.log(`    Email: ${p.email}`);
      console.log(`    Has auth account: Yes (user_id: ${p.user_id?.slice(0, 8)}...)`);
      console.log(`    Created: ${new Date(p.created_at).toLocaleDateString()}`);
      console.log('');
    }
  }

  if (ambiguousProfiles.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  AMBIGUOUS PROFILES (need manual review):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const p of ambiguousProfiles) {
      console.log(`  - ${p.full_name}`);
      console.log(`    Email: ${p.email}`);
      console.log(`    ID: ${p.id}`);
      console.log('');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  🌱 Seeded (to delete): ${seededProfiles.length}`);
  console.log(`  ✅ Organic (to keep):  ${organicProfiles.length}`);
  console.log(`  ⚠️  Ambiguous:          ${ambiguousProfiles.length}`);
  console.log(`  📊 Total:              ${allProfiles?.length || 0}`);

  return { seededProfiles, organicProfiles, ambiguousProfiles };
}

async function deleteSeededProfiles(dryRun = true) {
  const analysis = await analyzeProfiles();
  if (!analysis) return;

  const { seededProfiles } = analysis;

  if (seededProfiles.length === 0) {
    console.log('\n✨ No seeded profiles to delete!');
    return;
  }

  if (dryRun) {
    console.log('\n🔒 DRY RUN MODE - No changes will be made.');
    console.log(`   Would delete ${seededProfiles.length} seeded profiles.`);
    console.log('\n   To actually delete, run with: npx tsx scripts/cleanup-seeded-members.ts --delete');
    return;
  }

  console.log('\n⚠️  DELETING SEEDED PROFILES...');
  
  const idsToDelete = seededProfiles.map(p => p.id);
  
  const { error } = await supabase
    .from('network_profiles')
    .delete()
    .in('id', idsToDelete);

  if (error) {
    console.error('❌ Error deleting profiles:', error);
    return;
  }

  console.log(`\n✅ Successfully deleted ${seededProfiles.length} seeded profiles!`);
}

// Check for --delete flag
const shouldDelete = process.argv.includes('--delete');

deleteSeededProfiles(!shouldDelete)
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
