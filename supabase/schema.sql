
create extension if not exists pgcrypto;


create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  avatar_url text,
  updated_at timestamptz default now()
);


create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  title text not null,
  image text,
  price text,
  tag text,
  link text,
  description text,
  is_staff_pick boolean default false,
  is_public boolean default false,
  created_at timestamptz default now()
);


alter table public.wishlist_items enable row level security;


create policy public_select_or_owner on public.wishlist_items
  for select
  using (is_public = true OR auth.uid() = user_id);

create policy insert_for_authenticated on public.wishlist_items
  for insert
  with check (auth.role() = 'authenticated' AND (user_id = auth.uid()));


create policy update_delete_owner on public.wishlist_items
  for update, delete
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

