-- Migration 0006: Student App v2 Schema additions
-- Adds exercise skills, library topics, chat messages, and class post comments

-- 1. Exercise skills
create type exercise_skill as enum (
  'VOCAB', 'GRAMMAR', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'
);

alter table exercises
  add column if not exists skill exercise_skill not null default 'VOCAB';

-- 2. Topic source enum & nullable class_id for library topics (Arena)
create type topic_source as enum ('school', 'library');

alter table topics
  add column if not exists source topic_source not null default 'school',
  alter column class_id drop not null;

-- 3. Messages table for 1:1 Teacher <-> Student chat
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  teacher_id  uuid not null references users(id) on delete cascade,
  student_id  uuid not null references users(id) on delete cascade,
  sender_id   uuid not null references users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- 4. Threaded comments on class_posts
create table if not exists class_post_comments (
  id            uuid primary key default gen_random_uuid(),
  class_post_id uuid not null references class_posts(id) on delete cascade,
  author_id     uuid not null references users(id) on delete cascade,
  body          text not null,
  created_at    timestamptz not null default now()
);

-- 5. Track weekly vault bonus review timestamp on student_avatars
alter table student_avatars
  add column if not exists last_vault_review_bonus_at timestamptz;
