-- Fix missing database columns
-- Run this in your Supabase SQL Editor to resolve dashboard loading issues

-- 1. Add language column to persons table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'persons' 
        AND column_name = 'language'
    ) THEN
        ALTER TABLE persons 
        ADD COLUMN language VARCHAR(10) DEFAULT 'da' 
        CHECK (language IN ('da', 'en', 'no', 'sv'));
        RAISE NOTICE 'Added language column to persons table';
    ELSE
        RAISE NOTICE 'Language column already exists in persons table';
    END IF;
END $$;

-- 2. Add language column to companies table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'language'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN language VARCHAR(10) DEFAULT 'da' 
        CHECK (language IN ('da', 'en', 'no', 'sv'));
        RAISE NOTICE 'Added language column to companies table';
    ELSE
        RAISE NOTICE 'Language column already exists in companies table';
    END IF;
END $$;

-- 3. Add post_type column to posts table if it doesn't exist
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
        RAISE NOTICE 'Added post_type column to posts table';
    ELSE
        RAISE NOTICE 'Post_type column already exists in posts table';
    END IF;
END $$;

-- 4. Add category column to improvement_answers table if it doesn't exist
-- Note: This table might not exist in all installations, so we check for table existence first
DO $$ 
BEGIN
    -- Check if improvement_answers table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'improvement_answers'
    ) THEN
        -- Table exists, check if category column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'improvement_answers' 
            AND column_name = 'category'
        ) THEN
            ALTER TABLE improvement_answers 
            ADD COLUMN category VARCHAR(100) DEFAULT 'general';
            RAISE NOTICE 'Added category column to improvement_answers table';
        ELSE
            RAISE NOTICE 'Category column already exists in improvement_answers table';
        END IF;
    ELSE
        RAISE NOTICE 'improvement_answers table does not exist, skipping category column addition';
    END IF;
END $$;

-- 5. Update existing records to have default values
UPDATE persons SET language = 'da' WHERE language IS NULL;
UPDATE companies SET language = 'da' WHERE language IS NULL;
UPDATE posts SET post_type = 'general' WHERE post_type IS NULL;

-- Update improvement_answers only if table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'improvement_answers'
    ) THEN
        UPDATE improvement_answers SET category = 'general' WHERE category IS NULL;
        RAISE NOTICE 'Updated improvement_answers records with default category';
    ELSE
        RAISE NOTICE 'improvement_answers table does not exist, skipping update';
    END IF;
END $$;

-- 6. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Database columns fixed successfully! Dashboard should now load properly.' as status;
