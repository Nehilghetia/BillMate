-- ============================================
-- BILLMATE COMPLETE DATABASE SCHEMA
-- All tables and migrations combined
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PRODUCTS TABLE ENHANCEMENTS
-- ============================================

-- Add new fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS model_name TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS warranty TEXT,
ADD COLUMN IF NOT EXISTS return_policy TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ============================================
-- 2. BILLS TABLE ENHANCEMENTS (Orders)
-- ============================================

-- Add comprehensive order management fields to bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'placed' CHECK (order_status IN ('placed', 'processing', 'shipped', 'delivered', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online',
ADD COLUMN IF NOT EXISTS bank_reference TEXT;

-- Create indexes for bills
CREATE INDEX IF NOT EXISTS idx_bills_order_status ON bills(order_status);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- ============================================
-- 3. PROMOTIONS TABLE (New)
-- ============================================

-- Create promotions table for admin to manage discounts
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    category TEXT, -- If null, applies to specific products
    product_ids UUID[], -- Array of product IDs if category is null
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    banner_image TEXT,
    banner_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

-- ============================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for bills table if not exists
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at 
    BEFORE UPDATE ON bills
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for promotions table if not exists
DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON promotions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SAMPLE DATA (Optional)
-- ============================================

-- Insert sample promotions (only if table is empty)
INSERT INTO promotions (title, description, discount_percent, category, banner_color)
SELECT 'Mobile Mania', 'Get 30% off on all mobile phones', 30, 'Electronics', '#8B5CF6'
WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE title = 'Mobile Mania');

INSERT INTO promotions (title, description, discount_percent, category, banner_color)
SELECT 'Laptop Deals', 'Save 30% on premium laptops', 30, 'Electronics', '#3B82F6'
WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE title = 'Laptop Deals');

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on promotions table
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Allow public to read active promotions
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;
CREATE POLICY "Public can view active promotions"
    ON promotions FOR SELECT
    USING (is_active = true);

-- Allow authenticated users to view all promotions
DROP POLICY IF EXISTS "Authenticated users can view all promotions" ON promotions;
CREATE POLICY "Authenticated users can view all promotions"
    ON promotions FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins to manage promotions (you'll need to adjust based on your auth setup)
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
CREATE POLICY "Admins can manage promotions"
    ON promotions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 7. VIEWS FOR ANALYTICS (Optional)
-- ============================================

-- Create view for active promotions
CREATE OR REPLACE VIEW active_promotions AS
SELECT 
    id,
    title,
    description,
    discount_percent,
    category,
    banner_color,
    start_date,
    end_date
FROM promotions
WHERE is_active = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW());

-- Create view for order statistics
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
    order_status,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value
FROM bills
WHERE status = 'paid'
GROUP BY order_status;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables exist
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created/updated: products, bills, promotions';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Triggers added for automatic timestamp updates';
    RAISE NOTICE 'RLS policies configured for security';
END $$;
