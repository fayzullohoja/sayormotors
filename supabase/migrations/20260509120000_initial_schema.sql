-- Sayor Motors initial schema
-- Roles, companies, products, requests, VIN requests, audit log

-- =========================================================================
-- Extensions
-- =========================================================================

create extension if not exists pgcrypto with schema public;
create extension if not exists "uuid-ossp" with schema public;

-- =========================================================================
-- Enums
-- =========================================================================

create type public.user_role as enum ('client', 'manager', 'admin');
create type public.user_status as enum ('pending', 'active', 'blocked');
create type public.currency_code as enum ('EUR', 'USD', 'CNY', 'RUB', 'UZS');

create type public.product_source as enum ('germany', 'china', 'warehouse', 'transit', 'other');

create type public.request_status as enum (
  'new',
  'in_progress',
  'awaiting_clarification',
  'confirmed',
  'partial',
  'awaiting_payment',
  'ordered',
  'ready_for_shipment',
  'completed',
  'cancelled'
);

create type public.request_item_status as enum (
  'pending',
  'confirmed',
  'partial',
  'unavailable'
);

create type public.vin_request_status as enum (
  'new',
  'in_progress',
  'quoted',
  'rejected',
  'completed'
);

-- =========================================================================
-- Helper function: normalize article number for search
-- Strips all non-alphanumeric and uppercases. Used in generated column on products.
-- =========================================================================

