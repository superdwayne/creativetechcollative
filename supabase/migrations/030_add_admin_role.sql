-- Add database-level admin flag to network_profiles
-- Supplements the ADMIN_USER_IDS environment variable approach

ALTER TABLE network_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Partial index for fast admin lookups (only indexes true values)
CREATE INDEX IF NOT EXISTS idx_network_profiles_is_admin
  ON network_profiles (is_admin) WHERE is_admin = true;

COMMENT ON COLUMN network_profiles.is_admin IS 'Database-level admin flag. Admin access is granted if this is true OR if user_id is in ADMIN_USER_IDS env var.';

-- Helper function for use in RLS policies
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM network_profiles
    WHERE user_id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_current_user_admin() IS 'Returns true if the authenticated user has the is_admin flag set in network_profiles. For use in RLS policies.';
