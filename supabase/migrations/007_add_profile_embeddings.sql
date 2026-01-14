-- Add embedding columns to network_profiles for semantic search
-- This migration adds vector embedding support to enable AI-powered job matching

-- Add embedding column for storing OpenAI text-embedding-3-small vectors (1536 dimensions)
ALTER TABLE network_profiles
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add timestamp to track when embedding was last updated
ALTER TABLE network_profiles
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE;

-- Add column for storing scraped/processed portfolio content used for embedding generation
ALTER TABLE network_profiles
  ADD COLUMN IF NOT EXISTS enriched_content TEXT;

-- Create HNSW index for fast approximate nearest neighbor search
-- HNSW (Hierarchical Navigable Small World) provides better query performance than IVFFlat
-- Using cosine distance operator (<=>) which is standard for text embeddings
CREATE INDEX IF NOT EXISTS idx_network_profiles_embedding
  ON network_profiles
  USING hnsw (embedding vector_cosine_ops);

-- Add comments for documentation
COMMENT ON COLUMN network_profiles.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN network_profiles.embedding_updated_at IS 'Timestamp when the embedding was last generated/updated';
COMMENT ON COLUMN network_profiles.enriched_content IS 'Scraped and processed content from portfolio URLs used to enhance embedding quality';
