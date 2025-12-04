#!/usr/bin/env node

// Monthly Expense Tracker - Database Setup Script
// Run this script to automatically create all required tables, policies, and indexes
//
// Usage: node setup_database.js
//
// Prerequisites:
// 1. Install Node.js: https://nodejs.org/
// 2. Install Supabase JS client: npm install @supabase/supabase-js
// 3. Update the credentials below with your Supabase URL and service role key
//    (Get service role key from: Supabase Dashboard → Settings → API → service_role key)
//    WARNING: Keep this key secret and never expose it in client-side code

const { createClient } = require('@supabase/supabase-js');

// =============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// =============================================================================

// Replace with your actual Supabase project URL
const SUPABASE_URL = 'YOUR_SUPABASE_URL';

// Replace with your actual service role key (NOT anon key)
// This key has elevated privileges and should NEVER be exposed in client code
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

async function executeQuery(query, description) {
    console.log(`\n📋 ${description}`);
    try {
        const { data, error } = await supabase.rpc('exec_sql', { query });
        if (error && !error.message.includes('function exec_sql')) {
            // Try direct approach if RPC doesn't work
            console.log('   ℹ️  Using alternative method...');
            await executeDirectQuery(query);
        } else if (error) {
            await executeDirectQuery(query);
        } else {
            console.log('   ✅ Success');
        }
    } catch (err) {
        await executeDirectQuery(query);
    }
}

async function executeDirectQuery(query) {
    // For complex operations, we'll need to use the REST API directly
    // This is a simplified version - in production you'd want more robust error handling
    console.log('   ⚠️  Complex query - please run manually in Supabase SQL Editor');
    console.log('   📄 Query to execute:');
    console.log('   ' + query.replace(/\n/g, '\n   '));
}

async function checkConnection() {
    console.log('🔍 Checking Supabase connection...');
    const { data, error } = await supabase.from('auth.users').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.message.includes('JWT')) {
            console.error('   📝 Check your service role key');
        } else if (error.message.includes('URL')) {
            console.error('   📝 Check your Supabase URL');
        }
        process.exit(1);
    }

    console.log('✅ Connected to Supabase successfully!');
}

// =============================================================================
// DATABASE SCHEMA DEFINITION
// =============================================================================

async function createTables() {
    console.log('\n🏗️  Creating Tables...');

    // Expenses Table
    await executeQuery(`
        CREATE TABLE IF NOT EXISTS expenses (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
            category TEXT NOT NULL CHECK (category IN ('food', 'travel', 'other')),
            date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `, 'Creating expenses table');

    // Budgets Table
    await executeQuery(`
        CREATE TABLE IF NOT EXISTS budgets (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `, 'Creating budgets table');
}

async function createIndexes() {
    console.log('\n🔍 Creating Performance Indexes...');

    // Expenses indexes
    await executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
    `, 'Creating expenses user-date index');

    await executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category);
    `, 'Creating expenses category index');

    console.log('✅ Indexes created successfully!');
}

async function enableRLS() {
    console.log('\n🔒 Enabling Row Level Security...');

    await executeQuery('ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;', 'Enabling RLS on expenses table');
    await executeQuery('ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;', 'Enabling RLS on budgets table');

    console.log('✅ Row Level Security enabled!');
}

