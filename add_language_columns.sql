-- Add language column to persons and companies tables
-- Run this in your Supabase SQL Editor

-- Add language column to persons table if it doesn't exist
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
    END IF;
END $$;

-- Add language column to companies table if it doesn't exist
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
    END IF;
END $$;

-- Update existing records to have 'da' as default language
UPDATE persons SET language = 'da' WHERE language IS NULL;
UPDATE companies SET language = 'da' WHERE language IS NULL;
