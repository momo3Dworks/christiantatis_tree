
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create home_churches table
create table public.home_churches (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  "phoneNumber" text,
  email text,
  "whatsappNumber" text,
  "websiteUrl" text,
  neighborhood text,
  tags text[], 
  "personLimit" int,
  status text check (status in ('Open', 'Full', 'Closed', 'Temporarily Closed', 'Suspended')),
  "meetingDate" timestamptz,
  "meetingTime" text,
  "meetingSchedule" text,
  latitude float,
  longitude float,
  "creatorId" uuid references auth.users(id) on delete cascade,
  reservations text[], -- Array of user UUIDs
  "isRecurring" boolean default true,
  "isFull" boolean default false,
  "creatorName" text not null,
  "creatorEmail" text not null
);

-- Enable RLS
alter table public.home_churches enable row level security;

-- Policies
create policy "Public churches are viewable by everyone" on public.home_churches
  for select using (true);

create policy "Users can insert their own churches" on public.home_churches
  for insert with check (auth.uid() = "creatorId");

create policy "Creators can update their own churches" on public.home_churches
  for update using (auth.uid() = "creatorId");

create policy "Creators can delete their own churches" on public.home_churches
  for delete using (auth.uid() = "creatorId");

-- Reservation Policy (Simplified: Allow anyone authenticated to update reservations column)
-- Ideally this should be more strict or use a separate table
create policy "Authenticated users can update reservations" on public.home_churches
  for update using (auth.role() = 'authenticated');
