-- Add approval system to network profiles
-- Profiles need admin approval before appearing in the directory

-- Add approved column (defaults to false for new profiles)
ALTER TABLE network_profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add approved_at timestamp
ALTER TABLE network_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved_by to track who approved (admin user_id)
ALTER TABLE network_profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Create index for filtering approved profiles
CREATE INDEX IF NOT EXISTS idx_network_profiles_approved ON network_profiles(approved);

-- Update the public view policy to only show approved profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON network_profiles;

-- Allow anyone (authenticated or not) to view approved profiles
DO $$ BEGIN
  CREATE POLICY "Approved profiles are publicly viewable"
    ON network_profiles
    FOR SELECT
    TO public
    USING (approved = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Authenticated users can view their own profile even if not approved
DO $$ BEGIN
  CREATE POLICY "Users can view their own unapproved profile"
    ON network_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id AND approved = false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add comment
COMMENT ON COLUMN network_profiles.approved IS 'Whether the profile has been approved by an admin';
COMMENT ON COLUMN network_profiles.approved_at IS 'Timestamp when the profile was approved';
COMMENT ON COLUMN network_profiles.approved_by IS 'Admin user who approved the profile';
