-- Migration 0008: Beeblast v2 FRS Schema
-- Adds cefr_thresholds, xp_ledger, vocab_review_log, speaking_attempts, student_avatar_ownership, and updates journal_entries

-- 1. CEFR Thresholds table
create table if not exists cefr_thresholds (
  band text primary key,
  xp_required int not null
);

insert into cefr_thresholds (band, xp_required) values
  ('A1', 200),
  ('A2', 400),
  ('B1', 600),
  ('B2', 800),
  ('C1', 1000),
  ('C2', 1500)
on conflict (band) do update set xp_required = excluded.xp_required;

-- 2. XP Ledger
create table if not exists xp_ledger (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references users(id) on delete cascade,
  source      text not null check (source in ('lesson_first', 'lesson_replay', 'journal_approved', 'speaking_graded')),
  amount      int not null,
  ref_id      uuid,
  created_at  timestamptz not null default now()
);

create index if not exists xp_ledger_student_idx on xp_ledger(student_id, created_at desc);

-- 3. Vocab Review Log
create table if not exists vocab_review_log (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references users(id) on delete cascade,
  vocab_id       uuid not null references vocab_items(id) on delete cascade,
  result         text not null check (result in ('remembered', 'forgot')),
  next_review_at timestamptz not null,
  created_at     timestamptz not null default now()
);

create index if not exists vocab_review_log_student_idx on vocab_review_log(student_id, vocab_id, created_at desc);

-- 4. Journal Entries schema update
alter table journal_entries
  add column if not exists unit_id uuid references topics(id) on delete set null,
  add column if not exists type text not null default 'text' check (type in ('text', 'audio')),
  add column if not exists audio_url text,
  add column if not exists status text not null default 'submitted' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  add column if not exists teacher_comment_audio_url text,
  add column if not exists star_rating int check (star_rating >= 1 and star_rating <= 5),
  add column if not exists approved_at timestamptz;

-- 5. Speaking Attempts
create table if not exists speaking_attempts (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references users(id) on delete cascade,
  lesson_id       uuid references exercises(id) on delete cascade,
  audio_url       text not null,
  model_audio_url text,
  overall_score   numeric,
  attempt_number  int not null default 1,
  created_at      timestamptz not null default now()
);

create index if not exists speaking_attempts_student_idx on speaking_attempts(student_id, created_at desc);

-- 6. Avatar Items & Student Ownership
create table if not exists avatar_items (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('hair', 'face', 'hats', 'clothes', 'stance')),
  asset_url   text not null,
  price_gems  int not null default 0,
  z_index     int not null default 1,
  title       text not null default ''
);

create table if not exists student_avatar_ownership (
  student_id     uuid not null references users(id) on delete cascade,
  avatar_item_id uuid not null references avatar_items(id) on delete cascade,
  purchased_at   timestamptz not null default now(),
  primary key (student_id, avatar_item_id)
);

-- 7. Parental consent flag on users
alter table users
  add column if not exists parental_consent_at timestamptz;

-- 8. Gems balance on student_avatars
alter table student_avatars
  add column if not exists gems int not null default 100,
  add column if not exists last_weekly_bonus_claimed_at timestamptz;
