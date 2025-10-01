-- LinkedIn Opslag System Database Schema - Fixed Version
-- Run these commands in your Supabase SQL Editor

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  company VARCHAR(255),
  bio TEXT,
  linkedin_url VARCHAR(500),
  industry VARCHAR(100),
  target_audience TEXT,
  key_expertise TEXT[],
  personal_branding_notes TEXT,
  language VARCHAR(10) DEFAULT 'da' CHECK (language IN ('da', 'en', 'no', 'sv')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback memory for self-improving post generation
CREATE TABLE IF NOT EXISTS post_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person','company')),
  entity_id UUID NOT NULL,
  feedback TEXT NOT NULL,
  generated_version TEXT, -- snapshot of improved content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_post_feedback_post_id ON post_feedback(post_id);
CREATE INDEX IF NOT EXISTS idx_post_feedback_entity ON post_feedback(entity_type, entity_id);

-- Enable RLS on post_feedback
ALTER TABLE post_feedback ENABLE ROW LEVEL SECURITY;

-- Basic permissive policy: backend service role inserts/selects; users authenticated by same project can read/write their org's rows.
-- Adjust to your auth model as needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_feedback' AND policyname = 'allow_all_service_role'
  ) THEN
    CREATE POLICY allow_all_service_role ON post_feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Enable RLS on persons
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create policy for persons (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'persons' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON persons
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  company_size VARCHAR(50),
  mission_statement TEXT,
  linkedin_url VARCHAR(500),
  target_audience TEXT,
  key_products_services TEXT[],
  company_culture_notes TEXT,
  language VARCHAR(10) DEFAULT 'da' CHECK (language IN ('da', 'en', 'no', 'sv')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy for companies (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON companies
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create posts table (simplified without strategy_id foreign key)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('person', 'company')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[],
  post_type VARCHAR(50) DEFAULT 'general' CHECK (post_type IN ('educational', 'personal_story', 'industry_insight', 'contrarian_viewpoint', 'problem_agitate_solve', 'general')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  posted_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  engagement_metrics JSONB,
  image_url VARCHAR(500),
  image_filename VARCHAR(255),
  image_size INTEGER,
  image_mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy for posts (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON posts
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('person', 'company')),
  entity_id UUID NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  days_of_week INTEGER[],
  time_of_day TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for schedules (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedules' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON schedules
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create improvement_questions table
CREATE TABLE IF NOT EXISTS improvement_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('person', 'company')),
  entity_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on improvement_questions
ALTER TABLE improvement_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for improvement_questions (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'improvement_questions' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON improvement_questions
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create improvement_answers table
CREATE TABLE IF NOT EXISTS improvement_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('person', 'company')),
  entity_id UUID NOT NULL,
  answer_type VARCHAR(20) NOT NULL CHECK (answer_type IN ('option_a', 'option_b', 'custom')),
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (question_id) REFERENCES improvement_questions(id) ON DELETE CASCADE
);

-- Enable RLS on improvement_answers
ALTER TABLE improvement_answers ENABLE ROW LEVEL SECURITY;

-- Create policy for improvement_answers (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'improvement_answers' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON improvement_answers
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create improvement_preferences table
CREATE TABLE IF NOT EXISTS improvement_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('person', 'company')),
  entity_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  preference_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, category)
);

-- Enable RLS on improvement_preferences
ALTER TABLE improvement_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for improvement_preferences (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'improvement_preferences' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON improvement_preferences
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
