-- Pretty Nails by Atasha - Cebu City
-- Initial Database Seed Script

-- 1. Services
INSERT INTO services (id, name, category, description, base_price, duration, is_active, created_at, updated_at)
VALUES
  ('srv-biab-01', 'Structured BIAB & Gel Overlay', 'GEL', 'Natural plate reinforcement with Russian dry cuticle prep and high-shine Japanese apex finish. Includes autoclave-sterilized implements.', 50000, 60, true, NOW(), NOW()),
  ('srv-ext-02', 'Soft Gel Sculpted Extensions', 'EXTENSION', 'Sculpted length with apex architecture and Japanese soft gel. Unrushed structural balance designed for high durability. Autoclave sterilization guaranteed.', 80000, 90, true, NOW(), NOW()),
  ('srv-ped-03', 'Signature Luxe Gel Pedicure', 'PEDICURE', 'Callus softening, gentle dry prep, natural foot soak, and high-shine long-wearing gel finish with sterilized tools.', 60000, 60, true, NOW(), NOW()),
  ('srv-cln-04', 'Studio Dry Cuticle Prep & Hygiene Care', 'CLEANING', 'Precision e-file Russian dry manicuring, cuticle refinement, and natural plate conditioning without abrasive soaking. Hospital-grade autoclave sterilization.', 30000, 30, true, NOW(), NOW()),
  ('srv-art-05', 'Bespoke Hand-Painted Nail Art', 'ADDON', 'Custom fine-line artwork, tortoiseshell glass, metallic foil accents, or tailored editorial aesthetics.', 15000, 30, true, NOW(), NOW()),
  ('srv-rem-06', 'Gentle Gel Removal & Plate Conditioning', 'ADDON', 'Safe electric-file debulking and gentle wrap soak-off without scraping or damaging natural keratin layers.', 20000, 30, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Service Variants
INSERT INTO service_variants (id, service_id, name, price, is_active, created_at)
VALUES
  ('var-biab-1', 'srv-biab-01', 'Classic Single-Tone', 50000, true, NOW()),
  ('var-biab-2', 'srv-biab-01', 'French Accent Hairline', 60000, true, NOW()),
  ('var-biab-3', 'srv-biab-01', 'Magnetic Velvet Cat-Eye', 65000, true, NOW()),
  ('var-ext-1', 'srv-ext-02', 'Short', 80000, true, NOW()),
  ('var-ext-2', 'srv-ext-02', 'Medium', 95000, true, NOW()),
  ('var-ext-3', 'srv-ext-02', 'Long', 110000, true, NOW()),
  ('var-ped-1', 'srv-ped-03', 'Classic Luxe', 60000, true, NOW()),
  ('var-ped-2', 'srv-ped-03', 'French Finish', 70000, true, NOW()),
  ('var-cln-1', 'srv-cln-04', 'Standard Care', 30000, true, NOW()),
  ('var-cln-2', 'srv-cln-04', 'Deep Restorative Care', 45000, true, NOW()),
  ('var-art-1', 'srv-art-05', 'Minimalist Accent (2 nails)', 15000, true, NOW()),
  ('var-art-2', 'srv-art-05', 'Full Set Bespoke Concept', 35000, true, NOW()),
  ('var-rem-1', 'srv-rem-06', 'Standard Removal', 20000, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Gallery Items (Local Studio Assets)
INSERT INTO gallery (id, title, description, image_url, category, is_active, created_at, updated_at)
VALUES
  ('gal-001', 'Magnetic Velvet Cat-Eye in Bronze Shimmer', 'Deep multidimensional magnetic velvet shimmer over structured BIAB base with glass apex finish.', '/gallery/sample2.jpg', 'GEL', true, NOW(), NOW()),
  ('gal-002', 'Tortoiseshell Glass & Noir Minimalist', 'Hand-painted amber tortoiseshell layers accented with delicate noir contours and gold leaf hairline.', '/gallery/sample3.jpg', 'NAIL_ART', true, NOW(), NOW()),
  ('gal-003', 'Burgundy Wave French with Gold Hairline', 'Deep Bordeaux negative-space wave french finished with micro gold gilding and reinforced apex.', '/gallery/sample4.jpg', 'GEL', true, NOW(), NOW()),
  ('gal-004', 'Milky Blush Soft Gel with Glass Cushion Top', 'Natural almond sculpted extensions with translucent milky blush gradient and ultra-plump cushion top.', '/gallery/sample5.jpg', 'EXTENSION', true, NOW(), NOW()),
  ('gal-005', 'Pastel Buttercup & Metallic Foil Accent', 'Subtle spring buttercup monochrome paired with abstract silver foil flakes and satin matte balance.', '/gallery/sample6.jpg', 'NAIL_ART', true, NOW(), NOW()),
  ('gal-006', 'Precision Cuticle Prep & Gold Contour Detail', 'Russian dry e-file hygienic care paired with seamless high-shine gel finish and micro-metallic lines.', '/gallery/sample7.jpg', 'PEDICURE', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Settings
INSERT INTO settings (id, key, value, description, created_at, updated_at)
VALUES
  ('set-001', 'stampsRequired', '9', 'Stamps required for free nail set', NOW(), NOW()),
  ('set-002', 'stampExpiryMonths', '12', 'Stamp expiry in months', NOW(), NOW()),
  ('set-003', 'stampPerService', 'true', '1 stamp per nail set service', NOW(), NOW()),
  ('set-004', 'stampPerAmount', '50000', '1 stamp per 500 PHP spent in centavos', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- 5. Owner / Administrator Account (admin / admin)
INSERT INTO users (id, email, password, name, role, phone, email_verified, created_at, updated_at)
VALUES
  ('usr-admin-01', 'admin', '$2a$10$iw/DnkJXDPpF09NWeGqAvuMUtGcP4Ba1ymqEv5rUH8AkHDxJWuhz6', 'Ma''am Atasha (Owner)', 'ADMIN', '+639000000000', NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO loyalty_cards (id, user_id, stamp_count, expires_at, created_at, updated_at)
VALUES
  ('lc-admin-01', 'usr-admin-01', 0, NOW() + INTERVAL '1 year', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

