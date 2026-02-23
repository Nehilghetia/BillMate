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

-- Add discount fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON promotions(category);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- Insert sample promotions
INSERT INTO promotions (title, description, discount_percent, category, banner_color) VALUES
('Mobile Mania', 'Get 30% off on all mobile phones', 30, 'Electronics', '#8B5CF6'),
('Laptop Deals', 'Save 30% on premium laptops', 30, 'Electronics', '#3B82F6')
ON CONFLICT DO NOTHING;

-- Update trigger for promotions
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
