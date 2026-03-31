import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if a user is an admin.
 * Checks the ADMIN_USER_IDS env var first (fast, no DB call),
 * then falls back to the is_admin column in network_profiles.
 */
export async function isAdmin(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Check env var first (fast path)
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  const adminIds = adminUserIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (adminIds.includes(userId)) return true;

  // Fallback: check DB flag
  try {
    const { data } = await supabase
      .from('network_profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    return data?.is_admin === true;
  } catch {
    return false;
  }
}
