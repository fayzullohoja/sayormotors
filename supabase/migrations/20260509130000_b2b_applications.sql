-- B2B application flow:
-- 1) Public form on /register submits to companies (status=pending) via SECURITY DEFINER RPC
-- 2) Admin reviews and approves -> calls auth.admin.inviteUserByEmail (server-side)
-- 3) When invited user accepts invite, profile trigger links profile.company_id by application_email

-- =========================================================================
-- Application metadata on companies
-- =========================================================================

create type public.company_application_status as enum ('pending', 'approved', 'rejected');

alter table public.companies
  add column application_email text,
  add column application_status public.company_application_status not null default 'approved',
  add column application_comment text;

create index companies_application_email_idx
  on public.companies (lower(application_email))
  where application_email is not null;

create index companies_application_status_idx
  on public.companies (application_status);

-- =========================================================================
-- RPC: anon-callable B2B application submission
-- =========================================================================

create or replace function public.submit_b2b_application(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_company_id uuid;
  v_email text := lower(trim(payload->>'email'));
  v_name text := trim(payload->>'company_name');
begin
  if v_email is null or v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if v_name is null or v_name = '' then
    raise exception 'company_name_required' using errcode = '22023';
  end if;

  -- One pending application per email
  if exists (
    select 1 from public.companies
    where lower(application_email) = v_email
      and application_status = 'pending'
  ) then
    raise exception 'application_already_pending' using errcode = '23505';
  end if;

  insert into public.companies (
    name,
    inn,
    country,
    city,
    contact_person,
    phone,
    telegram,
    whatsapp,
    email,
    application_email,
    application_status,
    application_comment,
    client_type,
    is_active
  ) values (
    v_name,
    nullif(trim(payload->>'inn'), ''),
    nullif(trim(payload->>'country'), ''),
    nullif(trim(payload->>'city'), ''),
    nullif(trim(payload->>'contact_person'), ''),
    nullif(trim(payload->>'phone'), ''),
    nullif(trim(payload->>'telegram'), ''),
    nullif(trim(payload->>'whatsapp'), ''),
    v_email,
    v_email,
    'pending',
    nullif(trim(payload->>'comment'), ''),
    nullif(trim(payload->>'client_type'), ''),
    false
  )
  returning id into new_company_id;

  return new_company_id;
end;
$$;

revoke all on function public.submit_b2b_application(jsonb) from public;
grant execute on function public.submit_b2b_application(jsonb) to anon, authenticated;

-- =========================================================================
-- Update auth-user trigger: link profile to approved company by email
-- =========================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_company_id uuid;
begin
  -- Try to match approved company by email (b2b application flow)
  select id into matched_company_id
  from public.companies
  where lower(application_email) = lower(new.email)
    and application_status = 'approved'
  order by created_at desc
  limit 1;

  insert into public.profiles (id, full_name, phone, company_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null),
    matched_company_id,
    case when matched_company_id is not null then 'active'::public.user_status else 'pending'::public.user_status end
  )
  on conflict (id) do nothing;

  if matched_company_id is not null then
    update public.companies
      set is_active = true
      where id = matched_company_id;
  end if;

  return new;
end;
$$;