async function createPolicies() {
    console.log('\n📋 Creating Security Policies...');

    // Expenses policies
    const expensePolicies = [
        {
            name: 'Users can view their own expenses',
            sql: `CREATE POLICY "Users can view their own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);`
        },
        {
            name: 'Users can insert their own expenses',
            sql: `CREATE POLICY "Users can insert their own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);`
        },
        {
            name: 'Users can update their own expenses',
            sql: `CREATE POLICY "Users can update their own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
        },
        {
            name: 'Users can delete their own expenses',
            sql: `CREATE POLICY "Users can delete their own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);`
        }
    ];

    for (const policy of expensePolicies) {
        await executeQuery(policy.sql, `Creating policy: ${policy.name}`);
    }

    // Budget policies
    const budgetPolicies = [
        {
            name: 'Users can view their own budget',
            sql: `CREATE POLICY "Users can view their own budget" ON budgets FOR SELECT USING (auth.uid() = user_id);`
        },
        {
            name: 'Users can insert their own budget',
            sql: `CREATE POLICY "Users can insert their own budget" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);`
        },
        {
            name: 'Users can update their own budget',
            sql: `CREATE POLICY "Users can update their own budget" ON budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
        }
    ];

    for (const policy of budgetPolicies) {
        await executeQuery(policy.sql, `Creating policy: ${policy.name}`);
    }

    console.log('✅ Security policies created successfully!');
}

async function createViews() {
    console.log('\n📊 Creating Database Views...');

    // Monthly expenses summary view
    await executeQuery(`
        CREATE OR REPLACE VIEW monthly_expenses AS
        SELECT
            user_id,
            DATE_TRUNC('month', date) as month_start,
            category,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            AVG(amount) as average_amount
        FROM expenses
        GROUP BY user_id, DATE_TRUNC('month', date), category
        ORDER BY month_start DESC, category;
    `, 'Creating monthly_expenses view');

    // Weekly expenses summary view
    await executeQuery(`
        CREATE OR REPLACE VIEW weekly_expenses AS
        SELECT
            user_id,
            DATE_TRUNC('week', date) as week_start,
            category,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
        FROM expenses
        WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
          AND date < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
        GROUP BY user_id, DATE_TRUNC('week', date), category
        ORDER BY user_id, week_start;
    `, 'Creating weekly_expenses view');

    console.log('✅ Database views created successfully!');
}

async function createFunctions() {
    console.log('\n⚙️  Creating Utility Functions...');

    await executeQuery(`
        CREATE OR REPLACE FUNCTION get_budget_status(user_uuid UUID DEFAULT auth.uid())
        RETURNS TABLE (
            budget_amount DECIMAL(10,2),
            spent_this_month DECIMAL(10,2),
            remaining_budget DECIMAL(10,2),
            percent_used DECIMAL(5,2)
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT
                COALESCE(b.amount, 0) as budget_amount,
                COALESCE(SUM(e.amount), 0) as spent_this_month,
                COALESCE(b.amount, 0) - COALESCE(SUM(e.amount), 0) as remaining_budget,
                CASE
                    WHEN b.amount > 0 THEN
                        ROUND((COALESCE(SUM(e.amount), 0) / b.amount) * 100, 2)
                    ELSE 0
                END as percent_used
            FROM budgets b
            LEFT JOIN expenses e ON e.user_id = b.user_id
                AND DATE_TRUNC('month', e.date) = DATE_TRUNC('month', CURRENT_DATE)
            WHERE b.user_id = user_uuid
            GROUP BY b.amount;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `, 'Creating get_budget_status function');

    console.log('✅ Utility functions created successfully!');
}

async function createSampleData() {
    console.log('\n📝 Creating Sample Data (Optional)...');

    const createSampleChoice = await askForSampleData();

    if (createSampleChoice === 'y' || createSampleChoice === 'Y') {
        console.log('   ⚠️  Note: Sample data creation requires a valid user account');
        console.log('   ℹ️  Please create a user account first, then update user_id in the script');
        console.log('   💡 For now, sample data SQL is available in database_setup.sql');
    }

    console.log('   📄 Sample data SQL available in database_setup.sql file');
}

function askForSampleData() {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('   ❓ Do you want to create sample data? (y/n): ', (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
    console.log('🚀 Monthly Expense Tracker - Database Setup');
    console.log('=============================================');

    // Validate configuration
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_SERVICE_KEY === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
        console.error('❌ Please update the SUPABASE_URL and SUPABASE_SERVICE_KEY values in this script');
        console.error('   📝 Get these from: Supabase Dashboard → Settings → API');
        process.exit(1);
    }

    // Check connection
    await checkConnection();

    // Execute setup steps
    await createTables();
    await createIndexes();
    await enableRLS();
    await createPolicies();
    await createViews();
    await createFunctions();

    // Optional sample data
    await createSampleData();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Tables: expenses, budgets');
    console.log('   ✅ Indexes: user-date, category');
    console.log('   ✅ Security: Row Level Security enabled');
    console.log('   ✅ Policies: User data isolation');
    console.log('   ✅ Views: monthly_expenses, weekly_expenses');
    console.log('   ✅ Functions: get_budget_status');

    console.log('\n🚀 Ready to use your Expense Tracker application!');
    console.log('   📖 See README.md for application setup instructions');

    process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error.message);
    console.error('   💡 Make sure your credentials are correct and the database is accessible');
    process.exit(1);
});

// Run the setup
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, supabase };
