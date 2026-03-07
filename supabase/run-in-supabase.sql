-- ========================================
-- Supabase SQL Editor で実行する用
-- ========================================
-- 使い方:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. このファイルの内容をすべてコピーして貼り付け
-- 3. 右下の Run をクリック（または Cmd+Enter / Ctrl+Enter）
--
-- 注意: はじめてプロジェクトを作る場合は、schema.sql 全体を実行してください。
-- すでにテーブルがある場合に「order_draft_uploads だけ追加したい」ときは、
-- 下の「A. order_draft_uploads だけ追加する場合」のブロックだけ実行してください。
-- ========================================

-- ========================================
-- A. order_draft_uploads だけ追加する場合
-- （DIA注文-読み込み用。他のテーブルはもうあるとき）
-- ========================================

-- DIA注文読み込み用：アップロード済みPDFと抽出データの保管
create table if not exists public.order_draft_uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_bucket text not null default 'documents-private',
  storage_path text not null,
  extracted_data jsonb,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz default now()
);
alter table public.order_draft_uploads enable row level security;
create policy if not exists order_draft_uploads_select on public.order_draft_uploads for select using (true);
create policy if not exists order_draft_uploads_insert on public.order_draft_uploads for insert with check (auth.uid() is not null);

-- ========================================
-- B. orders に DIA P/O 用カラムを追加する場合（既存テーブルがあるとき）
-- ========================================
alter table public.orders add column if not exists addressees text;
alter table public.orders add column if not exists supplier text;
alter table public.orders add column if not exists product_name text;
alter table public.orders add column if not exists product_description text;
alter table public.orders add column if not exists product_grade text;
alter table public.orders add column if not exists particle_size text;
alter table public.orders add column if not exists ec_level text;
alter table public.orders add column if not exists recovery_volume text;
alter table public.orders add column if not exists moisture_level text;
alter table public.orders add column if not exists sieve_method text;
alter table public.orders add column if not exists container_info text;
alter table public.orders add column if not exists bales_count int;
alter table public.orders add column if not exists weight_per_bale text;
alter table public.orders add column if not exists weight_tolerance text;
alter table public.orders add column if not exists bag_type text;
alter table public.orders add column if not exists bales_per_container text;
alter table public.orders add column if not exists container_type text;
alter table public.orders add column if not exists number_of_containers int;
alter table public.orders add column if not exists product_specs text;
alter table public.orders add column if not exists unit_price numeric(14, 2);
alter table public.orders add column if not exists price_term text;
alter table public.orders add column if not exists demurrage_free_days int;
alter table public.orders add column if not exists requested_eta text;
alter table public.orders add column if not exists shipment_condition text;
alter table public.orders add column if not exists phyto_instructions text;
alter table public.orders add column if not exists origin_requirement text;
alter table public.orders add column if not exists consignee_name text;
alter table public.orders add column if not exists consignee_contact text;
alter table public.orders add column if not exists shipper_name text;
