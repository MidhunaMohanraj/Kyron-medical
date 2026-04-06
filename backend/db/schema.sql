-- ============================================
-- KYRON MEDICAL DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  sms_opted_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  body_part TEXT NOT NULL,
  bio TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  slot_datetime TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')),
  appointment_datetime TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table (for session persistence)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]',
  intake_complete BOOLEAN DEFAULT FALSE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'voice')),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED: Insert 4 doctors
-- ============================================
INSERT INTO doctors (name, specialty, body_part, bio) VALUES
  ('Dr. Sarah Chen', 'Orthopedic Surgeon', 'knee,hip,shoulder,joint,bone,back,spine,fracture,orthopedic,musculoskeletal', 'Dr. Chen has 15 years of experience in orthopedic surgery specializing in joint replacement and sports injuries.'),
  ('Dr. Marcus Webb', 'Cardiologist', 'heart,chest,cardiac,cardiovascular,blood pressure,palpitation,artery,vein,circulation', 'Dr. Webb is a board-certified cardiologist with expertise in preventive cardiology and heart disease management.'),
  ('Dr. Priya Patel', 'Dermatologist', 'skin,rash,acne,mole,eczema,psoriasis,dermatology,hair,nail,scalp,lesion,wart', 'Dr. Patel specializes in medical and cosmetic dermatology with a focus on skin cancer screening and chronic skin conditions.'),
  ('Dr. James Okafor', 'Neurologist', 'brain,head,headache,migraine,nerve,neurological,seizure,memory,dizzy,dizziness,tremor,stroke,numbness,tingling');

-- ============================================
-- SEED: Insert availability slots (next 30-60 days)
-- Run after doctors are inserted
-- ============================================
DO $$
DECLARE
  chen_id UUID;
  webb_id UUID;
  patel_id UUID;
  okafor_id UUID;
  base_date DATE := CURRENT_DATE + INTERVAL '3 days';
  slot_date DATE;
  i INT;
BEGIN
  SELECT id INTO chen_id FROM doctors WHERE name = 'Dr. Sarah Chen';
  SELECT id INTO webb_id FROM doctors WHERE name = 'Dr. Marcus Webb';
  SELECT id INTO patel_id FROM doctors WHERE name = 'Dr. Priya Patel';
  SELECT id INTO okafor_id FROM doctors WHERE name = 'Dr. James Okafor';

  -- Generate slots for 60 days, Mon-Fri only, various times
  FOR i IN 0..59 LOOP
    slot_date := base_date + (i || ' days')::INTERVAL;
    
    -- Skip weekends
    IF EXTRACT(DOW FROM slot_date) IN (0, 6) THEN
      CONTINUE;
    END IF;

    -- Dr. Chen: Mon/Wed/Fri at 9am, 11am, 2pm
    IF EXTRACT(DOW FROM slot_date) IN (1, 3, 5) THEN
      INSERT INTO availability_slots (doctor_id, slot_datetime) VALUES
        (chen_id, slot_date + TIME '09:00:00'),
        (chen_id, slot_date + TIME '11:00:00'),
        (chen_id, slot_date + TIME '14:00:00');
    END IF;

    -- Dr. Webb: Tue/Thu at 10am, 1pm, 3pm
    IF EXTRACT(DOW FROM slot_date) IN (2, 4) THEN
      INSERT INTO availability_slots (doctor_id, slot_datetime) VALUES
        (webb_id, slot_date + TIME '10:00:00'),
        (webb_id, slot_date + TIME '13:00:00'),
        (webb_id, slot_date + TIME '15:00:00');
    END IF;

    -- Dr. Patel: Mon/Tue/Thu at 9am, 10:30am, 2pm, 4pm
    IF EXTRACT(DOW FROM slot_date) IN (1, 2, 4) THEN
      INSERT INTO availability_slots (doctor_id, slot_datetime) VALUES
        (patel_id, slot_date + TIME '09:00:00'),
        (patel_id, slot_date + TIME '10:30:00'),
        (patel_id, slot_date + TIME '14:00:00'),
        (patel_id, slot_date + TIME '16:00:00');
    END IF;

    -- Dr. Okafor: Wed/Fri at 8am, 11am, 1pm, 3:30pm
    IF EXTRACT(DOW FROM slot_date) IN (3, 5) THEN
      INSERT INTO availability_slots (doctor_id, slot_datetime) VALUES
        (okafor_id, slot_date + TIME '08:00:00'),
        (okafor_id, slot_date + TIME '11:00:00'),
        (okafor_id, slot_date + TIME '13:00:00'),
        (okafor_id, slot_date + TIME '15:30:00');
    END IF;

  END LOOP;
END $$;
