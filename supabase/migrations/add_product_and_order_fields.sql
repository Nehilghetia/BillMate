-- Add new fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS model_name TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS warranty TEXT,
ADD COLUMN IF NOT EXISTS return_policy TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add new fields to bills table for comprehensive order management
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'placed' CHECK (order_status IN ('placed', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Add bank information fields (optional, for COD or other payment methods)
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online',
ADD COLUMN IF NOT EXISTS bank_reference TEXT;

-- Create index for faster order status queries
CREATE INDEX IF NOT EXISTS idx_bills_order_status ON bills(order_status);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);

-- Add updated_at trigger for bills table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
