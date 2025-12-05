# Monthly Expense Tracker

A modern expense tracking application with full CRUD operations, month-based filtering, custom categories, and a beautiful glassmorphism UI. Uses Supabase for secure, cloud-based data storage.

## ✨ Features

- 💰 **Budget Management** - Set and track monthly spending limits
- 📅 **Custom Dates** - Add expenses for any date (defaults to today)
- 🏷️ **Custom Categories** - Flexible category system with support for custom "Other" categories
- 📊 **Flexible Reporting** - Download monthly reports in CSV or Excel format
- ✏️ **Full CRUD** - Create, Read, Update, Delete expenses
- 🎨 **Modern UI** - Beautiful glassmorphism design with animations
- 🔒 **Secure Database** - Data stored securely in Supabase with user authentication
- 📱 **Responsive** - Works on desktop and mobile devices

## 🚀 Quick Start

### Database Setup (One-time)
1. Create a [Supabase](https://supabase.com) account and project
2. Copy the database setup script from `database_setup.sql`
3. Run it in your Supabase SQL Editor to create tables and policies
4. Update `config.js` with your Supabase project credentials

### Running the Application
1. **Clone or download** this repository
2. **Start a local server**:
   ```bash
   python -m http.server 8000
   # or
   npm start  # if you prefer npm
   ```
3. **Open your browser** to `http://localhost:8000/index.html`
4. **Create account** and start tracking expenses!

## 🎯 How to Use

### User Authentication
- **Sign up** with email and password
- **Sign in** to access your existing data
- Data is securely stored per user

### Budget Setup
- Enter your monthly budget amount
- Click "Set Budget" to save it
- View your spending progress in real-time

### Adding Expenses
- Enter the expense amount
- Select category: Food, Travel, or Other
- When "Other" is selected, specify the custom category (e.g., "Utilities", "Medical")
- Select date (defaults to today)
- Click "Add Expense" to save

### Month Filtering & Reporting
- Use the month picker to select any month
- View expenses and calculations for that period
- Download reports in CSV or Excel format
- Access reports for all months with expenses

### Managing Expenses
- Click "Edit" to modify any expense (including date and category)
- Click "Delete" to remove expenses
- All changes sync automatically with the database

## 📊 Database Migration

If you have existing data with the old category constraint, run `database_migration.sql` in your Supabase SQL Editor to update the schema to support custom categories.

## 🛠️ Technical

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with RLS policies
- **Styling**: Modern CSS with glassmorphism effects
- **Data Export**: Client-side CSV/Excel generation
- **Responsive**: Mobile-first design approach

## 📁 Project Files

```
expense-tracker/
├── index.html              # Main application UI
├── scripts.js              # Core functionality and database operations
├── styles.css              # Modern glassmorphism styling
├── config.js               # Supabase configuration (update with your credentials)
├── database_setup.sql      # Initial database schema setup
├── database_migration.sql  # Schema migration for existing databases
├── setup_database.js       # Database setup helper
├── package.json            # Project dependencies and scripts
└── README.md              # This documentation
```
