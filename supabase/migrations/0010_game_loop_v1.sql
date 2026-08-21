-- Migration 0010: Game Loop v1 Schema (C1 - C5)

-- 1. ALTER exercises table to include skill_tag
alter table exercises
  add column if not exists skill_tag text check (skill_tag in ('nghe','noi','doc','viet','tu_vung','ngu_phap','phat_am'));

-- Backfill default skill_tag if null based on type
update exercises set skill_tag = case
  when type in ('speaking', 'pronunciation') then 'noi'
  when type in ('listening') then 'nghe'
  when type in ('cloze', 'reading') then 'doc'
  when type in ('grammar', 'grammar_dialogue') then 'ngu_phap'
  when type in ('writing') then 'viet'
  else 'tu_vung'
end where skill_tag is null;

-- 2. Practice Sessions & Session Items (C2)
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  mode text not null check (mode in ('mistake_review', 'skill_boost')),
  skill_tags text[] default '{}',
  question_count int not null default 0,
  estimated_minutes int not null default 5,
  reward_gems int not null default 40,
  reward_xp int not null default 50,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists practice_session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  "order" int not null default 0,
  resolved boolean not null default false
);

create index if not exists practice_sessions_student_idx on practice_sessions(student_id, created_at desc);
create index if not exists practice_session_items_session_idx on practice_session_items(session_id);

-- 3. AI Role Play (C1)
create table if not exists role_play_topics (
  id uuid primary key default gen_random_uuid(),
  title_vi text not null,
  icon text not null default '🏫',
  cefr_band text not null default 'A1',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists role_play_tasks (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references role_play_topics(id) on delete cascade,
  "order" int not null default 1,
  prompt_vi text not null,
  keyword_hints text[] not null default '{}'
);

create table if not exists role_play_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  topic_id uuid not null references role_play_topics(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  reward_gems int not null default 30,
  reward_xp int not null default 50
);

create table if not exists role_play_utterances (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references role_play_sessions(id) on delete cascade,
  task_id uuid references role_play_tasks(id) on delete set null,
  audio_url text,
  transcript text,
  created_at timestamptz not null default now()
);

create table if not exists role_play_task_completions (
  session_id uuid not null references role_play_sessions(id) on delete cascade,
  task_id uuid not null references role_play_tasks(id) on delete cascade,
  completed_at timestamptz not null default now(),
  matched_keyword text,
  primary key (session_id, task_id)
);

create index if not exists role_play_sessions_student_idx on role_play_sessions(student_id, started_at desc);

-- 4. Interactive Story Library (C3)
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cover_url text,
  genre text not null default 'adventure',
  difficulty text not null default 'easy' check (difficulty in ('easy', 'hard')),
  cefr_band text not null default 'A1',
  topic_tag text not null default 'general',
  created_at timestamptz not null default now()
);

create table if not exists story_pages (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  "order" int not null default 1,
  illustration_url text,
  text_en text not null,
  audio_url text,
  word_timings jsonb default '[]'::jsonb
);

create table if not exists story_reads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  page_id uuid not null references story_pages(id) on delete cascade,
  read_at timestamptz not null default now(),
  reward_claimed boolean not null default false
);

create index if not exists story_reads_student_idx on story_reads(student_id, story_id, page_id, read_at desc);

