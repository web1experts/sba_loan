# SBA Loan Dashboard

A comprehensive full-stack SaaS application for managing SBA loan applications, built with React, Tailwind CSS, Supabase, and OpenAI integration.

## Features

### Multi-Role Authentication
- **Borrower Portal**: Loan application forms, document uploads, progress tracking
- **Referral Partner Dashboard**: Lead submission, pipeline tracking, training resources  
- **Admin Panel**: Complete oversight of all applications, documents, and referral activity

### Core Functionality
- 📋 **Jotform Integration**: Embedded loan application forms
- 📂 **Document Management**: Secure file uploads with categorization
- 🤖 **AI Assistant**: GPT-powered chat support contextual to user role
- 📊 **Pipeline Tracking**: Real-time status updates and progress monitoring
- 👥 **Role-Based Access**: Granular permissions and dashboard customization

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router DOM
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4 integration
- **Deployment**: Vercel-ready

## Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your-openai-api-key

# Optional: Email notifications
RESEND_API_KEY=your-resend-api-key
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL commands from `supabase-setup.sql` in your Supabase SQL editor
3. Configure storage buckets in the Supabase dashboard:
   - `borrower-docs` (private)
   - `referral_uploads` (private)

### 3. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Application Architecture

### User Roles

**Borrower (`/borrower/dashboard`)**
- Complete loan application forms via Jotform embeds
- Upload required documents (16+ categories)
- Track application progress
- Communicate with loan officer
- Access AI assistant for guidance

**Referral Partner (`/referral`)**
- Submit new leads with business details
- Track referral pipeline status
- Access training video library
- View referral performance metrics
- Direct contact with Chris Foster

**Admin (`/admin/dashboard`)**
- Oversight of all borrower applications
- Document review and approval workflow
- Referral lead management
- User role administration
- Analytics and reporting dashboard

### Database Schema

**Core Tables:**
- `documents` - Borrower file uploads with metadata
- `referral_leads` - Referral partner lead submissions
- Built on Supabase Auth for user management

**Storage Buckets:**
- `borrower-docs` - Categorized document storage
- `referral_uploads` - Referral supporting documents

### Security Features

- Row Level Security (RLS) policies
- Role-based data access
- Secure file storage with user isolation
- Authentication state management
- Protected route navigation

## Document Categories

The application supports 16 document categories for comprehensive loan processing:

- Business Bank Statements (3 Months)
- Business Tax Returns (3 Years)  
- Personal Bank Statements (3 Months)
- Personal Tax Returns (3 Years)
- Credit Report
- Insurance Documents
- Purchase Contract
- Year-To-Date Financials
- And 8 additional categories...

## AI Assistant Integration

The GPT-4 powered assistant provides contextual help based on:
- User role and permissions
- Current application stage
- Document requirements
- Timeline expectations
- Direct escalation to loan officer

## Development

### Project Structure
```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── borrower/        # Borrower-specific components
│   └── AssistantChat.jsx
├── hooks/               # Custom React hooks
├── services/            # API integrations
└── supabaseClient.js    # Database configuration
```

### Key Dependencies
- `@supabase/supabase-js` - Database and auth
- `react-router-dom` - Client-side routing
- `lucide-react` - Icon library
- `date-fns` - Date utilities

### Environment Variables
All sensitive keys should be configured in your hosting environment:
- Vercel: Add to project settings
- Local: Use `.env` file (see `.env.example`)

## Deployment

The application is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Support & Documentation

- **Database Setup**: See `supabase-setup.sql` for complete schema
- **Environment Config**: Reference `.env.example` for all required variables
- **Component Architecture**: Each component is self-contained with clear dependencies

## License

Proprietary - The Foster Company SBA Loan Dashboard