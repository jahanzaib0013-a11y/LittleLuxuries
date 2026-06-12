-- Fix: orders (and related tables) had RLS enabled with only a SELECT policy,
-- so DELETE/UPDATE/INSERT were silently denied — deletes removed 0 rows without
-- an error, making "deleted" orders reappear. This grants full access (dev mode),
-- matching 002_orders_schema_fixed.sql which was never applied to this database.

-- Orders
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
CREATE POLICY "Allow all operations on orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);

-- Order items (cascade-deleted with their order)
DROP POLICY IF EXISTS "Allow all operations on order_items" ON order_items;
CREATE POLICY "Allow all operations on order_items" ON order_items
  FOR ALL USING (true) WITH CHECK (true);

-- Order status history (cascade-deleted with their order)
DROP POLICY IF EXISTS "Allow all operations on order_status_history" ON order_status_history;
CREATE POLICY "Allow all operations on order_status_history" ON order_status_history
  FOR ALL USING (true) WITH CHECK (true);

-- Customers
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);