-- 5. League & Tier Leaderboard (C4)
create table if not exists league_groups (
  id uuid primary key default gen_random_uuid(),
  week_start_date date not null,
  cefr_band text not null default 'A1',
  group_index int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists league_memberships (
  league_group_id uuid not null references league_groups(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  xp_this_week int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (league_group_id, student_id)
);

create index if not exists league_memberships_student_idx on league_memberships(student_id);

-- 6. Buddy Pet (C5)
create table if not exists pet_species (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage_thresholds jsonb not null default '[{"stage":1,"min_streak":0},{"stage":2,"min_streak":7},{"stage":3,"min_streak":21}]'::jsonb
);

create table if not exists student_pets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  species_id uuid not null references pet_species(id) on delete cascade,
  stage int not null default 1,
  happiness int not null default 80,
  last_fed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists student_pets_student_idx on student_pets(student_id);

-- 7. Enable RLS and Policies
alter table practice_sessions enable row level security;
alter table practice_session_items enable row level security;
alter table role_play_topics enable row level security;
alter table role_play_tasks enable row level security;
alter table role_play_sessions enable row level security;
alter table role_play_utterances enable row level security;
alter table role_play_task_completions enable row level security;
alter table stories enable row level security;
alter table story_pages enable row level security;
alter table story_reads enable row level security;
alter table league_groups enable row level security;
alter table league_memberships enable row level security;
alter table pet_species enable row level security;
alter table student_pets enable row level security;

-- Read policies for shared content
create policy "Anyone authenticated can read role_play_topics" on role_play_topics for select using (true);
create policy "Anyone authenticated can read role_play_tasks" on role_play_tasks for select using (true);
create policy "Anyone authenticated can read stories" on stories for select using (true);
create policy "Anyone authenticated can read story_pages" on story_pages for select using (true);
create policy "Anyone authenticated can read pet_species" on pet_species for select using (true);
create policy "Anyone authenticated can read league_groups" on league_groups for select using (true);

-- Student ownership policies
create policy "Students can access own practice_sessions" on practice_sessions
  for all using (auth.uid() = student_id);

create policy "Students can access own practice_session_items" on practice_session_items
  for all using (exists (
    select 1 from practice_sessions s where s.id = practice_session_items.session_id and s.student_id = auth.uid()
  ));

create policy "Students can access own role_play_sessions" on role_play_sessions
  for all using (auth.uid() = student_id);

create policy "Students can access own role_play_utterances" on role_play_utterances
  for all using (exists (
    select 1 from role_play_sessions s where s.id = role_play_utterances.session_id and s.student_id = auth.uid()
  ));

create policy "Students can access own role_play_task_completions" on role_play_task_completions
  for all using (exists (
    select 1 from role_play_sessions s where s.id = role_play_task_completions.session_id and s.student_id = auth.uid()
  ));

create policy "Students can access own story_reads" on story_reads
  for all using (auth.uid() = student_id);

create policy "Students can access league_memberships in their group" on league_memberships
  for select using (true);
create policy "Students can insert own league_memberships" on league_memberships
  for insert with check (auth.uid() = student_id);
create policy "Students can update own league_memberships" on league_memberships
  for update using (auth.uid() = student_id);

create policy "Students can access own student_pets" on student_pets
  for all using (auth.uid() = student_id);

-- 8. Seed Initial Data for C1, C3, C5
insert into role_play_topics (id, title_vi, icon, cefr_band, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'House Tour', '🏠', 'A1', true),
  ('10000000-0000-0000-0000-000000000002', 'My Classroom', '🏫', 'A1', true),
  ('10000000-0000-0000-0000-000000000003', 'My Lunch', '🍱', 'A1', true)
on conflict (id) do nothing;

insert into role_play_tasks (id, topic_id, "order", prompt_vi, keyword_hints) values
  ('10000000-0000-0000-0001-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'Nói 1 căn phòng trong nhà em', ARRAY['room','living','bedroom','kitchen','house','home']),
  ('10000000-0000-0000-0001-000000000002', '10000000-0000-0000-0000-000000000001', 2, 'Nói 1 đồ vật có trong căn phòng đó', ARRAY['bed','table','chair','sofa','tv','desk','lamp']),
  ('10000000-0000-0000-0001-000000000003', '10000000-0000-0000-0000-000000000001', 3, 'Nói em thích làm gì ở căn phòng đó', ARRAY['like','play','sleep','watch','read','eat']),
  
  ('10000000-0000-0000-0002-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'Nói 1 đồ vật trong lớp học', ARRAY['desk','chair','board','pen','pencil','book','bag','ruler']),
  ('10000000-0000-0000-0002-000000000002', '10000000-0000-0000-0000-000000000002', 2, 'Nói em dùng đồ vật đó để làm gì', ARRAY['write','draw','read','sit','learn','study','use']),
  ('10000000-0000-0000-0002-000000000003', '10000000-0000-0000-0000-000000000002', 3, 'Nói đồ vật đó vị trí ở đâu trong lớp', ARRAY['on','in','next','under','near','behind','front','here']),
  
  ('10000000-0000-0000-0003-000000000001', '10000000-0000-0000-0000-000000000003', 1, 'Nói 1 món ăn hoặc đồ uống cho bữa trưa', ARRAY['rice','bread','milk','apple','chicken','soup','water','juice','sandwich']),
  ('10000000-0000-0000-0003-000000000002', '10000000-0000-0000-0000-000000000003', 2, 'Nói món ăn đó có vị gì hoặc màu gì', ARRAY['delicious','yummy','good','red','yellow','sweet','tasty']),
  ('10000000-0000-0000-0003-000000000003', '10000000-0000-0000-0000-000000000003', 3, 'Nói em ăn trưa cùng ai', ARRAY['friend','friends','classmate','teacher','mom','family'])
on conflict (id) do nothing;

insert into stories (id, title, cover_url, genre, difficulty, cefr_band, topic_tag) values
  ('30000000-0000-0000-0000-000000000001', 'Rubee and the Magical Honeybee', '🐝', 'fantasy', 'easy', 'A1', 'animals'),
  ('30000000-0000-0000-0000-000000000002', 'The Secret School Garden', '🌱', 'adventure', 'easy', 'A1', 'nature'),
  ('30000000-0000-0000-0000-000000000003', 'Space Journey of Little Bee', '🚀', 'sci-fi', 'hard', 'A2', 'space')
on conflict (id) do nothing;

insert into story_pages (id, story_id, "order", illustration_url, text_en, audio_url, word_timings) values
  ('30000000-0000-0000-0001-000000000001', '30000000-0000-0000-0000-000000000001', 1, '🌻', 'Rubee woke up early today to find the golden flower.', null, '[{"word":"Rubee","start_ms":0,"end_ms":400},{"word":"woke","start_ms":400,"end_ms":800},{"word":"up","start_ms":800,"end_ms":1100},{"word":"early","start_ms":1100,"end_ms":1500},{"word":"today","start_ms":1500,"end_ms":1900},{"word":"to","start_ms":1900,"end_ms":2100},{"word":"find","start_ms":2100,"end_ms":2500},{"word":"the","start_ms":2500,"end_ms":2700},{"word":"golden","start_ms":2700,"end_ms":3200},{"word":"flower.","start_ms":3200,"end_ms":3800}]'::jsonb),
  ('30000000-0000-0000-0001-000000000002', '30000000-0000-0000-0000-000000000001', 2, '🐝', 'The little bee flew across the green meadow happily.', null, '[{"word":"The","start_ms":0,"end_ms":200},{"word":"little","start_ms":200,"end_ms":600},{"word":"bee","start_ms":600,"end_ms":1000},{"word":"flew","start_ms":1000,"end_ms":1400},{"word":"across","start_ms":1400,"end_ms":1900},{"word":"the","start_ms":1900,"end_ms":2100},{"word":"green","start_ms":2100,"end_ms":2600},{"word":"meadow","start_ms":2600,"end_ms":3100},{"word":"happily.","start_ms":3100,"end_ms":3700}]'::jsonb),
  ('30000000-0000-0000-0001-000000000003', '30000000-0000-0000-0000-000000000001', 3, '🍯', 'Together they shared sweet honey under the big oak tree.', null, '[{"word":"Together","start_ms":0,"end_ms":600},{"word":"they","start_ms":600,"end_ms":900},{"word":"shared","start_ms":900,"end_ms":1400},{"word":"sweet","start_ms":1400,"end_ms":1800},{"word":"honey","start_ms":1800,"end_ms":2300},{"word":"under","start_ms":2300,"end_ms":2700},{"word":"the","start_ms":2700,"end_ms":2900},{"word":"big","start_ms":2900,"end_ms":3300},{"word":"oak","start_ms":3300,"end_ms":3700},{"word":"tree.","start_ms":3700,"end_ms":4200}]'::jsonb),
  
  ('30000000-0000-0000-0002-000000000001', '30000000-0000-0000-0000-000000000002', 1, '🏫', 'Behind the classroom lies a secret garden full of red roses.', null, '[{"word":"Behind","start_ms":0,"end_ms":500},{"word":"the","start_ms":500,"end_ms":700},{"word":"classroom","start_ms":700,"end_ms":1300},{"word":"lies","start_ms":1300,"end_ms":1700},{"word":"a","start_ms":1700,"end_ms":1900},{"word":"secret","start_ms":1900,"end_ms":2400},{"word":"garden","start_ms":2400,"end_ms":2900},{"word":"full","start_ms":2900,"end_ms":3300},{"word":"of","start_ms":3300,"end_ms":3500},{"word":"red","start_ms":3500,"end_ms":3900},{"word":"roses.","start_ms":3900,"end_ms":4500}]'::jsonb),
  ('30000000-0000-0000-0002-000000000002', '30000000-0000-0000-0000-000000000002', 2, '🦋', 'Butterflies dance around every single morning.', null, '[{"word":"Butterflies","start_ms":0,"end_ms":700},{"word":"dance","start_ms":700,"end_ms":1200},{"word":"around","start_ms":1200,"end_ms":1700},{"word":"every","start_ms":1700,"end_ms":2100},{"word":"single","start_ms":2100,"end_ms":2600},{"word":"morning.","start_ms":2600,"end_ms":3200}]'::jsonb),

  ('30000000-0000-0000-0003-000000000001', '30000000-0000-0000-0000-000000000003', 1, '🌕', 'Little Bee put on a shiny space helmet and flew to the Moon.', null, '[{"word":"Little","start_ms":0,"end_ms":400},{"word":"Bee","start_ms":400,"end_ms":700},{"word":"put","start_ms":700,"end_ms":1000},{"word":"on","start_ms":1000,"end_ms":1200},{"word":"a","start_ms":1200,"end_ms":1400},{"word":"shiny","start_ms":1400,"end_ms":1900},{"word":"space","start_ms":1900,"end_ms":2300},{"word":"helmet","start_ms":2300,"end_ms":2800},{"word":"and","start_ms":2800,"end_ms":3000},{"word":"flew","start_ms":3000,"end_ms":3400},{"word":"to","start_ms":3400,"end_ms":3600},{"word":"the","start_ms":3600,"end_ms":3800},{"word":"Moon.","start_ms":3800,"end_ms":4400}]'::jsonb)
on conflict (id) do nothing;

insert into pet_species (id, name, stage_thresholds) values
  ('50000000-0000-0000-0000-000000000001', 'Beeblast Buddy Bee', '[{"stage":1,"min_streak":0},{"stage":2,"min_streak":7},{"stage":3,"min_streak":21}]'::jsonb)
on conflict (id) do nothing;
