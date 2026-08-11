-- Beeblast demo schema (§4 of the build plan)
-- Naming: snake_case columns, uuid PKs, timestamptz everywhere.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type user_role         as enum ('TEACHER','STUDENT','PARENT');
create type exercise_type     as enum ('MCQ','FILL_BLANK','MATCHING','VOCAB_CARD');
create type notification_type as enum (
  'NEW_ASSIGNMENT','EXAM_RESULT','LEVEL_UP',
  'STREAK_AT_RISK','STREAK_BROKEN','KUDOS_RECEIVED','CLASS_POST'
);
create type kudos_tag         as enum ('HARD_WORK','TEAMWORK','PERSISTENCE','ON_TASK','CUSTOM');
create type avatar_category   as enum ('BASE','ACCESSORY','RANK_FRAME');

-- ---------------------------------------------------------------- people
create table users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        user_role not null,
  created_at  timestamptz not null default now()
);

create table classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  teacher_id  uuid not null references users(id) on delete cascade,
  cefr_level  text not null default 'B1',
  created_at  timestamptz not null default now()
);

create table enrollments (
  student_id  uuid not null references users(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (student_id, class_id)
);

create table parent_links (
  parent_id   uuid not null references users(id) on delete cascade,
  student_id  uuid not null references users(id) on delete cascade,
  primary key (parent_id, student_id)
);

-- ---------------------------------------------------------------- curriculum
create table topics (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  title       text not null,
  "order"     int  not null,
  cefr_level  text not null default 'B1',
  assigned_at timestamptz,                     -- null = built but not yet assigned
  created_at  timestamptz not null default now()
);

create table vocab_items (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references topics(id) on delete cascade,
  term        text not null,
  meaning     text not null,
  example     text,
  cefr_level  text not null default 'B1',
  created_at  timestamptz not null default now()
);

create table grammar_points (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references topics(id) on delete cascade,
  name        text not null,
  explanation text not null,
  cefr_level  text not null default 'B1',
  created_at  timestamptz not null default now()
);

create table exercises (
  id                    uuid primary key default gen_random_uuid(),
  topic_id              uuid not null references topics(id) on delete cascade,
  type                  exercise_type not null,
  vocab_item_id         uuid references vocab_items(id) on delete set null,
  grammar_point_id      uuid references grammar_points(id) on delete set null,
  content               jsonb not null,
  created_by_teacher_id uuid references users(id) on delete set null,
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------- assessment
create table exams (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references classes(id) on delete cascade,
  topic_id     uuid references topics(id) on delete set null,
  title        text not null,
  exercise_ids jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  published_at timestamptz
);

create table submissions (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references exams(id) on delete cascade,
  student_id   uuid not null references users(id) on delete cascade,
  answers      jsonb not null default '{}'::jsonb,
  score        numeric,                        -- 0..100, null = ungraded
  submitted_at timestamptz not null default now(),
  graded_at    timestamptz,
  unique (exam_id, student_id)
);

-- ---------------------------------------------------------------- practice loop
create table exercise_attempts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references users(id) on delete cascade,
  exercise_id  uuid not null references exercises(id) on delete cascade,
  correct      boolean not null,
  attempted_at timestamptz not null default now()
);

create table study_sessions (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references users(id) on delete cascade,
  started_at  timestamptz not null default now(),
  minutes     numeric not null default 0
);

create table vocab_mastery (
  student_id       uuid not null references users(id) on delete cascade,
  vocab_item_id    uuid not null references vocab_items(id) on delete cascade,
  mastery_score    numeric not null default 0,     -- 0..100
  last_reviewed_at timestamptz not null default now(),
  primary key (student_id, vocab_item_id)
);

create table grammar_mastery (
  student_id       uuid not null references users(id) on delete cascade,
  grammar_point_id uuid not null references grammar_points(id) on delete cascade,
  mastery_score    numeric not null default 0,     -- 0..100
  last_reviewed_at timestamptz not null default now(),
  primary key (student_id, grammar_point_id)
);

create table topic_progress (
  student_id       uuid not null references users(id) on delete cascade,
  topic_id         uuid not null references topics(id) on delete cascade,
  percent_complete numeric not null default 0,     -- 0..100
  updated_at       timestamptz not null default now(),
  primary key (student_id, topic_id)
);

-- ---------------------------------------------------------------- the level engine output
create table level_scores (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references users(id) on delete cascade,
  computed_at     timestamptz not null default now(),
  cefr_band       text not null,
  composite_score numeric not null,
  hours_score     numeric not null,
  vocab_score     numeric not null,
  exam_score      numeric not null,
  coverage_score  numeric not null,
  grammar_score   numeric not null
);
create index level_scores_student_computed_idx
  on level_scores (student_id, computed_at desc);

-- ---------------------------------------------------------------- engagement
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  type       notification_type not null,
  payload    jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on notifications (user_id, created_at desc);

create table xp_events (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references users(id) on delete cascade,
  date        date not null,
  xp          int  not null default 0,
  streak_count int not null default 0,
  unique (student_id, date)
);

-- ---------------------------------------------------------------- ClassDojo-inspired (§13)
create table avatars (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  category    avatar_category not null,
  label       text not null,
  unlock_rule text not null            -- e.g. 'streak:7', 'cefr:B2', 'xp:500'
);

create table student_avatars (
  student_id             uuid primary key references users(id) on delete cascade,
  base_avatar_seed       text not null,          -- fixed identity, DiceBear seed
  current_rank_frame_id  uuid references avatars(id) on delete set null,
  unlocked_accessory_ids jsonb not null default '[]'::jsonb,
  equipped_accessory_ids jsonb not null default '[]'::jsonb
);

create table kudos (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  teacher_id uuid not null references users(id) on delete cascade,
  tag        kudos_tag not null,
  note       text,
  created_at timestamptz not null default now()
);

create table class_posts (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes(id) on delete cascade,
  teacher_id uuid not null references users(id) on delete cascade,
  text       text not null,
  image_url  text,
  created_at timestamptz not null default now()
);

create table journal_entries (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references users(id) on delete cascade,
  topic_id        uuid references topics(id) on delete set null,
  text            text not null,
  teacher_comment text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpful indexes
create index exercise_attempts_student_idx on exercise_attempts (student_id, attempted_at desc);
create index study_sessions_student_idx    on study_sessions (student_id, started_at desc);
create index exercises_topic_idx           on exercises (topic_id);
create index vocab_items_topic_idx         on vocab_items (topic_id);
create index grammar_points_topic_idx      on grammar_points (topic_id);
create index topics_class_order_idx        on topics (class_id, "order");
