-- Run after schema.sql. Adds editable clothing departments without changing existing products.
create table if not exists public.categories (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 slug text not null unique check(slug ~ '^[a-z0-9-]+$'),
 description text not null default '',
 is_active boolean not null default true,
 sort_order int not null default 0,
 created_at timestamptz default now()
);
alter table public.categories enable row level security;
drop policy if exists "public active categories" on public.categories;
create policy "public active categories" on public.categories for select using(is_active=true);
drop policy if exists "admin categories" on public.categories;
create policy "admin categories" on public.categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.categories to anon,authenticated;
grant all on public.categories to authenticated,service_role;
insert into public.categories(name,slug,description,sort_order) values
 ('Women''s Wear','womens-wear','Sarees, suits, kurtis and everyday favourites',0),
 ('Men''s Wear','mens-wear','Kurtas, shirts and occasion-ready essentials',1),
 ('Kids'' Wear','kids-wear','Little outfits for their biggest moments',2),
 ('Cultural Wear','cultural-wear','Traditional clothing for festivals and celebrations',3),
 ('Accessories','accessories','The finishing touches to your favourite look',4)
on conflict(slug) do nothing;
alter table public.products add column if not exists department text not null default 'womens-wear';
create index if not exists products_department_idx on public.products(department) where is_active;
