-- 扩展
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists vector; -- pgvector

-- Schema
create schema if not exists app;

-- 用户表（业务侧）
create table if not exists app.users (
  uid uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text default 'en',
  tz text default 'Asia/Singapore',
  created_at timestamptz default now()
);

-- 运行/人生存档
create table if not exists app.runs (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null references auth.users(id) on delete cascade,
  universe text not null,
  seed_profile jsonb not null,
  state jsonb default '{}',
  version text default 'v1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_runs_owner on app.runs(owner_uid);

-- 聊天与消息
create table if not exists app.chats (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references app.runs(id) on delete cascade,
  title text,
  stage text,
  last_message_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_chats_run on app.chats(run_id);

create table if not exists app.messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references app.chats(id) on delete cascade,
  role text check (role in ('user','assistant','system')),
  content text not null,
  meta jsonb,
  tokens_in int default 0,
  tokens_out int default 0,
  llm_model text,
  status text default 'complete',
  created_at timestamptz default now()
);
create index if not exists idx_messages_chat_ts on app.messages(chat_id, created_at);

-- NPC/模板/关系
create table if not exists app.npcs (
  id uuid primary key default gen_random_uuid(),
  universe text not null,
  archetype text not null,
  persona jsonb not null,
  memory_vec vector(1536),
  created_at timestamptz default now()
);

create table if not exists app.templates (
  id uuid primary key default gen_random_uuid(),
  universe text not null,
  version text not null,
  checksum text,
  files jsonb,
  created_at timestamptz default now()
);

create table if not exists app.relationships (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references app.runs(id) on delete cascade,
  subject_type text not null,
  subject_id uuid not null,
  intimacy int default 0,
  trust int default 0,
  conflict int default 0,
  updated_at timestamptz default now()
);
create index if not exists idx_rel_run on app.relationships(run_id);

-- RLS 策略
alter table app.runs enable row level security;
create policy if not exists runs_owner_isolation on app.runs
  for all using (owner_uid = auth.uid()) with check (owner_uid = auth.uid());

alter table app.chats enable row level security;
create policy if not exists chats_run_owner on app.chats
  for all using (
    exists(select 1 from app.runs r where r.id = run_id and r.owner_uid = auth.uid())
  ) with check (
    exists(select 1 from app.runs r where r.id = run_id and r.owner_uid = auth.uid())
  );

alter table app.messages enable row level security;
create policy if not exists messages_chat_owner on app.messages
  for all using (
    exists(select 1 from app.chats c join app.runs r on r.id=c.run_id where c.id=chat_id and r.owner_uid=auth.uid())
  ) with check (
    exists(select 1 from app.chats c join app.runs r on r.id=c.run_id where c.id=chat_id and r.owner_uid=auth.uid())
  );
