-- Add user_id column to beta_applications to link with authenticated users
-- When a user signs up/logs in with an approved beta email, we link their account

-- Add user_id column (nullable until user creates account)
ALTER TABLE beta_applications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_beta_applications_user_id ON beta_applications(user_id);

-- Add a comment to explain the column
COMMENT ON COLUMN beta_applications.user_id IS 'Links to auth.users when beta member creates an account. NULL until they sign up.';

-- Update RLS policy to allow authenticated users to check their own beta status
CREATE POLICY "Users can view their own beta application" ON beta_applications
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
