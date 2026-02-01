-- Add membership_type column to network_profiles
-- This tracks whether a member is a 'beta' member or a 'full' directory member
-- Beta members can be upgraded to full members by admin

-- Add the membership_type column with default 'full' for existing members
ALTER TABLE network_profiles 
ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'full'
CHECK (membership_type IN ('beta', 'full'));

-- Create index for filtering by membership type
CREATE INDEX IF NOT EXISTS idx_network_profiles_membership_type ON network_profiles(membership_type);

-- Add a comment to explain the column
COMMENT ON COLUMN network_profiles.membership_type IS 'Member type: beta (approved beta application) or full (upgraded or direct signup)';
