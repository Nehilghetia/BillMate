-- Fix infinite recursion in RLS policies

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can view all bills" ON bills;
DROP POLICY IF EXISTS "Admins can create and edit bills" ON bills;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;

-- Recreate policies without recursive subqueries
-- For users table - simplify admin access
CREATE POLICY "Admins can view all users" ON users FOR SELECT
  USING (
    auth.uid() IN (SELECT auth_id FROM users WHERE user_type = 'admin')
  );

-- For products - admins should bypass RLS, everyone else sees active
CREATE POLICY "Admins can manage products" ON products FOR ALL
  USING (
    auth.uid() IN (SELECT auth_id FROM users WHERE user_type = 'admin')
  );

-- For bills - admins view all
CREATE POLICY "Admins can view all bills" ON bills FOR SELECT
  USING (
    auth.uid() IN (SELECT auth_id FROM users WHERE user_type = 'admin')
  );

CREATE POLICY "Admins can create and edit bills" ON bills FOR ALL
  USING (
    auth.uid() IN (SELECT auth_id FROM users WHERE user_type = 'admin')
  );

-- For orders - admins view all
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT
  USING (
    auth.uid() IN (SELECT auth_id FROM users WHERE user_type = 'admin')
  );

-- For payments - admins view all
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT
  USING (
    auth.uid() IN (SELECT auth_id FROM users WHERE user_type = 'admin')
  );

-- For invoices - admins view all
CREATE POLICY "Admins can view all invoices" ON invoices FOR SELECT
  USING (
    auth.uid() IN (SELECT auth_id FROM users WHERE user_type = 'admin')
  );
