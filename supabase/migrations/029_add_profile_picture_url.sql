-- Add profile_picture_url column to network_profiles
-- This column stores the public URL of the member's profile image uploaded to the profile-images storage bucket
-- Note: The storage bucket was created in migration 027, but the column to store the URL was missing

ALTER TABLE network_profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN network_profiles.profile_picture_url IS 'Public URL of the member profile image stored in the profile-images storage bucket';
