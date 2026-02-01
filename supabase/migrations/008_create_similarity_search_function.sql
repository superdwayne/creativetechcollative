-- Migration: Create vector similarity search function for job matching
-- This function finds similar profiles based on embedding vector similarity using pgvector

-- Create the similarity search function
CREATE OR REPLACE FUNCTION find_similar_profiles(
  query_embedding vector(1536),
  match_limit INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name VARCHAR(255),
  location VARCHAR(255),
  email VARCHAR(255),
  portfolio_url TEXT,
  linkedin_url TEXT,
  other_social_links TEXT[],
  bio TEXT,
  focus_areas TEXT[],
  skills TEXT[],
  projects JSONB,
  availability VARCHAR(50),
  is_ctc_member BOOLEAN,
  profile_picture_url TEXT,
  approved BOOLEAN,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  slug VARCHAR(255),
  embedding vector(1536),
  embedding_updated_at TIMESTAMP WITH TIME ZONE,
  enriched_content TEXT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    np.id,
    np.user_id,
    np.full_name,
    np.location,
    np.email,
    np.portfolio_url,
    np.linkedin_url,
    np.other_social_links,
    np.bio,
    np.focus_areas,
    np.skills,
    np.projects,
    np.availability,
    np.is_ctc_member,
    np.profile_picture_url,
    np.approved,
    np.approved_at,
    np.approved_by,
    np.created_at,
    np.updated_at,
    np.slug,
    np.embedding,
    np.embedding_updated_at,
    np.enriched_content,
    -- Cosine similarity: 1 - cosine distance (higher is more similar)
    (1 - (np.embedding <=> query_embedding))::FLOAT AS similarity_score
  FROM network_profiles np
  WHERE
    -- Only include profiles with embeddings
    np.embedding IS NOT NULL
    -- Only include approved profiles (profiles must be approved by admin to be matched)
    AND np.approved = true
    -- Apply similarity threshold (1 - threshold because <=> returns distance)
    AND (1 - (np.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY
    np.embedding <=> query_embedding ASC  -- Lower distance = higher similarity
  LIMIT match_limit;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION find_similar_profiles IS 'Find network profiles similar to a given embedding vector using cosine similarity. Only returns approved profiles (all availability statuses are included).';
