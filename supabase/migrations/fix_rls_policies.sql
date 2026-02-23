-- ============================================
-- FIX ROW LEVEL SECURITY POLICIES
-- Allow admins to manage products
-- ============================================

-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON products;

-- Policy 1: Allow public to view active products
CREATE POLICY "Public can view active products"
    ON products FOR SELECT
    USING (is_active = true OR is_active IS NULL);

-- Policy 2: Allow authenticated users to view all products
CREATE POLICY "Authenticated users can view all products"
    ON products FOR SELECT
    TO authenticated
    USING (true);

-- Policy 3: Allow authenticated users (admins) to INSERT products
CREATE POLICY "Authenticated users can insert products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 4: Allow authenticated users (admins) to UPDATE products
CREATE POLICY "Authenticated users can update products"
    ON products FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 5: Allow authenticated users (admins) to DELETE products
CREATE POLICY "Authenticated users can delete products"
    ON products FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- FIX BILL_ITEMS FOREIGN KEY CONSTRAINT
-- Make it CASCADE or SET NULL on delete
-- ============================================

-- First, check if the foreign key exists and drop it
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'bill_items_product_id_fkey' 
        AND table_name = 'bill_items'
    ) THEN
        ALTER TABLE bill_items DROP CONSTRAINT bill_items_product_id_fkey;
    END IF;
END $$;

-- Add the foreign key back with ON DELETE SET NULL
-- This way, if a product is deleted, the bill_items will have NULL product_id
ALTER TABLE bill_items 
ADD CONSTRAINT bill_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- View all policies on products table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'products';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully!';
    RAISE NOTICE 'Authenticated users can now fully manage products';
    RAISE NOTICE 'Foreign key constraint updated to SET NULL on delete';
END $$;
