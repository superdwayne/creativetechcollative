-- CTC Network Profiles Table with Authentication
-- This migration creates the network_profiles table linked to Supabase Auth

CREATE TABLE IF NOT EXISTS network_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to Supabase Auth user (nullable for migration, but new profiles require it)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  full_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  portfolio_url TEXT,
  linkedin_url TEXT,
  other_social_links TEXT[],
  bio TEXT NOT NULL,
  
  -- Specialization
  focus_areas TEXT[] NOT NULL,
  skills TEXT[] NOT NULL,
  
  -- Projects (stored as JSONB array)
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Availability & Community
  availability VARCHAR(50) NOT NULL CHECK (availability IN ('open-to-work', 'open-to-collaborations', 'not-available')),
  is_ctc_member BOOLEAN DEFAULT false,
  
  -- URL slug for profile page
  slug VARCHAR(255) NOT NULL UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_network_profiles_user_id ON network_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_network_profiles_slug ON network_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_network_profiles_availability ON network_profiles(availability);
CREATE INDEX IF NOT EXISTS idx_network_profiles_focus_areas ON network_profiles USING GIN(focus_areas);
CREATE INDEX IF NOT EXISTS idx_network_profiles_skills ON network_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_network_profiles_created_at ON network_profiles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE network_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view profiles (public directory)
DO $$ BEGIN
  CREATE POLICY "Profiles are viewable by everyone"
    ON network_profiles
    FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Authenticated users can create their own profile
DO $$ BEGIN
  CREATE POLICY "Users can create their own profile"
    ON network_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Users can update their own profile
DO $$ BEGIN
  CREATE POLICY "Users can update their own profile"
    ON network_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Users can delete their own profile
DO $$ BEGIN
  CREATE POLICY "Users can delete their own profile"
    ON network_profiles
    FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_network_profiles_updated_at ON network_profiles;
CREATE TRIGGER update_network_profiles_updated_at
  BEFORE UPDATE ON network_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add a comment to the table
COMMENT ON TABLE network_profiles IS 'CTC Network directory profiles for creative technologists';
