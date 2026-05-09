-- Trigram indexes for fast substring search across products.
-- Used by /app/search and /admin/products.

create extension if not exists pg_trgm with schema public;

create index if not exists products_article_normalized_trgm
  on public.products using gin (article_normalized gin_trgm_ops);

create index if not exists products_name_trgm
  on public.products using gin (name gin_trgm_ops);

create index if not exists products_brand_trgm
  on public.products using gin (brand gin_trgm_ops)
  where brand is not null;

-- Helper RPC: ranked product search across article/name/brand.
-- Returns up to `limit` products, ordered by best similarity match.
create or replace function public.search_products(
  q text,
  result_limit integer default 25
)
returns setof public.products
language plpgsql
stable
parallel safe
set search_path = public
as $$
declare
  norm_q text := upper(regexp_replace(coalesce(q, ''), '[^A-Za-z0-9]', '', 'g'));
  fuzzy_q text := lower(coalesce(q, ''));
begin
  -- Empty query → empty result
  if length(coalesce(q, '')) < 2 then
    return;
  end if;

  return query
  select p.*
  from public.products p
  where p.is_active = true
    and (
      p.article_normalized ilike '%' || norm_q || '%'
      or p.name ilike '%' || fuzzy_q || '%'
      or coalesce(p.brand, '') ilike '%' || fuzzy_q || '%'
    )
  order by
    case when p.article_normalized = norm_q then 0
         when p.article_normalized ilike norm_q || '%' then 1
         when p.article_normalized ilike '%' || norm_q || '%' then 2
         else 3
    end,
    similarity(p.name, fuzzy_q) desc nulls last,
    p.name asc
  limit greatest(1, least(coalesce(result_limit, 25), 100));
end;
$$;

revoke all on function public.search_products(text, integer) from public;
grant execute on function public.search_products(text, integer) to authenticated;
