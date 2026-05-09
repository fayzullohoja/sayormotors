-- Currency rates table. Base currency = EUR.
-- rate_to_eur: how many EUR you get for 1 unit of `code`.
-- Example: USD rate_to_eur=0.92 means 1 USD = 0.92 EUR.

create table public.currency_rates (
  code public.currency_code primary key,
  rate_to_eur numeric(20,10) not null check (rate_to_eur > 0),
  updated_at timestamptz not null default now()
);

create trigger currency_rates_set_updated_at
  before update on public.currency_rates
  for each row execute function public.set_updated_at();

-- Seed defaults (approximate, admin will tune)
insert into public.currency_rates (code, rate_to_eur) values
  ('EUR', 1),
  ('USD', 0.92),
  ('CNY', 0.13),
  ('RUB', 0.011),
  ('UZS', 0.000077)
on conflict do nothing;

alter table public.currency_rates enable row level security;

create policy "currency_rates: read for authenticated"
  on public.currency_rates for select
  to authenticated
  using (true);

create policy "currency_rates: staff write"
  on public.currency_rates for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select on public.currency_rates to authenticated;
