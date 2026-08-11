-- RLS + realtime.
--
-- NOTE ON SECURITY MODEL: this demo has no authentication (§1 of the plan calls
-- for a role picker, not real auth). Every row is seeded fake demo data — no
-- real people, no PII. So RLS is enabled on every table with permissive
-- policies for the anon role, which is what lets the browser client read and
-- write directly and what lets realtime deliver Postgres changes.
--
-- If this ever grows real users, these policies are the first thing to replace:
-- swap the `using (true)` predicates for auth.uid()-based ownership checks.

do $$
declare t text;
begin
  foreach t in array array[
    'users','classes','enrollments','parent_links','topics','vocab_items',
    'grammar_points','exercises','exams','submissions','exercise_attempts',
    'study_sessions','vocab_mastery','grammar_mastery','topic_progress',
    'level_scores','notifications','xp_events','avatars','student_avatars',
    'kudos','class_posts','journal_entries'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$create policy "demo_all_%s" on %I for all to anon, authenticated using (true) with check (true)$f$, t, t);
  end loop;
end $$;

-- Realtime: the demo's whole point is one persona's action moving a number on
-- another persona's screen, so every table a dashboard subscribes to is published.
do $$
declare t text;
begin
  foreach t in array array[
    'level_scores','notifications','exercise_attempts','xp_events',
    'topic_progress','kudos','class_posts','topics','submissions',
    'journal_entries','study_sessions','student_avatars','vocab_mastery',
    'grammar_mastery','exams'
  ]
  loop
    execute format('alter publication supabase_realtime add table %I', t);
    execute format('alter table %I replica identity full', t);
  end loop;
end $$;