create or replace function public.normalize_article(input text)
returns text
language sql
immutable
parallel safe
as $$
  select upper(regexp_replace(coalesce(input, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- =========================================================================
-- Helper function: updated_at trigger
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- Companies (B2B client companies)
-- =========================================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  inn text,
  country text,
  city text,
  legal_address text,
  contact_person text,
  phone text,
  telegram text,
  whatsapp text,
  email text,
  client_type text, -- сто, магазин, оптовик, дилер, другое
  pricing_group text default 'default',
  discount_percent numeric(5,2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  default_currency public.currency_code not null default 'EUR',
  internal_comment text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create index companies_inn_idx on public.companies (inn) where inn is not null;
create index companies_active_idx on public.companies (is_active);

-- =========================================================================
-- Profiles (extends auth.users)
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  status public.user_status not null default 'pending',
  full_name text,
  phone text,
  telegram text,
  whatsapp text,
  company_id uuid references public.companies(id) on delete set null,
  internal_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);
create index profiles_company_idx on public.profiles (company_id);

-- Auto-create profile row when new auth user signs up
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =========================================================================
-- Helper: current user role
-- =========================================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('manager', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- =========================================================================
-- Supplier profiles (Excel column mappings)
-- =========================================================================

create table public.supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  -- column mapping: { source: { article: 'A', name: 'B', price: 'C', ... }, defaults: { currency: 'EUR', source: 'germany' } }
  column_mapping jsonb not null default '{}'::jsonb,
  default_currency public.currency_code not null default 'EUR',
  default_source public.product_source not null default 'other',
  markup_percent numeric(5,2) not null default 0
    check (markup_percent >= 0 and markup_percent <= 200),
  is_active boolean not null default true,
  last_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger supplier_profiles_set_updated_at
  before update on public.supplier_profiles
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Products (catalog)
-- =========================================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  article text not null,
  article_normalized text generated always as (public.normalize_article(article)) stored,
  name text not null,
  brand text,
  category text,
  description text,
  applicability text,
  base_price numeric(14,2) not null check (base_price >= 0),
  base_currency public.currency_code not null default 'EUR',
  cost_price numeric(14,2) check (cost_price is null or cost_price >= 0),
  cost_currency public.currency_code,
  stock integer not null default 0 check (stock >= 0),
  lead_time text, -- "3-5 дней", "склад", "под заказ"
  source public.product_source not null default 'other',
  source_country text,
  min_order integer not null default 1 check (min_order >= 1),
  photo_url text,
  is_active boolean not null default true,
  supplier_profile_id uuid references public.supplier_profiles(id) on delete set null,
  last_imported_at timestamptz,
  internal_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create unique index products_article_normalized_uq on public.products (article_normalized);
create index products_brand_idx on public.products (brand);
create index products_category_idx on public.products (category);
create index products_active_idx on public.products (is_active);
create index products_last_imported_idx on public.products (last_imported_at);

-- =========================================================================
-- Excel imports (audit log)
-- =========================================================================

create table public.excel_imports (
  id uuid primary key default gen_random_uuid(),
  supplier_profile_id uuid references public.supplier_profiles(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  file_path text, -- supabase storage path
  total_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  error_count integer not null default 0,
  errors jsonb, -- array of { row, column, message }
  status text not null default 'pending', -- pending | processing | completed | failed
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index excel_imports_supplier_idx on public.excel_imports (supplier_profile_id);
create index excel_imports_status_idx on public.excel_imports (status);

-- =========================================================================
-- Requests (заявки от клиентов)
-- =========================================================================

create sequence public.request_number_seq start 1000;

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  number bigint not null default nextval('public.request_number_seq') unique,
  company_id uuid not null references public.companies(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  assigned_manager_id uuid references public.profiles(id) on delete set null,
  status public.request_status not null default 'new',
  display_currency public.currency_code not null default 'EUR',
  total_amount numeric(14,2) not null default 0,
  contact_method text, -- telegram | whatsapp | phone | email
  client_comment text,
  manager_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  closed_at timestamptz
);

create trigger requests_set_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

create index requests_company_idx on public.requests (company_id);
create index requests_status_idx on public.requests (status);
create index requests_assigned_idx on public.requests (assigned_manager_id);
create index requests_created_at_idx on public.requests (created_at desc);

-- =========================================================================
-- Request items (позиции в заявке)
-- =========================================================================

create table public.request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  -- Original input from client (preserved even if product later deleted)
  article_input text not null,
  article_normalized text generated always as (public.normalize_article(article_input)) stored,
  name_snapshot text,
  brand_snapshot text,
  -- Quantities
  qty_requested integer not null check (qty_requested >= 1),
  qty_confirmed integer check (qty_confirmed is null or qty_confirmed >= 0),
  -- Pricing snapshot at request time
  price_at_request numeric(14,2),
  price_confirmed numeric(14,2),
  currency public.currency_code,
  -- Lifecycle
  status public.request_item_status not null default 'pending',
  client_comment text,
  manager_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger request_items_set_updated_at
  before update on public.request_items
  for each row execute function public.set_updated_at();

create index request_items_request_idx on public.request_items (request_id);
create index request_items_product_idx on public.request_items (product_id);
create index request_items_article_norm_idx on public.request_items (article_normalized);

-- =========================================================================
-- Audit log: request status & price changes
-- =========================================================================

create table public.request_history (
  id bigserial primary key,
  request_id uuid not null references public.requests(id) on delete cascade,
  request_item_id uuid references public.request_items(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  event_type text not null, -- 'status_change' | 'price_change' | 'qty_change' | 'comment' | 'assigned'
  payload jsonb not null default '{}'::jsonb, -- { from, to, ... }
  created_at timestamptz not null default now()
);

create index request_history_request_idx on public.request_history (request_id, created_at desc);
create index request_history_item_idx on public.request_history (request_item_id) where request_item_id is not null;

-- =========================================================================
-- VIN requests (отдельная сущность для подбора по VIN)
-- =========================================================================

create table public.vin_requests (
  id uuid primary key default gen_random_uuid(),
  number bigint not null default nextval('public.request_number_seq') unique,
  company_id uuid not null references public.companies(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  assigned_manager_id uuid references public.profiles(id) on delete set null,
  vin text not null,
  make text,
  model text,
  year integer check (year is null or (year >= 1980 and year <= 2100)),
  what_needed text not null,
  client_comment text,
  manager_comment text,
  photo_urls text[] not null default '{}',
  status public.vin_request_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vin_requests_set_updated_at
  before update on public.vin_requests
  for each row execute function public.set_updated_at();

create index vin_requests_company_idx on public.vin_requests (company_id);
create index vin_requests_status_idx on public.vin_requests (status);
create index vin_requests_vin_idx on public.vin_requests (upper(vin));

-- =========================================================================
-- Row-Level Security
-- =========================================================================

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.supplier_profiles enable row level security;
alter table public.excel_imports enable row level security;
alter table public.requests enable row level security;
alter table public.request_items enable row level security;
alter table public.request_history enable row level security;
alter table public.vin_requests enable row level security;

-- Profiles
create policy "profiles: self read"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_staff());

create policy "profiles: self update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles: staff manage"
  on public.profiles for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Companies
create policy "companies: own read"
  on public.companies for select
  to authenticated
  using (
    public.is_staff()
    or id = (select company_id from public.profiles where id = auth.uid())
  );

create policy "companies: staff manage"
  on public.companies for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Products
create policy "products: active clients read active"
  on public.products for select
  to authenticated
  using (
    public.is_staff()
    or (
      is_active = true
      and public.current_user_status() = 'active'
    )
  );

create policy "products: staff manage"
  on public.products for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Supplier profiles, excel imports — staff only
create policy "supplier_profiles: staff only"
  on public.supplier_profiles for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "excel_imports: staff only"
  on public.excel_imports for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Requests
create policy "requests: own read"
  on public.requests for select
  to authenticated
  using (
    public.is_staff()
    or company_id = (select company_id from public.profiles where id = auth.uid())
  );

create policy "requests: clients insert own"
  on public.requests for insert
  to authenticated
  with check (
    public.current_user_status() = 'active'
    and created_by = auth.uid()
    and company_id = (select company_id from public.profiles where id = auth.uid())
  );

create policy "requests: clients update own pending"
  on public.requests for update
  to authenticated
  using (
    company_id = (select company_id from public.profiles where id = auth.uid())
    and created_by = auth.uid()
    and status = 'new'
  )
  with check (
    company_id = (select company_id from public.profiles where id = auth.uid())
    and created_by = auth.uid()
  );

create policy "requests: staff manage"
  on public.requests for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Request items
create policy "request_items: own read"
  on public.request_items for select
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.company_id = (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "request_items: clients write own pending"
  on public.request_items for all
  to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.company_id = (select company_id from public.profiles where id = auth.uid())
        and r.created_by = auth.uid()
        and r.status = 'new'
    )
  )
  with check (
    exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.company_id = (select company_id from public.profiles where id = auth.uid())
        and r.created_by = auth.uid()
        and r.status = 'new'
    )
  );

create policy "request_items: staff manage"
  on public.request_items for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Request history (audit log) — read for own, write only via server (service role)
create policy "request_history: own read"
  on public.request_history for select
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.company_id = (select company_id from public.profiles where id = auth.uid())
    )
  );

-- VIN requests — same pattern as requests
create policy "vin_requests: own read"
  on public.vin_requests for select
  to authenticated
  using (
    public.is_staff()
    or company_id = (select company_id from public.profiles where id = auth.uid())
  );

create policy "vin_requests: clients insert own"
  on public.vin_requests for insert
  to authenticated
  with check (
    public.current_user_status() = 'active'
    and created_by = auth.uid()
    and company_id = (select company_id from public.profiles where id = auth.uid())
  );

create policy "vin_requests: staff manage"
  on public.vin_requests for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- =========================================================================
-- Grants
-- =========================================================================

grant usage on schema public to anon, authenticated;
grant select on public.products to authenticated;
grant select, insert, update on public.profiles, public.companies, public.requests, public.request_items, public.vin_requests to authenticated;
grant select on public.request_history to authenticated;
