-- Orders Schema for Little Luxuries
-- Designed to work with AssanPay integration

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping addresses table
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'PK',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- Format: LL-XXXXX
  
  -- Customer info
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Shipping address (snapshot at time of order)
  shipping_first_name TEXT NOT NULL,
  shipping_last_name TEXT NOT NULL,
  shipping_street_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT DEFAULT 'PK',
  
  -- Financial
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending_payment' 
    CHECK (status IN ('pending_payment', 'payment_initiated', 'paid', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded')),
  
  -- Payment info (AssanPay ready)
  payment_provider TEXT DEFAULT NULL, -- 'assanpay', 'cod', etc.
  payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'initiated', 'processing', 'completed', 'failed', 'refunded')),
  external_transaction_id TEXT, -- AssanPay transaction ID
  external_payment_link TEXT, -- AssanPay completeLink for redirect
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Fulfillment
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- For storing AssanPay response data, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  
  -- Product snapshot at time of order
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image_url TEXT,
  
  -- Pricing snapshot
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Variant info
  size TEXT,
  color TEXT,
  variant TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  previous_status TEXT,
  notes TEXT,
  created_by TEXT, -- 'system', 'customer', 'admin', or user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_external_transaction_id ON orders(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_customer_id ON shipping_addresses(customer_id);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'LL-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 10001;

-- Create trigger to auto-generate order number
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON shipping_addresses;
CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, previous_status, created_by)
    VALUES (NEW.id, NEW.status, OLD.status, COALESCE(current_setting('app.current_user', true), 'system'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_order_status_change ON orders;
CREATE TRIGGER log_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Enable RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Customers can view their own data
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'authenticated');

CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = customer_id::text OR auth.role() = 'authenticated');

CREATE POLICY "Customers can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id 
      AND (orders.customer_id::text = auth.uid()::text OR auth.role() = 'authenticated')
    )
  );

-- Insert sample data for testing (optional - remove in production)
-- Uncomment below to add sample orders for testing
/*
INSERT INTO customers (id, email, first_name, last_name, phone)
VALUES 
  (gen_random_uuid(), 'sophia.miller@example.com', 'Sophia', 'Miller', '+92-300-1234567'),
  (gen_random_uuid(), 'marcus.chen@example.com', 'Marcus', 'Chen', '+92-301-9876543')
ON CONFLICT DO NOTHING;

INSERT INTO orders (
  customer_id, customer_email, customer_first_name, customer_last_name, customer_phone,
  shipping_first_name, shipping_last_name, shipping_street_address, shipping_city, shipping_postal_code,
  subtotal, tax_amount, shipping_amount, total_amount, status, payment_status
)
SELECT 
  c.id, c.email, c.first_name, c.last_name, c.phone,
  c.first_name, c.last_name, '123 Test Street', 'Lahore', '54000',
  120.00, 9.60, 10.00, 139.60, 'pending_payment', 'pending'
FROM customers c
LIMIT 1;
*/
