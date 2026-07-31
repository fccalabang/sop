-- Run this once in Supabase: Project > SQL Editor > New query > paste > Run

create extension if not exists "pgcrypto";

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_id uuid references roles(id) on delete set null
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references roles(id) on delete cascade,
  description text not null,
  sort_order int not null default 0
);

create table checklist_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  service_date date not null,
  day text not null check (day in ('SAT', 'SUN')),
  checked boolean not null default false,
  checked_by text,
  checked_at timestamptz,
  unique (task_id, service_date)
);

-- Row Level Security: this app has no login system (by design — a small
-- trusted team picks their name from a dropdown), so access control relies
-- on the deploy URL not being public. RLS is enabled with permissive
-- policies so the anon key can read/write. Do not link this URL publicly.
alter table roles enable row level security;
alter table members enable row level security;
alter table tasks enable row level security;
alter table checklist_entries enable row level security;

create policy "public read roles" on roles for select using (true);
create policy "public read members" on members for select using (true);
create policy "public read tasks" on tasks for select using (true);
create policy "public read entries" on checklist_entries for select using (true);
create policy "public write entries" on checklist_entries for insert with check (true);
create policy "public update entries" on checklist_entries for update using (true);

-- ---------------------------------------------------------------------
-- Seed data — edit names, roles, and task text to match your real SOP.
-- ---------------------------------------------------------------------

insert into roles (name, sort_order) values
  ('Sound Operator', 1),
  ('Presenter / Lyrics Operator', 2),
  ('Live Broadcast Operator', 3);

-- Sound Operator tasks
insert into tasks (role_id, description, sort_order)
select id, t.description, t.sort_order
from roles, (values
  ('Power on mixer and check main output levels', 1),
  ('Test all mics (handheld, lapel, pulpit)', 2),
  ('Check in-ear / monitor mix with worship team', 3),
  ('Confirm playback tracks for offering / video segments', 4),
  ('Set and save scene for the day''s service', 5)
) as t(description, sort_order)
where roles.name = 'Sound Operator';

-- Presenter / Lyrics Operator tasks
insert into tasks (role_id, description, sort_order)
select id, t.description, t.sort_order
from roles, (values
  ('Load worship set lyrics into presentation software', 1),
  ('Confirm sermon slides are the latest version', 2),
  ('Test slide advance/clicker before service', 3),
  ('Coordinate cue timing with worship leader', 4)
) as t(description, sort_order)
where roles.name = 'Presenter / Lyrics Operator';

-- Live Broadcast Operator tasks
insert into tasks (role_id, description, sort_order)
select id, t.description, t.sort_order
from roles, (values
  ('Check streaming encoder connection and bitrate', 1),
  ('Confirm camera framing and white balance', 2),
  ('Start test stream and verify on Facebook/YouTube', 3),
  ('Monitor stream health during service', 4),
  ('End stream and confirm recording saved', 5)
) as t(description, sort_order)
where roles.name = 'Live Broadcast Operator';

-- Sample members — replace with your actual team roster
insert into members (name, role_id)
select m.name, roles.id
from roles, (values
  ('Jay', 'Sound Operator'),
  ('Sample Member 2', 'Presenter / Lyrics Operator'),
  ('Sample Member 3', 'Live Broadcast Operator')
) as m(name, role_name)
where roles.name = m.role_name;
