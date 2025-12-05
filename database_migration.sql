-- Database Migration for Updating Categories Constraint
-- Run this script in Supabase SQL Editor for existing databases
-- This updates the category column to accept free-form text input instead of limited options

-- =============================================================================
-- MIGRATION: Update Category Constraint to Allow Free-Form Text
-- =============================================================================

-- Step 1: Drop the existing category constraint
ALTER TABLE expenses DROP CONSTRAINT expenses_category_check;

-- Step 2: Add new constraint that allows any non-empty category text
ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (LENGTH(TRIM(category)) > 0);

-- =============================================================================
-- VERIFICATION QUERIES (Optional - Run after migration)
-- =============================================================================

-- Check that the new constraint is active
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'expenses_category_check';

-- Verify that category values can now be any text
-- INSERT INTO expenses (user_id, amount, category, date) VALUES ('your-user-id', 100, 'Utilities', NOW()); -- Should work
-- INSERT INTO expenses (user_id, amount, category, date) VALUES ('your-user-id', 200, 'Entertainment', NOW()); -- Should work

-- =============================================================================
-- COMPLETION NOTES
-- =============================================================================

-- After running this migration:
-- 1. The database will accept any non-empty category names
-- 2. Users can enter custom categories like "Utilities", "Medical", "Entertainment", etc.
-- 3. The application UI logic remains the same and will work with the updated schema
