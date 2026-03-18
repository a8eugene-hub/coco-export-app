-- Coco Export Management System - Supabase schema
-- このファイルを Supabase SQL Editor や CLI から実行してください。

-- ===========================
-- 1. Enums
-- ===========================

create type role_enum as enum ('admin', 'manager', 'viewer');

create type task_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

create type payment_status as enum ('UNPAID', 'PARTIAL', 'PAID');

create type payment_type as enum ('PAYMENT1', 'PAYMENT2');

create type payment_scope as enum ('ORDER', 'SHIPMENT');

create type document_scope as enum ('ORDER', 'SHIPMENT', 'PAYMENT');

create type image_processing_status as enum ('PENDING', 'PROCESSING', 'DONE', 'FAILED', 'SKIPPED_DUPLICATE');

create type document_type as enum (
  'PO',
  'PROFORMA',
  'COMMERCIAL_INVOICE',
  'PACKING_LIST',
  'BL',
  'PHYTO',
  'COO',
  'FUMIGATION',
  'PAYMENT_RECEIPT',
  'OTHER'
);

-- ===========================
-- 2. Tables
-- ===========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role role_enum not null default 'manager',
  name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now()
);

alter table public.customers enable row level security;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  proforma_no text,
  order_date date,
  customer_id uuid references public.customers(id),
  destination text,
  incoterms text,
  currency text default 'USD',
  notes text,
  -- DIA P/O 用（CO/AR-08-26 等）
  addressees text,
  supplier text,
  product_name text,
  product_description text,
  product_grade text,
  particle_size text,
  ec_level text,
  recovery_volume text,
  moisture_level text,
  sieve_method text,
  container_info text,
  bales_count int,
  weight_per_bale text,
  weight_tolerance text,
  bag_type text,
  bales_per_container text,
  container_type text,
  number_of_containers int,
  product_specs text,
  unit_price numeric(14, 2),
  price_term text,
  demurrage_free_days int,
  requested_eta text,
  shipment_condition text,
  phyto_instructions text,
  origin_requirement text,
  consignee_name text,
  consignee_contact text,
  shipper_name text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  bl_no text,
  shipment_period text,
  etd date,
  eta date,
  vessel_name text,
  voyage_no text,
  container_type text,
  container_count int default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.shipments enable row level security;

create table if not exists public.containers (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  container_no text,
  seal_no text,
  created_at timestamptz default now()
);

alter table public.containers enable row level security;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  scope text not null, -- 'ORDER' or 'SHIPMENT'
  order_id uuid references public.orders(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete cascade,
  task_key text not null,
  title text not null,
  assignee uuid references public.profiles(id),
  status task_status default 'NOT_STARTED',
  planned_date date,
  completed_date date,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

alter table public.tasks add constraint tasks_scope_order_check
  check (
    (scope = 'ORDER' and order_id is not null and shipment_id is null)
    or
    (scope = 'SHIPMENT' and shipment_id is not null and order_id is not null)
  );

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_type payment_type not null,
  scope payment_scope not null,
  order_id uuid references public.orders(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete cascade,
  currency text default 'USD',
  status payment_status default 'UNPAID',
  due_date date,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments enable row level security;

alter table public.payments add constraint payments_scope_order_check
  check (
    (scope = 'ORDER' and order_id is not null and shipment_id is null)
    or
    (scope = 'SHIPMENT' and shipment_id is not null and order_id is not null)
  );

create table if not exists public.payment_revisions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  amount_planned numeric(14, 2) not null,
  reason text,
  revised_at timestamptz default now(),
  revised_by uuid references public.profiles(id)
);

alter table public.payment_revisions enable row level security;

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  paid_date date not null,
  amount_paid numeric(14, 2) not null,
  currency text default 'USD',
  memo text,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

alter table public.payment_transactions enable row level security;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  scope document_scope not null,
  document_type document_type not null,
  order_id uuid references public.orders(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz default now(),
  notes text
);

alter table public.documents enable row level security;

alter table public.documents add constraint documents_scope_check
  check (
    (scope = 'ORDER' and order_id is not null and shipment_id is null and payment_id is null)
    or
    (scope = 'SHIPMENT' and shipment_id is not null and order_id is not null and payment_id is null)
    or
    (scope = 'PAYMENT' and payment_id is not null and order_id is not null)
  );

-- ===========================
-- 2.x Messages (chat screenshot reconstruction) tables
-- ===========================

create table if not exists public.uploaded_images (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  sha256_hash text not null unique,
  mime_type text,
  file_size bigint,
  storage_bucket text not null default 'documents-private',
  storage_path text not null,
  processing_status image_processing_status not null default 'PENDING',
  error_text text,
  created_at timestamptz default now()
);

alter table public.uploaded_images enable row level security;

create table if not exists public.extracted_messages (
  id uuid primary key default gen_random_uuid(),
  uploaded_image_id uuid references public.uploaded_images(id) on delete cascade,
  sender text,
  time_text text,
  type text not null,
  text_original text,
  text_ja text,
  file_name text,
  file_hint text,
  order_hint numeric,
  source_image_id uuid,
  dedupe_key text,
  created_at timestamptz default now()
);

alter table public.extracted_messages enable row level security;

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  sender text,
  time_text text,
  type text not null,
  text_original text,
  text_ja text,
  file_name text,
  file_hint text,
  first_uploaded_image_id uuid references public.uploaded_images(id) on delete set null,
  dedupe_key text not null unique,
  sort_order numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.conversation_messages enable row level security;

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

-- ===========================
-- 3. RLS（シンプル版）
--   - admin / manager / viewer で read は全員OK
--   - write は manager 以上
-- ===========================

create or replace function public.current_role()
returns role_enum
language sql
stable
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'::role_enum
  );
$$;

-- 共通ポリシー作成用ヘルパー
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'profiles',
      'customers',
      'orders',
      'shipments',
      'containers',
      'tasks',
      'payments',
      'payment_revisions',
      'payment_transactions',
      'documents'
    ])
  loop
    execute format('
      create policy if not exists %I_select on public.%I
        for select
        using (true);
    ', tbl, tbl);

    execute format('
      create policy if not exists %I_write on public.%I
        for all
        using (public.current_role() in (''admin'', ''manager''))
        with check (public.current_role() in (''admin'', ''manager''));
    ', tbl || '_write', tbl);
  end loop;
end $$;

-- ===========================
-- 4. Storage bucket (コメント)
-- ===========================
-- Supabase ダッシュボードで下記 bucket を private で作成してください:
--   - documents-private
--
-- 推奨パス設計:
--   - orders/{order_id}/{document_type}/{uuid}_{filename}
--   - shipments/{shipment_id}/{document_type}/{uuid}_{filename}
--   - payments/{payment_id}/receipt/{uuid}_{filename}

