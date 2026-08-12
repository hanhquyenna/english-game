-- Fields the design's screens need, which the original schema had no home for.

-- The Account screen shows the school above the class.
alter table classes
  add column if not exists school text not null default 'Sunrise International School';

-- The Learn screen groups a topic's exercises into numbered levels along an
-- island path, so a topic needs a subtitle to sit under the island name
-- ("Everyday life & greetings").
alter table topics
  add column if not exists subtitle text;
