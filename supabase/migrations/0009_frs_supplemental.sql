-- Migration 0009: FRS Supplemental (Multi-format Submissions & RubeeShine additions)

-- 1. Create or extend submissions table for multi-format content
create table if not exists submissions_v2 (
  id                        uuid primary key default gen_random_uuid(),
  student_id                uuid not null references users(id) on delete cascade,
  source_type               text not null check (source_type in ('journal', 'homework', 'speaking')),
  source_ref_id             uuid,
  type                      text not null check (type in ('text', 'audio', 'image', 'video', 'file')),
  content                   text,
  media_url                 text,
  media_mime_type           text,
  file_size_bytes           bigint,
  duration_seconds          int,
  status                    text not null default 'submitted' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  star_rating               int check (star_rating >= 1 and star_rating <= 5),
  teacher_comment           text,
  teacher_comment_type      text check (teacher_comment_type in ('text', 'audio', 'image')),
  teacher_comment_media_url text,
  score                     numeric,
  created_at                timestamptz not null default now()
);

create index if not exists submissions_v2_student_idx on submissions_v2(student_id, source_type, created_at desc);

-- 2. Assignment Config table
create table if not exists assignment_configs (
  id                uuid primary key default gen_random_uuid(),
  lesson_content_id uuid references exercises(id) on delete cascade,
  allowed_types     jsonb not null default '["text", "audio", "image", "video", "file"]'::jsonb,
  max_audio_duration_seconds int default 60,
  max_video_duration_seconds int default 120,
  max_file_size_mb           int default 20
);

-- 3. Visual Learning - image_url on vocab_items
alter table vocab_items
  add column if not exists image_url text;

-- 4. Arena Topics
create table if not exists arena_topics (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  level_range      text not null default 'A1-B2',
  unlock_threshold int not null default 0,
  created_at       timestamptz not null default now()
);

insert into arena_topics (id, title, level_range, unlock_threshold) values
  ('11111111-1111-1111-1111-111111111111', 'Travel & Airport', 'A1-B1', 0),
  ('22222222-2222-2222-2222-222222222222', 'Workplace & Email', 'B1-B2', 200)
on conflict (id) do nothing;
