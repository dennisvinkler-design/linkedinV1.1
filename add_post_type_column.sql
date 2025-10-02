-- Add post_type column to existing posts table
-- Run this in your Supabase SQL Editor

-- Add post_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'post_type'
    ) THEN
        ALTER TABLE posts 
        ADD COLUMN post_type VARCHAR(50) DEFAULT 'general' 
        CHECK (post_type IN ('educational', 'personal_story', 'industry_insight', 'contrarian_viewpoint', 'problem_agitate_solve', 'general'));
    END IF;
END $$;

-- Update existing posts to have 'general' as post_type
UPDATE posts SET post_type = 'general' WHERE post_type IS NULL;
