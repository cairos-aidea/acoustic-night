-- ==========================================
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
  cash_collected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- For databases created before payment_method existed
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('gcash', 'cash'));
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS cash_collected BOOLEAN NOT NULL DEFAULT false;

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
  ('Don Arnold', 'a.cristobal@aidea.co', 'DES', 'pending'),
  ('Don Robert', 'r.dumaguin@aidea.co', 'DES', 'pending'),
  ('Sir Eric', 'e.pambid@aidea.co', 'DES', 'pending'),
  ('PAT', 'p.lara@aidea.co', 'DES', 'pending'),
  ('Jhayzel', 'j.olib@aidea.co', 'ST5', 'pending'),
  ('TAT', 'j.villalon@aidea.co', 'DES', 'pending'),
  ('Kate', 'k.villalon@aidea.co', 'ST1', 'pending'),
  ('Bryan', 'b.vilano@aidea.co', 'DES', 'pending'),
  ('Lea', 'l.bonifacio@aidea.co', 'ST5', 'pending'),
  ('Turon', 'r.ambagan@aidea.co', 'DES', 'pending'),
  ('Sir Mar', 'm.deleon@aidea.co', 'DES', 'pending'),
  ('Cai', 'jc.magno@aidea.co', 'EO', 'pending'),
  ('Tonton', 'j.castro@aidea.co', 'EO', 'pending'),
  ('Baxti', 'a.vasquez@aidea.co', 'EO', 'pending'),
  ('She', 's.noriega@aidea.co', 'ST5', 'pending'),
  ('Ruel ni She', 'ruel.nishe@aidea.co', 'ST5', 'pending'),
  ('AMT', 'a.tolentino@aidea.co', 'EO', 'pending'),
  ('Mam Angela', 'angela@aidea.co', 'EO', 'pending'),
  ('Lhen', 'l.padua@aidea.co', NULL, 'pending'),
  ('Babes', 'a.nunez@aidea.co', NULL, 'pending'),
  ('Janille', 'j.villasis@aidea.co', 'XGD', 'pending'),
  ('Janice', 'j.gianan@aidea.co', 'QA', 'pending'),
  ('Jessa', 'j.quindoy@aidea.co', 'XGD', 'pending'),
  ('Gab', 'j.manuson@aidea.co', 'XGD', 'pending'),
  ('Pia', 'p.maghirang@aidea.co', 'XGD', 'pending'),
  ('Ian', 'a.rivera@aidea.co', 'ST4', 'pending'),
  ('Elaisa', 'e.pallan@aidea.co', 'ST4', 'pending'),
  ('Dante', 'd.victorino@aidea.co', 'ST4', 'pending'),
  ('Jane', 'm.buquid@aidea.co', 'QA', 'pending'),
  ('Bing', 's.arena@aidea.co', 'ST5', 'pending'),
  ('Arvin', 'i.brion@aidea.co', 'DDG', 'pending'),
  ('Sir Jun', 'f.simeon@aidea.co', 'QA', 'pending'),
  ('Susy', 's.martin@aidea.co', 'OP', 'pending'),
  ('Ric', 'ric.reyes@aidea.co', 'ST4', 'pending'),
  ('Paul D.', 'p.dungao@aidea.co', 'ST2', 'pending'),
  ('Gil', 'g.magno@aidea.co', 'AT', 'pending'),
  ('Roger', 'verzosaaroger@gmail.com', 'DES', 'pending'),
  ('Renz', 'rj.seco@aidea.co', 'ST1', 'pending'),
  ('Ayana', 'a.kasilag@aidea.co', 'ST4', 'pending'),
  ('Jetro', 'jc.tolentino@aidea.co', 'ST4', 'pending'),
  ('Berns', 'b.mendoza@aidea.co', 'AT', 'pending'),
  ('Gina', 'g.garcia@aidea.co', 'ACCT', 'pending'),
  ('Tina', 'f.guilas@aidea.co', 'ID', 'pending')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  dept = EXCLUDED.dept;
