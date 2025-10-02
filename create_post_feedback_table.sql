-- Create post_feedback table for storing user feedback on posts
-- Run this in your Supabase SQL Editor

-- Create post_feedback table
CREATE TABLE IF NOT EXISTS post_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person','company')),
  entity_id UUID NOT NULL,
  feedback TEXT NOT NULL,
  generated_version TEXT, -- snapshot of improved content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_post_feedback_post_id ON post_feedback(post_id);
CREATE INDEX IF NOT EXISTS idx_post_feedback_entity ON post_feedback(entity_type, entity_id);

-- Enable RLS on post_feedback
ALTER TABLE post_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for post_feedback (allow all operations for service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_feedback' AND policyname = 'allow_all_service_role'
  ) THEN
    CREATE POLICY allow_all_service_role ON post_feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
