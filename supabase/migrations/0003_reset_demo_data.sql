-- A single, honest reset for the demo dataset.
--
-- The seed script needs to be re-runnable, and issuing 20+ ordered DELETEs from
-- the client is both slow and easy to get wrong when foreign keys change.
-- TRUNCATE ... CASCADE in one statement is the correct tool, and it needs to
-- live in the database because the anon client cannot run arbitrary SQL.

create or replace function reset_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table
    notifications, level_scores, exercise_attempts, study_sessions,
    vocab_mastery, grammar_mastery, topic_progress, xp_events,
    journal_entries, kudos, class_posts, submissions, exams,
    student_avatars, avatars, exercises, vocab_items, grammar_points,
    topics, enrollments, parent_links, classes, users
  cascade;
end;
$$;

grant execute on function reset_demo_data() to anon, authenticated;
