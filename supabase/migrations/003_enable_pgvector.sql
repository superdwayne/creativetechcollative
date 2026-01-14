-- Enable pgvector extension for vector embeddings and semantic search
-- This extension allows storing and querying vector embeddings for AI-powered matching

-- Enable the pgvector extension
-- Note: In Supabase, this extension is available on all plans
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is active by checking it exists
-- This will fail if the extension wasn't properly enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension was not enabled successfully';
  END IF;
END $$;

-- Add a comment documenting the extension purpose
COMMENT ON EXTENSION vector IS 'Vector data type and similarity search operators for AI-powered job matching';
