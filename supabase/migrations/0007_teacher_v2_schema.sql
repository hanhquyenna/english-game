-- Migration 0007: Teacher App v2 Schema additions
-- Adds material_folders, materials, and lesson_plans tables

-- 1. Material Folders
create table if not exists material_folders (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

-- 2. Materials
create table if not exists materials (
  id         uuid primary key default gen_random_uuid(),
  folder_id  uuid references material_folders(id) on delete set null,
  class_id   uuid not null references classes(id) on delete cascade,
  title      text not null,
  file_type  text not null default 'pdf',
  file_url   text not null,
  topic_id   uuid references topics(id) on delete set null,
  cefr_level text not null default 'B1',
  created_at timestamptz not null default now()
);

-- 3. Lesson Plans
create table if not exists lesson_plans (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references users(id) on delete cascade,
  topic_id   uuid references topics(id) on delete set null,
  title      text not null,
  objectives text not null,
  materials  text not null,
  activities text not null,
  homework   text not null,
  created_at timestamptz not null default now()
);
