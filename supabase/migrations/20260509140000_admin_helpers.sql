-- Bootstrap helper: promote a profile to admin/manager by email.
-- Used once for the very first admin account, and later for inviting staff.
-- Run via Supabase SQL editor: select public.set_user_role('your@email.com', 'admin');

create or replace function public.set_user_role(
  p_email text,
  p_role public.user_role
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email) limit 1;
  if v_user_id is null then
    raise exception 'user_not_found_for_email %', p_email using errcode = '22023';
  end if;

  insert into public.profiles (id, role, status)
  values (v_user_id, p_role, 'active')
  on conflict (id) do update
    set role = excluded.role,
        status = 'active';

  return v_user_id;
end;
$$;

revoke all on function public.set_user_role(text, public.user_role) from public;
-- This function is intended to be called by a Postgres superuser via SQL editor.
-- We do not grant execute to anon/authenticated.
