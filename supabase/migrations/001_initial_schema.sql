-- Create content table for storing site content
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY DEFAULT 'default',
  hero_banner JSONB NOT NULL DEFAULT '{"title": "Hand-crafted for Little Luxuries", "subtitle": "Premium baby essentials with love in every stitch", "badge_text": "Hand-crafted", "headline": "Discover our collection of premium baby essentials, thoughtfully designed for comfort and style.", "image_url": "/hero-baby.jpg"}',
  announcement_bar JSONB NOT NULL DEFAULT '{"is_active": true, "promises": [{"title": "Ethically Made", "description": "Crafted with sustainable materials and fair trade practices"}, {"title": "Heirloom Quality", "description": "Designed to last through generations of little ones"}, {"title": "Soft on Skin", "description": "Gentle fabrics perfect for delicate baby skin"}]}',
  layout TEXT NOT NULL DEFAULT 'Editorial Grid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  variant TEXT NOT NULL,
  badge TEXT,
  description TEXT NOT NULL,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Insert default content if it doesn't exist
INSERT INTO content (id, hero_banner, announcement_bar, layout)
VALUES (
  'default',
  '{"title": "Hand-crafted for Little Luxuries", "subtitle": "Premium baby essentials with love in every stitch", "badge_text": "Hand-crafted", "headline": "Discover our collection of premium baby essentials, thoughtfully designed for comfort and style.", "image_url": "/hero-baby.jpg"}',
  '{"is_active": true, "promises": [{"title": "Ethically Made", "description": "Crafted with sustainable materials and fair trade practices"}, {"title": "Heirloom Quality", "description": "Designed to last through generations of little ones"}, {"title": "Soft on Skin", "description": "Gentle fabrics perfect for delicate baby skin"}]}',
  'Editorial Grid'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, price, image_url, category, variant, badge, description, sizes)
VALUES 
  ('Cloud-Soft Organic Onesie', 48.00, '/product-onesie.jpg', 'Onesies', 'Lavender / 100% Organic Cotton', 'New', 'Luxuriously soft organic cotton onesie, hand-finished with love for your baby''s delicate skin.', ARRAY['Newborn', '0–3M', '3–6M', '6–12M']),
  ('Pure Wool Knitted Booties', 32.00, '/product-booties.jpg', 'Knitwear', 'Dusty Rose / Merino Wool', 'Bestseller', 'Hand-knit in small batches from the finest merino wool. Tiny, tender, and irresistibly soft on little feet.', ARRAY['0–3M', '3–6M', '6–12M']),
  ('Blush Garden Linen Swaddle', 58.00, '/product-swaddle.jpg', 'Accessories', 'Blush / French Linen', '', 'A breathable French linen swaddle with delicate hand-embroidered botanical detail.', ARRAY['One Size']),
  ('The Luxury Gift Box', 95.00, '/product-giftbox.jpg', 'Gift Sets', 'Lavender / Curated Trio', 'New', 'Three of our most-loved pieces, beautifully presented in a keepsake box with hand-tied gold ribbon.', ARRAY['Newborn', '0–3M', '3–6M']),
  ('Essential Sleep Suit Duo', 78.00, '/product-sleepwear.jpg', 'Sleepwear', 'Sage & Ivory / Pima Cotton', '', 'A pair of buttery-soft pima cotton sleep suits in calming, nursery-friendly tones.', ARRAY['Newborn', '0–3M', '3–6M', '6–12M']),
  ('Heirloom Knit Hat & Mittens', 42.00, '/product-accessories.jpg', 'Accessories', 'Lilac & Saffron / Hand-knit', 'Low stock', 'A cozy hat-and-mittens set hand-knit with whisper-soft yarn. Topped with playful pom-poms.', ARRAY['0–6M', '6–12M'])
ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
