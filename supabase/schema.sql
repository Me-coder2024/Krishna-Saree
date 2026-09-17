-- Krishna Sarees And Readymade
-- Run this file in your Supabase project's SQL Editor. It is safe to rerun.
create extension if not exists pgcrypto;
create table if not exists public.admin_profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, role text not null default 'admin' check(role='admin'), created_at timestamptz default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admin_profiles where id=auth.uid() and role='admin'); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text, fabric text, color text, price numeric not null check(price>0), discount_price numeric check(discount_price>0 and discount_price<price), stock int not null default 0 check(stock>=0), category text, collection text, images jsonb not null default '[]', is_featured boolean default false, is_active boolean default true, view_count int default 0, enquiry_count int default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.product_events (id uuid primary key default gen_random_uuid(),product_id uuid references public.products(id) on delete cascade,event_type text not null check(event_type in ('view','wishlist','enquiry','add_to_cart','purchase')),session_id text,created_at timestamptz default now());
create table if not exists public.enquiries (id uuid primary key default gen_random_uuid(),product_id uuid references public.products(id) on delete set null,customer_name text,email text,phone text,message text not null,source text default 'website' check(source in ('website','chatbot','checkout','newsletter')),status text default 'new' check(status in ('new','contacted','closed')),created_at timestamptz default now());
create table if not exists public.chat_sessions(id uuid primary key default gen_random_uuid(),session_id text unique not null,messages jsonb not null default '[]',created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.store_settings(id int primary key default 1 check(id=1),store_name text,tagline text,logo_url text,favicon_url text,contact_email text default '',contact_phone text default '',address text default '',opening_time time,closing_time time,working_days text[] default '{}',social_links jsonb default '{}',about_text text,policy_documents jsonb default '[]',shipping_policy text default 'Please contact our team to confirm shipping availability, charges and delivery times for your address.',returns_policy text default 'Please confirm return and exchange eligibility with our team before placing your order.',updated_at timestamptz default now());
create index if not exists products_category_idx on public.products(category) where is_active;
create index if not exists events_product_time_idx on public.product_events(product_id,created_at);
create index if not exists enquiries_status_idx on public.enquiries(status,created_at);
alter table public.admin_profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_events enable row level security;
alter table public.enquiries enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.store_settings enable row level security;
drop policy if exists "read own admin profile" on public.admin_profiles;
create policy "read own admin profile" on public.admin_profiles for select to authenticated using(id=auth.uid());
drop policy if exists "public active products" on public.products;
create policy "public active products" on public.products for select using(is_active=true);
drop policy if exists "admin products" on public.products;
create policy "admin products" on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public store settings" on public.store_settings;
create policy "public store settings" on public.store_settings for select using(true);
drop policy if exists "admin settings" on public.store_settings;
create policy "admin settings" on public.store_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin enquiries" on public.enquiries;
create policy "admin enquiries" on public.enquiries for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public enquiries" on public.enquiries;
create policy "public enquiries" on public.enquiries for insert to anon,authenticated with check(status='new' and length(message) between 5 and 4000 and length(customer_name) between 2 and 120 and (email is not null or phone is not null));
drop policy if exists "admin events" on public.product_events;
create policy "admin events" on public.product_events for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public events" on public.product_events;
create policy "public events" on public.product_events for insert to anon,authenticated with check(event_type in ('view','wishlist','enquiry','add_to_cart') and exists(select 1 from public.products where id=product_id and is_active=true));
drop policy if exists "admin chats" on public.chat_sessions;
create policy "admin chats" on public.chat_sessions for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.products,public.store_settings to anon,authenticated;
grant insert on public.enquiries,public.product_events to anon,authenticated;
grant select on public.admin_profiles to authenticated;
grant all on public.products,public.store_settings,public.enquiries,public.product_events,public.chat_sessions to authenticated;
grant all on all tables in schema public to service_role;
create or replace function public.increment_product_counters() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if new.event_type='view' then update public.products set view_count=view_count+1 where id=new.product_id; end if;
 if new.event_type='enquiry' then update public.products set enquiry_count=enquiry_count+1 where id=new.product_id; end if;
 return new; end; $$;
drop trigger if exists product_event_counter on public.product_events;
create trigger product_event_counter after insert on public.product_events for each row execute function public.increment_product_counters();
insert into public.store_settings(id,store_name,tagline,about_text) values(1,'Krishna Sarees And Readymade','Woven with tradition. Worn with love.','Some things never go out of style. The grace of a saree. The joy of dressing up. The pieces we pass down. At Krishna, we bring together beautiful sarees and readymade favourites for the everyday moments and the unforgettable ones.') on conflict(id) do nothing;
-- Create an admin in Authentication > Users, then run:
-- insert into public.admin_profiles(id,full_name) select id,'Store administrator' from auth.users where email='YOUR_ADMIN_EMAIL' on conflict(id) do nothing;
