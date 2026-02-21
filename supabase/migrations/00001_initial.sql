-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (synced from auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text not null,
  avatar_url text,
  initials text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Facilities
create table public.facilities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- Work items (tasks and projects)
create type work_item_type as enum ('task', 'project');
create type work_section as enum ('this_week', 'primary', 'icebox');
create type work_priority as enum ('high', 'medium', 'low');
create type work_status as enum ('todo', 'in_progress', 'done');

create table public.work_items (
  id uuid primary key default uuid_generate_v4(),
  type work_item_type not null default 'task',
  title text not null,
  description text,
  parent_id uuid references public.work_items(id) on delete cascade,
  position int not null default 0,
  section work_section not null default 'primary',
  due_date date,
  priority work_priority not null default 'medium',
  facility_id uuid references public.facilities(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  is_private boolean not null default false,
  status work_status not null default 'todo',
  attachments text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for common queries
create index work_items_section_position on public.work_items(section, position);
create index work_items_owner on public.work_items(owner_id);
create index work_items_parent on public.work_items(parent_id);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, initials)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 2))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.facilities enable row level security;
alter table public.work_items enable row level security;

-- Profiles: users can read all (for assignee/owner display), update own
create policy "Profiles readable by authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- Facilities: all authenticated can read
create policy "Facilities readable" on public.facilities
  for select using (auth.role() = 'authenticated');

-- Work items: authenticated users see non-private items or own private items
create policy "Work items select" on public.work_items
  for select using (
    auth.role() = 'authenticated'
    and (is_private = false or owner_id = auth.uid())
  );

create policy "Work items insert" on public.work_items
  for insert with check (auth.role() = 'authenticated');

create policy "Work items update" on public.work_items
  for update using (auth.role() = 'authenticated');

create policy "Work items delete" on public.work_items
  for delete using (auth.role() = 'authenticated');

-- Seed facilities
insert into public.facilities (name) values ('New York City'), ('Remote'), ('Other');
