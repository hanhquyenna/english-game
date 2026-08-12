-- Move the avatar system onto Open Peeps, matching the design prototype.
--
-- The previous model stored an emoji per accessory and a DiceBear seed. The
-- design's student app instead has a real character with swappable hair / face
-- / clothes, layered items, and a gem balance to buy them with — so the data
-- model has to carry that rather than a single emoji string.

-- Customisations chosen in the shop, layered over the seed-derived base.
-- Empty object = the character exactly as the seed generated it.
alter table student_avatars
  add column if not exists peep_overrides jsonb not null default '{}'::jsonb;

-- The cosmetic wallet. Gems are earned by practising and spent in the shop;
-- keeping the balance next to the avatar keeps the shop's reads to one row.
alter table student_avatars
  add column if not exists gems int not null default 0;

-- Where a layered item sits on the character: 'hat' | 'badge'.
-- Rank frames and base entries have no slot.
alter table avatars
  add column if not exists slot text;

-- What it costs in the shop. 0 = awarded by a milestone rather than bought.
alter table avatars
  add column if not exists cost int not null default 0;
