-- Add customer tier field to customers table
ALTER TABLE customers 
ADD COLUMN tier TEXT DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Bronze', 'Silver', 'Gold', 'Platinum'));

-- Add index for faster tier-based queries
CREATE INDEX idx_customers_tier ON customers(tier);
