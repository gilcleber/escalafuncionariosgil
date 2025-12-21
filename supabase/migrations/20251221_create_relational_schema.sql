-- FIX: Drop tables if they exist (to ensure clean slate with correct columns)
-- WARNING: This will delete data in these tables if they already exist (but they should be empty/new)
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS shift_templates CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES (Company/User settings)
-- We DO NOT drop profiles to protect existing user data, but we ensure columns exist.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
    name TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure settings column exists even if table already existed
DO $$ 
BEGIN 
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- RLS: Only the user can see/edit their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts before recreating
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);


-- ==============================================================================
-- 2. SHIFT_TEMPLATES (Modelos de Turno)
-- ==============================================================================
CREATE TABLE shift_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shift templates" 
ON shift_templates 
FOR ALL 
USING (auth.uid() = user_id);


-- ==============================================================================
-- 3. EMPLOYEES (Funcionários)
-- ==============================================================================
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    default_shift_template_id UUID REFERENCES shift_templates(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own employees" 
ON employees 
FOR ALL 
USING (auth.uid() = user_id);


-- ==============================================================================
-- 4. SHIFTS (Turnos - Tabela Principal)
-- ==============================================================================
CREATE TABLE shifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT NOT NULL, -- 'work', 'dayoff', 'holiday', etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries by employee and date range
CREATE INDEX idx_shifts_employee_date ON shifts(employee_id, date);
CREATE INDEX idx_shifts_user_date ON shifts(user_id, date);

-- RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shifts" 
ON shifts 
FOR ALL 
USING (auth.uid() = user_id);


-- ==============================================================================
-- 5. EVENTS (Eventos, Feriados Custom, etc.)
-- ==============================================================================
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'custom_holiday', 'company_event'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events" 
ON events 
FOR ALL 
USING (auth.uid() = user_id);
