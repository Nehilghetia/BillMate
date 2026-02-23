-- Create tables for BillMate Billing System

-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'admin')),
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products/Services table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bills/Invoices table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'cancelled')) DEFAULT 'draft',
  payment_method TEXT,
  notes TEXT,
  due_date DATE,
  paid_date DATE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bill Items (Line items in a bill)
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders table (for customer checkout)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'upi', 'net_banking', 'card', 'emi', 'cash_on_delivery')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_transaction_id TEXT,
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pdf_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'viewed', 'paid')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit logs for admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_by ON bills(created_by);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "Admins can view all users" ON users FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND user_type = 'admin'));

CREATE POLICY "Users can create their own profile" ON users FOR INSERT
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
  USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Everyone can view active products" ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage products" ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND user_type = 'admin'));

-- RLS Policies for bills
CREATE POLICY "Users can view their own bills" ON bills FOR SELECT
  USING (customer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all bills" ON bills FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND user_type = 'admin'));

CREATE POLICY "Admins can create and edit bills" ON bills FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND user_type = 'admin'));

-- RLS Policies for orders
CREATE POLICY "Customers can view their own orders" ON orders FOR SELECT
  USING (customer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all orders" ON orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND user_type = 'admin'));

CREATE POLICY "Customers can create their own orders" ON orders FOR INSERT
  WITH CHECK (customer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = (SELECT id FROM users WHERE auth_id = auth.uid())));

CREATE POLICY "Admins can view all payments" ON payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND user_type = 'admin'));

-- RLS Policies for invoices
CREATE POLICY "Customers can view their invoices" ON invoices FOR SELECT
  USING (customer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all invoices" ON invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND user_type = 'admin'));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
