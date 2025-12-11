/*
  # ShiftSync Multi-Tenant Roster Management Schema

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `users`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `name` (text)
      - `email` (text, unique)
      - `role` (enum: OWNER, MANAGER, STAFF)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `employees`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key, nullable)
      - `full_name` (text)
      - `role` (text) - Legacy field for comma-separated roles
      - `position_ids` (text[]) - Array of position IDs
      - `weekly_hours` (numeric)
      - `is_active` (boolean)
      - `location` (text, nullable)
      - `allowed_start_time` (text, nullable)
      - `allowed_end_time` (text, nullable)
      - `hourly_rate` (numeric, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `positions`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `name` (text)
      - `color` (text) - Hex color code
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `shifts`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
      - `employee_name` (text, nullable)
      - `date` (date)
      - `start_time` (text)
      - `end_time` (text)
      - `role` (text, nullable) - Legacy text override
      - `position_id` (uuid, foreign key, nullable)
      - `status` (enum: SCHEDULED, CONFIRMED, DECLINED, CANCELLED)
      - `check_in_time` (timestamptz, nullable)
      - `check_out_time` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `availability`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key)
      - `weekday` (integer) - 0-6 for Sunday-Saturday
      - `start_time` (text)
      - `end_time` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `shift_breaks`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `shift_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
      - `break_in` (timestamptz)
      - `break_out` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for multi-tenant data isolation by company_id
    - Users can only access data from their own company
    - Sessions table for mock authentication

  3. Indexes
    - Add indexes on foreign keys and frequently queried fields
    - Add indexes on company_id for all tables
    - Add indexes on date fields for shifts
*/

-- Create enums
CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'STAFF');
CREATE TYPE shift_status AS ENUM ('SCHEDULED', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'STAFF',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT '',
  position_ids text[] NOT NULL DEFAULT '{}',
  weekly_hours numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  location text,
  allowed_start_time text,
  allowed_end_time text,
  hourly_rate numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name text,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  role text,
  position_id uuid REFERENCES positions(id) ON DELETE SET NULL,
  status shift_status NOT NULL DEFAULT 'SCHEDULED',
  check_in_time timestamptz,
  check_out_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shift breaks table
CREATE TABLE IF NOT EXISTS shift_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  break_in timestamptz NOT NULL,
  break_out timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sessions table for mock authentication
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_company_id ON positions(company_id);
CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_availability_employee_id ON availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_breaks_shift_id ON shift_breaks(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_breaks_company_id ON shift_breaks(company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Companies
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- RLS Policies for Users
CREATE POLICY "Users can view users in own company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for Employees
CREATE POLICY "Users can view employees in own company"
  ON employees FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Managers can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

CREATE POLICY "Managers can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

-- RLS Policies for Positions
CREATE POLICY "Users can view positions in own company"
  ON positions FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Managers can insert positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

CREATE POLICY "Managers can update positions"
  ON positions FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

CREATE POLICY "Managers can delete positions"
  ON positions FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

-- RLS Policies for Shifts
CREATE POLICY "Users can view shifts in own company"
  ON shifts FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Managers can insert shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

CREATE POLICY "Managers can update shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

CREATE POLICY "Staff can update own shift status and time tracking"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete shifts"
  ON shifts FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

-- RLS Policies for Availability
CREATE POLICY "Users can view availability in own company"
  ON availability FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Managers can manage availability"
  ON availability FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN users u ON u.company_id = e.company_id
      WHERE u.id = auth.uid() AND u.role IN ('MANAGER', 'OWNER')
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN users u ON u.company_id = e.company_id
      WHERE u.id = auth.uid() AND u.role IN ('MANAGER', 'OWNER')
    )
  );

CREATE POLICY "Staff can manage own availability"
  ON availability FOR ALL
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- RLS Policies for Shift Breaks
CREATE POLICY "Users can view breaks in own company"
  ON shift_breaks FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage own breaks"
  ON shift_breaks FOR ALL
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Managers can manage all breaks"
  ON shift_breaks FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('MANAGER', 'OWNER')
    )
  );

-- RLS Policies for Sessions
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for shifts table
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE positions;