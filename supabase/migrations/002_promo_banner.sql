-- Site content + promo banner column
-- Safe if you never ran 001_initial_schema.sql (creates `content` table first).

CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY DEFAULT 'default',
  hero_banner JSONB NOT NULL DEFAULT '{"title": "Hand-crafted for Little Luxuries", "subtitle": "Premium baby essentials with love in every stitch", "badge_text": "Hand-crafted", "headline": "Discover our collection of premium baby essentials, thoughtfully designed for comfort and style.", "image_url": "/hero-baby.jpg"}'::jsonb,
  announcement_bar JSONB NOT NULL DEFAULT '{"is_active": false, "promises": [{"title": "Ethically Made", "description": "Responsibly sourced and sustainably produced with love for the planet."}, {"title": "Heirloom Quality", "description": "Standards of craftsmanship designed to last through generations."}, {"title": "Soft on Skin", "description": "Hypoallergenic and ultra-soft fabrics for the most sensitive skin."}]}'::jsonb,
  layout TEXT NOT NULL DEFAULT 'Editorial Grid',
  promo_banner JSONB NOT NULL DEFAULT '{
    "isActive": false,
    "variant": "festival",
    "eyebrow": "Limited time",
    "headline": "Seasonal Sale — 20% off",
    "description": "On selected heirloom pieces.",
    "promoCode": "LUXE10",
    "showPromoCode": true,
    "buttonLabel": "Shop the sale",
    "buttonLink": "/shop",
    "showButton": true,
    "iconName": "Gift",
    "textAlign": "center",
    "backgroundTheme": "gold",
    "endsAt": null
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If `content` already existed from 001 without promo_banner, add the column
ALTER TABLE content
ADD COLUMN IF NOT EXISTS promo_banner JSONB NOT NULL DEFAULT '{
  "isActive": false,
  "variant": "festival",
  "eyebrow": "Limited time",
  "headline": "Seasonal Sale — 20% off",
  "description": "On selected heirloom pieces.",
  "promoCode": "LUXE10",
  "showPromoCode": true,
  "buttonLabel": "Shop the sale",
  "buttonLink": "/shop",
  "showButton": true,
  "iconName": "Gift",
  "textAlign": "center",
  "backgroundTheme": "gold",
  "endsAt": null
}'::jsonb;

INSERT INTO content (id, hero_banner, announcement_bar, layout, promo_banner)
VALUES (
  'default',
  '{"headline": "Gentle luxuries\nfor your little one.", "buttonLabel": "Shop Collection", "buttonLink": "/shop", "seasonTag": "New Collection 2026", "description": "Thoughtfully designed garments that embrace your baby in softest ethically-sourced materials.", "badgeTitle": "Hand-crafted", "badgeSubtitle": "In small artisan batches", "socialProofText": "Loved by 12,000+ families worldwide", "showSocialProof": true, "socialProofIconName": "Star"}'::jsonb,
  '{"isActive": false, "promises": [{"title": "Ethically Made", "description": "Responsibly sourced and sustainably produced with love for the planet."}, {"title": "Heirloom Quality", "description": "Standards of craftsmanship designed to last through generations."}, {"title": "Soft on Skin", "description": "Hypoallergenic and ultra-soft fabrics for the most sensitive skin."}]}'::jsonb,
  'Editorial Grid',
  '{"isActive": false, "variant": "festival", "eyebrow": "Limited time", "headline": "Seasonal Sale — 20% off", "description": "On selected heirloom pieces.", "promoCode": "LUXE10", "showPromoCode": true, "buttonLabel": "Shop the sale", "buttonLink": "/shop", "showButton": true, "iconName": "Gift", "textAlign": "center", "backgroundTheme": "gold", "endsAt": null}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
