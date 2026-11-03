import fs from 'fs';

const csvPath = 'C:/acoustic-night/acoustic-night/public/acoustic night invite list NOV 13 - Sheet1.csv';
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

const guests = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const parts = line.split(',');
  const name = parts[0]?.trim();
  let email = parts[1]?.trim()?.toLowerCase();
  const dept = parts[2]?.trim() || '';

  if (!name && !email) continue;

  if (name === 'Ruel ni She' && !email) {
    email = 'ruel.nishe@aidea.co';
  } else if (name === 'Mam Angela' && !email) {
    email = 'angela@aidea.co';
  }

  guests.push({ name, email, dept });
}

let sql = `-- ==========================================
-- Acoustic Night RSVP - Complete Supabase Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mxmepnntyatisdmuwkcm/sql
-- ==========================================

-- 1. Create table 'guests'
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  dept TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'declined')),
  payment_receipt_url TEXT,
  reference_no TEXT,
  payment_method TEXT CHECK (payment_method IN ('gcash', 'cash')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- For databases created before payment_method existed
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('gcash', 'cash'));

-- Enable RLS on guests
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Allow anon read guests" ON public.guests;
DROP POLICY IF EXISTS "Allow anon update guests" ON public.guests;
DROP POLICY IF EXISTS "Allow anon insert guests" ON public.guests;
DROP POLICY IF EXISTS "Allow anon delete guests" ON public.guests;

-- Public / Anonymous policies
CREATE POLICY "Allow anon read guests" ON public.guests
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon update guests" ON public.guests
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon insert guests" ON public.guests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon delete guests" ON public.guests
  FOR DELETE TO anon, authenticated
  USING (true);

-- 2. Storage Bucket Setup ('receipts')
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for 'receipts' bucket
DROP POLICY IF EXISTS "Allow anon upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete receipts" ON storage.objects;

CREATE POLICY "Allow anon upload receipts" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow anon read receipts" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'receipts');

CREATE POLICY "Allow anon update receipts" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'receipts')
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow anon delete receipts" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'receipts');

-- 3. Seed Guests Data (43 guests from CSV with fallback emails)
INSERT INTO public.guests (name, email, dept, status)
VALUES
`;

const values = guests.map(g => {
  const safeName = g.name.replace(/'/g, "''");
  const safeEmail = g.email ? `'${g.email.replace(/'/g, "''")}'` : 'NULL';
  const safeDept = g.dept ? `'${g.dept.replace(/'/g, "''")}'` : 'NULL';
  return `  ('${safeName}', ${safeEmail}, ${safeDept}, 'pending')`;
}).join(',\n');

sql += values + `\nON CONFLICT (email) DO UPDATE SET\n  name = EXCLUDED.name,\n  dept = EXCLUDED.dept;\n`;

fs.writeFileSync('C:/acoustic-night/supabase_migration.sql', sql);
fs.writeFileSync('C:/acoustic-night/acoustic-night/supabase_migration.sql', sql);
console.log(`Successfully generated migration with ${guests.length} guests.`);
