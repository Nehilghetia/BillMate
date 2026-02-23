-- Disable RLS for development - simpler and avoids recursion issues
-- In production, replace with proper JWT-based policies

-- Disable RLS on all tables for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on auth tables (Supabase manages these)
-- This allows full development/testing without recursion issues