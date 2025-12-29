-- =====================================================
-- BARBER BOOKING APP - COMPLETE DATABASE SCHEMA (VERIFIED)
-- =====================================================

-- 1. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  duration INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Services with FIXED IDs to match Frontend
INSERT INTO services (id, title, duration, price, image, category) VALUES
('2fe91aac-69d9-4cd4-9662-7c6096655d3a', 'Haircut', 30, 30.00, '/haircut.jpg', 'barbering'),
('13a4365c-4a93-4f27-8f9d-bea026364ca7', 'Beard Trim', 25, 20.00, '/beard-trim.jpg', 'barbering'),
('6fac428e-77a9-4a48-b60f-4e82e8e1b2de', 'Hair Wash', 15, 10.00, '/hair-wash.jpg', 'barbering'),
('d72b2718-6b93-4523-8605-57b83fe2c017', 'Hairdressing', 15, 20.00, '/hairdressing.jpg', 'barbering'),
('bcfb6dfb-24e3-4ed2-be87-359d5e0c1744', 'Curly', 10, 20.00, '/hairdressing.jpg', 'barbering'),
('b6f4ca92-619d-478a-b833-714535e86efc', 'Kids Haircut', 30, 30.00, '/haircut.jpg', 'barbering')
ON CONFLICT (id) DO NOTHING;

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  notes TEXT,
  is_vip BOOLEAN DEFAULT false,
  total_bookings INT DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  service_id UUID REFERENCES services(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  no_show BOOLEAN DEFAULT false,
  is_walk_in BOOLEAN DEFAULT false,
  google_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WORKING HOURS TABLE
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default hours
INSERT INTO working_hours (day_of_week, start_time, end_time, is_active) VALUES
(1, '09:00', '18:00', true), -- Monday
(2, '09:00', '18:00', true),
(3, '09:00', '18:00', true),
(4, '09:00', '18:00', true),
(5, '09:00', '18:00', true),
(6, '09:00', '14:00', true), -- Saturday
(0, '09:00', '18:00', false) -- Sunday (Closed)
ON CONFLICT DO NOTHING;

-- 5. BLOCKED TIMES TABLE
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
('admin_password_hash', '{"hash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 7. TRIGGERS
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers 
    SET total_bookings = total_bookings + 1,
        last_visit = NEW.start_time
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_stats ON appointments;
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();
