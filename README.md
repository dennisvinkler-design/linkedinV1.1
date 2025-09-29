# LinkedIn Assistent - Automated Post Generation System

A comprehensive system for generating personalized LinkedIn posts with automated scheduling capabilities.

## Features

- **Person & Company Profiles**: Create detailed profiles for individuals and companies
- **AI-Powered Strategy Generation**: Automatically generate personalized LinkedIn strategies
- **Post Generation**: Create engaging, personalized LinkedIn posts based on strategies
- **Automated Scheduling**: Schedule posts with flexible frequency options (daily, weekly, 2x/3x weekly)
- **Real-time Management**: View, edit, and manage posts and schedules through a modern web interface

## Architecture

This system follows a microservice architecture with clear separation of concerns:

- **Backend**: Node.js/Express API with Supabase database
- **Frontend**: React application with modern UI
- **AI Integration**: OpenAI GPT-4 for content generation
- **Database**: Supabase with Row Level Security (RLS) enabled

## Quick Start

### Prerequisites

- Node.js 16+ 
- Supabase account
- OpenAI API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Environment Setup**:
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `OPENAI_API_KEY`: Your OpenAI API key

3. **Start the application**:
   ```bash
   npm run dev
   ```

   This will start both backend (port 3001) and frontend (port 3000).

## Usage

### 1. Create Profiles

**Add a Person:**
- Navigate to "Persons" in the sidebar
- Click "Add Person" and fill in details like name, title, company, bio, expertise
- Click "Create Person"

**Add a Company:**
- Navigate to "Companies" in the sidebar  
- Click "Add Company" and fill in company details
- Click "Create Company"

### 2. Generate Strategies

For each person or company:
- Click the "Strategy" button next to their name
- The system will analyze their profile and generate a personalized LinkedIn strategy
- Review and edit the generated strategy as needed

### 3. Generate Posts

- Navigate to "Posts" to view generated content
- Use the generation features to create multiple posts based on your strategies
- Posts are created in "draft" status for review

### 4. Set Up Scheduling

- Go to "Schedules" to set up automated posting
- Create schedules for each person/company with your preferred frequency
- Choose specific days and times for posting
- Toggle schedules on/off as needed

## API Endpoints

### Persons
- `GET /api/persons` - List all persons
- `POST /api/persons` - Create person
- `PUT /api/persons/:id` - Update person
- `DELETE /api/persons/:id` - Delete person

### Companies  
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Strategies
- `POST /api/strategies/generate` - Generate strategy
- `POST /api/strategies` - Save strategy
- `GET /api/strategies/:id` - Get strategy
- `PUT /api/strategies/:id` - Update strategy

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts/generate` - Generate posts
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post

### Schedules
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `POST /api/schedules/:id/toggle` - Toggle schedule

## Database Schema

The system uses the following main tables with RLS enabled:

- **persons**: Individual profiles with personal branding information
- **companies**: Company profiles with business context
- **strategies**: Generated LinkedIn strategies linked to entities
- **posts**: Generated posts with scheduling and status tracking
- **schedules**: Automated posting schedules

## Security

- Row Level Security (RLS) enabled on all tables
- API rate limiting and input validation
- Secure environment variable handling
- CORS protection

## Content Guidelines

The system follows specific content guidelines:

- **Voice & Tone**: Human-like, confident, direct communication
- **Specificity**: Concrete examples over generic advice
- **Authenticity**: Personalized content that feels genuine
- **Engagement**: Posts designed to drive meaningful interactions

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon
```

### Frontend Development  
```bash
cd frontend
npm start    # Starts React dev server
```

### Database Migrations
The system automatically runs migrations on startup. Check `backend/src/database/init.js` for schema definitions.

## Production Deployment

1. Set `NODE_ENV=production`
2. Update API URLs for production
3. Configure proper CORS settings
4. Set up monitoring and logging
5. Configure backup strategies for Supabase

## Contributing

1. Follow the established microservice architecture
2. Maintain RLS policies for all database operations
3. Use the defined validation schemas
4. Follow the content guidelines for AI generation
5. Test all API endpoints thoroughly

## License

MIT License - see LICENSE file for details
