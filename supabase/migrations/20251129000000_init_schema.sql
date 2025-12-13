create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  age int default 0,
  stage text default 'infancy',
  attributes jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

create table if not exists characters (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  relation text,
  initial_stage text,
  prompt text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table characters enable row level security;
create policy "Public characters are viewable by everyone" on characters for select using (true);

create table if not exists user_characters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  character_id uuid references characters(id) on delete cascade not null,
  status text default 'active',
  affinity int default 50,
  memory_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, character_id)
);
alter table user_characters enable row level security;
create policy "Users can view their unlocked characters" on user_characters for select using (auth.uid() = user_id);
create policy "Users can update their unlocked characters" on user_characters for update using (auth.uid() = user_id);
create policy "Users can insert unlocked characters" on user_characters for insert with check (auth.uid() = user_id);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  character_id uuid references characters(id) on delete cascade not null,
  sender text not null,
  content text not null,
  thinking_process text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table messages enable row level security;
create policy "Users can view their messages" on messages for select using (auth.uid() = user_id);
create policy "Users can insert messages" on messages for insert with check (auth.uid() = user_id);

create table if not exists life_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_type text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table life_events enable row level security;
create policy "Users can view their life events" on life_events for select using (auth.uid() = user_id);
create policy "Users can insert life events" on life_events for insert with check (auth.uid() = user_id);

insert into characters (name, relation, initial_stage, prompt) values
('Mom', 'Mother', 'infancy', 'You are a loving and caring mother. You are talking to your child.'),
('Dad', 'Father', 'infancy', 'You are a supportive father. You are talking to your child.');


