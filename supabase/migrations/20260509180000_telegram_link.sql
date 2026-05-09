-- Allow profiles to be linked to a Telegram chat for direct notifications.
-- chat_id is numeric in Telegram; we store as bigint (chat IDs can be negative for groups).

alter table public.profiles
  add column telegram_chat_id bigint;

create unique index profiles_telegram_chat_id_uq
  on public.profiles (telegram_chat_id)
  where telegram_chat_id is not null;

-- Pending links: when a Telegram user starts the bot, we generate a code; clicking
-- a /link command in their cabinet sets telegram_chat_id from the matching code.
create table public.telegram_link_codes (
  code text primary key,
  telegram_chat_id bigint not null,
  telegram_username text,
  telegram_first_name text,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  consumed_by uuid references public.profiles(id) on delete set null
);

create index telegram_link_codes_chat_id_idx on public.telegram_link_codes (telegram_chat_id);
create index telegram_link_codes_unconsumed_idx on public.telegram_link_codes (created_at desc) where consumed_at is null;

alter table public.telegram_link_codes enable row level security;

create policy "telegram_link_codes: own read"
  on public.telegram_link_codes for select
  to authenticated
  using (
    public.is_staff()
    or consumed_by = auth.uid()
  );
