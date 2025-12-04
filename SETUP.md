# Monthly Expense Tracker - Professional Setup Guide

This guide provides step-by-step instructions for setting up the Monthly Expense Tracker application with Supabase database integration and user authentication.

## 📋 Prerequisites

- **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
- **Supabase Project**: Create a new project in your Supabase dashboard
- **Basic Knowledge**: Familiarity with web development and database concepts

## 🗂️ Project Structure

```
monthly-expense-tracker/
├── index.html              # Main application interface
├── scripts.js              # Application logic and event handlers
├── styles.css              # Modern UI styling with glassmorphism
├── config.js               # Configuration and environment variables
├── database_setup.sql      # Complete database schema and policies
├── SETUP.md               # This setup documentation
└── LICENSE                 # Project license information
```

## 🗄️ Database Setup

### Option 1: Automated Setup (Recommended)

The project includes an automated setup script that handles all database configuration:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Update Credentials**
   - Open `setup_database.js` in your editor
   - Replace these placeholder values with your actual Supabase service role key:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_SERVICE_KEY = 'your-service-role-key-here';
   ```

3. **Run Automated Setup**
   ```bash
   npm run setup-db
   # or
   node setup_database.js
   ```

   The script will automatically create:
   - ✅ Database tables with constraints
   - ✅ Performance indexes
   - ✅ Row Level Security policies
   - ✅ Database views and functions
   - ✅ Comprehensive error checking

### Option 2: Manual Setup

If you prefer manual database setup:

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Copy and paste the entire content of `database_setup.sql`
4. Click **Run** to execute the schema

The SQL file includes:
- **Tables**: `expenses` and `budgets` with proper constraints
- **Indexes**: Performance optimizations for month-based and category queries
- **RLS Policies**: Row-level security for multi-tenant data isolation
- **Views**: Optional reporting views for analytics
- **Functions**: Business logic utility functions

### 2. Email Configuration (Recommended)

1. Go to **Authentication** > **Settings** in your Supabase dashboard
2. Configure SMTP settings if using custom email templates
3. Enable email confirmation for production use

## ⚙️ Application Configuration

### 1. Supabase Credentials

1. Open `config.js` in your editor
2. Replace the placeholder values with your actual Supabase credentials:

```javascript
const CONFIG = {
    SUPABASE: {
        URL: 'https://your-project-id.supabase.co',
        ANON_KEY: 'your-supabase-anon-key'
    },
    // ... rest of config
};

// Retrieve these values from:
// Supabase Dashboard → Settings → API
```

### 2. Security Note

⚠️ **Important**: Never commit sensitive credentials to version control. Consider using:
- Environment variables (if deploying to Node.js backend)
- Build-time replacements for production deployments
- Supabase Edge Functions for better security isolation

## 🚀 Deployment Instructions

### Local Development

1. Start a local HTTP server:
```bash
python -m http.server 8000
# or use any HTTP server capable of serving static files
```

2. Open your browser to: `http://localhost:8000/index.html`

### Production Deployment

1. **Static Hosting**: Deploy to Netlify, Vercel, GitHub Pages, or any static hosting service
2. **Security Headers**: Configure CORS policies for your Supabase project if needed
3. **HTTPS**: Ensure SSL/TLS certificates are configured for secure data transmission

### Alternative Deployment Options

- **Supabase Edge Functions**: For server-side processing and enhanced security
- **Serverless Functions**: Use Vercel Functions or Netlify Functions for additional logic
- **CDN**: Configure Cloudflare or similar for global distribution

## 🔧 Troubleshooting

### Common Issues

**Database Connection Errors**:
- Verify Supabase URL and API keys in `config.js`
- Check Supabase project status in dashboard
- Ensure RLS policies are correctly applied

**Authentication Issues**:
- Confirm email confirmation settings in Supabase Auth
- Check browser console for error messages
- Verify user email format and password requirements

**Data Persistence**:
- Ensure user is properly authenticated before database operations
- Check browser network tab for failed API calls
- Verify Row Level Security policies allow the operation

### Performance Optimization

- **Database**: The provided indexes optimize month-based queries
- **Frontend**: Events use delegation for efficient DOM manipulation
- **Caching**: Consider implementing local storage for offline capabilities

## 📊 Features Overview

### ✅ Core Functionality

- **Multi-User System**: Isolated data per authenticated user
- **Full CRUD Operations**: Create, View, Edit, Delete expenses
- **Month-Based Filtering**: Track expenses across different months
- **Budget Management**: Set and monitor monthly spending limits
- **Modern UI**: Glassmorphism design with responsive interactions

### ✅ Advanced Features

- **Real-time Sync**: Instant data updates across sessions
- **Data Validation**: Client and server-side input validation
- **Error Handling**: Comprehensive error handling and user feedback
- **Security**: RLS policies ensure data privacy and integrity

### ✅ Database Reporting (Optional)

Using the provided database views and functions:
- **Monthly Analytics**: Aggregate spending by category
- **Budget Tracking**: Monitor budget utilization
- **Trend Analysis**: Historical spending patterns

## 🔐 Security Best Practices

1. **Environment Variables**: Store sensitive data securely
2. **Input Validation**: Sanitize all user inputs
3. **HTTPS Only**: Enforce secure connections in production
4. **Rate Limiting**: Configure Supabase project rate limits
5. **Regular Backups**: Set up automated database backups
6. **Monitoring**: Enable Supabase Analytics for performance monitoring

## 🤝 Support

For issues or questions:
- Review this documentation thoroughly
- Check Supabase documentation for platform-specific guidance
- Verify JavaScript console for detailed error messages

## 📈 Future Enhancements

Potential feature additions:
- **Data Export**: CSV/Excel download capabilities
- **Receipt Upload**: File attachment functionality
- **Budget Alerts**: Email notifications for budget limits
- **Multi-currency**: International currency support
- **Charts & Analytics**: Enhanced dashboard visualization
- **Categories CRUD**: User-defined expense categories

---

**Last Updated**: December 2025
**Version**: 2.0.0
**License**: [See LICENSE file]
