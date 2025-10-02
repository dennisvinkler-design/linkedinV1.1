const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDatabase() {
  try {
    // Test database connection with a simple query
    const { data, error } = await supabase
      .from('persons')
      .select('count')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist yet - this is expected for first run
      logger.warn('Database tables not found. Please run the SQL setup script in Supabase dashboard.');
      logger.warn('Use the database_setup_simple.sql file to create the required tables.');
      logger.info('Database connection established (tables need to be created)');
    } else if (error) {
      throw error;
    } else {
      logger.info('Database connection established and tables found');
    }
    
    // Skip migrations for now - tables should be created manually
    logger.info('Skipping automatic migrations. Tables should be created manually in Supabase.');
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Migration function disabled - tables should be created manually in Supabase
async function runMigrations() {
  logger.info('Migrations disabled - tables should be created manually in Supabase dashboard');
  logger.info('Use the database_setup_simple.sql file to create the required tables');
  return;
  
  // Create tables with RLS enabled
  const migrations = [
    {
      name: 'create_persons_table',
      sql: `
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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all operations for authenticated users" ON persons
          FOR ALL USING (auth.role() = 'authenticated');
      `
    },
    {
      name: 'create_companies_table',
      sql: `
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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all operations for authenticated users" ON companies
          FOR ALL USING (auth.role() = 'authenticated');
      `
    },
    {
      name: 'create_posts_table',
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('person', 'company')),
          entity_id UUID NOT NULL,
          content TEXT NOT NULL,
          hashtags TEXT[],
          scheduled_date TIMESTAMP WITH TIME ZONE,
          posted_date TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
          engagement_metrics JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all operations for authenticated users" ON posts
          FOR ALL USING (auth.role() = 'authenticated');
      `
    },
    {
      name: 'create_schedules_table',
      sql: `
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
        
        ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all operations for authenticated users" ON schedules
          FOR ALL USING (auth.role() = 'authenticated');
      `
    },
    {
      name: 'create_improvement_questions_table',
      sql: `
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
        
        ALTER TABLE improvement_questions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all operations for authenticated users" ON improvement_questions
          FOR ALL USING (auth.role() = 'authenticated');
      `
    },
    {
      name: 'create_improvement_answers_table',
      sql: `
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
        
        ALTER TABLE improvement_answers ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all operations for authenticated users" ON improvement_answers
          FOR ALL USING (auth.role() = 'authenticated');
      `
    },
    {
      name: 'create_improvement_preferences_table',
      sql: `
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
        
        ALTER TABLE improvement_preferences ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all operations for authenticated users" ON improvement_preferences
          FOR ALL USING (auth.role() = 'authenticated');
      `
    }
  ];

  for (const migration of migrations) {
    try {
      // Split the SQL into individual statements
      const statements = migration.sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
          if (error) {
            logger.error(`Migration ${migration.name} statement failed:`, error);
            logger.error(`Statement: ${statement.trim()}`);
          }
        }
      }
      
      logger.info(`Migration ${migration.name} completed`);
    } catch (error) {
      logger.error(`Migration ${migration.name} failed:`, error);
    }
  }
}

module.exports = {
  supabase,
  initializeDatabase
};
