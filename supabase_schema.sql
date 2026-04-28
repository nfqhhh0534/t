-- Database Schema for AI Community
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (user profiles)
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  department text not null,
  position text not null,
  avatar text,
  energy integer default 100,
  level text default '新星',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tags table
create table if not exists tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text not null,
  count integer default 0,
  created_at timestamp with time zone default now()
);

-- Questions table
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  author_id uuid references profiles(id) on delete cascade,
  status text default 'unresolved' check (status in ('unresolved', 'resolved')),
  bounty integer,
  likes integer default 0,
  views integer default 0,
  "收藏" integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Question-Tags junction table
create table if not exists question_tags (
  question_id uuid references questions(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (question_id, tag_id)
);

-- Answers table
create table if not exists answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  likes integer default 0,
  is_accepted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Comments table
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Likes table (to track who liked what)
create table if not exists likes (
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, question_id)
);

-- Collections table (bookmarks)
create table if not exists collections (
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, question_id)
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table collections enable row level security;
alter table tags enable row level security;
alter table question_tags enable row level security;

-- Public read access for all tables (for community content)
create policy "Public read access on profiles" on profiles for select using (true);
create policy "Public read access on questions" on questions for select using (true);
create policy "Public read access on answers" on answers for select using (true);
create policy "Public read access on comments" on comments for select using (true);
create policy "Public read access on tags" on tags for select using (true);
create policy "Public read access on question_tags" on question_tags for select using (true);

-- Users can insert questions
create policy "Users can insert questions" on questions for insert with check (true);

-- Users can update their own questions
create policy "Users can update own questions" on questions for update using (auth.uid() = author_id);

-- Users can delete their own questions
create policy "Users can delete own questions" on questions for delete using (auth.uid() = author_id);

-- Users can insert answers
create policy "Users can insert answers" on answers for insert with check (true);

-- Users can insert comments
create policy "Users can insert comments" on comments for insert with check (true);

-- Users can manage their own likes
create policy "Users can manage likes" on likes for all using (true);

-- Users can manage their own collections
create policy "Users can manage collections" on collections for all using (true);

-- Create indexes for better performance
create index if not exists idx_questions_author_id on questions(author_id);
create index if not exists idx_questions_created_at on questions(created_at desc);
create index if not exists idx_questions_status on questions(status);
create index if not exists idx_answers_question_id on answers(question_id);
create index if not exists idx_comments_question_id on comments(question_id);

-- Function to update tag counts
create or replace function update_tag_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update tags set count = count + 1 where id = NEW.tag_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update tags set count = count - 1 where id = OLD.tag_id;
    return OLD;
  end if;
end;
$$ language plpgsql;

-- Trigger to auto-update tag counts
drop trigger if exists update_tag_count_on_insert on question_tags;
create trigger update_tag_count_on_insert
after insert on question_tags
for each row execute procedure update_tag_count();

drop trigger if exists update_tag_count_on_delete on question_tags;
create trigger update_tag_count_on_delete
after delete on question_tags
for each row execute procedure update_tag_count();
