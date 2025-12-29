-- =====================================================
-- BARBER BOOKING APP - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. WORKING HOURS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default working hours (Mon-Fri: 9 AM - 6 PM, Sat: 9 AM - 2 PM)
INSERT INTO working_hours (day_of_week, start_time, end_time, is_active) VALUES
(1, '09:00', '18:00', true), -- Monday
(2, '09:00', '18:00', true), -- Tuesday
(3, '09:00', '18:00', true), -- Wednesday
(4, '09:00', '18:00', true), -- Thursday
(5, '09:00', '18:00', true), -- Friday
(6, '09:00', '14:00', true), -- Saturday
(0, '09:00', '18:00', false); -- Sunday (closed)

-- =====================================================
-- 2. BLOCKED TIMES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CUSTOMERS TABLE
-- =====================================================
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

-- =====================================================
-- 4. SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('buffer_time', '{"minutes": 0}'::jsonb),
('admin_password_hash', '{"hash": "$2a$10$placeholder"}'::jsonb), -- Change this!
('sms_templates', '{
  "booking_confirmation": "Hi {customer_name}, your appointment is confirmed for {date} at {time} for {service}. See you soon!",
  "reminder": "Reminder: You have an appointment tomorrow at {time} for {service}.",
  "cancellation": "Your appointment for {date} at {time} has been cancelled."
}'::jsonb);

-- =====================================================
-- 5. UPDATE EXISTING TABLES
-- =====================================================

-- Update appointments table
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false;

-- Update services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_blocked_times_range ON blocked_times(start_time, end_time);

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to auto-update customer stats
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers 
    SET total_bookings = total_bookings + 1,
        last_visit = NEW.start_time
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats on new booking
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON appointments;
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- =====================================================
-- DONE! Schema is ready.
-- =====================================================
