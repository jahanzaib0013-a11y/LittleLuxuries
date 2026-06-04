-- Pakistan domestic shipping: PKR 250 flat, free from PKR 10,000
UPDATE shipping_zones
SET
  shipping_cost = 250,
  free_shipping_threshold = 10000,
  delivery_info = 'Flat PKR 250 · Free from PKR 10,000'
WHERE name = 'Pakistan';
