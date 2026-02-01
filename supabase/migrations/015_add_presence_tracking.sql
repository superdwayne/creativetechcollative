-- Add presence tracking to network_profiles
-- This allows us to determine if a user is "online" and skip email notifications for active users

-- Add last_seen_at column to track user activity
ALTER TABLE network_profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient presence queries
CREATE INDEX IF NOT EXISTS idx_network_profiles_last_seen_at 
ON network_profiles(last_seen_at DESC NULLS LAST);

-- Add last_seen_at to companies table as well for company users
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_companies_last_seen_at 
ON companies(last_seen_at DESC NULLS LAST);

-- Comment on columns
COMMENT ON COLUMN network_profiles.last_seen_at IS 'Timestamp of the user''s last activity, used to determine if they are online';
COMMENT ON COLUMN companies.last_seen_at IS 'Timestamp of the company user''s last activity, used to determine if they are online';
