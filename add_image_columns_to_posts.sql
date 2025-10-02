-- Add image columns to posts table for image storage
-- Run this in your Supabase SQL Editor

ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS image_size INTEGER,
  ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(100);

-- Create index for faster queries on posts with images
CREATE INDEX IF NOT EXISTS idx_posts_image_url ON posts(image_url) WHERE image_url IS NOT NULL;
