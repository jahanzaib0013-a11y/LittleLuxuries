-- Update Order Statuses
-- Add 'order_confirmed' after 'order_placed'
-- Rename 'confirmed' to 'payment_confirmed' and place before 'pending_payment'

-- Update the status constraint to include new statuses
ALTER TABLE orders 
DROP CONSTRAINT orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'order_placed', 
  'order_confirmed', 
  'payment_confirmed', 
  'pending_payment', 
  'payment_initiated', 
  'paid', 
  'packed', 
  'shipped', 
  'delivered', 
  'cancelled', 
  'refunded'
));

-- Update existing 'confirmed' orders to 'payment_confirmed'
UPDATE orders 
SET status = 'payment_confirmed' 
WHERE status = 'confirmed';

-- Update order_status_history entries
UPDATE order_status_history 
SET status = 'payment_confirmed' 
WHERE status = 'confirmed';
