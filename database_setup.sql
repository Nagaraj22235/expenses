-- Monthly Expense Tracker Database Setup
-- Execute these commands in sequence within Supabase SQL Editor
-- Ensure you have selected your project database

-- =============================================================================
-- TABLES AND SCHEMA DEFINITION
-- =============================================================================

-- Expenses Table: Stores individual expense records for each user
-- Enforces data integrity with constraints and references
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN ('food', 'travel', 'other')),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets Table: Stores monthly budget amounts for each user
-- User can have only one budget record (enforced by UNIQUE constraint)
CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Index on expenses for efficient month-based queries
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);

-- Index on expenses category for filtering
CREATE INDEX idx_expenses_category ON expenses(user_id, category);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Expenses Table Policies
-- Users can only view, insert, update, and delete their own expenses
CREATE POLICY "Users can view their own expenses"
ON expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
ON expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
ON expenses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
ON expenses FOR DELETE
USING (auth.uid() = user_id);

-- Budgets Table Policies
-- Users can only view, insert, and update their own budget
CREATE POLICY "Users can view their own budget"
ON budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget"
ON budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget"
ON budgets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- VIEWS FOR COMPLEX QUERIES (OPTIONAL)
-- =============================================================================

-- Monthly expense summary view
CREATE VIEW monthly_expenses AS
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

-- Weekly expense summary view within current month
CREATE VIEW weekly_expenses AS
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

-- =============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC (OPTIONAL)
-- =============================================================================

-- Function to get user's current month budget status
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

-- =============================================================================
-- PERMISSIONS AND GRANTS
-- =============================================================================

-- Grant necessary permissions (typically handled automatically by Supabase)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON budgets TO authenticated;
-- GRANT USAGE ON SEQUENCE expenses_id_seq TO authenticated;
-- GRANT USAGE ON SEQUENCE budgets_id_seq TO authenticated;

-- =============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- =============================================================================

-- Note: Uncomment below for testing. Replace 'your-user-id' with actual user UUID
-- after creating a test user account

/*
-- Sample budget
INSERT INTO budgets (user_id, amount) VALUES
('your-user-id', 50000.00);

-- Sample expenses
INSERT INTO expenses (user_id, amount, category, date) VALUES
('your-user-id', 2500.00, 'food', '2025-12-01 10:00:00+00'),
('your-user-id', 1500.00, 'travel', '2025-12-02 14:30:00+00'),
('your-user-id', 800.00, 'food', '2025-12-03 12:15:00+00'),
('your-user-id', 3200.00, 'other', '2025-12-04 16:45:00+00'),
('your-user-id', 1200.00, 'food', '2025-12-05 09:20:00+00');
*/

-- =============================================================================
-- COMPLETION NOTES
-- =============================================================================

-- This SQL file sets up a complete, secure expense tracking database with:
-- - Proper data integrity constraints
-- - Row Level Security for multi-tenant isolation
-- - Performance optimized indexes
-- - Optional views for complex reporting
-- - Utility functions for business logic
--
-- After executing this file, proceed with application configuration
-- as documented in README.md
